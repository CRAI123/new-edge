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
  Info,
  Calculator,
  Table,
  Clock,
  Wrench,
  Thermometer,
  Layers,
  Droplets,
  Wind
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";

const slicingParams = [
  {
    material: "PLA",
    color: "bg-[#28cd41]",
    textColor: "text-[#28cd41]",
    bgLight: "bg-[#28cd41]/10",
    nozzleTemp: "190 ~ 220°C",
    bedTemp: "50 ~ 70°C",
    layerHeight: "0.12 ~ 0.28mm",
    printSpeed: "40 ~ 80mm/s",
    cooling: "全开",
    enclosure: "无需",
    features: "易打印、低翘曲、色彩丰富"
  },
  {
    material: "ABS",
    color: "bg-[#f59e0b]",
    textColor: "text-[#f59e0b]",
    bgLight: "bg-[#f59e0b]/10",
    nozzleTemp: "230 ~ 260°C",
    bedTemp: "90 ~ 110°C",
    layerHeight: "0.15 ~ 0.3mm",
    printSpeed: "30 ~ 60mm/s",
    cooling: "半开 / 关闭",
    enclosure: "建议",
    features: "高强度、耐高温、需封闭环境"
  },
  {
    material: "PETG",
    color: "bg-[#0071e3]",
    textColor: "text-[#0071e3]",
    bgLight: "bg-[#0071e3]/10",
    nozzleTemp: "220 ~ 250°C",
    bedTemp: "70 ~ 85°C",
    layerHeight: "0.12 ~ 0.28mm",
    printSpeed: "30 ~ 70mm/s",
    cooling: "50% ~ 80%",
    enclosure: "可选",
    features: "韧性好、透明可选、耐化学"
  }
];

const troubleshootingItems = [
  {
    title: "堵头 / 不出料",
    icon: <Wrench className="w-5 h-5" />,
    color: "bg-[#ef4444]/10 text-[#ef4444]",
    points: [
      "检查耗材是否在喷嘴处熔化并冷却堵塞",
      "适当提高喷嘴温度 5~10°C 重试",
      "使用清理针或专用清理耗材通喷嘴",
      "确认耗材进料齿轮松紧度合适"
    ]
  },
  {
    title: "翘边 / 底部分离",
    icon: <Layers className="w-5 h-5" />,
    color: "bg-[#f59e0b]/10 text-[#f59e0b]",
    points: [
      "确认平台清洁，无灰尘油污残留",
      "检查首层是否过于贴近或远离平台",
      "添加裙边（Brim）或 raft 增加接触面积",
      "降低冷却风扇速度，保持环境温度稳定"
    ]
  },
  {
    title: "层分离 / 断裂",
    icon: <Droplets className="w-5 h-5" />,
    color: "bg-[#8b5cf6]/10 text-[#8b5cf6]",
    points: [
      "适当提高喷嘴温度，增强层间粘合",
      "降低打印速度，给每层足够熔合时间",
      "检查环境是否有冷风直吹打印件",
      "确认耗材干燥，吸湿材料需烘干后使用"
    ]
  }
];

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

// Fallback image generator function
const getFallbackImage = (brand: string, model: string) => {
  const seed = encodeURIComponent(`${brand}-${model}`);
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=f5f5f7`;
};

export default function Printers() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [imageLoadedMap, setImageLoadedMap] = useState<Record<string, boolean>>({});
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const { user } = useUserStore();

  useEffect(() => {
    fetchPublishedPrinters();
  }, []);

  const handleSelectPrinter = (printer: Printer) => {
    setSelectedPrinter(printer);
  };

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
    <div className="pt-12 md:pt-16 min-h-screen bg-[#f5f5f7]">
      {/* Hero Section */}
      <section className="py-8 md:py-10 px-4 md:px-8 lg:px-16 bg-white relative overflow-hidden">
        <div style={{ position: 'absolute' }} className="top-0 left-1/4 w-[420px] h-[420px] rounded-full bg-[#0071e3]/8 blur-[120px] pointer-events-none animate-halo"></div>
        <div style={{ position: 'absolute', animationDelay: "1.2s" }} className="bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#28cd41]/8 blur-[120px] pointer-events-none animate-halo"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-10"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#0071e3] transition-colors mb-4 md:mb-6 group text-xs md:text-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:-translate-x-0.5 transition-transform" />
              返回首页
            </Link>

            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-0.5 md:py-1 rounded-full bg-[#f5f5f7] text-[#86868b] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-3 md:mb-4">
              <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />
              Device Showcase
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              <span className="gradient-text-dual">3D 打印设备与工具</span>
              ·创客选型参考
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-[#86868b] leading-relaxed max-w-3xl mx-auto">
              汇总创客团队日常使用与学习研究中接触过的设备型号与切片参数，整理真实使用感受与故障排查速览，
              供青少年创客与科创教师在创作与选购前做信息参考。
            </p>
          </motion.div>

          {/* Disclaimer Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="max-w-4xl mx-auto mb-6 md:mb-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-r from-[#fef3c7] via-[#fff7ed] to-[#fce7f3] p-4 md:p-6 border border-[#f59e0b]/20 shimmer-border"
          >
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white text-[#f59e0b] flex items-center justify-center shrink-0 shadow-sm">
                <Info className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-[#1d1d1f] mb-1 md:mb-2 text-sm md:text-base">内容说明与免责</h4>
                <p className="text-[#86868b] leading-relaxed text-[12px] md:text-[15px]">
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
            className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-5 shadow-sm border border-white mb-8 md:mb-10 flex flex-col md:flex-row gap-3 md:gap-4 shimmer-border"
          >
            <div className="relative flex-grow">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#86868b]" />
              <input
                type="text"
                placeholder="搜索机型名称、品牌或关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all text-[13px] md:text-[15px]"
              />
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <div className="flex items-center gap-2 px-2 md:px-3 py-1 md:py-1 rounded-xl md:rounded-2xl bg-[#f5f5f7]">
                <Filter className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#86868b]" />
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="px-2 md:px-3 py-2 md:py-3 rounded-xl md:rounded-2xl bg-transparent text-[#1d1d1f] hover:bg-[#ececef] transition-colors outline-none font-medium text-xs md:text-sm min-w-[120px] md:min-w-[140px]"
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
                className="px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl bg-[#f5f5f7] hover:bg-[#ececef] transition-colors text-[#1d1d1f] font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                )}
                {loading ? "同步中..." : "刷新数据"}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Layout - Two Columns on large screens */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 pb-24">
        <div className="flex flex-col xl:flex-row gap-8 lg:gap-12">
          
          {/* Left Column: Printers List (Takes up 65% on XL screens) */}
          <div className="w-full xl:w-[65%] flex-shrink-0">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 md:gap-3 mb-8 md:mb-12 sticky top-20 z-30 bg-[#f5f5f7]/80 backdrop-blur-md py-4 -mx-4 px-4 md:mx-0 md:px-0 rounded-2xl">
              {['全部'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterBrand(cat === '全部' ? 'all' : cat)}
                  className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm md:text-base font-medium transition-all duration-300 ${
                    filterBrand === 'all'
                      ? 'bg-[#1d1d1f] text-white shadow-md scale-105'
                      : 'bg-white text-[#86868b] hover:bg-gray-100 hover:text-[#1d1d1f]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Printers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-6 md:gap-8">
              {filteredPrinters.map((printer, idx) => (
                <motion.div
                  key={printer.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.05 }}
                  className="bg-white rounded-[2rem] p-5 md:p-6 shadow-sm hover:shadow-xl transition-all duration-300 group card-hover border border-gray-100/50 flex flex-col"
                >
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-5 md:mb-6 bg-[#f5f5f7] relative">
                    <img
                      src={printer.image || getFallbackImage(printer.brand, printer.title)}
                      alt={printer.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getFallbackImage(printer.brand, printer.title);
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button 
                        onClick={() => setSelectedPrinter(printer)}
                        className="bg-white/90 backdrop-blur-md text-[#1d1d1f] px-6 py-2 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                      >
                        查看详情
                      </button>
                    </div>
                    {/* Tag badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#1d1d1f] shadow-sm">
                      {printer.brand}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-[#86868b] text-xs font-bold uppercase tracking-wider mb-1">{printer.brand}</p>
                        <h3 className="text-xl md:text-2xl font-bold text-[#1d1d1f] leading-tight">{printer.title}</h3>
                      </div>
                      {printer.price && (
                        <div className="bg-[#f5f5f7] px-3 py-1 rounded-full text-sm font-bold text-[#1d1d1f] whitespace-nowrap">
                          {printer.price}
                        </div>
                      )}
                    </div>

                    <p className="text-[#86868b] text-sm line-clamp-2 mb-4 leading-relaxed flex-1">
                      {printer.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      {printer.pros?.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs bg-[#f5f5f7] text-[#1d1d1f] px-2.5 py-1 rounded-md font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredPrinters.length === 0 && !loading && (
              <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100">
                <div className="w-20 h-20 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-4">
                  <PrinterIcon className="w-10 h-10 text-[#86868b]" />
                </div>
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">未找到设备</h3>
                <p className="text-[#86868b]">该分类下暂无设备记录，请尝试其他分类。</p>
              </div>
            )}
          </div>

          {/* Right Column: Reference Tools (Takes up 35% on XL screens) */}
          <div className="w-full xl:w-[35%] flex flex-col gap-8 xl:sticky xl:top-28 h-fit pb-12">
            
            {/* Quick Reference Table */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3]">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1d1d1f]">切片参数速查</h2>
                  <p className="text-xs text-[#86868b]">常用耗材参数区间参考</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {slicingParams.map((item) => (
                  <div key={item.material} className="group rounded-2xl bg-[#f5f5f7] p-4 hover:bg-[#1d1d1f] transition-colors duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${item.color} text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow`}>
                          {item.material.charAt(0)}
                        </div>
                        <h3 className="font-bold text-[#1d1d1f] group-hover:text-white transition-colors">{item.material}</h3>
                      </div>
                      <span className="text-[10px] bg-white/50 group-hover:bg-white/10 px-2 py-1 rounded-md text-[#86868b] group-hover:text-white/70 transition-colors">
                        {item.enclosure}封闭
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/60 group-hover:bg-white/5 rounded-xl p-2.5 transition-colors">
                        <p className="text-[10px] text-[#86868b] group-hover:text-white/50 uppercase mb-0.5">喷嘴温度</p>
                        <p className="font-semibold text-sm text-[#1d1d1f] group-hover:text-white">{item.nozzleTemp}</p>
                      </div>
                      <div className="bg-white/60 group-hover:bg-white/5 rounded-xl p-2.5 transition-colors">
                        <p className="text-[10px] text-[#86868b] group-hover:text-white/50 uppercase mb-0.5">热床温度</p>
                        <p className="font-semibold text-sm text-[#1d1d1f] group-hover:text-white">{item.bedTemp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Troubleshooting Guide */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1d1d1f]">常见故障排查</h2>
                  <p className="text-xs text-[#86868b]">打印失败问题速决</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {troubleshootingItems.map((issue) => (
                  <div key={issue.title} className="rounded-2xl border border-[#f5f5f7] p-4 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${issue.color}`}>
                        {issue.icon}
                      </div>
                      <h3 className="font-bold text-[#1d1d1f] text-sm">{issue.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {issue.points.slice(0, 2).map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-[#86868b] text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1 shrink-0" />
                          <span className="leading-tight">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPrinter && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-4 lg:p-6">
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
              className="relative z-10 w-[min(96vw,1000px)] max-h-[92vh] overflow-y-auto bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedPrinter(null)}
                className="absolute top-3 md:top-5 right-3 md:right-5 z-50 w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white/90 backdrop-blur shadow-sm hover:bg-white hover:text-[#ef4444] text-[#86868b] flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Hero Image / Brand Display */}
              <div className="aspect-[16/8] md:aspect-[16/7] relative overflow-hidden bg-gradient-to-br from-[#f8fafc] via-white to-[#f1f5f9]">
                <div style={{ position: 'absolute' }} className="inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
                  <div style={{ position: 'absolute' }} className="top-6 md:top-10 left-6 md:left-10 text-4xl md:text-6xl font-black rotate-6 whitespace-nowrap">
                    {selectedPrinter.brand}
                  </div>
                  <div style={{ position: 'absolute' }} className="bottom-6 md:bottom-10 right-6 md:right-10 text-4xl md:text-6xl font-black -rotate-6 whitespace-nowrap text-[#28cd41]">
                    {selectedPrinter.title.split(" ")[0]}
                  </div>
                  <div style={{ position: 'absolute' }} className="inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,113,227,0.08),transparent_50%)]" />
                  <div style={{ position: 'absolute' }} className="inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(40,205,65,0.08),transparent_50%)]" />
                </div>

                {!imageLoadedMap[`detail-${selectedPrinter.id}`] &&
                 !imageErrorMap[`detail-${selectedPrinter.id}`] &&
                 selectedPrinter.image &&
                 !selectedPrinter.image.includes("traeapi.us") &&
                 !selectedPrinter.image.includes("placeholder") && (
                  <div style={{ position: 'absolute' }} className="inset-0 z-20 img-skeleton" />
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
                  className={`detail-brand-artistic absolute inset-0 flex-col items-center justify-center p-4 md:p-6 text-center z-0 transition-opacity duration-500 ${
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
                    <div style={{ position: 'absolute' }} className="-inset-10 md:-inset-16 rounded-full bg-gradient-to-br from-[#0071e3]/25 via-transparent to-[#28cd41]/25 blur-3xl animate-halo" />
                    <div style={{ position: 'absolute', animationDelay: "0.6s" }} className="-inset-6 md:-inset-10 rounded-full bg-gradient-to-br from-[#0071e3]/15 via-transparent to-[#28cd41]/15 blur-2xl animate-halo" />
                    <span className="relative text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-[#1d1d1f] select-none mb-3 md:mb-4 drop-shadow-lg">
                      {selectedPrinter.brand.split(" ")[0]}
                    </span>
                  </div>
                  <div className="h-1 md:h-1.5 w-16 md:w-24 bg-gradient-to-r from-[#0071e3] via-[#00c6ff] to-[#28cd41] rounded-full mb-3 md:mb-5 shadow-lg shadow-[#0071e3]/30" />
                  <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1 md:py-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 shadow-md">
                    <PrinterIcon className="w-3 h-3 md:w-4 md:h-4 text-[#0071e3]" />
                    <span className="text-[10px] md:text-xs font-bold tracking-[0.25em] md:tracking-[0.3em] text-[#86868b] uppercase whitespace-nowrap">
                      {selectedPrinter.brand} · {selectedPrinter.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 md:p-8 lg:p-12">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 mb-6 md:mb-10">
                  <div>
                    <div className="flex items-center gap-2 md:gap-3 mb-2.5 md:mb-4 flex-wrap">
                      <span className="px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] border border-[#0071e3]/20">
                        {selectedPrinter.brand}
                      </span>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="flex items-center gap-0.5">
                          {renderRating(selectedPrinter.rating || 4.5)}
                        </div>
                        <span className="text-xs md:text-sm font-bold text-[#1d1d1f]">
                          {selectedPrinter.rating?.toFixed(1) || "4.8"} / 5.0
                        </span>
                      </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1d1d1f] leading-tight">
                      {selectedPrinter.title}
                    </h2>
                  </div>
                  <div className="shrink-0">
                    <div className="p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-[#E6F4FF] via-white to-[#F6FFED] border border-[#0071e3]/15 text-center shimmer-border">
                      <p className="text-[10px] md:text-xs font-bold text-[#86868b] uppercase tracking-wider mb-1 md:mb-2">
                        参考价格
                      </p>
                      <p className="text-2xl md:text-3xl lg:text-4xl font-black gradient-text-dual leading-none">
                        {selectedPrinter.price || "咨询官方"}
                      </p>
                      <p className="text-[9px] md:text-[10px] text-[#86868b] mt-1.5 md:mt-2">
                        价格信息仅供参考，以官方渠道为准
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6 md:mb-10">
                  <h3 className="text-base md:text-lg font-bold text-[#1d1d1f] mb-2.5 md:mb-4">设备概览</h3>
                  <div className="p-4 md:p-6 lg:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-[#f5f5f7] text-[#86868b] leading-relaxed text-[13px] md:text-[15px]">
                    {selectedPrinter.description || (
                      <span className="text-[#86868b]/70 italic">
                        暂无详细描述。更多信息请查阅官方资料或咨询授权渠道。
                      </span>
                    )}
                  </div>
                </div>

                {/* Pros & Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-10">
                  <div className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-[#F6FFED] to-white border border-[#28cd41]/15">
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                      <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-[#28cd41] text-white flex items-center justify-center shadow-lg shadow-[#28cd41]/20">
                        <ThumbsUp className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-[#1d1d1f]">核心亮点</h3>
                    </div>
                    {selectedPrinter.pros?.length > 0 ? (
                      <ul className="space-y-2 md:space-y-3">
                        {selectedPrinter.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-2.5 md:gap-3 text-[#1d1d1f] text-[13px] md:text-base">
                            <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#28cd41]/15 text-[#28cd41] text-[10px] md:text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{pro}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#86868b] text-xs md:text-sm italic">暂无亮点说明</p>
                    )}
                  </div>

                  <div className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-[#fef2f2] to-white border border-[#ef4444]/15">
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                      <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-[#ef4444] text-white flex items-center justify-center shadow-lg shadow-[#ef4444]/20">
                        <ThumbsDown className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-[#1d1d1f]">注意事项</h3>
                    </div>
                    {selectedPrinter.cons?.length > 0 ? (
                      <ul className="space-y-2 md:space-y-3">
                        {selectedPrinter.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-2.5 md:gap-3 text-[#1d1d1f] text-[13px] md:text-base">
                            <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#ef4444]/15 text-[#ef4444] text-[10px] md:text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{con}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#86868b] text-xs md:text-sm italic">暂无特别说明</p>
                    )}
                  </div>
                </div>

                {/* External Links & Disclaimer */}
                <div className="rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-r from-[#E6F4FF] via-white to-[#fef3c7] p-5 md:p-8 border border-[#0071e3]/15 shimmer-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div className="flex-grow max-w-2xl">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                        <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-[#f59e0b]" />
                        <h4 className="font-bold text-[#1d1d1f] text-sm md:text-base">选购提示</h4>
                      </div>
                      <p className="text-[#86868b] text-[12px] md:text-[15px] leading-relaxed">
                        本页内容仅作<strong className="text-[#1d1d1f]">创客教育参考</strong>，
                        不作为购买决策唯一依据。实际选购时请综合考虑
                        <strong className="text-[#1d1d1f]">官方参数、授权渠道、售后政策、预算与使用场景</strong>
                        等多方面因素。
                      </p>
                    </div>
                    <div className="flex gap-2 md:gap-3 shrink-0 flex-wrap justify-end">
                      {selectedPrinter.buy_url ? (
                        <a
                          href={selectedPrinter.buy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-[#1d1d1f] hover:bg-black text-white text-xs md:text-sm font-semibold flex items-center gap-1.5 md:gap-2 transition-colors ripple-target"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(selectedPrinter.buy_url, "_blank", "noopener,noreferrer");
                          }}
                        >
                          <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          前往官方了解
                        </a>
                      ) : (
                        <span className="px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-[#f5f5f7] text-[#86868b] font-semibold text-xs md:text-sm flex items-center gap-1.5 md:gap-2">
                          <Info className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
