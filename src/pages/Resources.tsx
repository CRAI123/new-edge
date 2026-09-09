import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, Video, MessageSquare, Lock, X, BookOpen, GraduationCap, Lightbulb, Wrench } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { supabase } from "@/lib/supabase";
import { showToast, safeConfirm } from "@/lib/utils";

interface ResourceItem {
  id: string | number;
  title: string;
  file_type: string;
  file_url: string;
  min_level: string;
  category?: string;
}

interface Category {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  items: ResourceItem[];
}

const CATEGORY_KEY_MAP: Record<string, string[]> = {
  "primary": ["小学", "小学组", "primary", "Primary"],
  "middle": ["初中", "初中组", "middle", "Middle", "junior", "Junior"],
  "high": ["高中", "高中组", "high", "High", "senior", "Senior"],
  "tools": ["创作工具与技巧", "工具", "技巧", "tools", "Tools", "tutorial", "Tutorial"]
};

export default function Resources() {
  const { user, updateStats } = useUserStore();
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([
    {
      key: "primary",
      title: "小学组",
      description: "趣味 3D 建模入门，培养空间想象力与动手能力。",
      icon: <BookOpen className="w-6 h-6" />,
      items: []
    },
    {
      key: "middle",
      title: "初中组",
      description: "进阶建模与结构设计，结合创意电子模块开展项目式工程实践。",
      icon: <GraduationCap className="w-6 h-6" />,
      items: []
    },
    {
      key: "high",
      title: "高中组",
      description: "复杂结构设计与创新实践项目，衔接工程思维与竞赛。",
      icon: <Lightbulb className="w-6 h-6" />,
      items: []
    },
    {
      key: "tools",
      title: "创作工具与技巧",
      description: "3D 打印切片参数速查、打印成本估算与故障排查技巧。",
      icon: <Wrench className="w-6 h-6" />,
      items: []
    }
  ]);

  useEffect(() => {
    updateStats('browse');
    fetchResources();
  }, [updateStats]);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        console.log("获取到云端资源数据:", data);
        const publishedOnly = data.filter(r => (r.status || 'published') === 'published');
        setCategories(prevCategories => {
          return prevCategories.map(cat => {
            const matchKeys = CATEGORY_KEY_MAP[cat.key] || [];
            return {
              ...cat,
              items: publishedOnly.filter(item => {
                const itemCat = (item.category || "").toString();
                if (!itemCat) return false;
                return matchKeys.some(k => itemCat.includes(k) || k.includes(itemCat));
              })
            };
          });
        });
      }
    } catch (err: any) {
      console.error('Error fetching resources:', err.message);
    }
  };

  const handleDownload = (item: ResourceItem) => {
    const userLevel = user?.level || 0;
    const requiredLevel = parseInt(item.min_level.replace('LV', '')) || 1;

    if (userLevel < requiredLevel) {
      showToast("info", `抱歉，该资源需要等级达到 ${item.min_level} 才能下载。您的当前等级为 LV${userLevel}`);
      return;
    }

    updateStats('download');
    window.open(item.file_url, '_blank');
  };

  const visibleCategories = activeCategory
    ? categories.filter(c => c.key === activeCategory)
    : categories;

  return (
    <div className="pt-24 min-h-screen">
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="heading-medium mb-6">课件资源中心</h1>
            <p className="text-description max-w-3xl mx-auto">
              提供全学段信息科技教育资源，助力教师高效授课，激发学生创新潜能。
            </p>
          </motion.div>

          {/* Category Quick Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <div className="flex flex-wrap items-center justify-center gap-3 p-2 rounded-[2rem] bg-[#f5f5f7] border border-[#d2d2d7]/40 mx-auto w-fit shimmer-card">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeCategory === null
                    ? "bg-[#1d1d1f] text-white shadow-lg shadow-black/10"
                    : "text-[#86868b] hover:text-[#1d1d1f] hover:bg-white"
                }`}
              >
                全部
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key === activeCategory ? null : cat.key)}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    activeCategory === cat.key
                      ? "bg-[#1d1d1f] text-white shadow-lg shadow-black/10"
                      : "text-[#86868b] hover:text-[#1d1d1f] hover:bg-white"
                  }`}
                >
                  <span className="w-4 h-4">{cat.icon}</span>
                  {cat.title}
                  <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeCategory === cat.key
                      ? "bg-white/20 text-white"
                      : "bg-white text-[#86868b]"
                  }`}>
                    {cat.items.length}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          <div className="space-y-20">
            {visibleCategories.map((category, idx) => (
              <div key={category.key} id={`cat-${category.key}`} className="scroll-mt-32">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0071e3]/10 to-[#28cd41]/10 border border-[#0071e3]/10 flex items-center justify-center text-[#0071e3] shrink-0 shimmer-card">
                      {category.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold">{category.title}</h2>
                        <span className="text-xs px-3 py-1 rounded-full bg-[#0071e3]/10 text-[#0071e3] font-bold border border-[#0071e3]/10">
                          {category.items.length} 个资源
                        </span>
                      </div>
                      <p className="text-[#86868b]">{category.description}</p>
                    </div>
                  </div>
                </div>
                
                {category.items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {category.items.map((item) => {
                      const isLocked = (user?.level || 0) < (parseInt(item.min_level.replace('LV', '')) || 1);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ duration: 0.6 }}
                          whileHover={{ scale: 1.02 }}
                          className="p-6 rounded-3xl bg-[#f5f5f7] border border-transparent hover:border-[#0071e3]/10 transition-all group relative overflow-hidden card-hover shimmer-card tilt-card"
                        >
                          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br from-[#0071e3]/10 to-[#28cd41]/10 blur-2xl group-hover:opacity-80 transition-opacity opacity-0"></div>
                          <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm glow-ring">
                                {item.file_type === 'MP4' ? <Video className="w-6 h-6 text-[#28cd41]" /> : <FileText className="w-6 h-6 text-[#0071e3]" />}
                              </div>
                              <div className="flex-grow overflow-hidden">
                                <h4 className="font-bold truncate text-[#1d1d1f]" title={item.title}>{item.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-[#86868b] font-bold uppercase">{item.file_type}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#0071e3] font-bold border border-[#0071e3]/10">{item.min_level}</span>
                                </div>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => handleDownload(item)}
                              className={`w-full py-3 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 btn-shine ripple-target ${
                                isLocked 
                                  ? "bg-white text-[#86868b] cursor-not-allowed" 
                                  : "bg-white text-[#1d1d1f] hover:bg-[#0071e3] hover:text-white hover:border-[#0071e3] border border-transparent"
                              }`}
                            >
                              {isLocked ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                              {isLocked ? `需 ${item.min_level}` : "立即下载"}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center rounded-3xl bg-[#f5f5f7] border border-dashed border-[#d2d2d7] shimmer-card">
                    <p className="text-[#86868b]">该分类下暂无资源，敬请期待后续更新</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teacher Community Section */}
      <section className="section-padding bg-[#f5f5f7] relative overflow-hidden">
        <div className="absolute top-0 left-20 w-[420px] h-[420px] rounded-full bg-[#0071e3]/8 blur-[120px] pointer-events-none animate-halo"></div>
        <div className="absolute bottom-0 right-20 w-[400px] h-[400px] rounded-full bg-[#28cd41]/10 blur-[120px] pointer-events-none animate-halo" style={{ animationDelay: "1.5s" }}></div>
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-white p-12 md:p-20 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-12 relative z-10 shimmer-border group">
          <div className="flex-grow">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-3xl font-bold mb-6 text-[#1d1d1f]"
            >
              教师交流社区
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[#86868b] mb-8 leading-relaxed"
            >
              加入我们的教师社群，分享教学心得，获取定制化课件开发服务，与全国优秀的科创老师共同成长。
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              onClick={() => setShowQRModal(true)}
              className="btn-primary flex items-center gap-2 px-8 btn-shine ripple-target"
            >
              <MessageSquare className="w-5 h-5" />
              立即入群
            </motion.button>
          </div>
        </div>
      </section>

      {/* QR Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQRModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl p-12 text-center shimmer-border group"
            >
              <button 
                onClick={() => setShowQRModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-[#f5f5f7] hover:bg-[#d2d2d7] transition-all"
              >
                <X className="w-5 h-5 text-[#1d1d1f]" />
              </button>
              
              <h3 className="text-2xl font-bold mb-4">加入教师社区</h3>
              <p className="text-[#86868b] mb-8">请使用微信扫码，备注“睿造打印-科创教育”申请入群。</p>
              
              <div className="aspect-square w-full rounded-[2rem] bg-[#f5f5f7] flex items-center justify-center mb-8 border border-[#d2d2d7]/30 shadow-inner overflow-hidden p-4 shimmer-border">
                <img 
                  src="https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+QR+code+mockup+simple+clean+design+soft+blue+accent+clean+line+art+cell+shading+simple+plain+white+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=square" 
                  alt="QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <button 
                onClick={() => setShowQRModal(false)}
                className="w-full btn-secondary py-4"
              >
                已扫码，返回
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
