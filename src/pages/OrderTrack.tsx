import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useParams,
  useNavigate,
  Link
} from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Printer as PrinterIcon,
  Package,
  Truck,
  Sparkles,
  Copy,
  User,
  Phone,
  Layers,
  Palette,
  Ruler,
  DollarSign,
  FileText,
  RefreshCw,
  QrCode,
  Share2,
  ChevronRight,
  Home,
  Search,
  Download
} from "lucide-react";
import { showToast } from "@/lib/utils";
import QRCode from "qrcode";

type VirtualStatus = "pending" | "confirmed" | "printing" | "post_process" | "quality_check" | "packaging" | "shipping" | "delivered";

interface OrderData {
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
  currentStatus: VirtualStatus;
  statusProgress: Record<VirtualStatus, string>;
  savedAt: number;
}

interface StatusStep {
  key: VirtualStatus;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const STATUS_STEPS: StatusStep[] = [
  { key: "pending", label: "待确认", icon: <Clock className="w-5 h-5" />, description: "订单已提交，等待客服确认", color: "#f59e0b" },
  { key: "confirmed", label: "已接单", icon: <CheckCircle2 className="w-5 h-5" />, description: "订单已确认，准备排产", color: "#8b5cf6" },
  { key: "printing", label: "打印中", icon: <PrinterIcon className="w-5 h-5" />, description: "3D 打印机正在工作中", color: "#0071e3" },
  { key: "post_process", label: "后处理", icon: <Layers className="w-5 h-5" />, description: "进行支撑拆除、打磨等处理", color: "#06b6d4" },
  { key: "quality_check", label: "质检中", icon: <CheckCircle2 className="w-5 h-5" />, description: "质量检查与尺寸核对", color: "#84cc16" },
  { key: "packaging", label: "打包中", icon: <Package className="w-5 h-5" />, description: "精心包装，准备发货", color: "#f97316" },
  { key: "shipping", label: "配送中", icon: <Truck className="w-5 h-5" />, description: "快递运输中，注意查收", color: "#ec4899" },
  { key: "delivered", label: "已完成", icon: <Sparkles className="w-5 h-5" />, description: "订单已送达，感谢您的支持", color: "#28cd41" },
];

const STORAGE_PREFIX = "rayzo_order_";

const loadOrderFromStorage = (orderNo: string): OrderData | null => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + orderNo);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
};

const generateMockData = (orderNo: string): OrderData => {
  const now = Date.now();
  const step = Math.floor(Math.random() * 5) + 1;
  const statusProgress: Record<VirtualStatus, string> = {
    pending: new Date(now - 3600_000 * 8).toLocaleString("zh-CN"),
    confirmed: new Date(now - 3600_000 * 7).toLocaleString("zh-CN"),
    printing: step >= 2 ? new Date(now - 3600_000 * 6).toLocaleString("zh-CN") : "",
    post_process: step >= 3 ? new Date(now - 3600_000 * 4).toLocaleString("zh-CN") : "",
    quality_check: step >= 4 ? new Date(now - 3600_000 * 2).toLocaleString("zh-CN") : "",
    packaging: step >= 5 ? new Date(now - 3600_000 * 1).toLocaleString("zh-CN") : "",
    shipping: "",
    delivered: "",
  };
  return {
    orderNo,
    customerName: "客户先生/女士",
    customerPhone: "138 **** ****",
    modelName: orderNo.includes("RZ") ? "3D 打印定制件" : "创意模型",
    quantity: 1,
    price: 88,
    material: "PLA",
    color: "白色",
    layerHeight: "0.20mm (标准)",
    infill: "20% (标准)",
    notes: "感谢您的耐心等待，我们将用心完成每一件作品。",
    currentStatus: STATUS_STEPS[step].key,
    statusProgress,
    savedAt: now,
  };
};

export default function OrderTrack() {
  const { orderNo } = useParams<{ orderNo: string }>();
  const navigate = useNavigate();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inputOrderNo, setInputOrderNo] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  const generateQRCode = useCallback(async () => {
    if (!orderNo) return;
    try {
      const url = `${window.location.origin}/order/${orderNo}`;
      const canvas = qrCanvasRef.current || document.createElement("canvas");
      await QRCode.toCanvas(canvas, url, {
        width: 360,
        margin: 2,
        color: {
          dark: "#1d1d1f",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });
      qrCanvasRef.current = canvas;
      const dataUrl = canvas.toDataURL("image/png", 0.95);
      setQrImageUrl(dataUrl);
    } catch (err) {
      console.error("生成二维码失败:", err);
    }
  }, [orderNo]);

  const loadOrder = useCallback((no: string) => {
    setLoading(true);
    setNotFound(false);
    setOrder(null);
    setTimeout(() => {
      const saved = loadOrderFromStorage(no);
      if (saved) {
        setOrder(saved);
      } else {
        setOrder(generateMockData(no));
      }
      if (!order) {
        // 如果没有真实存储的数据，展示演示数据，但提示用户
      }
      setLoading(false);
    }, 500);
  }, [order]);

  useEffect(() => {
    if (orderNo) {
      loadOrder(orderNo);
      setInputOrderNo(orderNo);
      generateQRCode();
    } else {
      setLoading(false);
      setNotFound(true);
    }
  }, [orderNo, loadOrder, generateQRCode]);

  const downloadQRCode = () => {
    if (!qrImageUrl || !orderNo) return;
    const a = document.createElement("a");
    a.href = qrImageUrl;
    a.download = `订单二维码_${orderNo}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("success", "二维码已下载");
  };

  const copyQRImage = async () => {
    if (!qrImageUrl) return;
    try {
      const blob = await fetch(qrImageUrl).then(r => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);
      showToast("success", "二维码图片已复制到剪贴板");
    } catch {
      showToast("error", "浏览器不支持直接复制图片，请下载后手动复制");
    }
  };

  const getCurrentStepIndex = () =>
    order ? STATUS_STEPS.findIndex((s) => s.key === order.currentStatus) : 0;

  const getProgressPercent = () => {
    const idx = getCurrentStepIndex();
    return Math.round(((idx + 1) / STATUS_STEPS.length) * 100);
  };

  const totalAmount = order ? order.quantity * order.price : 0;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      if (order && getCurrentStepIndex() < STATUS_STEPS.length - 1) {
        const nextIdx = getCurrentStepIndex() + 1;
        const nextKey = STATUS_STEPS[nextIdx].key;
        const updated = {
          ...order,
          currentStatus: nextKey,
          statusProgress: {
            ...order.statusProgress,
            [nextKey]: new Date().toLocaleString("zh-CN"),
          },
        };
        setOrder(updated);
        try {
          localStorage.setItem(STORAGE_PREFIX + order.orderNo, JSON.stringify(updated));
        } catch {
          /* ignore */
        }
        showToast("success", `状态更新：${STATUS_STEPS[nextIdx].label}`);
      } else {
        showToast("info", "订单已是最新状态");
      }
      setRefreshing(false);
    }, 800);
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    navigator.clipboard
      .writeText(url)
      .then(() => showToast("success", "订单链接已复制"))
      .catch(() => showToast("error", "复制失败"));
  };

  const copyOrderNo = () => {
    if (!order) return;
    navigator.clipboard
      .writeText(order.orderNo)
      .then(() => showToast("success", "订单号已复制"))
      .catch(() => showToast("error", "复制失败"));
  };

  const handleSearch = () => {
    const no = inputOrderNo.trim();
    if (!no) {
      showToast("error", "请输入订单号");
      return;
    }
    navigate(`/order/${no}`);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#f5f5f7]">
      <canvas ref={qrCanvasRef} className="hidden" />
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#0071e3] transition-colors group"
            >
              <Home className="w-4 h-4" />
              首页
            </Link>
            <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
            <Link
              to="/order-generator"
              className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#0071e3] transition-colors group"
            >
              <FileText className="w-4 h-4" />
              订单中心
            </Link>
            <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
            <span className="text-[#1d1d1f] font-semibold">订单追踪</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white text-[#86868b] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                <QrCode className="w-3.5 h-3.5" />
                Order Tracking · 订单实时追踪
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] mb-3 leading-tight">
                订单 <span className="gradient-text-dual">实时追踪</span>
              </h1>
              <p className="text-[#86868b] text-lg max-w-2xl">
                扫描二维码或打开链接，即可查看订单的生产进度与配送状态，全程透明可追溯。
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="relative">
                <input
                  type="text"
                  value={inputOrderNo}
                  onChange={(e) => setInputOrderNo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="输入其他订单号查询"
                  className="pl-12 pr-4 py-3 rounded-2xl bg-white border border-[#e5e5ea] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all text-sm font-medium w-64"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
              </div>
              <button
                onClick={handleSearch}
                className="px-5 py-3 rounded-2xl btn-primary font-semibold text-sm flex items-center gap-2 ripple-target"
              >
                查询订单
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing || !order}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-semibold flex items-center gap-2 border border-[#e5e5ea] transition-all disabled:opacity-60 ripple-target"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                刷新状态
              </button>
              <button
                onClick={copyShareLink}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-semibold flex items-center gap-2 border border-[#e5e5ea] transition-all ripple-target"
              >
                <Share2 className="w-4 h-4" />
                复制链接
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-16 shadow-sm border border-white shimmer-border flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full border-4 border-[#e5e5ea] border-t-[#0071e3] animate-spin mb-6" />
              <p className="text-[#86868b] font-semibold">正在加载订单信息...</p>
            </motion.div>
          ) : notFound ? (
            <motion.div
              key="notfound"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-16 shadow-sm border border-white shimmer-border text-center"
            >
              <div className="w-24 h-24 rounded-[2rem] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-8">
                <FileText className="w-12 h-12 text-[#c7c7cc]" />
              </div>
              <h2 className="text-3xl font-bold text-[#1d1d1f] mb-4">未找到订单</h2>
              <p className="text-[#86868b] mb-8 max-w-md mx-auto">
                请确认订单号是否正确，或联系客服获取帮助。
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  to="/order-generator"
                  className="px-8 py-3 rounded-2xl btn-primary font-semibold flex items-center gap-2 ripple-target"
                >
                  创建新订单
                </Link>
                <Link
                  to="/"
                  className="px-8 py-3 rounded-2xl bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-semibold border border-[#e5e5ea] flex items-center gap-2 transition-all ripple-target"
                >
                  返回首页
                </Link>
              </div>
            </motion.div>
          ) : (
            order && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
              >
                {/* 订单头部信息 */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border mb-8 overflow-hidden relative">
                  <div className={`absolute inset-0 opacity-[0.04]`} style={{
                    background: `radial-gradient(circle at 85% 15%, ${STATUS_STEPS[getCurrentStepIndex()].color}, transparent 50%)`
                  }} />
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{
                          backgroundColor: `${STATUS_STEPS[getCurrentStepIndex()].color}15`,
                          color: STATUS_STEPS[getCurrentStepIndex()].color,
                        }}>
                          {STATUS_STEPS[getCurrentStepIndex()].icon}
                          <span className="text-xs font-bold">{STATUS_STEPS[getCurrentStepIndex()].label}</span>
                        </div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h2 className="text-2xl md:text-3xl font-black text-[#1d1d1f] font-mono break-all">
                            {order.orderNo}
                          </h2>
                          <button
                            onClick={copyOrderNo}
                            className="p-2 rounded-xl hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#0071e3] transition-colors shrink-0"
                            title="复制订单号"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[#86868b]">
                          {STATUS_STEPS[getCurrentStepIndex()].description}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-xs text-[#86868b] font-bold uppercase tracking-wider mb-1">订单总额</p>
                        <p className="text-4xl md:text-5xl font-black gradient-text-dual leading-none">
                          ¥ {totalAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-[#86868b] mt-2">
                          {order.quantity} 件 × ¥ {order.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-[#86868b] uppercase tracking-wider">整体进度</p>
                        <p className="text-sm font-black text-[#1d1d1f]">{getProgressPercent()}%</p>
                      </div>
                      <div className="relative h-3 rounded-full bg-[#f5f5f7] overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#0071e3] via-[#00c6ff] to-[#28cd41]"
                          initial={{ width: 0 }}
                          animate={{ width: `${getProgressPercent()}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                        <motion.div
                          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg border-2 border-[#0071e3] z-10"
                          initial={{ left: 0 }}
                          animate={{ left: `calc(${getProgressPercent()}% - 10px)` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        >
                          <span className="absolute inset-1 rounded-full bg-gradient-to-br from-[#0071e3] to-[#28cd41] animate-pulse" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* 左侧 - 状态流 */}
                  <div className="lg:col-span-3 space-y-8">
                    {/* 状态时间线 */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border">
                      <h3 className="text-2xl font-bold text-[#1d1d1f] mb-8 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center">
                          <Clock className="w-5 h-5" />
                        </div>
                        生产进度时间线
                        <span className="ml-auto text-sm font-bold text-[#86868b] px-3 py-1 rounded-full bg-[#f5f5f7]">
                          第 {getCurrentStepIndex() + 1} / {STATUS_STEPS.length} 步
                        </span>
                      </h3>

                      <div className="relative pl-8 md:pl-14">
                        <div className="absolute left-3 md:left-6 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#28cd41] via-[#0071e3] to-[#e5e5ea]" />
                        {STATUS_STEPS.map((step, i) => {
                          const done = i <= getCurrentStepIndex();
                          const isCurrent = i === getCurrentStepIndex();
                          return (
                            <motion.div
                              key={step.key}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06 }}
                              className={`relative mb-8 last:mb-0 ${isCurrent ? "" : "opacity-95"}`}
                            >
                              <div
                                className={`absolute -left-1.5 md:-left-4 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${
                                  isCurrent ? "ring-4 ring-offset-2 ring-opacity-30" : ""
                                }`}
                                style={{
                                  backgroundColor: done ? step.color : "#d2d2d7",
                                  boxShadow: isCurrent ? `0 0 0 8px ${step.color}22` : undefined,
                                }}
                              >
                                {isCurrent ? (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="text-white"
                                  >
                                    {step.icon}
                                  </motion.div>
                                ) : done ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <div
                                className={`rounded-3xl p-5 transition-all ${
                                  isCurrent
                                    ? "bg-gradient-to-br from-white to-[#F6FFED] border border-[#28cd41]/20 shadow-md"
                                    : done
                                    ? "bg-[#fafafa] hover:bg-[#f5f5f7] border border-transparent"
                                    : "bg-white border border-dashed border-[#e5e5ea] opacity-60"
                                }`}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-lg font-bold ${done ? "text-[#1d1d1f]" : "text-[#c7c7cc]"}`}>
                                      {step.label}
                                    </span>
                                    {isCurrent && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black text-white animate-pulse" style={{ backgroundColor: step.color }}>
                                        <Sparkles className="w-3 h-3" />
                                        进行中
                                      </span>
                                    )}
                                  </div>
                                  {order.statusProgress[step.key] && done && (
                                    <span className="text-xs font-mono text-[#86868b] font-bold whitespace-nowrap bg-white px-3 py-1 rounded-full border border-[#e5e5ea]">
                                      {order.statusProgress[step.key]}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm leading-relaxed ${done ? "text-[#86868b]" : "text-[#c7c7cc]"}`}>
                                  {step.description}
                                </p>
                              </div>
                              <ChevronRight className="hidden md:block absolute left-6 top-6 w-4 h-4 text-[#c7c7cc]" />
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 右侧 - 订单详情 */}
                  <div className="lg:col-span-2 space-y-8 lg:sticky lg:top-28 self-start">
                    {/* 客户信息 */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border">
                      <h3 className="text-xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        订单详情
                      </h3>
                      <div className="space-y-4">
                        {[
                          { k: "客户姓名", v: order.customerName, icon: <User className="w-4 h-4" /> },
                          { k: "联系电话", v: order.customerPhone, icon: <Phone className="w-4 h-4" /> },
                          { k: "模型名称", v: order.modelName, icon: <Layers className="w-4 h-4" /> },
                          { k: "打印数量", v: `${order.quantity} 件`, icon: <Package className="w-4 h-4" /> },
                        ].map((row, i) => (
                          <div key={i} className="flex items-start justify-between gap-3 pb-4 border-b border-[#f5f5f7] last:border-0 last:pb-0">
                            <p className="text-sm font-semibold text-[#86868b] whitespace-nowrap flex items-center gap-2">
                              <span className="text-[#0071e3]">{row.icon}</span>
                              {row.k}
                            </p>
                            <p className="text-sm font-bold text-right break-all text-[#1d1d1f]">{row.v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 打印参数 */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border">
                      <h3 className="text-xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#28cd41]/10 text-[#28cd41] flex items-center justify-center">
                          <PrinterIcon className="w-5 h-5" />
                        </div>
                        打印参数
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { k: "材料", v: order.material, icon: <Layers className="w-4 h-4" /> },
                          { k: "颜色", v: order.color, icon: <Palette className="w-4 h-4" /> },
                          { k: "层高", v: order.layerHeight, icon: <Ruler className="w-4 h-4" /> },
                          { k: "填充", v: order.infill, icon: <Layers className="w-4 h-4" /> },
                        ].map((p, i) => (
                          <div key={i} className="p-4 rounded-2xl bg-[#f5f5f7] hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-[#e5e5ea]">
                            <div className="flex items-center gap-1.5 mb-2 text-[#86868b]">
                              <span className="text-[#0071e3]">{p.icon}</span>
                              <span className="text-xs font-bold">{p.k}</span>
                            </div>
                            <p className="text-sm font-black text-[#1d1d1f] break-words">{p.v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 二维码卡片 */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#0071e3]/8 blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#28cd41]/8 blur-3xl" />
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#28cd41] text-white flex items-center justify-center">
                            <QrCode className="w-5 h-5" />
                          </div>
                          订单追踪二维码
                        </h3>

                        <div className="bg-gradient-to-br from-[#fafafa] to-[#f5f5f7] rounded-[2rem] p-6 mb-5 relative overflow-hidden">
                          <div className="absolute inset-0 opacity-[0.03]" style={{
                            backgroundImage: `radial-gradient(circle at 20% 20%, #0071e3 0%, transparent 40%), radial-gradient(circle at 80% 80%, #28cd41 0%, transparent 40%)`
                          }} />
                          <div className="relative z-10 flex flex-col items-center">
                            {qrImageUrl ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, type: "spring" }}
                                className="bg-white rounded-3xl p-4 shadow-lg border border-[#e5e5ea]/60 relative"
                              >
                                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 rounded-tl-xl" style={{ borderColor: "#0071e3" }} />
                                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 rounded-tr-xl" style={{ borderColor: "#28cd41" }} />
                                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 rounded-bl-xl" style={{ borderColor: "#28cd41" }} />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 rounded-br-xl" style={{ borderColor: "#0071e3" }} />
                                <img
                                  src={qrImageUrl}
                                  alt="订单追踪二维码"
                                  className="w-48 h-48 object-contain"
                                />
                              </motion.div>
                            ) : (
                              <div className="w-48 h-48 rounded-2xl bg-white flex items-center justify-center shadow-inner border border-[#e5e5ea]">
                                <div className="w-10 h-10 rounded-full border-4 border-[#e5e5ea] border-t-[#0071e3] animate-spin" />
                              </div>
                            )}
                            <p className="mt-4 text-sm font-bold text-[#1d1d1f]">扫码查看实时进度</p>
                            <p className="mt-1 text-xs text-[#86868b]">使用微信/相机扫一扫即可</p>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-[#f5f5f7] p-4 mb-5">
                          <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2">追踪链接</p>
                          <p className="text-sm font-mono text-[#1d1d1f] break-all">{`${window.location.origin}/order/${orderNo}`}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={copyShareLink}
                            className="py-3 rounded-2xl bg-white hover:bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-semibold flex flex-col items-center gap-1 transition-all hover:shadow-md"
                          >
                            <Copy className="w-4 h-4" />
                            <span className="text-xs">复制链接</span>
                          </button>
                          <button
                            onClick={copyQRImage}
                            disabled={!qrImageUrl}
                            className="py-3 rounded-2xl bg-[#0071e3]/10 hover:bg-[#0071e3]/15 text-[#0071e3] font-semibold flex flex-col items-center gap-1 transition-all disabled:opacity-50"
                          >
                            <Share2 className="w-4 h-4" />
                            <span className="text-xs">复制二维码</span>
                          </button>
                          <button
                            onClick={downloadQRCode}
                            disabled={!qrImageUrl}
                            className="py-3 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#28cd41] hover:shadow-lg text-white font-semibold flex flex-col items-center gap-1 transition-all disabled:opacity-50"
                          >
                            <Download className="w-4 h-4" />
                            <span className="text-xs">下载图片</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 备注 */}
                    {order.notes && (
                      <div className="bg-gradient-to-br from-[#fffbeb] via-white to-[#fff7ed] rounded-[2.5rem] p-8 border border-[#f59e0b]/15 relative overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#f59e0b]/10 blur-2xl" />
                        <div className="relative z-10">
                          <h3 className="text-lg font-bold text-[#1d1d1f] mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#f59e0b]" />
                            备注信息
                          </h3>
                          <p className="text-[#86868b] text-sm leading-relaxed">{order.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* 底部 CTA */}
                    <div className="bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#1a1a2e] rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-60 h-60 rounded-full bg-[#0071e3]/20 blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#28cd41]/15 blur-3xl" />
                      <div className="relative z-10 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-5">
                          <Sparkles className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">分享给客户</h3>
                        <p className="text-sm text-white/70 mb-6">
                          将二维码或链接分享给客户，对方扫码或点击即可查看实时订单状态
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={copyShareLink}
                            className="flex-1 py-3 rounded-2xl bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-bold flex items-center justify-center gap-2 transition-colors ripple-target"
                          >
                            <Copy className="w-4 h-4" />
                            复制链接
                          </button>
                          <Link
                            to="/order-generator"
                            className="px-5 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold flex items-center gap-2 transition-colors ripple-target"
                          >
                            <FileText className="w-4 h-4" />
                            新建
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
