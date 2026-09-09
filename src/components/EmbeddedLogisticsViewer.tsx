import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  RefreshCw,
  ArrowLeftRight,
  Sparkles,
  TrendingUp,
  Layers
} from "lucide-react";
import { showToast } from "@/lib/utils";

export interface TrackEvent {
  time: string;
  location: string;
  status: string;
  description: string;
  isLatest?: boolean;
}

export interface LogisticsResult {
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

const getCarrierBrand = (code: string) =>
  CARRIER_BRAND_COLORS[code] || CARRIER_BRAND_COLORS.other;

const copyTrackingNo = async (no: string) => {
  try {
    await navigator.clipboard.writeText(no);
    showToast("success", "运单号已复制");
  } catch {
    showToast("error", "复制失败");
  }
};

interface EmbeddedLogisticsViewerProps {
  initialTrackingNo?: string;
  compact?: boolean;
}

export default function EmbeddedLogisticsViewer({
  initialTrackingNo = "",
  compact = false,
}: EmbeddedLogisticsViewerProps) {
  const [inputValue, setInputValue] = useState(initialTrackingNo);
  const [carrierHint, setCarrierHint] = useState<{ code: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LogisticsResult | null>(null);
  const autoQueriedRef = useRef(false);

  const detectCarrier = useCallback(async (no: string) => {
    if (!no.trim()) {
      setCarrierHint(null);
      return;
    }
    try {
      const resp = await fetch("/api/logistics/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_no: no }),
      });
      const data = await resp.json();
      if (data?.success) setCarrierHint(data.data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => detectCarrier(inputValue), 250);
    return () => clearTimeout(t);
  }, [inputValue, detectCarrier]);

  const querySingle = useCallback(async (noOverride?: string) => {
    const no = (noOverride ?? inputValue).trim();
    if (!no) {
      showToast("error", "请先输入运单号");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch("/api/logistics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_no: no }),
      });
      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || "查询失败");
      }
      setResult(data.data);
      showToast("success", `查询成功：${data.data.status_text}`);
    } catch (err: any) {
      showToast("error", err.message || "查询失败");
    } finally {
      setLoading(false);
    }
  }, [inputValue]);

  useEffect(() => {
    if (initialTrackingNo && !autoQueriedRef.current) {
      autoQueriedRef.current = true;
      querySingle(initialTrackingNo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setInputValue(initialTrackingNo);
    if (initialTrackingNo) {
      autoQueriedRef.current = true;
      querySingle(initialTrackingNo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTrackingNo]);

  return (
    <div className="w-full">
      {/* Query Bar */}
      <div className={`bg-white rounded-3xl ${compact ? "p-4 md:p-5" : "p-5 md:p-6"} shadow-sm border border-white shimmer-border mb-5`}>
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && querySingle()}
              placeholder="输入运单号查询轨迹"
              className="w-full pl-11 pr-28 md:pr-36 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all text-sm font-medium"
            />
            {carrierHint && (
              <div className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0071e3]/10 text-[#0071e3] text-xs font-bold">
                <Sparkles className="w-3 h-3" />
                {carrierHint.name}
              </div>
            )}
          </div>
          <button
            onClick={() => querySingle()}
            disabled={loading}
            className="px-6 py-3 rounded-2xl btn-primary font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap ripple-target"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "查询中..." : "立即查询"}
          </button>
        </div>
        {!initialTrackingNo && !result && (
          <p className="mt-3 text-xs text-[#86868b] leading-relaxed">
            支持顺丰/圆通/中通/申通/韵达/京东/EMS 主流快递；录入运单号后即可查看完整轨迹。
          </p>
        )}
      </div>

      {/* Empty state */}
      <AnimatePresence mode="wait">
        {!result && !loading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`bg-white rounded-3xl ${compact ? "p-6 md:p-8" : "p-8 md:p-12"} shadow-sm border border-white shimmer-border text-center`}
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-gradient-to-br from-[#0071e3]/10 via-[#00c6ff]/10 to-[#28cd41]/10 flex items-center justify-center mx-auto mb-5">
              <Truck className="w-10 h-10 md:w-12 md:h-12 text-[#0071e3]" />
            </div>
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">暂无物流信息</h3>
            <p className="text-sm text-[#86868b] max-w-md mx-auto leading-relaxed">
              {initialTrackingNo
                ? `运单号「${initialTrackingNo}」正在查询或暂无轨迹，请点击上方按钮重试；若未录入单号请先在订单中填写。`
                : "请先在订单详情中录入运单号，或在上方输入框中输入任意单号进行查询。"}
            </p>
          </motion.div>
        )}

        {loading && !result && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`bg-white rounded-3xl ${compact ? "p-6 md:p-8" : "p-8 md:p-12"} shadow-sm border border-white shimmer-border text-center`}
          >
            <div className="w-14 h-14 rounded-full border-4 border-[#e5e5ea] border-t-[#0071e3] animate-spin mx-auto mb-5" />
            <p className="font-semibold text-[#86868b]">正在查询物流轨迹，请稍候...</p>
          </motion.div>
        )}

        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="space-y-5"
          >
            {/* Carrier header */}
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-white shimmer-border overflow-hidden">
              <div className={`rounded-2xl p-4 md:p-5 bg-gradient-to-br ${getCarrierBrand(result.carrier_code).from} ${getCarrierBrand(result.carrier_code).to} relative overflow-hidden`}>
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/15 blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] font-bold mb-2 ${getCarrierBrand(result.carrier_code).text}`}>
                      <Package className="w-3 h-3" />
                      {result.carrier} {result.data_source === "mock" ? "· 演示数据" : ""}
                    </div>
                    <h2 className={`text-xl md:text-2xl font-black mb-1 truncate ${getCarrierBrand(result.carrier_code).text}`}>
                      {result.tracking_no}
                    </h2>
                    <p className={`text-xs opacity-80 ${getCarrierBrand(result.carrier_code).text}`}>
                      始发 {result.origin || "—"} → 目的 {result.destination || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyTrackingNo(result.tracking_no)}
                      className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur transition-colors"
                      title="复制单号"
                    >
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => querySingle(result.tracking_no)}
                      className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur transition-colors"
                      title="刷新状态"
                    >
                      <RefreshCw className={`w-4 h-4 text-white ${loading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                {[
                  { label: "当前状态", value: STATUS_META[result.status].label, color: STATUS_META[result.status].color, icon: STATUS_META[result.status].icon },
                  { label: "进度完成", value: `${result.progress_percent}%`, color: "#0071e3", icon: <TrendingUp className="w-4 h-4" /> },
                  { label: "轨迹节点", value: `${result.events.length} 条`, color: "#8b5cf6", icon: <Layers className="w-4 h-4" /> },
                  { label: result.estimated_delivery ? "预计送达" : result.signed_by ? "签收人" : "状态更新", value: result.estimated_delivery || result.signed_by || result.status_text, color: "#28cd41", icon: result.signed_by ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" /> },
                ].map((card, i) => (
                  <div key={i} className="p-3 md:p-4 rounded-2xl bg-[#f5f5f7] hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-[#e5e5ea]">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 text-white" style={{ backgroundColor: card.color }}>
                      {card.icon}
                    </div>
                    <p className="text-[11px] text-[#86868b] font-bold uppercase tracking-wider mb-0.5">{card.label}</p>
                    <p className="text-base font-black text-[#1d1d1f] leading-tight break-words">{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">运输进度</p>
                  <p className="text-sm font-black text-[#1d1d1f]">{result.progress_percent}%</p>
                </div>
                <div className="relative h-2.5 rounded-full bg-[#f5f5f7] overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#0071e3] via-[#00c6ff] to-[#28cd41]"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.progress_percent}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Mini map */}
              <div className="relative rounded-2xl overflow-hidden border border-[#e5e5ea] mt-5">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f1f3d] via-[#0a1628] to-[#1a1a2e]" />
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `radial-gradient(circle at 20% 30%, rgba(0,113,227,0.35), transparent 35%),
                                     radial-gradient(circle at 80% 70%, rgba(40,205,65,0.30), transparent 35%),
                                     linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                                     linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                  backgroundSize: "auto, auto, 36px 36px, 36px 36px",
                }} />
                <svg viewBox="0 0 800 260" className="relative w-full h-48 md:h-56">
                  <defs>
                    <linearGradient id="embed_routeLine" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#28cd41" />
                      <stop offset="50%" stopColor="#00c6ff" />
                      <stop offset="100%" stopColor="#0071e3" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 60,120 C 200,40 320,220 440,110 S 660,40 740,160"
                    fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" strokeLinecap="round"
                  />
                  <motion.path
                    d="M 60,120 C 200,40 320,220 440,110 S 660,40 740,160"
                    fill="none" stroke="url(#embed_routeLine)" strokeWidth="4" strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: result.progress_percent / 100 }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                  />
                  {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                    const cx = 60 + t * 680;
                    const cy = t <= 0.25 ? 120 - 80 * t * 4 + 20 * Math.sin(t * 10)
                      : t <= 0.5 ? 120 + 100 * ((t - 0.25) * 4) - 20 * Math.sin(t * 8)
                      : t <= 0.75 ? 120 - 150 * ((t - 0.5) * 4) + 15 * Math.sin(t * 6)
                      : 120 + 40 * ((t - 0.75) * 4);
                    const active = t <= result.progress_percent / 100;
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r={active ? 7 : 5} fill={active ? "#00c6ff" : "rgba(255,255,255,0.2)"} />
                        <circle cx={cx} cy={cy} r={12} fill="none" stroke={active ? "#00c6ff" : "rgba(255,255,255,0.1)"} strokeWidth="1.5" />
                        {i === 0 && <text x={cx} y={cy - 20} fill="rgba(255,255,255,0.85)" fontSize="11" fontWeight="700" textAnchor="middle">{result.origin?.slice(0, 4) || "始发"}</text>}
                        {i === 4 && <text x={cx} y={cy - 20} fill="rgba(255,255,255,0.85)" fontSize="11" fontWeight="700" textAnchor="middle">{result.destination?.slice(0, 4) || "终点"}</text>}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-white shimmer-border">
              <h3 className="font-bold text-[#1d1d1f] mb-5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0071e3]" />
                轨迹时间线
                <span className="ml-auto text-xs font-bold text-[#86868b] px-2.5 py-1 rounded-full bg-[#f5f5f7]">
                  共 {result.events.length} 条
                </span>
              </h3>

              <div className="relative pl-6 md:pl-10">
                <div className="absolute left-2 md:left-4 top-1 bottom-1 w-px bg-gradient-to-b from-[#28cd41] via-[#0071e3] to-[#e5e5ea]" />
                {result.events.map((ev, i) => {
                  const meta = i === 0 ? STATUS_META[result.status] : null;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="relative mb-5 last:mb-0"
                    >
                      <div
                        className={`absolute -left-4 md:-left-6 top-1 w-4 h-4 md:w-5 md:h-5 rounded-full border-[3px] border-white shadow-md ${
                          i === 0 ? "" : "bg-[#d2d2d7]"
                        }`}
                        style={{ backgroundColor: i === 0 ? (meta?.color || "#28cd41") : undefined }}
                      />
                      <div className={`rounded-2xl p-4 ${i === 0 ? "bg-gradient-to-br from-[#F6FFED] via-white to-white border border-[#28cd41]/20" : "bg-[#fafafa]"}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <p className={`text-sm font-bold ${i === 0 ? "text-[#1d1d1f]" : "text-[#1d1d1f]/80"}`}>
                            {ev.status}
                            {i === 0 && <span className="ml-2 text-[11px] font-black px-2 py-0.5 rounded-full text-white inline-block" style={{ backgroundColor: STATUS_META[result.status].color }}>最新</span>}
                          </p>
                          <span className="text-xs font-mono font-bold text-[#86868b]">{ev.time}</span>
                        </div>
                        <p className="text-[13px] text-[#86868b] leading-relaxed break-words">{ev.description}</p>
                        {ev.location && <p className="text-xs text-[#86868b]/80 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
