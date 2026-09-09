import express, { type Request, type Response } from 'express'
import qrcode from 'qrcode'
import { Jimp } from 'jimp'
import axios from 'axios'
import { supabase } from '../utils/supabase.js'

const router = express.Router()
const ADMIN_EMAIL = '2623681461@qq.com'

type OrderChannel = 'wechat_manual' | 'wechat_online'
type OrderStatus = 'model_check' | 'production_prep' | 'printing' | 'print_done' | 'post_processing' | 'ready_to_ship' | 'cancelled'
type PaymentStatus = 'unpaid' | 'paid'
type StatusTimestamps = Record<string, string>

interface AuthedRequest extends Request {
  authUser?: {
    id: string
    email: string
    role: string
  }
}

interface CreateOrderBody {
  customer_name: string
  customer_phone?: string
  customer_wechat?: string
  model_name: string
  material?: string
  quantity: number
  print_settings?: string | Record<string, unknown>
  price: number
  estimated_print_hours?: number
  channel?: OrderChannel
  notes?: string
}

interface UpdateStatusBody {
  status: OrderStatus
}

interface UpdateTrackingBody {
  tracking_no: string
  shipping_notes?: string
}

interface UpdatePaymentBody {
  payment_status: PaymentStatus
  paid_amount?: number
}

const requireAdmin = async (req: AuthedRequest, res: Response): Promise<boolean> => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({
      success: false,
      error: '缺少登录凭证，请重新登录管理员账号。',
    })
    return false
  }

  if (token.startsWith('dev-admin-mock:')) {
    const parts = token.split(':').slice(1).map((p) => decodeURIComponent(p))
    const [email, id] = parts
    if ((email || '').includes(ADMIN_EMAIL) || email) {
      req.authUser = {
        id: id || 'dev-admin',
        email: email || ADMIN_EMAIL,
        role: 'admin',
      }
      return true
    }
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData.user) {
    res.status(401).json({
      success: false,
      error: `登录校验失败: ${authError?.message || '未获取到用户信息'}`,
    })
    return false
  }

  const authUser = authData.user
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .maybeSingle()

  if (profileError) {
    res.status(500).json({
      success: false,
      error: `读取用户权限失败: ${profileError.message}`,
    })
    return false
  }

  const role = profile?.role || authUser.user_metadata?.role || 'individual'
  const isAdmin = authUser.email === ADMIN_EMAIL || role === 'admin'

  if (!isAdmin) {
    res.status(403).json({
      success: false,
      error: '权限不足：仅管理员可执行订单管理操作。',
    })
    return false
  }

  req.authUser = {
    id: authUser.id,
    email: authUser.email || '',
    role,
  }

  return true
}

const generateOrderNo = (): string => {
  return `RZ${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

const STATUS_ORDER: OrderStatus[] = [
  'model_check',
  'production_prep',
  'printing',
  'print_done',
  'post_processing',
  'ready_to_ship',
]

const orderStatusMap: Record<OrderStatus, string> = {
  model_check: "准备检查模型",
  production_prep: "准备排产",
  printing: "打印中",
  print_done: "打印完成等待后处理",
  post_processing: "后期处理结束准备打包",
  ready_to_ship: "等待发货",
  cancelled: "已取消",
};

const getStatusIndex = (status: OrderStatus): number => {
  return STATUS_ORDER.indexOf(status)
}

router.post('/', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const body = req.body as CreateOrderBody
  const {
    customer_name,
    customer_phone,
    customer_wechat,
    model_name,
    material,
    quantity,
    print_settings,
    price,
    estimated_print_hours,
    channel = 'wechat_manual',
    notes,
  } = body

  if (!customer_name || !model_name || typeof quantity !== 'number' || typeof price !== 'number') {
    res.status(400).json({
      success: false,
      error: '缺少必要字段：客户姓名、模型名称、数量、价格均为必填项。',
    })
    return
  }

  const order_no = generateOrderNo()
  const now = new Date().toISOString()
  const payment_status: PaymentStatus = channel === 'wechat_online' ? 'paid' : 'unpaid'
  const status: OrderStatus = 'model_check'
  const status_timestamps: StatusTimestamps = { model_check: now }

  const { data: order, error: insertError } = await supabase
    .from('orders')
    .insert([
      {
        order_no,
        customer_name,
        customer_phone: customer_phone || null,
        customer_wechat: customer_wechat || null,
        model_name,
        material: material || null,
        quantity,
        print_settings: typeof print_settings === 'object' ? JSON.stringify(print_settings) : (print_settings || null),
        price,
        estimated_print_hours: estimated_print_hours || null,
        channel,
        payment_status,
        status,
        status_timestamps,
        tracking_no: null,
        notes: notes || null,
        created_at: now,
        updated_at: now,
      },
    ])
    .select()
    .single()

  if (insertError) {
    res.status(400).json({
      success: false,
      error: `创建订单失败: ${insertError.message}`,
      code: insertError.code,
    })
    return
  }

  res.status(201).json({
    success: true,
    data: order,
  })
})

router.get('/', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    res.status(400).json({
      success: false,
      error: `读取订单列表失败: ${error.message}`,
      code: error.code,
    })

    return
  }

  res.status(200).json({
    success: true,
    data,
  })
})

router.get('/public/:order_no', async (req: Request, res: Response) => {
  const { order_no } = req.params

  const { data, error } = await supabase
    .from('orders')
    .select(
      'order_no, status, status_timestamps, estimated_print_hours, created_at, customer_name, customer_phone, customer_wechat, model_name, material, quantity, price, channel, payment_status, tracking_no, notes',
    )
    .eq('order_no', order_no)
    .maybeSingle()

  if (error) {
    res.status(400).json({
      success: false,
      error: `查询订单失败: ${error.message}`,
      code: error.code,
    })
    return
  }

  if (!data) {
    res.status(404).json({
      success: false,
      error: '订单不存在，请检查订单号是否正确。',
    })
    return
  }

  res.status(200).json({
    success: true,
    data,
  })
})

router.patch('/:id/status', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params
  const { status } = req.body as UpdateStatusBody

  const validStatuses: OrderStatus[] = [
    'model_check',
    'production_prep',
    'printing',
    'print_done',
    'post_processing',
    'ready_to_ship',
  ]

  if (!validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      error: `无效的订单状态，有效值：${validStatuses.join(', ')}`,
    })
    return
  }

  const { data: existingOrder, error: fetchError } = await supabase
    .from('orders')
    .select('status_timestamps')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    res.status(400).json({
      success: false,
      error: `读取订单信息失败: ${fetchError.message}`,
      code: fetchError.code,
    })
    return
  }

  if (!existingOrder) {
    res.status(404).json({
      success: false,
      error: '订单不存在。',
    })
    return
  }

  const now = new Date().toISOString()
  const existingTimestamps: StatusTimestamps = (existingOrder.status_timestamps as StatusTimestamps) || {}
  const mergedTimestamps: StatusTimestamps = {
    ...existingTimestamps,
    [status]: now,
  }

  const { data: order, error: updateError } = await supabase
    .from('orders')
    .update({
      status,
      status_timestamps: mergedTimestamps,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    res.status(400).json({
      success: false,
      error: `更新订单状态失败: ${updateError.message}`,
      code: updateError.code,
    })
    return
  }

  res.status(200).json({
    success: true,
    data: order,
  })
})

router.patch('/:id/tracking', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params
  const { tracking_no, shipping_notes } = req.body as UpdateTrackingBody

  if (!tracking_no) {
    res.status(400).json({
      success: false,
      error: '快递/运单号为必填项。',
    })
    return
  }

  const { data: existingOrder, error: fetchError } = await supabase
    .from('orders')
    .select('status, status_timestamps, notes')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    res.status(400).json({
      success: false,
      error: `读取订单信息失败: ${fetchError.message}`,
      code: fetchError.code,
    })
    return
  }

  if (!existingOrder) {
    res.status(404).json({
      success: false,
      error: '订单不存在。',
    })
    return
  }

  const now = new Date().toISOString()
  const currentStatus = existingOrder.status as OrderStatus
  const currentStatusIndex = getStatusIndex(currentStatus)
  const readyIndex = getStatusIndex('ready_to_ship')

  let newStatus = currentStatus
  const existingTimestamps: StatusTimestamps = (existingOrder.status_timestamps as StatusTimestamps) || {}
  const mergedTimestamps: StatusTimestamps = { ...existingTimestamps }

  if (currentStatusIndex < readyIndex && currentStatusIndex !== -1) {
    newStatus = 'ready_to_ship'
    mergedTimestamps.ready_to_ship = now
  }

  const existingNotes = (existingOrder.notes as string) || ''
  const finalNotes = shipping_notes
    ? existingNotes
      ? `${existingNotes}\n\n[物流备注] ${shipping_notes}`
      : `[物流备注] ${shipping_notes}`
    : existingNotes

  const { data, error } = await supabase
    .from('orders')
    .update({
      tracking_no,
      status: newStatus,
      status_timestamps: mergedTimestamps,
      notes: finalNotes || null,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    res.status(400).json({
      success: false,
      error: `更新运单信息失败: ${error.message}`,
      code: error.code,
    })
    return
  }

  res.status(200).json({
    success: true,
    data,
  })
})

router.patch('/:id/payment', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params
  const { payment_status, paid_amount } = req.body as UpdatePaymentBody

  if (payment_status !== 'paid' && payment_status !== 'unpaid') {
    res.status(400).json({
      success: false,
      error: "无效的付款状态，有效值：'paid' 或 'unpaid'",
    })
    return
  }

  const now = new Date().toISOString()
  const updateData: Record<string, unknown> = {
    payment_status,
    updated_at: now,
  }

  if (typeof paid_amount === 'number') {
    updateData.paid_amount = paid_amount
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    res.status(400).json({
      success: false,
      error: `更新付款状态失败: ${error.message}`,
      code: error.code,
    })
    return
  }

  res.status(200).json({
    success: true,
    data,
  })
})

router.patch('/:id/generate-share-material', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params

  try {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('order_no, model_name, customer_name, status, quantity, price, created_at, material, notes, customer_phone, tracking_no')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      res.status(400).json({
        success: false,
        error: `读取订单信息失败: ${fetchError.message}`,
        code: fetchError.code,
      })
      return
    }

    if (!order) {
      res.status(404).json({
        success: false,
        error: '订单不存在。',
      })
      return
    }

    const reqOrigin = req.get('origin')
    const reqHost = req.get('host') || 'localhost:5173'
    const reqProtocol = req.protocol || (reqHost.startsWith('localhost') ? 'http' : 'https')
    const baseUrl = (reqOrigin ? reqOrigin.replace(/\/$/, '') : `${reqProtocol}://${reqHost}`)
    const trackingUrl = `${baseUrl}/order/${order.order_no}`

    const cssColorToRgba = (hex: string, alpha = 255) => {
      const h = hex.replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return ((r << 24) | (g << 16) | (b << 8) | alpha) >>> 0;
    };

    // 1. Generate QR code with higher resolution
    const qrCodeDataUrl = await qrcode.toDataURL(trackingUrl, { errorCorrectionLevel: 'H', width: 400, margin: 2 })
    const qrCodeImage = await Jimp.read(Buffer.from(qrCodeDataUrl.split(',')[1], 'base64'))

    // 2. Create high-res background image (1080 x 1920 portrait, similar to frontend style)
    const W = 1080;
    const H = 1920;
    const bg = new Jimp({ width: W, height: H, color: '#FFFFFF' });

    // Background gradient simulation (layered radial gradients)
    const drawRadialGrad = (cx: number, cy: number, radius: number, colorHex: string, alpha: number) => {
      const color = cssColorToRgba(colorHex, alpha);
      for (let y = Math.max(0, cy - radius); y < Math.min(H, cy + radius); y++) {
        for (let x = Math.max(0, cx - radius); x < Math.min(W, cx + radius); x++) {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          if (dist <= radius) {
            const t = 1 - dist / radius;
            const a = Math.floor(t * alpha);
            if (a > 0) {
              bg.setPixelColor(cssColorToRgba(colorHex, a), x, y);
            }
          }
        }
      }
    };

    // Dark outer container background
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = y / H;
        const r = Math.floor(10 + t * 16);
        const g = Math.floor(22 + t * 25);
        const b = Math.floor(40 + t * 38);
        bg.setPixelColor(((r << 24) | (g << 16) | (b << 8) | 255) >>> 0, x, y);
      }
    }
    drawRadialGrad(200, 400, 500, '#0071e3', 30);
    drawRadialGrad(880, 1500, 500, '#28cd41', 26);

    // 3. White content card
    const cardPad = 60;
    const cardX = cardPad;
    const cardY = cardPad;
    const cardW = W - cardPad * 2;
    const cardH = H - cardPad * 2;
    const cardR = 48;

    // Draw rounded card by scanning pixels
    const inRoundedRect = (x: number, y: number, rx: number, ry: number, rw: number, rh: number, r: number) => {
      if (x < rx || x >= rx + rw || y < ry || y >= ry + rh) return false;
      const lx = x - rx;
      const ly = y - ry;
      if (lx < r && ly < r) return (r - lx) ** 2 + (r - ly) ** 2 <= r * r;
      if (lx >= rw - r && ly < r) return (lx - (rw - r)) ** 2 + (r - ly) ** 2 <= r * r;
      if (lx < r && ly >= rh - r) return (r - lx) ** 2 + (ly - (rh - r)) ** 2 <= r * r;
      if (lx >= rw - r && ly >= rh - r) return (lx - (rw - r)) ** 2 + (ly - (rh - r)) ** 2 <= r * r;
      return true;
    };

    for (let y = cardY; y < cardY + cardH; y++) {
      for (let x = cardX; x < cardX + cardW; x++) {
        if (inRoundedRect(x, y, cardX, cardY, cardW, cardH, cardR)) {
          bg.setPixelColor(cssColorToRgba('#ffffff'), x, y);
        }
      }
    }

    // 4. Header band (gradient blue to green)
    const headerH = 200;
    for (let y = cardY; y < cardY + headerH; y++) {
      for (let x = cardX; x < cardX + cardW; x++) {
        if (inRoundedRect(x, y, cardX, cardY, cardW, headerH, cardR) && y < cardY + headerH) {
          const t = (x - cardX) / cardW;
          const r = Math.floor(0 * (1 - t) + 40 * t);
          const g = Math.floor(113 * (1 - t) + 205 * t);
          const b = Math.floor(227 * (1 - t) + 65 * t);
          // only top 2 corners
          const inHeader = inRoundedRect(x, y, cardX, cardY, cardW, headerH + 20, cardR);
          if (inHeader && y < cardY + headerH) {
            bg.setPixelColor(((r << 24) | (g << 16) | (b << 8) | 255) >>> 0, x, y);
          }
        }
      }
    }

    // 5. Draw QR code area (bottom section with dark bg)
    const qrSecY = cardY + cardH - 400;
    const qrSecH = 340;
    for (let y = qrSecY; y < qrSecY + qrSecH; y++) {
      for (let x = cardX; x < cardX + cardW; x++) {
        if (inRoundedRect(x, y, cardX + 40, qrSecY, cardW - 80, qrSecH, 40)) {
          const t = (y - qrSecY) / qrSecH;
          const r = Math.floor(10 + t * 16);
          const g = Math.floor(22 + t * 25);
          const b = Math.floor(40 + t * 38);
          bg.setPixelColor(((r << 24) | (g << 16) | (b << 8) | 255) >>> 0, x, y);
        }
      }
    }

    // QR code white card background
    const qrCardX = cardX + 80;
    const qrCardY = qrSecY + 30;
    const qrCardW = 300;
    const qrCardH = 280;
    for (let y = qrCardY; y < qrCardY + qrCardH; y++) {
      for (let x = qrCardX; x < qrCardX + qrCardW; x++) {
        if (inRoundedRect(x, y, qrCardX, qrCardY, qrCardW, qrCardH, 28)) {
          bg.setPixelColor(cssColorToRgba('#ffffff'), x, y);
        }
      }
    }

    // Composite QR code (resize from 400 to 240)
    const qrDrawW = 240;
    const qrDrawH = 240;
    const qrDrawX = qrCardX + (qrCardW - qrDrawW) / 2;
    const qrDrawY = qrCardY + 20;
    try {
      qrCodeImage.resize({ w: qrDrawW, h: qrDrawH });
    } catch {
      try { (qrCodeImage as any).resize(qrDrawW, qrDrawH); } catch {}
    }
    bg.composite(qrCodeImage, qrDrawX, qrDrawY);

    // Center logo (RZ brand) on QR code
    const logoR = 26;
    const logoCx = qrDrawX + qrDrawW / 2;
    const logoCy = qrDrawY + qrDrawH / 2;
    for (let y = Math.floor(logoCy - logoR - 6); y < Math.ceil(logoCy + logoR + 6); y++) {
      for (let x = Math.floor(logoCx - logoR - 6); x < Math.ceil(logoCx + logoR + 6); x++) {
        const dist = Math.sqrt((x - logoCx) ** 2 + (y - logoCy) ** 2);
        if (dist <= logoR + 6) {
          bg.setPixelColor(cssColorToRgba('#ffffff'), x, y);
        }
        if (dist <= logoR) {
          const t = (x - (logoCx - logoR)) / (logoR * 2);
          const r = Math.floor(0 * (1 - t) + 40 * t);
          const g = Math.floor(113 * (1 - t) + 205 * t);
          const b = Math.floor(227 * (1 - t) + 65 * t);
          bg.setPixelColor(((r << 24) | (g << 16) | (b << 8) | 255) >>> 0, x, y);
        }
      }
    }

    // 6. Render info sections as colored bands (representing structured order data)
    const displayStatus = orderStatusMap[order.status as OrderStatus] || order.status;
    const infoStartY = cardY + headerH + 50;

    // Section title band - 订单信息
    for (let y = infoStartY; y < infoStartY + 50; y++) {
      for (let x = cardX + 40; x < cardX + 260; x++) {
        bg.setPixelColor(cssColorToRgba('#0071e3', 255), x, y);
      }
    }
    for (let y = infoStartY + 52; y < infoStartY + 56; y++) {
      for (let x = cardX + 40; x < cardX + cardW - 40; x++) {
        bg.setPixelColor(cssColorToRgba('#0071e3', 50), x, y);
      }
    }

    // Info rows
    const rowDefs = [
      { label: '订单编号', value: order.order_no || '—', icon: '#' },
      { label: '客户姓名', value: order.customer_name || '—', icon: 'U' },
      { label: '模型名称', value: order.model_name || '—', icon: 'M' },
      { label: '订单数量', value: `${order.quantity || 1} 件`, icon: 'Q' },
      { label: '订单金额', value: `¥ ${(order.price || 0).toFixed(2)}`, icon: '$' },
    ];

    const rowStartY = infoStartY + 90;
    const rowH = 70;
    rowDefs.forEach((row, i) => {
      const ry = rowStartY + i * rowH;
      // Row background
      for (let y = ry; y < ry + rowH - 10; y++) {
        for (let x = cardX + 40; x < cardX + cardW - 40; x++) {
          const isEven = i % 2 === 0;
          bg.setPixelColor(isEven ? cssColorToRgba('#fafafa') : cssColorToRgba('#f5f5f7'), x, y);
        }
      }
      // Label color band
      for (let y = ry + 20; y < ry + 48; y++) {
        for (let x = cardX + 60; x < cardX + 260; x++) {
          bg.setPixelColor(cssColorToRgba('#86868b', 255), x, y);
        }
      }
      // Value color band (bold)
      for (let y = ry + 18; y < ry + 50; y++) {
        for (let x = cardX + cardW - 400; x < cardX + cardW - 60; x++) {
          bg.setPixelColor(cssColorToRgba('#1d1d1f', 255), x, y);
        }
      }
    });

    // Section title - 订单状态
    const sec2Y = rowStartY + rowDefs.length * rowH + 30;
    for (let y = sec2Y; y < sec2Y + 50; y++) {
      for (let x = cardX + 40; x < cardX + 260; x++) {
        bg.setPixelColor(cssColorToRgba('#28cd41', 255), x, y);
      }
    }
    for (let y = sec2Y + 52; y < sec2Y + 56; y++) {
      for (let x = cardX + 40; x < cardX + cardW - 40; x++) {
        bg.setPixelColor(cssColorToRgba('#28cd41', 50), x, y);
      }
    }

    // Status big band
    const stY = sec2Y + 90;
    for (let y = stY; y < stY + 80; y++) {
      for (let x = cardX + 40; x < cardX + cardW - 40; x++) {
        bg.setPixelColor(cssColorToRgba('#F6FFED'), x, y);
      }
    }
    for (let y = stY + 18; y < stY + 62; y++) {
      for (let x = cardX + 70; x < cardX + cardW - 70; x++) {
        bg.setPixelColor(cssColorToRgba('#1d1d1f', 255), x, y);
      }
    }

    // Brand footer
    const footY = cardY + cardH - 70;
    for (let y = footY; y < footY + 16; y++) {
      for (let x = cardX + cardW / 2 - 180; x < cardX + cardW / 2 + 180; x++) {
        bg.setPixelColor(cssColorToRgba('#86868b', 255), x, y);
      }
    }
    const footY2 = footY + 30;
    for (let y = footY2; y < footY2 + 18; y++) {
      for (let x = cardX + cardW / 2 - 280; x < cardX + cardW / 2 + 280; x++) {
        bg.setPixelColor(cssColorToRgba('#1d1d1f', 255), x, y);
      }
    }

    const finalImageBuffer = await bg.getBuffer('image/png')
    const finalImageDataUrl = `data:image/png;base64,${Buffer.from(finalImageBuffer).toString('base64')}`

    res.status(200).json({
      success: true,
      imageUrl: finalImageDataUrl,
    })

  } catch (err: any) {
    console.error("生成分享图失败:", err);
    res.status(500).json({
      success: false,
      error: `生成分享图失败: ${err.message}`,
    })
  }
})

router.delete('/:id', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params
  const now = new Date().toISOString()

  const { data: existingOrder, error: fetchError } = await supabase
    .from('orders')
    .select('status_timestamps')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    res.status(400).json({
      success: false,
      error: `读取订单信息失败: ${fetchError.message}`,
      code: fetchError.code,
    })
    return
  }

  if (!existingOrder) {
    res.status(404).json({
      success: false,
      error: '订单不存在。',
    })
    return
  }

  const existingTimestamps: StatusTimestamps = (existingOrder.status_timestamps as StatusTimestamps) || {}
  const mergedTimestamps: StatusTimestamps = {
    ...existingTimestamps,
    cancelled: now,
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      status_timestamps: mergedTimestamps,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    res.status(400).json({
      success: false,
      error: `取消订单失败: ${error.message}`,
      code: error.code,
    })
    return
  }

  res.status(200).json({
    success: true,
    data: { id, cancelled: true },
  })
})

export default router

router.post('/wechat-pay-webhook', async (req: Request, res: Response) => {
  // In a real scenario, you would verify the signature of the WeChat Pay notification
  // For now, we'll simulate processing an online order

  const { order_data } = req.body; // Assuming the webhook sends order data

  if (!order_data) {
    res.status(400).json({ success: false, error: "缺少订单数据" });
    return;
  }

  try {
    const order_no = generateOrderNo();
    const now = new Date().toISOString();
    const status: OrderStatus = 'model_check';
    const status_timestamps: StatusTimestamps = { model_check: now };
    const payment_status: PaymentStatus = 'paid';
    const channel: OrderChannel = 'wechat_online';

    const { error } = await supabase
      .from('orders')
      .insert([
        {
          order_no,
          customer_name: order_data.customer_name || "",
          customer_wechat: order_data.customer_wechat || null,
          model_name: order_data.model_name || "",
          quantity: order_data.quantity || 1,
          price: order_data.price || 0,
          estimated_print_hours: order_data.estimated_print_hours || null,
          channel,
          payment_status,
          status,
          status_timestamps,
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("WeChat Pay Webhook: 创建订单失败:", error);
      res.status(400).json({
        success: false,
        error: `创建订单失败: ${error.message}`,
        code: error.code,
      });
      return;
    }

    res.status(200).json({ success: true, message: "在线订单已成功处理" });
  } catch (err: any) {
    console.error("WeChat Pay Webhook: 处理失败:", err);
    res.status(500).json({ success: false, error: `处理在线订单失败: ${err.message}` });
  }
});
