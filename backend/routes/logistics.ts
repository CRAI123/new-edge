import express, { type Request, type Response } from 'express'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

type CarrierCode = 'sf' | 'yto' | 'zto' | 'sto' | 'yd' | 'ems' | 'jd' | 'other'

interface TrackEvent {
  time: string
  location: string
  status: string
  description: string
  isLatest?: boolean
}

interface LogisticsResult {
  tracking_no: string
  carrier: string
  carrier_code: CarrierCode
  status: 'in_transit' | 'delivered' | 'pending' | 'exception' | 'returned'
  status_text: string
  origin: string
  destination: string
  estimated_delivery?: string
  signed_by?: string
  events: TrackEvent[]
  progress_percent: number
  data_source: 'mock' | 'kuaidi100' | 'kuaidiniao' | 'cainiao'
}

const CARRIER_MAP: Record<CarrierCode, { name: string; pattern: RegExp }> = {
  sf:    { name: '顺丰速运', pattern: /^(SF|sf|90|92|93|95|96)/ },
  yto:   { name: '圆通速递', pattern: /^(YT|yt|8|D)/ },
  zto:   { name: '中通快递', pattern: /^(ZT|zt|7|5)/ },
  sto:   { name: '申通快递', pattern: /^(ST|st|2|3|4)/ },
  yd:    { name: '韵达快递', pattern: /^(YD|yd|31|39|42|43)/ },
  ems:   { name: 'EMS/邮政', pattern: /^(E[eE]|98|99|10|11|12)/ },
  jd:    { name: '京东物流', pattern: /^(JD|jd|00|01|02)/ },
  other: { name: '其他快递', pattern: /(.*)/ },
}

const detectCarrier = (trackingNo: string): CarrierCode => {
  const codes: CarrierCode[] = ['sf', 'yto', 'zto', 'sto', 'yd', 'ems', 'jd']
  for (const code of codes) {
    if (CARRIER_MAP[code].pattern.test(trackingNo)) return code
  }
  return 'other'
}

const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const CITIES_NORTH = ['北京市朝阳区', '北京市海淀区', '天津市和平区', '石家庄市长安区', '济南市历下区', '青岛市市南区', '郑州市金水区', '西安市雁塔区']
const CITIES_CENTRAL = ['上海市浦东新区', '杭州市西湖区', '南京市鼓楼区', '苏州市工业园区', '合肥市蜀山区', '武汉市武昌区', '长沙市岳麓区', '南昌市东湖区']
const CITIES_SOUTH = ['广州市天河区', '深圳市南山区', '厦门市思明区', '福州市鼓楼区', '东莞市南城区', '佛山市南海区', '南宁市青秀区', '海口市龙华区']
const CITIES_WEST = ['成都市锦江区', '重庆市渝北区', '贵阳市云岩区', '昆明市五华区', '兰州市城关区']

const STATUS_TEMPLATES = [
  '快件已从【{city}】发出，下一站【转运中心】',
  '快件到达【{city}转运中心】，正在分拣',
  '快件已到达【{city}营业部】，正在卸车',
  '【{city}】派送员正在为您派送，电话：138****{rand}',
  '快件已送达【{city}】，签收人：本人签收',
  '快件已放入【{city}驿站/丰巢柜】，请凭取件码领取',
  '快件途经【{city}中转场】，已完成消杀',
  '【{city}】站点已揽收，快递员已取件',
]

const seededRandom = (seed: string) => {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0
    return h / 0xffffffff
  }
}

const generateMockTrack = (trackingNo: string): LogisticsResult => {
  const rand = seededRandom(trackingNo)
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]

  const carrierCode = detectCarrier(trackingNo)
  const carrier = CARRIER_MAP[carrierCode].name

  const delivered = rand() > 0.35
  const exception = !delivered && rand() > 0.88

  const origin = pick([...CITIES_NORTH, ...CITIES_SOUTH, ...CITIES_CENTRAL])
  let destination = pick([...CITIES_CENTRAL, ...CITIES_SOUTH, ...CITIES_WEST])
  while (destination === origin) destination = pick([...CITIES_CENTRAL, ...CITIES_SOUTH, ...CITIES_WEST])

  const allCities = [
    origin,
    pick(CITIES_NORTH),
    pick(CITIES_CENTRAL),
    destination,
  ]
  const transitCities = shuffle(allCities).slice(0, 2 + Math.floor(rand() * 3))
  if (!transitCities.includes(origin)) transitCities.unshift(origin)
  if (!transitCities.includes(destination)) transitCities.push(destination)

  const now = Date.now()
  const events: TrackEvent[] = []

  const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toLocaleString('zh-CN', { hour12: false })

  events.push({
    time: minutesAgo(60 * 24 * 3 + Math.floor(rand() * 600)),
    location: origin,
    status: '已揽收',
    description: `【${carrier}】${origin} 站点已揽收，快递员：李师傅 138****${Math.floor(rand() * 8999 + 1000)}`,
  })

  transitCities.slice(0, -1).forEach((city, i) => {
    const tpl1 = STATUS_TEMPLATES[0].replace('{city}', city).replace('{rand}', String(Math.floor(rand() * 8999 + 1000)))
    const tpl2 = STATUS_TEMPLATES[1].replace('{city}', city).replace('{rand}', String(Math.floor(rand() * 8999 + 1000)))
    const tpl3 = STATUS_TEMPLATES[6].replace('{city}', city).replace('{rand}', String(Math.floor(rand() * 8999 + 1000)))
    const minsAgo = 60 * 24 * (3 - i * 0.5) - Math.floor(rand() * 480)
    events.push({ time: minutesAgo(Math.max(minsAgo, 60)), location: city, status: '运输中', description: tpl1 })
    events.push({ time: minutesAgo(Math.max(minsAgo - 180, 30)), location: city, status: '分拣中', description: tpl2 })
    if (rand() > 0.5) {
      events.push({ time: minutesAgo(Math.max(minsAgo - 240, 20)), location: city, status: '中转', description: tpl3 })
    }
  })

  const destCity = transitCities[transitCities.length - 1]
  const preDeliveryMins = delivered ? 180 : exception ? 600 : 720

  events.push({
    time: minutesAgo(preDeliveryMins + 120),
    location: destCity,
    status: '到达站点',
    description: STATUS_TEMPLATES[2].replace('{city}', destCity).replace('{rand}', String(Math.floor(rand() * 8999 + 1000))),
  })

  let status_text = '运输中'
  let status_code: LogisticsResult['status'] = 'in_transit'
  let progress_percent = 60 + Math.floor(rand() * 25)

  if (exception) {
    status_text = '派送异常'
    status_code = 'exception'
    progress_percent = 85
    events.push({
      time: minutesAgo(preDeliveryMins),
      location: destCity,
      status: '派送异常',
      description: `【${destCity}】派送失败：收件人电话未接通，快件将在明日再次派送（客服热线：95***）`,
    })
  } else if (delivered) {
    status_text = '已签收'
    status_code = 'delivered'
    progress_percent = 100
    const signedBy = ['本人签收', '家人代收', '前台代收', '丰巢柜', '菜鸟驿站', '门卫代收']
    events.push({
      time: minutesAgo(preDeliveryMins),
      location: destCity,
      status: '派送中',
      description: STATUS_TEMPLATES[3].replace('{city}', destCity).replace('{rand}', String(Math.floor(rand() * 8999 + 1000))),
    })
    events.push({
      time: minutesAgo(Math.floor(rand() * 120 + 10)),
      location: destCity,
      status: '已签收',
      description: `快件已送达 ${destCity}，签收方式：${signedBy[Math.floor(rand() * signedBy.length)]}，感谢使用${carrier}！`,
      isLatest: true,
    })
  } else {
    events.push({
      time: minutesAgo(preDeliveryMins),
      location: destCity,
      status: '派送中',
      description: STATUS_TEMPLATES[3].replace('{city}', destCity).replace('{rand}', String(Math.floor(rand() * 8999 + 1000))),
      isLatest: true,
    })
  }

  events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  events[0].isLatest = true

  const estimated_delivery = new Date(now + 24 * 3600 * 1000).toLocaleDateString('zh-CN')

  return {
    tracking_no: trackingNo,
    carrier,
    carrier_code: carrierCode,
    status: status_code,
    status_text,
    origin,
    destination,
    estimated_delivery: delivered ? undefined : estimated_delivery,
    signed_by: delivered ? events[events.length - 1].description.match(/签收方式[：:]\s*(.+?)，/)?.[1] : undefined,
    events,
    progress_percent,
    data_source: 'mock',
  }
}

const queryKuaiDi100 = async (trackingNo: string, carrier?: CarrierCode): Promise<LogisticsResult | null> => {
  const key = process.env.KUAIDI100_KEY || process.env.KUAIDI100_CUSTOMER
  if (!key) return null
  try {
    const carrierCode = carrier || detectCarrier(trackingNo)
    const carrierName = CARRIER_MAP[carrierCode].name
    const resp = await axios.post('https://poll.kuaidi100.com/poll/query.do', {
      customer: process.env.KUAIDI100_CUSTOMER || '',
      key,
      param: JSON.stringify({
        com: carrierCode === 'other' ? 'auto' : carrierCode,
        num: trackingNo,
        phone: '',
        from: '',
        to: '',
        resultv2: '4',
        show: '0',
        order: 'desc',
      }),
    }, { timeout: 8000 })

    if (resp.data?.status === '200' && resp.data?.data) {
      const events: TrackEvent[] = resp.data.data.map((e: any, i: number) => ({
        time: e.time || e.ftime,
        location: e.context?.match(/【(.+?)】/)?.[1] || '',
        status: e.status || '运输中',
        description: e.context || e.desc,
        isLatest: i === 0,
      }))
      const delivered = resp.data.state === '3' || resp.data.state === '6'
      return {
        tracking_no: trackingNo,
        carrier: carrierName,
        carrier_code: carrierCode,
        status: delivered ? 'delivered' : resp.data.state === '4' ? 'exception' : 'in_transit',
        status_text: resp.data.message || (delivered ? '已签收' : '运输中'),
        origin: events[events.length - 1]?.location || '',
        destination: events[0]?.location || '',
        events,
        progress_percent: delivered ? 100 : 40 + Math.floor(events.length * 10),
        data_source: 'kuaidi100',
      }
    }
    return null
  } catch (err) {
    console.warn('[kuaidi100] query failed, fallback to mock:', (err as Error).message)
    return null
  }
}

const queryKuaiDiNiao = async (trackingNo: string, carrier?: CarrierCode): Promise<LogisticsResult | null> => {
  const eBusinessId = process.env.KUAIDINIAO_EBUSINESSID
  const appKey = process.env.KUAIDINIAO_APPKEY
  if (!eBusinessId || !appKey) return null
  try {
    const carrierCode = carrier || detectCarrier(trackingNo)
    const requestData = JSON.stringify({
      OrderCode: '',
      ShipperCode: carrierCode === 'other' ? 'AUTO' : carrierCode.toUpperCase(),
      LogisticCode: trackingNo,
    })
    const resp = await axios.post('https://api.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx', {
      RequestData: requestData,
      EBusinessID: eBusinessId,
      RequestType: '1002',
      DataSign: Buffer.from(
        require('crypto').createHash('md5').update(requestData + appKey).digest('hex')
      ).toString('base64'),
      DataType: '2',
    }, { timeout: 8000 })

    if (resp.data?.Success && resp.data?.Traces) {
      const carrierCode2 = detectCarrier(trackingNo)
      const events: TrackEvent[] = [...resp.data.Traces]
        .sort((a: any, b: any) => new Date(b.AcceptTime).getTime() - new Date(a.AcceptTime).getTime())
        .map((e: any, i: number) => ({
          time: e.AcceptTime,
          location: e.Location || e.AcceptStation?.match(/【(.+?)】/)?.[1] || '',
          status: e.Remark || '运输中',
          description: e.AcceptStation,
          isLatest: i === 0,
        }))
      const delivered = resp.data.State === '3' || resp.data.State === 4
      return {
        tracking_no: trackingNo,
        carrier: CARRIER_MAP[carrierCode2].name,
        carrier_code: carrierCode2,
        status: delivered ? 'delivered' : resp.data.State === '4' ? 'exception' : 'in_transit',
        status_text: resp.data.StateEx || (delivered ? '已签收' : '运输中'),
        origin: events[events.length - 1]?.location || '',
        destination: events[0]?.location || '',
        events,
        progress_percent: delivered ? 100 : 40 + Math.floor(events.length * 10),
        data_source: 'kuaidiniao',
      }
    }
    return null
  } catch (err) {
    console.warn('[kuaidiniao] query failed, fallback to mock:', (err as Error).message)
    return null
  }
}

router.get('/carriers', (_req: Request, res: Response) => {
  const carriers = Object.entries(CARRIER_MAP).map(([code, info]) => ({
    code,
    name: info.name,
  }))
  res.status(200).json({
    success: true,
    data: carriers,
  })
})

router.post('/detect', async (req: Request, res: Response) => {
  try {
    const { tracking_no } = req.body as { tracking_no?: string }
    if (!tracking_no || !tracking_no.trim()) {
      res.status(400).json({ success: false, error: '运单号不能为空' })
      return
    }
    const code = detectCarrier(tracking_no.trim())
    res.status(200).json({
      success: true,
      data: {
        carrier_code: code,
        carrier_name: CARRIER_MAP[code].name,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || '识别失败' })
  }
})

router.post('/track', async (req: Request, res: Response) => {
  try {
    const {
      tracking_no,
      carrier,
      force_mock = false,
    } = req.body as {
      tracking_no?: string
      carrier?: CarrierCode
      force_mock?: boolean
    }

    if (!tracking_no || !tracking_no.trim()) {
      res.status(400).json({ success: false, error: '运单号不能为空' })
      return
    }
    const no = tracking_no.trim()

    let result: LogisticsResult | null = null

    if (!force_mock) {
      const sources = [queryKuaiDi100, queryKuaiDiNiao]
      for (const fn of sources) {
        try {
          result = await fn(no, carrier)
          if (result) break
        } catch (e) {
          console.warn('[logistics] source failed:', (e as Error).message)
        }
      }
    }

    if (!result) {
      result = generateMockTrack(no)
    }

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (err: any) {
    console.error('[logistics] track error:', err)
    res.status(500).json({
      success: false,
      error: err.message || '查询失败，请稍后重试',
    })
  }
})

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { tracking_nos, carrier, force_mock = false } = req.body as {
      tracking_nos?: string[]
      carrier?: CarrierCode
      force_mock?: boolean
    }
    if (!tracking_nos || tracking_nos.length === 0) {
      res.status(400).json({ success: false, error: '运单号列表不能为空' })
      return
    }
    const results: LogisticsResult[] = []
    for (const no of tracking_nos) {
      if (force_mock || !(process.env.KUAIDI100_KEY || process.env.KUAIDINIAO_EBUSINESSID)) {
        results.push(generateMockTrack(no))
      } else {
        let r = await queryKuaiDi100(no, carrier).catch(() => null)
        if (!r) r = await queryKuaiDiNiao(no, carrier).catch(() => null)
        if (!r) r = generateMockTrack(no)
        results.push(r)
      }
    }
    res.status(200).json({
      success: true,
      data: results,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || '批量查询失败' })
  }
})

export default router
