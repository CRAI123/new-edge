import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Image as ImageIcon,
  RefreshCw,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Printer as PrinterIcon,
  Package,
  Truck,
  Sparkles,
  Copy,
  User,
  FileText,
  Hash,
  DollarSign,
  Layers,
  Palette,
  Ruler,
  ArrowLeft,
  Share2,
  QrCode,
  ExternalLink
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { showToast } from "@/lib/utils";
import QRCode from "qrcode";

type VirtualStatus = "pending" | "confirmed" | "printing" | "post_process" | "quality_check" | "packaging" | "shipping" | "delivered";

interface OrderFormData {
  orderNo: string;
  customerName: string;
  customerPhone: string;
  modelName: string;
  quantity: number;
  price: number;
  material: string;
  color: string;
  layerHeight: string;
  infill: string;
  notes: string;
}

interface StatusStep {
  key: VirtualStatus;
  label: string;
  icon: React.ReactNode;
  duration: number;
  color: string;
}

const STATUS_STEPS: StatusStep[] = [
  { key: "pending", label: "待确认", icon: <Clock className="w-5 h-5" />, duration: 2000, color: "#f59e0b" },
  { key: "confirmed", label: "已接单", icon: <CheckCircle2 className="w-5 h-5" />, duration: 2500, color: "#8b5cf6" },
  { key: "printing", label: "打印中", icon: <PrinterIcon className="w-5 h-5" />, duration: 4000, color: "#0071e3" },
  { key: "post_process", label: "后处理", icon: <Layers className="w-5 h-5" />, duration: 3000, color: "#06b6d4" },
  { key: "quality_check", label: "质检中", icon: <CheckCircle2 className="w-5 h-5" />, duration: 2500, color: "#84cc16" },
  { key: "packaging", label: "打包中", icon: <Package className="w-5 h-5" />, duration: 2000, color: "#f97316" },
  { key: "shipping", label: "配送中", icon: <Truck className="w-5 h-5" />, duration: 3000, color: "#ec4899" },
  { key: "delivered", label: "已完成", icon: <Sparkles className="w-5 h-5" />, duration: 0, color: "#28cd41" },
];

const MATERIALS = ["PLA", "PETG", "ABS", "TPU", "树脂", "碳纤维尼龙", "ASA", "PC"];
const COLORS = ["白色", "黑色", "灰色", "红色", "蓝色", "绿色", "黄色", "橙色", "紫色", "粉色", "透明", "金色", "银色"];
const LAYER_HEIGHTS = ["0.10mm (高精)", "0.15mm (高品)", "0.20mm (标准)", "0.25mm (快速)", "0.30mm (草稿)"];
const INFILLS = ["10% (轻量)", "20% (标准)", "30% (结实)", "50% (坚固)", "80% (实心)", "100% (全实)"];

const generateOrderNo = () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const randPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RZ${datePart}${randPart}`;
};

const STORAGE_PREFIX = "rayzo_order_";

const saveOrderToStorage = (data: {
  formData: OrderFormData;
  currentStatus: VirtualStatus;
  statusProgress: Record<VirtualStatus, string>;
}) => {
  try {
    const payload = {
      ...data.formData,
      currentStatus: data.currentStatus,
      statusProgress: data.statusProgress,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_PREFIX + data.formData.orderNo, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
};

export default function OrderGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<OrderFormData>({
    orderNo: generateOrderNo(),
    customerName: "",
    customerPhone: "",
    modelName: "",
    quantity: 1,
    price: 0,
    material: "PLA",
    color: "白色",
    layerHeight: "0.20mm (标准)",
    infill: "20% (标准)",
    notes: "",
  });

  const [currentStatus, setCurrentStatus] = useState<VirtualStatus>("pending");
  const [statusProgress, setStatusProgress] = useState<Record<VirtualStatus, string>>({
    pending: new Date().toLocaleString("zh-CN"),
    confirmed: "",
    printing: "",
    post_process: "",
    quality_check: "",
    packaging: "",
    shipping: "",
    delivered: "",
  });
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const totalAmount = formData.quantity * formData.price;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) || 0 : value,
    }));
  };

  const getCurrentStepIndex = useCallback(() => {
    return STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  }, [currentStatus]);

  const advanceStatus = useCallback(() => {
    const currentIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
    if (currentIdx < STATUS_STEPS.length - 1) {
      const nextKey = STATUS_STEPS[currentIdx + 1].key;
      setCurrentStatus(nextKey);
      setStatusProgress((prev) => {
        const nextProgress = {
          ...prev,
          [nextKey]: new Date().toLocaleString("zh-CN"),
        };
        saveOrderToStorage({ formData, currentStatus: nextKey, statusProgress: nextProgress });
        return nextProgress;
      });
      showToast("success", `订单状态已更新：${STATUS_STEPS[currentIdx + 1].label}`);
    } else {
      setIsAutoPlaying(false);
    }
  }, [currentStatus, formData]);

  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      return;
    }

    const currentIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
    if (currentIdx >= STATUS_STEPS.length - 1) {
      setIsAutoPlaying(false);
      return;
    }

    const step = STATUS_STEPS[currentIdx];
    if (step.duration > 0) {
      autoTimerRef.current = setTimeout(() => {
        advanceStatus();
      }, step.duration);
    }

    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
      }
    };
  }, [isAutoPlaying, currentStatus, advanceStatus]);

  const resetOrder = () => {
    setFormData((prev) => ({ ...prev, orderNo: generateOrderNo() }));
    setCurrentStatus("pending");
    setStatusProgress({
      pending: new Date().toLocaleString("zh-CN"),
      confirmed: "",
      printing: "",
      post_process: "",
      quality_check: "",
      packaging: "",
      shipping: "",
      delivered: "",
    });
    setIsAutoPlaying(false);
    setPreviewImageUrl(null);
    showToast("info", "已重置为新订单");
  };

  const toggleAutoPlay = () => {
    if (getCurrentStepIndex() >= STATUS_STEPS.length - 1) {
      resetOrder();
      setTimeout(() => setIsAutoPlaying(true), 300);
      return;
    }
    setIsAutoPlaying((prev) => !prev);
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const getShareUrl = useCallback(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/order/${formData.orderNo}`;
  }, [formData.orderNo]);

  const generateOrderImage = useCallback(async () => {
    setGeneratingImage(true);
    try {
      saveOrderToStorage({ formData, currentStatus, statusProgress });
      const shareUrl = getShareUrl();

      const qrCanvas = qrCanvasRef.current || document.createElement("canvas");
      qrCanvasRef.current = qrCanvas;
      await QRCode.toCanvas(qrCanvas, shareUrl, {
        width: 340,
        margin: 2,
        color: {
          dark: "#1d1d1f",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas 不可用");

      const W = 1080;
      const H = 2060;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("无法获取 Canvas 上下文");

      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, "#0a1628");
      bgGrad.addColorStop(0.5, "#0f1f3d");
      bgGrad.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < 6; i++) {
        const x = (i / 5) * W;
        const y = (i / 5) * H;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 500);
        grad.addColorStop(0, i % 2 === 0 ? "rgba(0,113,227,0.12)" : "rgba(40,205,65,0.10)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      drawRoundedRect(ctx, 60, 60, W - 120, H - 120, 48);
      const cardGrad = ctx.createLinearGradient(0, 60, 0, H - 60);
      cardGrad.addColorStop(0, "rgba(255,255,255,0.96)");
      cardGrad.addColorStop(1, "rgba(250,250,252,0.98)");
      ctx.fillStyle = cardGrad;
      ctx.fill();

      ctx.save();
      drawRoundedRect(ctx, 60, 60, W - 120, 200, 48);
      const headerGrad = ctx.createLinearGradient(60, 60, W - 60, 260);
      headerGrad.addColorStop(0, "#0071e3");
      headerGrad.addColorStop(1, "#28cd41");
      ctx.fillStyle = headerGrad;
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "bold 120px -apple-system, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("3D", W - 100, 170);

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.font = "bold 68px -apple-system, sans-serif";
      ctx.fillText("睿造打印工坊", 100, 150);
      ctx.font = "30px -apple-system, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillText("Rayzo 3D Print Studio · 定制订单", 100, 210);

      let y = 330;
      ctx.fillStyle = "#0071e3";
      ctx.font = "bold 40px -apple-system, sans-serif";
      ctx.fillText("📋 订单信息", 100, y);
      y += 20;
      ctx.strokeStyle = "rgba(0,113,227,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, y + 10);
      ctx.lineTo(W - 100, y + 10);
      ctx.stroke();
      y += 60;

      const infoItems = [
        { label: "订单编号", value: formData.orderNo, icon: "#️⃣" },
        { label: "客户姓名", value: formData.customerName || "—", icon: "👤" },
        { label: "联系电话", value: formData.customerPhone || "—", icon: "📞" },
        { label: "模型名称", value: formData.modelName || "—", icon: "🎯" },
        { label: "打印数量", value: `${formData.quantity} 件`, icon: "📦" },
      ];

      ctx.font = "32px -apple-system, sans-serif";
      infoItems.forEach((item) => {
        ctx.fillStyle = "#86868b";
        ctx.fillText(`${item.icon}  ${item.label}`, 100, y);
        ctx.fillStyle = "#1d1d1f";
        ctx.textAlign = "right";
        ctx.font = "bold 34px -apple-system, sans-serif";
        ctx.fillText(item.value, W - 100, y);
        ctx.textAlign = "left";
        ctx.font = "32px -apple-system, sans-serif";
        y += 70;
      });

      y += 20;
      ctx.fillStyle = "#28cd41";
      ctx.font = "bold 40px -apple-system, sans-serif";
      ctx.fillText("⚙️ 打印参数", 100, y);
      y += 20;
      ctx.strokeStyle = "rgba(40,205,65,0.2)";
      ctx.beginPath();
      ctx.moveTo(100, y + 10);
      ctx.lineTo(W - 100, y + 10);
      ctx.stroke();
      y += 60;

      const params = [
        { label: "打印材料", value: formData.material },
        { label: "颜色选择", value: formData.color },
        { label: "层高精度", value: formData.layerHeight },
        { label: "填充密度", value: formData.infill },
      ];

      const paramBoxW = (W - 260) / 2;
      params.forEach((p, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = 100 + col * (paramBoxW + 60);
        const by = y + row * 120;

        drawRoundedRect(ctx, bx, by, paramBoxW, 100, 24);
        ctx.fillStyle = "rgba(0,113,227,0.06)";
        ctx.fill();

        ctx.fillStyle = "#86868b";
        ctx.font = "26px -apple-system, sans-serif";
        ctx.fillText(p.label, bx + 30, by + 45);
        ctx.fillStyle = "#1d1d1f";
        ctx.font = "bold 32px -apple-system, sans-serif";
        ctx.fillText(p.value, bx + 30, by + 85);
      });

      y += 280;

      if (formData.notes) {
        drawRoundedRect(ctx, 100, y, W - 200, 140, 24);
        ctx.fillStyle = "rgba(245,158,11,0.08)";
        ctx.fill();
        ctx.fillStyle = "#86868b";
        ctx.font = "26px -apple-system, sans-serif";
        ctx.fillText("📝 备注说明", 130, y + 48);
        ctx.fillStyle = "#1d1d1f";
        ctx.font = "28px -apple-system, sans-serif";
        const noteText = formData.notes.length > 50 ? formData.notes.slice(0, 50) + "..." : formData.notes;
        ctx.fillText(noteText, 130, y + 95);
        y += 180;
      }

      y += 20;
      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 40px -apple-system, sans-serif";
      ctx.fillText("📊 订单进度", 100, y);
      y += 20;
      ctx.strokeStyle = "rgba(245,158,11,0.2)";
      ctx.beginPath();
      ctx.moveTo(100, y + 10);
      ctx.lineTo(W - 100, y + 10);
      ctx.stroke();
      y += 60;

      const currentIdx = getCurrentStepIndex();
      const stepIcons = ["⏳", "✅", "🖨️", "🔧", "🔍", "📦", "🚚", "🎉"];
      STATUS_STEPS.forEach((step, i) => {
        const done = i <= currentIdx;
        const sy = y + i * 60;

        ctx.beginPath();
        ctx.arc(120, sy, 18, 0, Math.PI * 2);
        if (done) {
          const stepG = ctx.createRadialGradient(120, sy, 0, 120, sy, 22);
          stepG.addColorStop(0, step.color);
          stepG.addColorStop(1, step.color);
          ctx.fillStyle = stepG;
        } else {
          ctx.fillStyle = "#d2d2d7";
        }
        ctx.fill();

        ctx.font = "22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.fillText(stepIcons[i] || "✓", 120, sy + 8);
        ctx.textAlign = "left";

        ctx.fillStyle = done ? "#1d1d1f" : "#c7c7cc";
        ctx.font = done ? "bold 28px -apple-system, sans-serif" : "28px -apple-system, sans-serif";
        ctx.fillText(step.label, 165, sy + 10);

        if (statusProgress[step.key] && done) {
          ctx.fillStyle = "#86868b";
          ctx.font = "22px -apple-system, sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(statusProgress[step.key], W - 100, sy + 10);
          ctx.textAlign = "left";
        }
      });

      y += STATUS_STEPS.length * 60 + 60;

      drawRoundedRect(ctx, 100, y, W - 200, 180, 36);
      const priceBg = ctx.createLinearGradient(100, y, W - 100, y + 180);
      priceBg.addColorStop(0, "rgba(0,113,227,0.08)");
      priceBg.addColorStop(0.5, "rgba(40,205,65,0.06)");
      priceBg.addColorStop(1, "rgba(0,113,227,0.08)");
      ctx.fillStyle = priceBg;
      ctx.fill();

      ctx.fillStyle = "#86868b";
      ctx.font = "32px -apple-system, sans-serif";
      ctx.fillText("单价", 140, y + 60);
      ctx.fillText("数量", 140, y + 120);
      ctx.fillText("合计金额", W / 2 + 20, y + 90);

      ctx.fillStyle = "#1d1d1f";
      ctx.font = "bold 32px -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`¥ ${formData.price.toFixed(2)}`, 260, y + 60);
      ctx.fillText(`${formData.quantity} 件`, 260, y + 120);

      ctx.textAlign = "right";
      ctx.font = "bold 64px -apple-system, sans-serif";
      const priceText = ctx.createLinearGradient(W - 420, y, W - 100, y + 100);
      priceText.addColorStop(0, "#0071e3");
      priceText.addColorStop(1, "#28cd41");
      ctx.fillStyle = priceText;
      ctx.fillText(`¥ ${totalAmount.toFixed(2)}`, W - 140, y + 115);
      ctx.textAlign = "left";

      y += 220;

      // 二维码区域
      drawRoundedRect(ctx, 100, y, W - 200, 360, 40);
      const qrBgGrad = ctx.createLinearGradient(100, y, W - 100, y + 360);
      qrBgGrad.addColorStop(0, "#0a1628");
      qrBgGrad.addColorStop(0.5, "#0f1f3d");
      qrBgGrad.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = qrBgGrad;
      ctx.fill();

      // 装饰光晕
      ctx.save();
      drawRoundedRect(ctx, 100, y, W - 200, 360, 40);
      ctx.clip();
      const halo1 = ctx.createRadialGradient(180, y + 60, 0, 180, y + 60, 300);
      halo1.addColorStop(0, "rgba(0,113,227,0.35)");
      halo1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo1;
      ctx.fillRect(100, y, W - 200, 360);
      const halo2 = ctx.createRadialGradient(W - 180, y + 300, 0, W - 180, y + 300, 300);
      halo2.addColorStop(0, "rgba(40,205,65,0.30)");
      halo2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo2;
      ctx.fillRect(100, y, W - 200, 360);
      ctx.restore();

      // 绘制二维码白底卡片（更大更精致）
      const qrCardX = 140;
      const qrCardY = y + 40;
      const qrCardW = 300;
      const qrCardH = 280;
      // 外阴影层
      ctx.save();
      drawRoundedRect(ctx, qrCardX + 4, qrCardY + 6, qrCardW, qrCardH, 28);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fill();
      ctx.restore();
      // 主卡片
      drawRoundedRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 28);
      const qrCardGrad = ctx.createLinearGradient(qrCardX, qrCardY, qrCardX, qrCardY + qrCardH);
      qrCardGrad.addColorStop(0, "#ffffff");
      qrCardGrad.addColorStop(1, "#fafafa");
      ctx.fillStyle = qrCardGrad;
      ctx.fill();

      // 四角装饰边框
      const cornerSize = 28;
      const cornerLine = 5;
      ctx.strokeStyle = "#0071e3";
      ctx.lineWidth = cornerLine;
      // 左上
      ctx.beginPath();
      ctx.moveTo(qrCardX + 18, qrCardY + 18 + cornerSize);
      ctx.lineTo(qrCardX + 18, qrCardY + 18);
      ctx.lineTo(qrCardX + 18 + cornerSize, qrCardY + 18);
      ctx.stroke();
      ctx.strokeStyle = "#28cd41";
      // 右上
      ctx.beginPath();
      ctx.moveTo(qrCardX + qrCardW - 18 - cornerSize, qrCardY + 18);
      ctx.lineTo(qrCardX + qrCardW - 18, qrCardY + 18);
      ctx.lineTo(qrCardX + qrCardW - 18, qrCardY + 18 + cornerSize);
      ctx.stroke();
      // 左下
      ctx.beginPath();
      ctx.moveTo(qrCardX + 18, qrCardY + qrCardH - 18 - cornerSize);
      ctx.lineTo(qrCardX + 18, qrCardY + qrCardH - 18);
      ctx.lineTo(qrCardX + 18 + cornerSize, qrCardY + qrCardH - 18);
      ctx.stroke();
      ctx.strokeStyle = "#0071e3";
      // 右下
      ctx.beginPath();
      ctx.moveTo(qrCardX + qrCardW - 18 - cornerSize, qrCardY + qrCardH - 18);
      ctx.lineTo(qrCardX + qrCardW - 18, qrCardY + qrCardH - 18);
      ctx.lineTo(qrCardX + qrCardW - 18, qrCardY + qrCardH - 18 - cornerSize);
      ctx.stroke();

      // 绘制二维码到主画布（居中放大）
      const qrSize = 340;
      const drawSize = 240;
      const qrDrawX = qrCardX + (qrCardW - drawSize) / 2;
      const qrDrawY = qrCardY + 22;
      ctx.drawImage(qrCanvas, 0, 0, qrSize, qrSize, qrDrawX, qrDrawY, drawSize, drawSize);

      // 二维码中心 Logo 占位（圆形徽标
      const logoR = 26;
      const logoCx = qrDrawX + drawSize / 2;
      const logoCy = qrDrawY + drawSize / 2;
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR + 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI * 2);
      const logoGrad = ctx.createLinearGradient(logoCx - logoR, logoCy - logoR, logoCx + logoR, logoCy + logoR);
      logoGrad.addColorStop(0, "#0071e3");
      logoGrad.addColorStop(1, "#28cd41");
      ctx.fillStyle = logoGrad;
      ctx.fill();
      // Logo 文字 RZ
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("RZ", logoCx, logoCy);
      ctx.textBaseline = "alphabetic";

      // 二维码下方小字
      ctx.fillStyle = "#1d1d1f";
      ctx.font = "bold 22px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("扫码查看实时进度", qrCardX + qrCardW / 2, qrCardY + qrCardH - 24);

      // 右侧文字说明
      const txtX = qrCardX + qrCardW + 40;
      const txtY = y + 80;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("📲 扫码追踪订单", txtX, txtY);

      ctx.fillStyle = "rgba(255,255,255,0.90)";
      ctx.font = "28px -apple-system, sans-serif";
      ctx.fillText("扫描左侧二维码，或访问下方链接", txtX, txtY + 58);
      ctx.fillText("随时查看订单生产与配送状态", txtX, txtY + 100);

      // 订单号快速信息
      ctx.fillStyle = "rgba(255,255,255,0.60)";
      ctx.font = "24px -apple-system, sans-serif";
      ctx.fillText(`订单号：${formData.orderNo}`, txtX, txtY + 145);

      // 链接卡片
      drawRoundedRect(ctx, txtX, txtY + 165, W - 100 - txtX, 80, 20);
      const linkBgGrad = ctx.createLinearGradient(txtX, txtY + 165, txtX, txtY + 245);
      linkBgGrad.addColorStop(0, "rgba(255,255,255,0.14)");
      linkBgGrad.addColorStop(1, "rgba(255,255,255,0.08)");
      ctx.fillStyle = linkBgGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // 链接图标
      ctx.fillStyle = "rgba(0,198,255,0.95)";
      ctx.font = "bold 26px -apple-system, sans-serif";
      const displayUrl = shareUrl.length > 48 ? shareUrl.slice(0, 45) + "..." : shareUrl;
      ctx.fillText("🔗  " + displayUrl, txtX + 28, txtY + 218);

      y += 400;

      // 底部文字
      ctx.fillStyle = "#86868b";
      ctx.font = "26px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("下单时间  " + statusProgress.pending, W / 2, y);
      y += 45;
      ctx.fillStyle = "#1d1d1f";
      ctx.font = "bold 30px -apple-system, sans-serif";
      ctx.fillText("—— 感谢您选择睿造打印工坊 ——", W / 2, y);
      y += 45;
      ctx.fillStyle = "#86868b";
      ctx.font = "24px -apple-system, sans-serif";
      ctx.fillText("Rayzo Print Studio · 连接创意与实物", W / 2, y);
      ctx.textAlign = "left";

      const dataUrl = canvas.toDataURL("image/png", 0.95);
      setPreviewImageUrl(dataUrl);
      showToast("success", "订单图片生成成功！已包含追踪二维码");
    } catch (err: any) {
      console.error("生成图片失败:", err);
      showToast("error", `生成图片失败: ${err.message || "未知错误"}`);
    } finally {
      setGeneratingImage(false);
    }
  }, [formData, currentStatus, statusProgress, totalAmount, getCurrentStepIndex, getShareUrl]);

  const downloadImage = () => {
    if (!previewImageUrl) return;
    const a = document.createElement("a");
    a.href = previewImageUrl;
    a.download = `订单_${formData.orderNo}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("success", "订单图片已开始下载");
  };

  const copyOrderNo = async () => {
    try {
      await navigator.clipboard.writeText(formData.orderNo);
      showToast("success", "订单号已复制");
    } catch {
      showToast("error", "复制失败，请手动复制");
    }
  };

  const copyShareLink = async () => {
    saveOrderToStorage({ formData, currentStatus, statusProgress });
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      showToast("success", "订单追踪链接已复制，可直接分享给客户");
    } catch {
      showToast("error", "复制失败，请手动复制");
    }
  };

  const previewTrackPage = () => {
    saveOrderToStorage({ formData, currentStatus, statusProgress });
    navigate(`/order/${formData.orderNo}`);
  };

  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#f5f5f7]">
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={qrCanvasRef} className="hidden" />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#0071e3] transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            返回首页
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white text-[#86868b] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Custom Order Generator
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] mb-3 leading-tight">
                自定义 <span className="gradient-text-dual">订单生成器</span>
              </h1>
              <p className="text-[#86868b] text-lg max-w-2xl">
                填写客户与打印参数，模拟订单全生命周期流转，一键生成精美订单分享图。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleAutoPlay}
                className={`px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 transition-all ripple-target ${
                  isAutoPlaying
                    ? "bg-[#ef4444] text-white hover:bg-[#dc2626] shadow-lg shadow-red-500/30"
                    : "bg-[#28cd41] text-white hover:bg-[#1e9a34] shadow-lg shadow-green-500/30"
                }`}
              >
                {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isAutoPlaying ? "暂停模拟" : "自动流转"}
              </button>
              <button
                onClick={copyShareLink}
                className="px-5 py-3 rounded-2xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold flex items-center gap-2 shadow-lg shadow-violet-500/30 transition-all ripple-target"
              >
                <Share2 className="w-5 h-5" />
                复制追踪链接
              </button>
              <button
                onClick={previewTrackPage}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-semibold flex items-center gap-2 border border-[#e5e5ea] transition-all ripple-target"
              >
                <ExternalLink className="w-5 h-5" />
                预览追踪页
              </button>
              <button
                onClick={resetOrder}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-semibold flex items-center gap-2 border border-[#e5e5ea] transition-all ripple-target"
              >
                <RefreshCw className="w-5 h-5" />
                新建订单
              </button>
              <button
                onClick={generateOrderImage}
                disabled={generatingImage}
                className="px-5 py-3 rounded-2xl btn-primary font-semibold flex items-center gap-2 disabled:opacity-60"
              >
                {generatingImage ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
                {generatingImage ? "生成中..." : "生成订单图"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border">
              <h2 className="text-2xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                基本信息
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1f] mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#86868b]" /> 订单编号
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="orderNo"
                      value={formData.orderNo}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all font-mono text-sm"
                    />
                    <button
                      onClick={copyOrderNo}
                      className="px-4 py-3 rounded-2xl bg-[#f5f5f7] hover:bg-[#ececef] text-[#1d1d1f] font-semibold flex items-center gap-2 transition-colors"
                      title="复制订单号"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#1d1d1f] mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#86868b]" /> 客户姓名
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="请输入客户姓名"
                      className="w-full px-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1d1d1f] mb-2 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-[#86868b]" /> 联系电话
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      placeholder="138 XXXX XXXX"
                      className="w-full px-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#1d1d1f] mb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#86868b]" /> 模型名称
                    </label>
                    <input
                      type="text"
                      name="modelName"
                      value={formData.modelName}
                      onChange={handleInputChange}
                      placeholder="例如：皮卡丘手办、手机支架..."
                      className="w-full px-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1d1d1f] mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#86868b]" /> 数量
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      min={1}
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1f] mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#86868b]" /> 单价（元）
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b] font-semibold">¥</span>
                    <input
                      type="number"
                      name="price"
                      min={0}
                      step={0.01}
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border">
              <h2 className="text-2xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#28cd41]/10 text-[#28cd41] flex items-center justify-center">
                  <PrinterIcon className="w-5 h-5" />
                </div>
                打印参数
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1f] mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#86868b]" /> 打印材料
                  </label>
                  <select
                    name="material"
                    value={formData.material}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  >
                    {MATERIALS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1f] mb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#86868b]" /> 颜色选择
                  </label>
                  <select
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  >
                    {COLORS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1f] mb-2 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-[#86868b]" /> 层高精度
                  </label>
                  <select
                    name="layerHeight"
                    value={formData.layerHeight}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  >
                    {LAYER_HEIGHTS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1f] mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#86868b]" /> 填充密度
                  </label>
                  <select
                    name="infill"
                    value={formData.infill}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  >
                    {INFILLS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">备注说明</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="特殊要求、打磨上色、包装方式等..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1d1d1f] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  订单生命周期
                </h2>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5f5f7]">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_STEPS[getCurrentStepIndex()].color }}
                  />
                  <span className="text-sm font-semibold text-[#1d1d1f]">
                    当前：{STATUS_STEPS[getCurrentStepIndex()].label}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= getCurrentStepIndex();
                  const isCurrent = i === getCurrentStepIndex();
                  return (
                    <motion.button
                      key={step.key}
                      whileHover={{ scale: 1.008 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setCurrentStatus(step.key);
                        if (!statusProgress[step.key]) {
                          setStatusProgress((prev) => {
                            const next = {
                              ...prev,
                              [step.key]: new Date().toLocaleString("zh-CN"),
                            };
                            saveOrderToStorage({ formData, currentStatus: step.key, statusProgress: next });
                            return next;
                          });
                        } else {
                          saveOrderToStorage({ formData, currentStatus: step.key, statusProgress });
                        }
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        done
                          ? "border-transparent bg-gradient-to-r from-[#f5f5f7] to-white"
                          : "border-dashed border-[#e5e5ea] bg-white opacity-60"
                      } ${isCurrent ? "!border-[#0071e3]/40 !from-[#E6F4FF] !shadow-md" : ""}`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white ${
                          done ? "" : "bg-[#e5e5ea]"
                        } ${isCurrent ? "ring-4 ring-[#0071e3]/20 scale-110" : ""}`}
                        style={{ backgroundColor: done ? step.color : undefined }}
                      >
                        {step.icon}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className={`font-bold ${done ? "text-[#1d1d1f]" : "text-[#c7c7cc]"}`}>
                            {step.label}
                          </p>
                          {statusProgress[step.key] && (
                            <span className="text-xs text-[#86868b] shrink-0 font-mono">
                              {statusProgress[step.key]}
                            </span>
                          )}
                        </div>
                        {isCurrent && isAutoPlaying && (
                          <div className="mt-2 h-1 bg-[#0071e3]/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: step.color }}
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: step.duration / 1000, ease: "linear" }}
                            />
                          </div>
                        )}
                      </div>
                      {done && (
                        <CheckCircle2 className="w-6 h-6 text-[#28cd41] shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-6 p-6 rounded-[2rem] bg-gradient-to-r from-[#E6F4FF] via-white to-[#F6FFED] border border-[#0071e3]/15">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-1">订单合计</p>
                    <p className="text-sm text-[#86868b]">
                      {formData.quantity} 件 × ¥ {formData.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-4xl md:text-5xl font-black gradient-text-dual leading-none">
                    ¥ {totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8 lg:sticky lg:top-28 self-start">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1d1d1f] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  订单预览图
                </h2>
                {previewImageUrl && (
                  <button
                    onClick={downloadImage}
                    className="px-4 py-2 rounded-2xl bg-[#28cd41] hover:bg-[#1e9a34] text-white font-semibold flex items-center gap-2 transition-colors ripple-target text-sm"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {previewImageUrl ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="rounded-[2rem] overflow-hidden border border-[#e5e5ea] shadow-lg relative group">
                      <img
                        src={previewImageUrl}
                        alt="订单预览"
                        className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={downloadImage}
                        className="flex-1 py-3 rounded-2xl btn-primary font-semibold flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        保存图片
                      </button>
                      <button
                        onClick={() => {
                          if (!previewImageUrl) return;
                          navigator.clipboard
                            .write([
                              new ClipboardItem({
                                "image/png": fetch(previewImageUrl).then((r) => r.blob()),
                              }),
                            ])
                            .then(() => showToast("success", "图片已复制到剪贴板"))
                            .catch(() => showToast("error", "浏览器不支持直接复制图片，请下载后手动复制"));
                        }}
                        className="px-5 py-3 rounded-2xl bg-[#f5f5f7] hover:bg-[#ececef] text-[#1d1d1f] font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="aspect-[2/3] rounded-[2rem] bg-gradient-to-br from-[#f5f5f7] via-white to-[#e5e5ea] flex flex-col items-center justify-center border-2 border-dashed border-[#d2d2d7] p-8">
                      <div className="w-20 h-20 rounded-3xl bg-white shadow-md flex items-center justify-center mb-6 tilt-card">
                        <QrCode className="w-10 h-10 text-[#0071e3]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">还没有生成预览</h3>
                      <p className="text-sm text-[#86868b] text-center mb-6 max-w-xs">
                        填写订单信息后，点击下方按钮生成精美的订单分享图
                      </p>
                      <button
                        onClick={generateOrderImage}
                        disabled={generatingImage}
                        className="w-full py-3 rounded-2xl btn-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {generatingImage ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                        {generatingImage ? "正在渲染..." : "立即生成"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#1a1a2e] rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-60 h-60 rounded-full bg-[#0071e3]/20 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#28cd41]/15 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">使用小贴士</h3>
                </div>
                <ul className="space-y-3 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="text-[#28cd41] mt-0.5">✓</span>
                    点击左侧「自动流转」按钮，可模拟订单从下单到完成的全流程
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#28cd41] mt-0.5">✓</span>
                    点击任一步骤条可手动跳转到对应状态，方便演示特定环节
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#28cd41] mt-0.5">✓</span>
                    生成的订单图为 1080×1620 高清尺寸，适合朋友圈 / 微信群分享
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#28cd41] mt-0.5">✓</span>
                    点击「新建订单」会自动重置表单并生成新的订单编号
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
