import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Star,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Filter,
  ArrowLeft,
  AlertTriangle,
  Printer as PrinterIcon,
  Loader2,
  Sparkles,
  Info
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

const PRINTER_IMAGE_FALLBACKS: {
  brand: string;
  model_keywords: string[];
  art_prompt_url: string;
}[] = [
  {
    brand: "Bambu Lab",
    model_keywords: ["X1 Carbon", "X1C"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+orange+black+3D+printer+clean+line+art+cell+shading+simple+pure+white+studio+background+soft+subtle+shadows+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Bambu Lab",
    model_keywords: ["P1P"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+desktop+3D+printer+orange+black+body+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Bambu Lab",
    model_keywords: ["P1S"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+3D+printer+black+body+orange+accents+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Bambu Lab",
    model_keywords: ["A1 Mini"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+compact+mini+3D+printer+orange+white+small+cute+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Creality",
    model_keywords: ["K2 Plus", "K2+"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+large+format+3D+printer+red+black+bold+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Creality",
    model_keywords: ["Ender 3 V3", "Ender3 V3", "Ender-3 V3"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+classic+3D+printer+black+frame+red+accents+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Creality",
    model_keywords: ["K1 Max"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+large+coreXY+3D+printer+red+black+sturdy+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Snapmaker",
    model_keywords: ["Artisan"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+premium+3D+printer+dark+gray+blue+accents+elegant+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Snapmaker",
    model_keywords: ["J1s", "J1 S"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+dual+extruder+3D+printer+gray+blue+modern+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Raise3D",
    model_keywords: ["E2CF"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+industrial+3D+printer+dark+blue+gray+professional+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Raise3D",
    model_keywords: ["Pro3"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+industrial+grade+3D+printer+dark+gray+dual+extruder+robust+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "QIDI",
    model_keywords: ["X-Smart 3", "XSmart 3"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+compact+desktop+3D+printer+yellow+black+cheerful+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "QIDI",
    model_keywords: ["X-Max 3", "XMax 3"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+large+format+3D+printer+yellow+black+industrial+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Formlabs",
    model_keywords: ["Form 3+", "Form3+"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+sleek+white+SLA+resin+3D+printer+purple+accents+modern+elegant+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Formlabs",
    model_keywords: ["Form 4", "Form4"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+modern+SLA+3D+printer+white+purple+high+tech+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Markforged",
    model_keywords: ["Mark Two", "Mark 2"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+industrial+3D+printer+black+silver+carbon+fiber+professional+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Voron",
    model_keywords: ["Voron 2.4", "Voron2.4", "Voron 2 4"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+DIY+coreXY+3D+printer+orange+black+open+frame+maker+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  },
  {
    brand: "Anycubic",
    model_keywords: ["Kobra 3 Combo", "Kobra3 Combo"],
    art_prompt_url: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+multi+color+3D+printer+green+black+vibrant+clean+line+art+cell+shading+simple+pure+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9"
  }
];

const findPrinterFallback = (brand: string, title: string): string => {
  const lowerBrand = brand?.toLowerCase() || "";
  const lowerTitle = title?.toLowerCase() || "";

  for (const entry of PRINTER_IMAGE_FALLBACKS) {
    if (
      lowerBrand.includes(entry.brand.toLowerCase()) &&
      entry.model_keywords.some((kw) =>
        lowerTitle.includes(kw.toLowerCase())
      )
    ) {
      return entry.art_prompt_url;
    }
  }

  for (const entry of PRINTER_IMAGE_FALLBACKS) {
    if (lowerBrand.includes(entry.brand.toLowerCase())) {
      return entry.art_prompt_url;
    }
  }

  for (const entry of PRINTER_IMAGE_FALLBACKS) {
    if (
      entry.model_keywords.some((kw) =>
        lowerTitle.includes(kw.toLowerCase())
      )
    ) {
      return entry.art_prompt_url;
    }
  }

  return PRINTER_IMAGE_FALLBACKS[0].art_prompt_url;
};

interface Printer {
  id: string;
  title: string;
  brand: string;
  rating: number;
  pros: string[];
  cons: string[];
  price: string;
  image: string;
  description: string;
  buy_url: string;
  status?: "draft" | "published";
  source_url?: string;
  created_at?: string;
  updated_at?: string;
}

export default function Printers() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [imageLoadedMap, setImageLoadedMap] = useState<Record<string, boolean>>({});
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPublishedPrinters();
  }, []);

  const fetchPublishedPrinters = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("printers")
        .select("*")
        .or("status.eq.published,status.is.null")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message || "无法获取设备数据，请检查网络或 RLS 权限");
      }

      setPrinters((data || []) as Printer[]);
    } catch (err: any) {
      console.error("获取打印机列表失败:", err);
      setError(err.message || "加载失败");
      setPrinters([]);
    } finally {
      setLoading(false);
    }
  };

  const brands = useMemo(() => {
    const set = new Set(printers.map((p) => p.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [printers]);

  const filteredPrinters = useMemo(() => {
    return printers.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === ""
          ? true
          : p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand =
        filterBrand === "all" ? true : p.brand === filterBrand;
      return matchesSearch && matchesBrand;
    });
  }, [printers, searchQuery, filterBrand]);

  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      const filled = i < fullStars || (i === fullStars && hasHalf);
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            filled ? "text-yellow-500 fill-yellow-500" : "text-[#d2d2d7]"
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="pt-24 min-h-screen bg-[#f5f5f7]">
      {/* Hero Section */}
      <section className="section-padding bg-white relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[420px] h-[420px] rounded-full bg-[#0071e3]/8 blur-[120px] pointer-events-none animate-halo"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#28cd41]/8 blur-[120px] pointer-events-none animate-halo" style={{ animationDelay: "1.2s" }}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#0071e3] transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              返回首页
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Device Showcase
            </div>
            <h1 className="heading-medium mb-6">
              <span className="gradient-text-dual">3D 打印设备</span>
              ·创客选型参考
            </h1>
            <p className="text-description max-w-3xl mx-auto">
              汇总创客团队日常使用与学习研究中接触过的设备型号，整理真实使用感受与参数速览，
              供青少年创客与科创教师在选购前做信息参考。
            </p>
          </motion.div>

          {/* Disclaimer Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="max-w-4xl mx-auto mb-16 rounded-[2rem] bg-gradient-to-r from-[#fef3c7] via-[#fff7ed] to-[#fce7f3] p-6 md:p-8 border border-[#f59e0b]/20 shimmer-border"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#f59e0b] flex items-center justify-center shrink-0 shadow-sm">
                <Info className="w-6 h-6" />
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-[#1d1d1f] mb-2">内容说明与免责</h4>
                <p className="text-[#86868b] leading-relaxed text-[15px]">
                  本页面所有设备型号、价格、图片、评测内容均基于
                  <strong className="text-[#1d1d1f]">创客团队公开资料整理与个人学习笔记</strong>
                  ，仅用于
                  <strong className="text-[#1d1d1f]">教育参考与创作交流</strong>
                  ，不构成任何购买代理、官方推荐或销售承诺。
                  实际参数、价格、售后政策请以品牌官方渠道或授权经销商最新信息为准。
                  睿造打印工坊<strong className="text-[#1d1d1f]">不销售任何硬件设备</strong>，亦不为第三方购买行为承担责任。
                </p>
              </div>
            </div>
          </motion.div>

          {/* Search & Filter Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-[2.5rem] p-4 md:p-6 shadow-sm border border-white mb-12 flex flex-col md:flex-row gap-4 shimmer-border"
          >
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
              <input
                type="text"
                placeholder="搜索机型名称、品牌或关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all text-[15px]"
              />
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-[#f5f5f7]">
                <Filter className="w-4 h-4 text-[#86868b]" />
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="px-3 py-3 rounded-2xl bg-transparent text-[#1d1d1f] hover:bg-[#ececef] transition-colors outline-none font-medium text-sm min-w-[140px]"
                >
                  <option value="all">全部品牌 ({printers.length})</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b} ({printers.filter(p => p.brand === b).length})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={fetchPublishedPrinters}
                disabled={loading}
                className="px-5 py-3 rounded-2xl bg-[#f5f5f7] hover:bg-[#ececef] transition-colors text-[#1d1d1f] font-semibold text-sm flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {loading ? "同步中..." : "刷新数据"}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Printer Cards Grid */}
      <section className="section-padding pt-0 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] shadow-sm">
              <Loader2 className="w-10 h-10 text-[#0071e3] animate-spin mb-4" />
              <p className="text-[#86868b]">正在加载设备数据...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 bg-rose-50/50 border border-rose-100 rounded-[2.5rem]">
              <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">加载失败</h3>
              <p className="text-rose-600 mb-6 max-w-md text-center px-4">{error}</p>
              <button
                onClick={fetchPublishedPrinters}
                className="px-6 py-3 rounded-2xl bg-[#0071e3] text-white font-bold hover:bg-[#0077ed] transition-all ripple-target"
              >
                重新加载
              </button>
            </div>
          ) : filteredPrinters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] shadow-sm border border-white">
              <PrinterIcon className="w-16 h-16 text-[#86868b]/20 mb-6" />
              <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">
                {printers.length === 0 ? "暂无展示机型" : "没有匹配的设备"}
              </h3>
              <p className="text-[#86868b] text-center max-w-md px-4">
                {printers.length === 0
                  ? "后台管理员尚未发布任何机型数据，请稍后再来查看。"
                  : "请尝试调整搜索关键词或品牌筛选条件。"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8 px-2">
                <p className="text-sm text-[#86868b]">
                  共展示 <span className="font-bold text-[#1d1d1f]">{filteredPrinters.length}</span> 款机型
                  {printers.length !== filteredPrinters.length && (
                    <span> （总 {printers.length} 款）</span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPrinters.map((printer, idx) => (
                  <motion.div
                    key={printer.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, delay: (idx % 9) * 0.08 }}
                    whileHover={{ y: -8 }}
                    onClick={() => setSelectedPrinter(printer)}
                    className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-white hover:shadow-2xl transition-all duration-500 cursor-pointer group relative shimmer-border"
                  >
                    {/* Image */}
                    <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center border-b border-[#f5f5f7]">
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
                        <div className="absolute -top-5 -left-5 text-5xl font-black rotate-12 whitespace-nowrap">
                          {printer.brand}
                        </div>
                        <div className="absolute -bottom-8 -right-2 text-6xl font-black -rotate-6 whitespace-nowrap gradient-text-dual opacity-20">
                          {printer.title.split(" ")[0]}
                        </div>
                      </div>

                      {!imageLoadedMap[printer.id] && !imageErrorMap[printer.id] && (
                        <div className="absolute inset-0 z-20 img-skeleton" />
                      )}

                      {printer.image &&
                      !printer.image.includes("traeapi.us") &&
                      !printer.image.includes("placeholder") &&
                      !imageErrorMap[printer.id] ? (
                        <img
                          src={printer.image}
                          alt={printer.title}
                          loading="lazy"
                          decoding="async"
                          className={`w-full h-full object-cover z-10 transition-all duration-700 group-hover:scale-105 ${
                            imageLoadedMap[printer.id] ? "opacity-100 blur-0" : "opacity-0 blur-sm"
                          }`}
                          onLoad={() => {
                            setImageLoadedMap((prev) => ({ ...prev, [printer.id]: true }));
                          }}
                          onError={() => {
                            setImageErrorMap((prev) => ({ ...prev, [printer.id]: true }));
                            setImageLoadedMap((prev) => ({ ...prev, [printer.id]: true }));
                          }}
                        />
                      ) : null}

                      <div
                        className={`brand-artistic-display absolute inset-0 flex-col items-center justify-center p-4 text-center z-0 transition-opacity duration-500 ${
                          (printer.image &&
                          !printer.image.includes("traeapi.us") &&
                          !printer.image.includes("placeholder") &&
                          !imageErrorMap[printer.id]) &&
                          imageLoadedMap[printer.id]
                            ? "hidden opacity-0"
                            : "flex opacity-100"
                        }`}
                      >
                        <div className="relative">
                          <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-[#0071e3]/20 via-transparent to-[#28cd41]/20 blur-2xl animate-halo" />
                          <span className="relative text-4xl md:text-5xl font-black tracking-tighter text-[#1d1d1f] select-none drop-shadow-sm">
                            {printer.brand.split(" ")[0]}
                          </span>
                        </div>
                        <div className="h-1 w-12 bg-gradient-to-r from-[#0071e3] to-[#28cd41] rounded-full my-3 shadow-md shadow-[#0071e3]/20" />
                        <span className="text-[10px] font-bold tracking-[0.4em] text-[#86868b] uppercase">
                          {printer.brand}
                        </span>
                        <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 backdrop-blur border border-white/80">
                          <PrinterIcon className="w-3 h-3 text-[#0071e3]" />
                          <span className="text-[10px] font-semibold text-[#86868b]">3D Printer</span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur border border-white shadow-sm text-[10px] font-bold text-[#0071e3] uppercase tracking-wider">
                          {printer.brand}
                        </div>
                      </div>

                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40">
                        <div className="w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-[#86868b] group-hover:text-[#0071e3] transition-colors">
                          <Info className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-1">
                          {renderRating(printer.rating || 4.5)}
                          <span className="text-sm font-bold text-[#1d1d1f] ml-1">
                            {printer.rating?.toFixed(1) || "4.8"}
                          </span>
                        </div>
                        <span className="text-lg font-bold gradient-text-dual">
                          {printer.price || "咨询官方"}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-[#1d1d1f] line-clamp-1">
                        {printer.title}
                      </h3>
                      <p className="text-sm text-[#86868b] line-clamp-2 leading-relaxed mb-5">
                        {printer.description || "暂无详细描述，点击卡片查看更多信息。"}
                      </p>

                      {/* Pros/Cons Preview */}
                      {(printer.pros?.length > 0 || printer.cons?.length > 0) && (
                        <div className="flex gap-2 flex-wrap">
                          {printer.pros?.slice(0, 1).map((pro, i) => (
                            <span
                              key={`pro-${i}`}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#28cd41]/10 text-[#28cd41] text-[11px] font-semibold"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              {pro.length > 10 ? pro.slice(0, 10) + "…" : pro}
                            </span>
                          ))}
                          {printer.cons?.slice(0, 1).map((con, i) => (
                            <span
                              key={`con-${i}`}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-[11px] font-semibold"
                            >
                              <ThumbsDown className="w-3 h-3" />
                              {con.length > 10 ? con.slice(0, 10) + "…" : con}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPrinter && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPrinter(null)}
              className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 30 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="relative z-10 w-[min(96vw,1000px)] max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedPrinter(null)}
                className="absolute top-5 right-5 z-50 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur shadow-sm hover:bg-white hover:text-[#ef4444] text-[#86868b] flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Hero Image / Brand Display */}
              <div className="aspect-[16/8] relative overflow-hidden bg-gradient-to-br from-[#f8fafc] via-white to-[#f1f5f9]">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
                  <div className="absolute top-10 left-10 text-6xl font-black rotate-6 whitespace-nowrap">
                    {selectedPrinter.brand}
                  </div>
                  <div className="absolute bottom-10 right-10 text-6xl font-black -rotate-6 whitespace-nowrap text-[#28cd41]">
                    {selectedPrinter.title.split(" ")[0]}
                  </div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,113,227,0.08),transparent_50%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(40,205,65,0.08),transparent_50%)]" />
                </div>

                {!imageLoadedMap[`detail-${selectedPrinter.id}`] &&
                 !imageErrorMap[`detail-${selectedPrinter.id}`] &&
                 selectedPrinter.image &&
                 !selectedPrinter.image.includes("traeapi.us") &&
                 !selectedPrinter.image.includes("placeholder") && (
                  <div className="absolute inset-0 z-20 img-skeleton" />
                )}

                {selectedPrinter.image &&
                !selectedPrinter.image.includes("traeapi.us") &&
                !selectedPrinter.image.includes("placeholder") &&
                !imageErrorMap[`detail-${selectedPrinter.id}`] ? (
                  <img
                    src={selectedPrinter.image}
                    alt={selectedPrinter.title}
                    className={`w-full h-full object-cover z-10 relative transition-all duration-700 ${
                      imageLoadedMap[`detail-${selectedPrinter.id}`]
                        ? "opacity-100 blur-0"
                        : "opacity-0 blur-md"
                    }`}
                    onLoad={() => {
                      setImageLoadedMap((prev) => ({
                        ...prev,
                        [`detail-${selectedPrinter.id}`]: true,
                      }));
                    }}
                    onError={() => {
                      setImageErrorMap((prev) => ({
                        ...prev,
                        [`detail-${selectedPrinter.id}`]: true,
                      }));
                      setImageLoadedMap((prev) => ({
                        ...prev,
                        [`detail-${selectedPrinter.id}`]: true,
                      }));
                    }}
                  />
                ) : null}

                <div
                  className={`detail-brand-artistic absolute inset-0 flex-col items-center justify-center p-6 text-center z-0 transition-opacity duration-500 ${
                    (selectedPrinter.image &&
                    !selectedPrinter.image.includes("traeapi.us") &&
                    !selectedPrinter.image.includes("placeholder") &&
                    !imageErrorMap[`detail-${selectedPrinter.id}`]) &&
                    imageLoadedMap[`detail-${selectedPrinter.id}`]
                      ? "hidden opacity-0"
                      : "flex opacity-100"
                  }`}
                >
                  <div className="relative">
                    <div className="absolute -inset-16 rounded-full bg-gradient-to-br from-[#0071e3]/25 via-transparent to-[#28cd41]/25 blur-3xl animate-halo" />
                    <div className="absolute -inset-10 rounded-full bg-gradient-to-br from-[#0071e3]/15 via-transparent to-[#28cd41]/15 blur-2xl animate-halo" style={{ animationDelay: "0.6s" }} />
                    <span className="relative text-7xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] select-none mb-4 drop-shadow-lg">
                      {selectedPrinter.brand.split(" ")[0]}
                    </span>
                  </div>
                  <div className="h-1.5 w-24 bg-gradient-to-r from-[#0071e3] via-[#00c6ff] to-[#28cd41] rounded-full mb-5 shadow-lg shadow-[#0071e3]/30" />
                  <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 shadow-md">
                    <PrinterIcon className="w-4 h-4 text-[#0071e3]" />
                    <span className="text-xs font-bold tracking-[0.3em] text-[#86868b] uppercase">
                      {selectedPrinter.brand} · {selectedPrinter.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                  <div>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <span className="px-4 py-1.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] text-xs font-bold uppercase tracking-[0.2em] border border-[#0071e3]/20">
                        {selectedPrinter.brand}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {renderRating(selectedPrinter.rating || 4.5)}
                        </div>
                        <span className="text-sm font-bold text-[#1d1d1f]">
                          {selectedPrinter.rating?.toFixed(1) || "4.8"} / 5.0
                        </span>
                      </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1d1d1f] leading-tight">
                      {selectedPrinter.title}
                    </h2>
                  </div>
                  <div className="shrink-0">
                    <div className="p-6 rounded-[2rem] bg-gradient-to-br from-[#E6F4FF] via-white to-[#F6FFED] border border-[#0071e3]/15 text-center shimmer-border">
                      <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2">
                        参考价格
                      </p>
                      <p className="text-3xl md:text-4xl font-black gradient-text-dual leading-none">
                        {selectedPrinter.price || "咨询官方"}
                      </p>
                      <p className="text-[10px] text-[#86868b] mt-2">
                        价格信息仅供参考，以官方渠道为准
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-10">
                  <h3 className="text-lg font-bold text-[#1d1d1f] mb-4">设备概览</h3>
                  <div className="p-6 md:p-8 rounded-[2rem] bg-[#f5f5f7] text-[#86868b] leading-relaxed text-[15px]">
                    {selectedPrinter.description || (
                      <span className="text-[#86868b]/70 italic">
                        暂无详细描述。更多信息请查阅官方资料或咨询授权渠道。
                      </span>
                    )}
                  </div>
                </div>

                {/* Pros & Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="p-8 rounded-[2rem] bg-gradient-to-br from-[#F6FFED] to-white border border-[#28cd41]/15">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 rounded-2xl bg-[#28cd41] text-white flex items-center justify-center shadow-lg shadow-[#28cd41]/20">
                        <ThumbsUp className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-[#1d1d1f]">核心亮点</h3>
                    </div>
                    {selectedPrinter.pros?.length > 0 ? (
                      <ul className="space-y-3">
                        {selectedPrinter.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-3 text-[#1d1d1f]">
                            <span className="w-6 h-6 rounded-full bg-[#28cd41]/15 text-[#28cd41] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{pro}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#86868b] text-sm italic">暂无亮点说明</p>
                    )}
                  </div>

                  <div className="p-8 rounded-[2rem] bg-gradient-to-br from-[#fef2f2] to-white border border-[#ef4444]/15">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 rounded-2xl bg-[#ef4444] text-white flex items-center justify-center shadow-lg shadow-[#ef4444]/20">
                        <ThumbsDown className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-[#1d1d1f]">注意事项</h3>
                    </div>
                    {selectedPrinter.cons?.length > 0 ? (
                      <ul className="space-y-3">
                        {selectedPrinter.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-3 text-[#1d1d1f]">
                            <span className="w-6 h-6 rounded-full bg-[#ef4444]/15 text-[#ef4444] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{con}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#86868b] text-sm italic">暂无特别说明</p>
                    )}
                  </div>
                </div>

                {/* External Links & Disclaimer */}
                <div className="rounded-[2rem] bg-gradient-to-r from-[#E6F4FF] via-white to-[#fef3c7] p-8 border border-[#0071e3]/15 shimmer-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-grow max-w-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
                        <h4 className="font-bold text-[#1d1d1f]">选购提示</h4>
                      </div>
                      <p className="text-[#86868b] text-[15px] leading-relaxed">
                        本页内容仅作<strong className="text-[#1d1d1f]">创客教育参考</strong>，
                        不作为购买决策唯一依据。实际选购时请综合考虑
                        <strong className="text-[#1d1d1f]">官方参数、授权渠道、售后政策、预算与使用场景</strong>
                        等多方面因素。
                      </p>
                    </div>
                    <div className="flex gap-3 shrink-0 flex-wrap justify-end">
                      {selectedPrinter.buy_url ? (
                        <a
                          href={selectedPrinter.buy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 rounded-2xl bg-[#1d1d1f] hover:bg-black text-white font-semibold flex items-center gap-2 transition-colors ripple-target"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(selectedPrinter.buy_url, "_blank", "noopener,noreferrer");
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          前往官方了解
                        </a>
                      ) : (
                        <span className="px-6 py-3 rounded-2xl bg-[#f5f5f7] text-[#86868b] font-semibold text-sm flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          请查询官方渠道
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
