import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, Palette, Sticker, GraduationCap, MessageSquare, Sparkles } from "lucide-react";

const IconMap: { [key: string]: React.ElementType } = {
  Palette: Palette,
  Sticker: Sticker,
  GraduationCap: GraduationCap,
  MessageSquare: MessageSquare,
  Mail: Mail,
  Sparkles: Sparkles,
};

interface ProductItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  image: string;
  tags: string[];
}

const FALLBACK_PRODUCTS: ProductItem[] = [
  {
    id: "1",
    name: "小瑞奇 3D 打印徽章",
    icon: "Sticker",
    color: "from-[#0071e3] to-[#5ac8fa]",
    description: "工作室吉祥物小瑞奇系列徽章，采用 PLA+ 材料高精度打印，表面哑光处理，搭配可拆式磁吸背扣，即可佩戴又可做冰箱贴。",
    image: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+cute+round+mascot+character+3D+printed+badge+pin+blue+white+colors+clean+line+art+cell+shading+simple+plain+white+background+soft+shadows+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9",
    tags: ["3D打印", "吉祥物", "限量周边"]
  },
  {
    id: "2",
    name: "创想色彩 水彩笔记本",
    icon: "Palette",
    color: "from-[#ff375f] to-[#ff9500]",
    description: "由工作室成员手绘封面设计的原创笔记本，内页搭配 120g 米黄护眼纸张，适合随手记录灵感与课堂笔记。",
    image: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+hand+drawn+watercolor+notebook+cover+creative+colorful+splashes+artistic+design+clean+line+art+cell+shading+simple+plain+light+beige+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9",
    tags: ["手绘设计", "文具", "日常好物"]
  },
  {
    id: "3",
    name: "青少年科创 主题帆布袋",
    icon: "GraduationCap",
    color: "from-[#28cd41] to-[#34c759]",
    description: "重磅 16 安加厚帆布，正面印有工作室原创 slogan 与机械结构线稿，日常通勤、装书装电脑都方便。",
    image: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+canvas+tote+bag+teen+maker+robot+line+art+print+green+accent+clean+line+art+cell+shading+simple+plain+white+studio+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9",
    tags: ["环保帆布", "通勤必备", "大容"]
  },
  {
    id: "4",
    name: "灵感火花 贴纸大礼包",
    icon: "Sparkles",
    color: "from-[#af52de] to-[#ff2d55]",
    description: "精选工作室历次活动的原创设计贴纸 40+ 款，包含机械结构、编程梗图、创客标语等主题，PVC 防水覆膜持久耐用。",
    image: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+colorful+sticker+pack+collection+robot+programming+funny+maker+slogan+purple+pink+theme+clean+line+art+cell+shading+simple+plain+light+purple+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9",
    tags: ["贴纸", "40+ 款", "防水覆膜"]
  }
];

export default function Products() {
  const [products, setProducts] = useState<ProductItem[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products", { method: "GET" });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setProducts(data);
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#0071e3]/20 border-t-[#0071e3] animate-spin"></div>
          <div className="text-[#86868b] text-sm">加载中…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 md:pt-16 min-h-screen">
      <section className="py-2 md:py-3 px-3 md:px-6 lg:px-12 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#0071e3]/8 blur-[120px] pointer-events-none animate-halo"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#28cd41]/10 blur-[120px] pointer-events-none animate-halo" style={{ animationDelay: "1.5s" }}></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85 }}
            className="rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-br from-[#E6F4FF] via-white to-[#FFF6E6] border border-[#0071e3]/10 px-4 md:px-8 lg:px-12 py-4 md:py-6 lg:py-8 text-center relative overflow-hidden shimmer-border group"
          >
            <div style={{ position: 'absolute' }} className="top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#0071e3]/10 via-[#28cd41]/10 to-transparent blur-[120px] pointer-events-none animate-halo"></div>
            <div style={{ position: 'absolute' }} className="bottom-0 right-0 w-64 h-64 rounded-full bg-[#ff9500]/10 blur-[100px] pointer-events-none"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="flex flex-col items-center gap-2 md:gap-3 mb-3 md:mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] text-[10px] md:text-xs font-bold uppercase tracking-wider">
                  Original IP Collection
                </div>
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white shadow-sm border border-[#d2d2d7]/60 shimmer-card">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff9500] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff9500]"></span>
                  </span>
                  <span className="text-[#ff9500] font-bold tracking-wide text-xs md:text-sm">COMING SOON</span>
                </div>
              </div>

              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2 bg-gradient-to-br from-[#1d1d1f] via-[#0071e3] to-[#28cd41] bg-clip-text text-transparent leading-tight">
                原创IP周边 · 即将上线
              </h1>
              
              <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-5 mt-1">
                <div className="h-px w-6 md:w-10 bg-gradient-to-r from-transparent to-[#d2d2d7]"></div>
                <div className="text-xl md:text-3xl font-black text-[#ff375f] tracking-tight flex items-baseline gap-1">
                  <span className="text-base md:text-xl font-bold text-[#86868b] align-top">¥</span>
                  超低价格
                  <span className="text-base md:text-xl font-bold text-[#86868b] align-bottom">起</span>
                </div>
                <div className="h-px w-6 md:w-10 bg-gradient-to-l from-transparent to-[#d2d2d7]"></div>
              </div>

              <p className="text-xs md:text-base lg:text-lg text-[#86868b] leading-relaxed mb-4 md:mb-6 max-w-2xl mx-auto">
                青少年创客 × 3D创作 — 每一件周边都源自工作室成员的真实创意，记录成长路上的灵感火花。
                <span className="hidden md:inline"> 小瑞奇徽章、手绘笔记本、科创帆布袋、灵感贴纸包…全套原创周边正在紧锣密鼓筹备中，</span>
                <span className="text-[#1d1d1f] font-semibold">学生价优惠，敬请期待 🎁</span>
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6 max-w-2xl mx-auto">
                {["徽章挂件", "手绘文具", "帆布袋包", "创意贴纸"].map((item, idx) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.08 }}
                    className="rounded-xl md:rounded-2xl bg-white/75 backdrop-blur px-2 py-2.5 md:px-3 md:py-3.5 border border-white shadow-sm"
                  >
                    <div className="text-xl md:text-2xl mb-0.5 md:mb-1">
                      {["🎖️", "📓", "👜", "✨"][idx]}
                    </div>
                    <div className="text-[#1d1d1f] font-semibold text-[11px] md:text-xs">{item}</div>
                    <div className="text-[8px] md:text-[10px] text-[#ff375f] font-bold mt-0.5 tracking-wide">即将开售</div>
                  </motion.div>
                ))}
              </div>

              <Link 
                to="/contact" 
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 md:px-8 md:py-3 text-xs md:text-base font-semibold btn-shine ripple-target"
              >
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
                上线提醒 · 邮件通知我
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-[#f5f5f7] relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-[3rem] bg-white p-10 md:p-16 shadow-sm shimmer-border group relative overflow-hidden"
          >
            <div style={{ position: 'absolute' }} className="top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#0071e3]/10 to-[#28cd41]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#0071e3] to-[#28cd41] text-white flex items-center justify-center shadow-xl glow-ring">
                  <Mail className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="heading-medium text-left !mb-0">服务说明</h2>
                </div>
              </div>

              <div className="space-y-6 text-[#86868b] leading-relaxed text-[15px]">
                <div className="p-6 rounded-2xl bg-[#f5f5f7] border-l-4 border-[#0071e3]">
                  <p className="text-[#1d1d1f] font-semibold mb-2">本站提供线上商城，不售卖任何电子商品。</p>
                  <p>本页面所有周边内容仅用于创意展示与作品分享，目的在于呈现青少年创客工作室的创作成果与设计理念。</p>
                </div>

                <div className="p-6 rounded-2xl bg-[#f5f5f7] border-l-4 border-[#28cd41]">
                  <p className="text-[#1d1d1f] font-semibold mb-2">如需定制或进一步了解周边设计，欢迎通过邮件咨询。</p>
                  <p>我们接受学校社团、创客活动、班级集体等场景的IP形象与周边设计咨询，通过邮件沟通您的创意需求与使用场景，共同探讨创作方向与可行性方案。</p>
                </div>

                <div className="p-8 rounded-2xl bg-gradient-to-r from-[#E6F4FF] via-white to-[#F6FFED] border border-[#0071e3]/10">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-grow">
                      <h4 className="font-bold text-[#1d1d1f] mb-1">定制咨询邮箱</h4>
                      <p className="text-2xl font-bold gradient-text-dual">2623681461@qq.com</p>
                    </div>
                    <div className="text-sm text-[#86868b]">
                      <p>请在邮件中简要说明：使用场景、期望方向、数量范围</p>
                      <p>我们会在工作日 1~3 日内回复</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
