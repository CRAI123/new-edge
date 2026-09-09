import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  ArrowLeftRight,
  Sparkles,
  Copy,
  RefreshCw,
  Plane,
  ArrowLeft,
  Layers,
  TrendingUp,
  Shield,
  Link as LinkIcon,
  Info,
  QrCode
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { showToast } from "@/lib/utils";

interface TrackEvent {
  time: string;
  location: string;
  status: string;
  description: string;
  isLatest?: boolean;
}

interface LogisticsResult {
  tracking_no: string;
  carrier: string;
  carrier_code: string;
  status: "in_transit" | "delivered" | "pending" | "exception" | "returned";
  status_text: string;
  origin: string;
  destination: string;
  estimated_delivery?: string;
  signed_by?: string;
  events: TrackEvent[];
  progress_percent: number;
  data_source: "mock" | "kuaidi100" | "kuaidiniao" | "cainiao";
}

const STATUS_META: Record<LogisticsResult["status"], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  in_transit: { label: "运输中", color: "#0071e3", bg: "#E6F4FF", icon: <Truck className="w-5 h-5" /> },
  delivered: { label: "已签收", color: "#28cd41", bg: "#F6FFED", icon: <CheckCircle2 className="w-5 h-5" /> },
  pending:   { label: "待揽收", color: "#f59e0b", bg: "#FFFBF0", icon: <Clock className="w-5 h-5" /> },
  exception: { label: "派送异常", color: "#ef4444", bg: "#FEF2F2", icon: <AlertTriangle className="w-5 h-5" /> },
  returned:  { label: "退回中", color: "#8b5cf6", bg: "#F5F3FF", icon: <ArrowLeftRight className="w-5 h-5" /> },
};

const CARRIER_BRAND_COLORS: Record<string, { from: string; to: string; text: string }> = {
  sf:    { from: "from-slate-900", to: "to-slate-700", text: "text-white" },
  yto:   { from: "from-violet-600", to: "to-violet-400", text: "text-white" },
  zto:   { from: "from-sky-600", to: "to-sky-400", text: "text-white" },
  sto:   { from: "from-yellow-500", to: "to-amber-400", text: "text-slate-900" },
  yd:    { from: "from-rose-600", to: "to-rose-400", text: "text-white" },
  ems:   { from: "from-green-700", to: "to-green-500", text: "text-white" },
  jd:    { from: "from-red-600", to: "to-red-400", text: "text-white" },
  other: { from: "from-slate-700", to: "to-slate-500", text: "text-white" },
};

export default function LogisticsTracker() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LogisticsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trackingNoFromUrl = searchParams.get("no");
  const orderNoFromUrl = searchParams.get("order");

  const querySingle = async (no: string) => {
    const trimmedNo = no.trim();
    if (!trimmedNo) {
      setError("缺少运单号参数");
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const resp = await fetch("/api/logistics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_no: trimmedNo }),
      });
      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || "查询失败");
      }
      setResult(data.data);
    } catch (err: any) {
      setError(err.message || "查询失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trackingNoFromUrl) {
      querySingle(trackingNoFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingNoFromUrl]);

  const copyTrackingNo = async (no: string) => {
    try {
      await navigator.clipboard.writeText(no);
      showToast("success", "运单号已复制");
    } catch {
      showToast("error", "复制失败");
    }
  };

  const copyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("success", "轨迹链接已复制");
    } catch {
      showToast("error", "复制失败");
    }
  };

  const getCarrierBrand = (code: string) =>
    CARRIER_BRAND_COLORS[code] || CARRIER_BRAND_COLORS.other;

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#0071e3] transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            返回首页
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white text-[#86868b] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                <Truck className="w-3.5 h-3.5" />
                Logistics Trace · 轨迹追溯
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] mb-3 leading-tight">
                快递<span className="gradient-text-dual">轨迹查询</span>
              </h1>
              <p className="text-[#86868b] text-lg max-w-2xl">
                通过订单分享链接访问本页面，实时查看物流运输进度与派送节点信息。
              </p>
            </div>
            {result && (
              <div className="flex gap-3">
                <button
                  onClick={copyCurrentUrl}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-semibold border border-[#e5e5ea] flex items-center gap-2 ripple-target"
                >
                  <LinkIcon className="w-4 h-4" />
                  复制链接
                </button>
                <button
                  onClick={() => trackingNoFromUrl && querySingle(trackingNoFromUrl)}
                  disabled={loading}
                  className="px-5 py-3 rounded-2xl btn-primary font-semibold flex items-center gap-2 ripple-target disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  刷新
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 无运单号参数：显示引导页 */}
        <AnimatePresence mode="wait">
          {!trackingNoFromUrl && (
            <motion.div
              key="no-param"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-sm border border-white shimmer-border text-center relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-[#0071e3]/10 to-[#28cd41]/10 blur-3xl" />
                <div className="relative z-10">
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#0071e3] via-[#00c6ff] to-[#28cd41] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#0071e3]/20">
                    <Shield className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-[#1d1d1f] mb-4">
                    隐私安全保护
                  </h2>
                  <p className="text-[#86868b] text-lg max-w-xl mx-auto mb-3 leading-relaxed">
                    为防止随意查询他人订单信息，本页面不支持手动输入运单号。
                  </p>
                  <p className="text-[#86868b] max-w-lg mx-auto mb-10 leading-relaxed">
                    请通过订单邮件、短信或订单分享链接中的完整地址访问本页面，链接中已加密包含您的运单号。
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                    <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#f5f5f7] hover:bg-white hover:border-[#0071e3]/20 border border-transparent transition-all max-w-md w-full sm:w-auto">
                      <div className="w-11 h-11 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center flex-shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-bold text-[#1d1d1f]">二维码 / 链接访问</p>
                        <p className="text-xs text-[#86868b]">管理员订单分享中的二维码</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#f5f5f7] hover:bg-white hover:border-[#28cd41]/20 border border-transparent transition-all max-w-md w-full sm:w-auto">
                      <div className="w-11 h-11 rounded-2xl bg-[#28cd41]/10 text-[#28cd41] flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-bold text-[#1d1d1f]">订单中心</p>
                        <p className="text-xs text-[#86868b]">我的订单 → 查看物流详情</p>
                      </div>
                    </div>
                  </div>

                  {orderNoFromUrl && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFBF0] text-[#f59e0b] border border-[#f59e0b]/15 text-xs font-bold">
                      <Info className="w-3.5 h-3.5" />
                      订单号: {orderNoFromUrl} 暂未发货或未录入运单号
                    </div>
                  )}

                  <div className="pt-8 border-t border-[#f5f5f7] max-w-md mx-auto">
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl btn-primary font-bold ripple-target"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      回到首页
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 有运单号 + 加载中 */}
          {trackingNoFromUrl && loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-white shimmer-border text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-[#e5e5ea] border-t-[#0071e3] animate-spin" />
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">正在查询物流信息...</h3>
                <p className="text-[#86868b] font-mono text-sm">运单号: {trackingNoFromUrl}</p>
              </div>
            </motion.div>
          )}

          {/* 有运单号 + 查询错误 */}
          {trackingNoFromUrl && !loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-white shimmer-border text-center">
                <div className="w-20 h-20 rounded-[2rem] bg-[#FEF2F2] text-[#ef4444] flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">查询失败</h3>
                <p className="text-[#86868b] mb-2">运单号: <span className="font-mono text-[#1d1d1f] font-bold">{trackingNoFromUrl}</span></p>
                <p className="text-sm text-[#ef4444] mb-8 font-semibold">{error}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => querySingle(trackingNoFromUrl)}
                    className="px-6 py-3 rounded-2xl btn-primary font-semibold flex items-center gap-2 ripple-target"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重新查询
                  </button>
                  <Link
                    to="/"
                    className="px-6 py-3 rounded-2xl bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] font-semibold transition-colors"
                  >
                    返回首页
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* 有运单号 + 查询成功结果 */}
          {trackingNoFromUrl && !loading && !error && result && (
            <motion.div
              key="logistics-result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="grid grid-cols-1 xl:grid-cols-5 gap-8"
            >
              <div className="xl:col-span-3 space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border overflow-hidden">
                  <div className={`rounded-[2rem] p-6 -m-2 mb-6 bg-gradient-to-br ${getCarrierBrand(result.carrier_code).from} ${getCarrierBrand(result.carrier_code).to} relative overflow-hidden`}>
                    <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/15 blur-3xl" />
                    <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-black/10 blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-bold mb-3 ${getCarrierBrand(result.carrier_code).text}`}>
                          <Package className="w-3.5 h-3.5" />
                          {result.carrier} · {result.data_source === "mock" ? "演示数据" : result.data_source}
                        </div>
                        <h2 className={`text-2xl md:text-3xl font-black mb-2 ${getCarrierBrand(result.carrier_code).text}`}>
                          {result.tracking_no}
                        </h2>
                        <p className={`text-sm opacity-80 ${getCarrierBrand(result.carrier_code).text}`}>
                          始发：{result.origin || "—"} &nbsp;→&nbsp; 目的：{result.destination || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => copyTrackingNo(result.tracking_no)}
                          className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur transition-colors"
                          title="复制单号"
                        >
                          <Copy className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={() => querySingle(result.tracking_no)}
                          className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur transition-colors"
                          title="刷新状态"
                        >
                          <RefreshCw className={`w-5 h-5 text-white ${loading ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: "当前状态", value: STATUS_META[result.status].label, color: STATUS_META[result.status].color, icon: STATUS_META[result.status].icon },
                      { label: "进度完成", value: `${result.progress_percent}%`, color: "#0071e3", icon: <TrendingUp className="w-5 h-5" /> },
                      { label: "轨迹节点", value: `${result.events.length} 条`, color: "#8b5cf6", icon: <Layers className="w-5 h-5" /> },
                      { label: result.estimated_delivery ? "预计送达" : result.signed_by ? "签收人" : "状态更新", value: result.estimated_delivery || result.signed_by || result.status_text, color: "#28cd41", icon: result.signed_by ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" /> },
                    ].map((card, i) => (
                      <div key={i} className="p-5 rounded-3xl bg-[#f5f5f7] hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-[#e5e5ea]">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 text-white" style={{ backgroundColor: card.color }}>
                          {card.icon}
                        </div>
                        <p className="text-xs text-[#86868b] font-bold uppercase tracking-wider mb-1">{card.label}</p>
                        <p className="text-xl font-black text-[#1d1d1f] leading-tight break-words">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-[#86868b] uppercase tracking-wider">运输进度</p>
                      <p className="text-sm font-black text-[#1d1d1f]">{result.progress_percent}%</p>
                    </div>
                    <div className="relative h-3 rounded-full bg-[#f5f5f7] overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#0071e3] via-[#00c6ff] to-[#28cd41]"
                        initial={{ width: 0 }}
                        animate={{ width: `${result.progress_percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                      <motion.div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg border-2 border-[#0071e3] z-10"
                        initial={{ left: 0 }}
                        animate={{ left: `calc(${result.progress_percent}% - 10px)` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <span className="absolute inset-1 rounded-full bg-gradient-to-br from-[#0071e3] to-[#28cd41] animate-pulse" />
                      </motion.div>
                    </div>
                  </div>

                  <div className="relative rounded-[2rem] overflow-hidden border border-[#e5e5ea] mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0f1f3d] via-[#0a1628] to-[#1a1a2e]" />
                    <div className="absolute inset-0 opacity-30" style={{
                      backgroundImage: `radial-gradient(circle at 20% 30%, rgba(0,113,227,0.35), transparent 35%),
                                         radial-gradient(circle at 80% 70%, rgba(40,205,65,0.30), transparent 35%),
                                         linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                                         linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                      backgroundSize: "auto, auto, 42px 42px, 42px 42px",
                    }} />
                    <svg viewBox="0 0 800 280" className="relative w-full h-64">
                      <defs>
                        <linearGradient id="routeLine" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#28cd41" />
                          <stop offset="50%" stopColor="#00c6ff" />
                          <stop offset="100%" stopColor="#0071e3" />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      <path
                        d={`M 60,${80 + 20 * 1} C ${200},${20 + 15 * 2} ${300},${240 - 10 * 1} ${420},${120 + 8 * 3} S ${650},${20 + 5 * 2} 740,${180}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.10)"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      <motion.path
                        d={`M 60,${80 + 20 * 1} C ${200},${20 + 15 * 2} ${300},${240 - 10 * 1} ${420},${120 + 8 * 3} S ${650},${20 + 5 * 2} 740,${180}`}
                        fill="none"
                        stroke="url(#routeLine)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        filter="url(#glow)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: result.progress_percent / 100 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                      />
                      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                        const px = 60 + t * (740 - 60);
                        const baseY = 130;
                        const py = baseY + Math.sin(t * Math.PI * 2) * 45 - (t > 0.5 ? 30 : 0);
                        const isPassed = t * 100 <= result.progress_percent + 2;
                        const isCurrent = Math.abs(t * 100 - result.progress_percent) < 15;
                        return (
                          <g key={i}>
                            <circle cx={px} cy={py} r={isCurrent ? 14 : 10} fill={isPassed ? (isCurrent ? "#ffffff" : "#28cd41") : "rgba(255,255,255,0.2)"} stroke={isPassed ? "#0071e3" : "rgba(255,255,255,0.3)"} strokeWidth={2} />
                            {isCurrent && (
                              <>
                                <circle cx={px} cy={py} r={22} fill="none" stroke="#28cd41" strokeWidth={2} opacity={0.6}>
                                  <animate attributeName="r" from="14" to="32" dur="1.4s" repeatCount="indefinite" />
                                  <animate attributeName="opacity" from="0.8" to="0" dur="1.4s" repeatCount="indefinite" />
                                </circle>
                                <text x={px} y={py - 34} textAnchor="middle" className="fill-[#ffffff] font-bold text-[14px]">
                                  🚚
                                </text>
                              </>
                            )}
                          </g>
                        );
                      })}
                      <g>
                        <rect x="18" y="110" width="92" height="60" rx="14" fill="rgba(40,205,65,0.15)" stroke="rgba(40,205,65,0.6)" />
                        <text x="64" y="140" textAnchor="middle" className="fill-white font-bold text-[13px]">
                          🏭 始发
                        </text>
                        <text x="64" y="160" textAnchor="middle" className="fill-white/70 text-[11px]" style={{ fontSize: 10 }}>
                          {result.origin || "—"}
                        </text>
                      </g>
                      <g>
                        <rect x="690" y="186" width="100" height="60" rx="14" fill="rgba(0,113,227,0.18)" stroke="rgba(0,113,227,0.7)" />
                        <text x="740" y="216" textAnchor="middle" className="fill-white font-bold text-[13px]">
                          📍 目的
                        </text>
                        <text x="740" y="236" textAnchor="middle" className="fill-white/70 text-[11px]" style={{ fontSize: 10 }}>
                          {result.destination || "—"}
                        </text>
                      </g>
                    </svg>
                    <div className="relative z-10 px-6 py-4 flex items-center justify-between border-t border-white/10">
                      <span className="text-xs text-white/60 font-bold flex items-center gap-2">
                        <Plane className="w-4 h-4 text-[#00c6ff]" />
                        可视化运输地图 · 动态路径示意图
                      </span>
                      <span className="text-xs font-bold text-white/80 px-3 py-1 rounded-full bg-white/10 backdrop-blur">
                        {STATUS_META[result.status].label} · {result.progress_percent}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border">
                  <h3 className="text-2xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    物流轨迹详情
                    <span className="ml-auto text-sm font-bold text-[#86868b]">共 {result.events.length} 条节点</span>
                  </h3>

                  <div className="relative pl-8 md:pl-14">
                    <div className="absolute left-3 md:left-6 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#28cd41] via-[#0071e3] to-[#e5e5ea]" />
                    {result.events.map((ev, i) => {
                      const isLatest = i === 0;
                      const color = isLatest
                        ? STATUS_META[result.status].color
                        : i < Math.floor(result.events.length / 3)
                        ? "#0071e3"
                        : "#c7c7cc";
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`relative mb-6 last:mb-0 ${isLatest ? "" : "opacity-95"}`}
                        >
                          <div
                            className={`absolute -left-1.5 md:-left-4 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${isLatest ? "ring-4 ring-offset-2 ring-opacity-30" : ""}`}
                            style={{
                              backgroundColor: color,
                              boxShadow: isLatest ? `0 0 0 8px ${color}22` : undefined,
                            }}
                          >
                            {isLatest ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                              >
                                {STATUS_META[result.status].icon}
                              </motion.div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div
                            className={`rounded-3xl p-5 transition-all hover:shadow-md ${
                              isLatest ? "bg-gradient-to-br from-white to-[#F6FFED] border border-[#28cd41]/20" : "bg-[#fafafa] hover:bg-[#f5f5f7] border border-transparent"
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[#1d1d1f] font-bold text-lg">{ev.status || "物流更新"}</span>
                                {isLatest && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black text-white" style={{ backgroundColor: STATUS_META[result.status].color }}>
                                    <Sparkles className="w-3 h-3" />
                                    最新
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-mono text-[#86868b] font-bold whitespace-nowrap bg-white px-3 py-1 rounded-full border border-[#e5e5ea]">
                                {ev.time}
                              </span>
                            </div>
                            <p className="text-[#1d1d1f] leading-relaxed">{ev.description || ev.status}</p>
                            {ev.location && (
                              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#86868b] bg-white px-3 py-1.5 rounded-xl border border-[#e5e5ea]">
                                <MapPin className="w-3.5 h-3.5 text-[#0071e3]" />
                                {ev.location}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="xl:col-span-2 space-y-8 xl:sticky xl:top-28 self-start">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border">
                  <h3 className="text-xl font-bold text-[#1d1d1f] mb-6">运单信息卡片</h3>
                  <div className="space-y-4">
                    {[
                      { k: "运单号", v: result.tracking_no, copy: true },
                      { k: "承运商", v: `${result.carrier} (${result.carrier_code.toUpperCase()})` },
                      { k: "始发地", v: result.origin || "—" },
                      { k: "目的地", v: result.destination || "—" },
                      { k: "当前状态", v: STATUS_META[result.status].label, color: STATUS_META[result.status].color },
                      { k: result.signed_by ? "签收人" : "预计送达", v: result.signed_by || result.estimated_delivery || "派送中" },
                      { k: "数据来源", v: result.data_source === "mock" ? "演示模式" : result.data_source.toUpperCase() },
                    ].map((row, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 pb-4 border-b border-[#f5f5f7] last:border-0 last:pb-0">
                        <p className="text-sm font-semibold text-[#86868b] whitespace-nowrap">{row.k}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-right break-all" style={{ color: row.color || "#1d1d1f" }}>
                            {row.v}
                          </p>
                          {row.copy && (
                            <button onClick={() => copyTrackingNo(String(row.v))} className="p-1.5 rounded-lg hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#0071e3] transition-colors shrink-0">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#1a1a2e] rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-60 h-60 rounded-full bg-[#0071e3]/20 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#28cd41]/15 blur-3xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">隐私安全说明</h3>
                        <p className="text-xs text-white/60 font-bold">物流信息仅限本人访问</p>
                      </div>
                    </div>
                    <ul className="space-y-3 text-sm text-white/75">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#28cd41] mt-0.5 flex-shrink-0" />
                        <span>本页面不提供手动输入运单号功能</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#28cd41] mt-0.5 flex-shrink-0" />
                        <span>仅通过加密分享链接访问对应订单轨迹</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#28cd41] mt-0.5 flex-shrink-0" />
                        <span>严禁用于查询他人订单，违者将追究责任</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
