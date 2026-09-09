type Ecc = { ordinal: number; formatBits: number };

const ECC_LOW: Ecc = { ordinal: 0, formatBits: 1 };
const ECC_MEDIUM: Ecc = { ordinal: 1, formatBits: 0 };
const ECC_QUARTILE: Ecc = { ordinal: 2, formatBits: 3 };
const ECC_HIGH: Ecc = { ordinal: 3, formatBits: 2 };

const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

const NUM_ERROR_CORRECTION_CODEWORDS: number[][] = [
  [1, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0],
  [2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0],
  [2, 0, 0, 2], [4, 0, 0, 2], [4, 0, 0, 4], [4, 0, 0, 4], [4, 0, 0, 6],
  [4, 2, 0, 6], [4, 2, 0, 8], [5, 2, 0, 8], [5, 2, 2, 8], [6, 2, 2, 8],
  [6, 4, 2, 10], [7, 4, 2, 10], [7, 4, 4, 12], [8, 4, 4, 12], [8, 6, 4, 14],
  [8, 6, 4, 14], [9, 6, 6, 16], [9, 6, 6, 18], [10, 8, 6, 18], [10, 8, 8, 20],
  [11, 8, 8, 20], [11, 10, 8, 22], [12, 10, 8, 22], [12, 12, 10, 24], [13, 12, 10, 24],
  [13, 14, 12, 26], [14, 14, 12, 26], [15, 16, 12, 28], [16, 16, 14, 28], [17, 18, 14, 30],
];

const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  [1, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0],
  [2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0],
  [2, 0, 0, 2], [4, 0, 0, 2], [4, 0, 0, 4], [4, 0, 0, 4], [4, 0, 0, 6],
  [4, 2, 0, 6], [4, 2, 0, 8], [5, 2, 0, 8], [5, 2, 2, 8], [6, 2, 2, 8],
  [6, 4, 2, 10], [7, 4, 2, 10], [7, 4, 4, 12], [8, 4, 4, 12], [8, 6, 4, 14],
  [8, 6, 4, 14], [9, 6, 6, 16], [9, 6, 6, 18], [10, 8, 6, 18], [10, 8, 8, 20],
  [11, 8, 8, 20], [11, 10, 8, 22], [12, 10, 8, 22], [12, 12, 10, 24], [13, 12, 10, 24],
  [13, 14, 12, 26], [14, 14, 12, 26], [15, 16, 12, 28], [16, 16, 14, 28], [17, 18, 14, 30],
];

class BitBuffer {
  data: number[] = [];
  length: number = 0;

  getBit(index: number): number {
    return ((this.data[Math.floor(index / 8)] >>> (7 - (index % 8))) & 1);
  }

  appendBits(value: number, len: number): void {
    for (let i = 0; i < len; i++)
      this.appendBit((value >>> (len - 1 - i)) & 1);
  }

  appendBit(bit: number): void {
    const index = Math.floor(this.length / 8);
    if (this.data.length <= index)
      this.data.push(0);
    if (bit !== 0)
      this.data[index] |= 0x80 >>> (this.length % 8);
    this.length++;
  }
}

class ReedSolomonGenerator {
  private coefficients: number[];

  constructor(degree: number) {
    if (degree < 1 || degree > 255)
      throw new RangeError("Degree out of range");
    const coefficients: number[] = [];
    for (let i = 0; i < degree - 1; i++)
      coefficients.push(0);
    coefficients.push(1);
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < coefficients.length; j++) {
        if (coefficients[j] !== 0)
          coefficients[j] = ReedSolomonGenerator.multiply(coefficients[j], root);
        if (j + 1 < coefficients.length)
          coefficients[j] ^= coefficients[j + 1];
      }
      root = ReedSolomonGenerator.multiply(root, 0x02);
    }
    this.coefficients = coefficients;
  }

  getRemainder(data: number[]): number[] {
    const result: number[] = this.coefficients.map(() => 0);
    for (const b of data) {
      const factor = b ^ (result.shift() as number);
      result.push(0);
      if (factor !== 0) {
        for (let i = 0; i < this.coefficients.length; i++)
          result[i] ^= ReedSolomonGenerator.multiply(this.coefficients[i], factor);
      }
    }
    return result;
  }

  private static multiply(x: number, y: number): number {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
}

class QrCode {
  size: number;
  modules: boolean[][];
  isFunction: boolean[][];

  private constructor(size: number) {
    this.size = size;
    this.modules = [];
    for (let i = 0; i < size; i++) {
      this.modules.push(new Array(size).fill(false));
    }
    this.isFunction = [];
    for (let i = 0; i < size; i++) {
      this.isFunction.push(new Array(size).fill(false));
    }
  }

  static encodeText(text: string, ecl: Ecc = ECC_MEDIUM): QrCode {
    const bytes = new TextEncoder().encode(text);
    const segs: QrSegment[] = [QrSegment.makeBytes(bytes)];
    let minVersion = 1;
    let maxVersion = 40;
    for (let version = minVersion; ; version++) {
      const capacity = QrCode.getNumDataCodewords(version, ecl) * 8;
      let used = 0;
      for (const seg of segs) {
        const ccbits = QrSegment.getCharCountBits(seg.mode, version);
        used += 4 + ccbits + seg.bitLength;
      }
      if (used <= capacity) break;
      if (version >= maxVersion)
        throw new RangeError("Data too long");
    }
    return QrCode.encodeSegments(segs, ecl, minVersion, maxVersion, -1, true);
  }

  private static encodeSegments(
    segs: QrSegment[],
    ecl: Ecc,
    minVersion: number,
    maxVersion: number,
    mask: number,
    boostEcl: boolean,
  ): QrCode {
    if (!(1 <= minVersion && minVersion <= maxVersion && maxVersion <= 40))
      throw new RangeError("Invalid value");
    if (!(-1 <= mask && mask <= 7))
      throw new RangeError("Mask value out of range");

    let version: number;
    let usedBits: number;
    let dataCapacityBits: number;
    while (true) {
      let dataCapacityBits1 = -1;
      let usedBits1 = -1;
      for (version = minVersion; version <= maxVersion; version++) {
        dataCapacityBits1 = QrCode.getNumDataCodewords(version, ecl) * 8;
        usedBits1 = 0;
        for (const seg of segs) {
          const ccbits = QrSegment.getCharCountBits(seg.mode, version);
          if (seg.numChars >>> ccbits > 0) {
            usedBits1 = Infinity;
            break;
          }
          usedBits1 += 4 + ccbits + seg.bitLength;
        }
        if (usedBits1 <= dataCapacityBits1)
          break;
      }
      if (version > maxVersion)
        throw new RangeError("Data too long");

      if (boostEcl) {
        let newEcl = ecl;
        for (const trial of [ECC_MEDIUM, ECC_QUARTILE, ECC_HIGH]) {
          const newCapacity = QrCode.getNumDataCodewords(version, trial) * 8;
          if (usedBits1! <= newCapacity)
            newEcl = trial;
          else
            break;
        }
        dataCapacityBits = dataCapacityBits1!;
        usedBits = usedBits1!;
        break;
      } else {
        dataCapacityBits = dataCapacityBits1!;
        usedBits = usedBits1!;
        break;
      }
    }

    const bb = new BitBuffer();
    for (const seg of segs) {
      bb.appendBits(seg.mode.modeBits, 4);
      bb.appendBits(seg.numChars, QrSegment.getCharCountBits(seg.mode, version));
      for (const bit of seg.getBits())
        bb.appendBit(bit);
    }

    bb.appendBits(0, Math.min(4, dataCapacityBits - bb.length));
    bb.appendBits(0, (8 - (bb.length % 8)) % 8);
    for (let padByte = 0xEC; bb.length < dataCapacityBits; padByte ^= 0xEC ^ 0x11)
      bb.appendBits(padByte, 8);

    const result = new QrCode(QrCode.getSize(version));
    result.drawFunctionPatterns();
    const allCodewords = result.addEccAndInterleave(bb.data, version, ecl);
    result.drawCodewords(allCodewords);

    if (mask === -1) {
      let minPenalty = Infinity;
      let bestMask = 0;
      for (let i = 0; i < 8; i++) {
        result.applyMask(i);
        result.drawFormatBits(i, ecl);
        const penalty = result.getPenaltyScore();
        if (penalty < minPenalty) {
          minPenalty = penalty;
          bestMask = i;
        }
        result.applyMask(i);
      }
      mask = bestMask;
    }
    result.applyMask(mask);
    result.drawFormatBits(mask, ecl);
    return result;
  }

  private drawFunctionPatterns(): void {
    for (let i = 0; i < this.size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }

    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);

    const alignPatPos = this.getAlignmentPatternPositions();
    const numAlign = alignPatPos.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0))
          continue;
        this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
      }
    }

    this.drawFormatBits(0, ECC_LOW);
    this.drawVersion();
  }

  private drawFormatBits(mask: number, ecl: Ecc): void {
    const data = (ecl.formatBits << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++)
      rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;

    for (let i = 0; i <= 5; i++)
      this.setFunctionModule(8, i, ((bits >>> i) & 1) !== 0);
    this.setFunctionModule(8, 7, ((bits >>> 6) & 1) !== 0);
    this.setFunctionModule(8, 8, ((bits >>> 7) & 1) !== 0);
    this.setFunctionModule(7, 8, ((bits >>> 8) & 1) !== 0);
    for (let i = 9; i < 15; i++)
      this.setFunctionModule(14 - i, 8, ((bits >>> i) & 1) !== 0);

    for (let i = 0; i < 8; i++)
      this.setFunctionModule(this.size - 1 - i, 8, ((bits >>> i) & 1) !== 0);
    for (let i = 8; i < 15; i++)
      this.setFunctionModule(8, this.size - 15 + i, ((bits >>> i) & 1) !== 0);
    this.setFunctionModule(8, this.size - 8, true);
  }

  private drawVersion(): void {
    const version = Math.floor((this.size - 17) / 4);
    if (version < 7)
      return;

    let rem = version;
    for (let i = 0; i < 12; i++)
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    const bits = (version << 12) | rem;

    for (let i = 0; i < 18; i++) {
      const bit = ((bits >>> i) & 1) !== 0;
      const a = Math.floor(i / 3);
      const b = (i % 3) + this.size - 8 - 3;
      this.setFunctionModule(b, a, bit);
      this.setFunctionModule(a, b, bit);
    }
  }

  private drawFinderPattern(x: number, y: number): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (0 <= xx && xx < this.size && 0 <= yy && yy < this.size)
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
      }
    }
  }

  private drawAlignmentPattern(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  private setFunctionModule(x: number, y: number, isDark: boolean): void {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  private addEccAndInterleave(data: number[], version: number, ecl: Ecc): number[] {
    if (data.length !== QrCode.getNumDataCodewords(version, ecl))
      throw new RangeError("Invalid argument");

    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[version - 1][ecl.ordinal];
    const blockEccLen = NUM_ERROR_CORRECTION_CODEWORDS[version - 1][ecl.ordinal];
    const rawCodewords = Math.floor(QrCode.getNumRawDataModules(version) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const rsGen = new ReedSolomonGenerator(blockEccLen);
    const blocks: number[][] = [];
    let k = 0;
    for (let i = 0; i < numBlocks; i++) {
      const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      const ecc = rsGen.getRemainder(dat);
      if (i < numShortBlocks)
        dat.push(0);
      blocks.push(dat.concat(ecc));
    }

    const result: number[] = [];
    for (let i = 0; i < blocks[0].length; i++) {
      for (let j = 0; j < blocks.length; j++) {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks)
          result.push(blocks[j][i]);
      }
    }
    return result;
  }

  private drawCodewords(data: number[]): void {
    if (data.length !== Math.floor(QrCode.getNumRawDataModules(Math.floor((this.size - 17) / 4)) / 8))
      throw new RangeError("Invalid argument");
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6)
        right = 5;
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = ((data[Math.floor(i / 8)] >>> (7 - (i % 8))) & 1) !== 0;
            i++;
          }
        }
      }
    }
  }

  private applyMask(mask: number): void {
    if (!(0 <= mask && mask <= 7))
      throw new RangeError("Mask value out of range");
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert: boolean;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = (x * y) % 2 + (x * y) % 3 === 0; break;
          case 6: invert = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
          case 7: invert = ((x + y) % 2 + (x * y) % 3) % 2 === 0; break;
          default: throw new Error("Unreachable");
        }
        if (invert && !this.isFunction[y][x])
          this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  private getPenaltyScore(): number {
    let result = 0;

    for (let y = 0; y < this.size; y++) {
      let runColor = false;
      let runX = 0;
      let runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < this.size; x++) {
        if (this.modules[y][x] === runColor) {
          runX++;
          if (runX === 5)
            result += PENALTY_N1;
          else if (runX > 5)
            result++;
        } else {
          this.finderPenaltyAddHistory(runX, runHistory);
          if (!runColor)
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          runColor = this.modules[y][x];
          runX = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * PENALTY_N3;
    }
    for (let x = 0; x < this.size; x++) {
      let runColor = false;
      let runY = 0;
      let runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < this.size; y++) {
        if (this.modules[y][x] === runColor) {
          runY++;
          if (runY === 5)
            result += PENALTY_N1;
          else if (runY > 5)
            result++;
        } else {
          this.finderPenaltyAddHistory(runY, runHistory);
          if (!runColor)
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          runColor = this.modules[y][x];
          runY = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * PENALTY_N3;
    }

    for (let y = 0; y < this.size - 1; y++) {
      for (let x = 0; x < this.size - 1; x++) {
        const c = this.modules[y][x];
        if (c === this.modules[y][x + 1] && c === this.modules[y + 1][x] && c === this.modules[y + 1][x + 1])
          result += PENALTY_N2;
      }
    }

    let dark = 0;
    for (const row of this.modules) {
      for (const c of row) {
        if (c)
          dark++;
      }
    }
    const total = this.size * this.size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * PENALTY_N4;
    return result;
  }

  private getAlignmentPatternPositions(): number[] {
    const version = Math.floor((this.size - 17) / 4);
    if (version === 1)
      return [];
    const numAlign = Math.floor(version / 7) + 2;
    const step = (version === 32) ? 26 :
      Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
    const result: number[] = [6];
    for (let pos = this.size - 7; result.length < numAlign; pos -= step)
      result.splice(1, 0, pos);
    return result;
  }

  private static getNumRawDataModules(ver: number): number {
    if (ver < 1 || ver > 40)
      throw new RangeError("Version number out of range");
    let result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7)
        result -= 36;
    }
    return result;
  }

  private static getNumDataCodewords(ver: number, ecl: Ecc): number {
    return Math.floor(QrCode.getNumRawDataModules(ver) / 8) -
      NUM_ERROR_CORRECTION_BLOCKS[ver - 1][ecl.ordinal] *
      NUM_ERROR_CORRECTION_CODEWORDS[ver - 1][ecl.ordinal];
  }

  private static getSize(version: number): number {
    return version * 4 + 17;
  }

  private finderPenaltyCountPatterns(runHistory: number[]): number {
    const n = runHistory[1];
    const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
    return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0)
      + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
  }

  private finderPenaltyTerminateAndCount(currentRunColor: boolean, currentRunLength: number, runHistory: number[]): number {
    if (currentRunColor) {
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      currentRunLength = 0;
    }
    currentRunLength += this.size;
    this.finderPenaltyAddHistory(currentRunLength, runHistory);
    return this.finderPenaltyCountPatterns(runHistory);
  }

  private finderPenaltyAddHistory(currentRunLength: number, runHistory: number[]): void {
    if (runHistory[0] === 0)
      currentRunLength += this.size;
    runHistory.pop();
    runHistory.unshift(currentRunLength);
  }
}

class QrSegment {
  readonly mode: QrSegmentMode;
  readonly numChars: number;
  private readonly bitData: number[];

  constructor(mode: QrSegmentMode, numChars: number, bitData: number[]) {
    this.mode = mode;
    this.numChars = numChars;
    this.bitData = bitData.slice();
  }

  get bitLength(): number {
    return this.bitData.length;
  }

  getBits(): readonly number[] {
    return this.bitData;
  }

  static makeBytes(data: Uint8Array | number[]): QrSegment {
    const bb = new BitBuffer();
    for (const b of data)
      bb.appendBits(b as number, 8);
    return new QrSegment(QrSegmentMode.BYTE, data.length, bb.data.slice(0, Math.ceil(bb.length / 8))
      .flatMap(byte => Array.from({ length: 8 }, (_, i) => (byte >>> (7 - i)) & 1))
      .slice(0, bb.length));
  }

  static getCharCountBits(mode: QrSegmentMode, ver: number): number {
    if (ver < 1 || ver > 40)
      throw new RangeError("Version out of range");
    for (const entry of QrSegmentMode.CHAR_COUNT) {
      if (mode === entry[0]) {
        if (ver <= 9)
          return entry[1];
        else if (ver <= 26)
          return entry[2];
        else
          return entry[3];
      }
    }
    throw new Error("Unreachable");
  }
}

type QrSegmentMode = {
  readonly modeBits: number;
  readonly numBitsCharCount: [number, number, number];
};

namespace QrSegmentMode {
  export const NUMERIC: QrSegmentMode = { modeBits: 0x1, numBitsCharCount: [10, 12, 14] };
  export const ALPHANUMERIC: QrSegmentMode = { modeBits: 0x2, numBitsCharCount: [9, 11, 13] };
  export const BYTE: QrSegmentMode = { modeBits: 0x4, numBitsCharCount: [8, 16, 16] };
  export const KANJI: QrSegmentMode = { modeBits: 0x8, numBitsCharCount: [8, 10, 12] };
  export const ECI: QrSegmentMode = { modeBits: 0x7, numBitsCharCount: [0, 0, 0] };

  export const CHAR_COUNT: [QrSegmentMode, number, number, number][] = [
    [NUMERIC, NUMERIC.numBitsCharCount[0], NUMERIC.numBitsCharCount[1], NUMERIC.numBitsCharCount[2]],
    [ALPHANUMERIC, ALPHANUMERIC.numBitsCharCount[0], ALPHANUMERIC.numBitsCharCount[1], ALPHANUMERIC.numBitsCharCount[2]],
    [BYTE, BYTE.numBitsCharCount[0], BYTE.numBitsCharCount[1], BYTE.numBitsCharCount[2]],
    [KANJI, KANJI.numBitsCharCount[0], KANJI.numBitsCharCount[1], KANJI.numBitsCharCount[2]],
  ];
}

export function generateQRCodeSVG(text: string, size = 256, margin = 4): string {
  const qr = QrCode.encodeText(text, ECC_MEDIUM);
  const modules = qr.size;
  const dim = modules + 2 * margin;
  const scale = size / dim;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${size}" height="${size}" fill="none" stroke="none">`;
  svg += `<rect width="${dim}" height="${dim}" fill="transparent"/>`;

  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      if (qr.modules[y][x]) {
        svg += `<rect x="${x + margin}" y="${y + margin}" width="1" height="1" fill="#000"/>`;
      }
    }
  }

  svg += `</svg>`;
  return svg;
}

export function svgToDataURL(svgStr: string): string {
  const encoded = encodeURIComponent(svgStr)
    .replace(/%20/g, ' ')
    .replace(/%3D/g, '=')
    .replace(/%3A/g, ':')
    .replace(/%2F/g, '/')
    .replace(/%22/g, '"')
    .replace(/%3C/g, '<')
    .replace(/%3E/g, '>')
    .replace(/%23/g, '#');
  return `data:image/svg+xml;utf8,${encoded}`;
}
