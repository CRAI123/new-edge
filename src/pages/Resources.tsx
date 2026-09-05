import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, Video, MessageSquare, Lock, X } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { supabase } from "@/lib/supabase";

interface ResourceItem {
  id: string | number;
  title: string;
  file_type: string;
  file_url: string;
  min_level: string;
}

interface Category {
  title: string;
  description: string;
  items: ResourceItem[];
}

export default function Resources() {
  const { user, updateStats } = useUserStore();
  const [showQRModal, setShowQRModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([
    { title: "小学组", description: "趣味 3D 建模入门，培养空间想象力。", items: [] },
    { title: "初中组", description: "进阶建模与结构设计，结合开源硬件。", items: [] },
    { title: "高中组", description: "复杂结构设计与创新实践项目。", items: [] },
    { title: "选购与维护", description: "专业 3D 打印机横评建议与日常维护技巧。", items: [] }
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
        setCategories(prevCategories => {
          return prevCategories.map(cat => {
            // 将分类名称映射为数据库中的 category 字段
            const dbCategory = cat.title.replace('组', '');
            return {
              ...cat,
              items: data.filter(item => {
                // 处理“技术文档”这种不带“组”字的分类
                const itemCat = item.category;
                return itemCat === dbCategory || itemCat === cat.title;
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
      alert(`抱歉，该资源需要等级达到 ${item.min_level} 才能下载。您的当前等级为 LV${userLevel}`);
      return;
    }

    updateStats('download');
    window.open(item.file_url, '_blank');
  };

  return (
    <div className="pt-24 min-h-screen">
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h1 className="heading-medium mb-6">课件资源中心</h1>
            <p className="text-description max-w-3xl mx-auto">
              提供全学段信息科技教育资源，助力教师高效授课，激发学生创新潜能。
            </p>
          </motion.div>

          <div className="space-y-20">
            {categories.map((category, idx) => (
              <div key={idx}>
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{category.title}</h2>
                    <p className="text-[#86868b]">{category.description}</p>
                  </div>
                </div>
                
                {category.items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {category.items.map((item) => {
                      const isLocked = (user?.level || 0) < (parseInt(item.min_level.replace('LV', '')) || 1);
                      return (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.02 }}
                          className="p-6 rounded-3xl bg-[#f5f5f7] border border-transparent hover:border-[#0071e3]/10 transition-all group relative overflow-hidden"
                        >
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                              {item.file_type === 'MP4' ? <Video className="w-6 h-6 text-[#28cd41]" /> : <FileText className="w-6 h-6 text-[#0071e3]" />}
                            </div>
                            <div className="flex-grow overflow-hidden">
                              <h4 className="font-bold truncate" title={item.title}>{item.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-[#86868b] font-bold uppercase">{item.file_type}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#0071e3] font-bold">{item.min_level}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleDownload(item)}
                            className={`w-full py-3 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 ${
                              isLocked 
                                ? "bg-white text-[#86868b] cursor-not-allowed" 
                                : "bg-white text-[#1d1d1f] hover:bg-[#0071e3] hover:text-white"
                            }`}
                          >
                            {isLocked ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            {isLocked ? `需 ${item.min_level}` : "立即下载"}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center rounded-3xl bg-[#f5f5f7] border border-dashed border-[#d2d2d7]">
                    <p className="text-[#86868b]">该分类下暂无资源</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teacher Community Section */}
      <section className="section-padding bg-[#f5f5f7]">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-white p-12 md:p-20 shadow-sm flex flex-col md:flex-row items-center gap-12">
          <div className="flex-grow">
            <h3 className="text-3xl font-bold mb-6">教师交流社区</h3>
            <p className="text-[#86868b] mb-8 leading-relaxed">
              加入我们的教师社群，分享教学心得，获取定制化课件开发服务，与全国优秀的科创老师共同成长。
            </p>
            <button 
              onClick={() => setShowQRModal(true)}
              className="btn-primary flex items-center gap-2 px-8"
            >
              <MessageSquare className="w-5 h-5" />
              立即入群
            </button>
          </div>
          <div className="w-48 h-48 rounded-[2rem] bg-gradient-to-br from-[#E6F4FF] to-[#F6FFED] flex items-center justify-center shrink-0 shadow-inner">
            <img 
              src="https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Minimalist+QR+code+placeholder+Apple+style+clean+design&image_size=square" 
              alt="Community QR"
              className="w-32 h-32 mix-blend-multiply opacity-50"
            />
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
              className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl p-12 text-center"
            >
              <button 
                onClick={() => setShowQRModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-[#f5f5f7] hover:bg-[#d2d2d7] transition-all"
              >
                <X className="w-5 h-5 text-[#1d1d1f]" />
              </button>
              
              <h3 className="text-2xl font-bold mb-4">加入教师社区</h3>
              <p className="text-[#86868b] mb-8">请使用微信扫码，备注“睿造打印-科创教育”申请入群。</p>
              
              <div className="aspect-square w-full rounded-[2rem] bg-[#f5f5f7] flex items-center justify-center mb-8 border border-[#d2d2d7]/30 shadow-inner overflow-hidden p-4">
                <img 
                  src="https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Realistic+WeChat+QR+code+mockup+clean+minimalist&image_size=square" 
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
