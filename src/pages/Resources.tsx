import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { Download, FileText, Video, MessageSquare, Lock, X, BookOpen, GraduationCap, Lightbulb, Wrench, Eye, Loader2, AlertCircle, RefreshCw, Box } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { supabase } from "@/lib/supabase";
import { showToast, safeConfirm } from "@/lib/utils";
import { logUserActivity } from "@/lib/supabase";
import { Turnstile } from '@marsidev/react-turnstile';
// --- 基础数据结构 ---
interface ResourceItem {
  id: string | number;
  title: string;
  file_type: string;
  file_url: string;
  min_level: string;
  category?: string;
  image_url?: string; // 新增预览图字段
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
  const [previewItem, setPreviewItem] = useState<ResourceItem | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [previewEngine, setPreviewEngine] = useState<'microsoft' | 'xdoc'>('microsoft');
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ id: string | number, progress: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showCaptchaModal, setShowCaptchaModal] = useState<{ isOpen: boolean, action: 'download' | 'preview', item: ResourceItem | null }>({ isOpen: false, action: 'download', item: null });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPreviewLoading) {
      setIsSlowLoading(false);
      timer = setTimeout(() => {
        setIsSlowLoading(true);
      }, 5000); // 5秒后如果还在加载，显示切换提示
    }
    return () => clearTimeout(timer);
  }, [isPreviewLoading, previewEngine]);
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

  const handleDownloadClick = (item: ResourceItem) => {
    if (!user) {
      showToast("info", "请先登录后再下载课件资源。");
      return;
    }
    if (!turnstileToken) {
      setShowCaptchaModal({ isOpen: true, action: 'download', item });
      return;
    }
    executeDownload(item);
  };

  const executeDownload = async (item: ResourceItem) => {
    if (downloadProgress?.id === item.id) {
      showToast("info", "该文件正在下载中，请稍候...");
      return;
    }

    if (user) {
      updateStats('download');
      // 记录下载动态
      logUserActivity(user.id, '下载课件资源', { 
        resource_title: item.title,
      });
    }
    
    try {
      showToast("info", "正在准备下载...");
      setDownloadProgress({ id: item.id, progress: 0 });

      // 使用 XMLHttpRequest 获取文件，以便能够监听下载进度
      const xhr = new XMLHttpRequest();
      xhr.open('GET', item.file_url, true);
      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setDownloadProgress({ id: item.id, progress: percentComplete });
        } else {
          // 如果服务器没返回 Content-Length，做一个假进度条动画
          setDownloadProgress(prev => ({ 
            id: item.id, 
            progress: Math.min((prev?.progress || 0) + 10, 90) 
          }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setDownloadProgress({ id: item.id, progress: 100 });
          const blob = xhr.response;
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          // 提取文件名：优先使用我们数据库中记录的文件中文标题 + 文件类型后缀
          const fileName = `${item.title}.${item.file_type.toLowerCase()}`;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          
          // 清理
          link.parentNode?.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          setTimeout(() => {
            setDownloadProgress(null);
            showToast("success", "下载完成！");
          }, 500);
        } else {
          throw new Error('网络请求失败');
        }
      };

      xhr.onerror = () => {
        throw new Error('网络请求失败');
      };

      xhr.send();
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadProgress(null);
      // 如果 fetch 失败（比如跨域问题），回退到 window.open 但尝试加上 download 属性的假链接
      const link = document.createElement('a');
      link.href = item.file_url;
      link.setAttribute('download', '');
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    }
  };

  const handlePreviewClick = (item: ResourceItem) => {
    if (!user) {
      showToast("info", "请先登录后再预览课件资源。");
      return;
    }
    if (!turnstileToken) {
      setShowCaptchaModal({ isOpen: true, action: 'preview', item });
      return;
    }
    executePreview(item);
  };

  const executePreview = (item: ResourceItem) => {
    const fileType = item.file_type.toLowerCase();
    if (
      fileType.includes('ppt') || fileType.includes('doc') || fileType.includes('xls') ||
      fileType.includes('pdf') || fileType.includes('mp4') || fileType.includes('png') || fileType.includes('jpg')
    ) {
      if (user) {
        // 记录预览动态
        logUserActivity(user.id, '预览课件资源', { 
          resource_title: item.title,
        });
      }

      setIsPreviewLoading(true);
      setPreviewError(false);
      setPreviewEngine('microsoft');
      setPreviewItem(item);
    } else {
      showToast("info", `当前文件格式 (${item.file_type}) 暂不支持在线预览，请直接下载查看。`);
    }
  };

  const getPreviewUrl = (item: ResourceItem, engine: 'microsoft' | 'xdoc') => {
    const fileUrl = item.file_url;
    const fileType = item.file_type.toLowerCase();
    if (fileType.includes('ppt') || fileType.includes('doc') || fileType.includes('xls')) {
      if (engine === 'microsoft') {
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}&wdOrigin=BROWSELINK`;
      } else {
        // 使用国内稳定的 XDOC 文档预览服务作为备用方案，无需科学上网
        return `https://view.xdocin.com/view?src=${encodeURIComponent(fileUrl)}`;
      }
    }
    return fileUrl;
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {category.items.map((item) => {
                      const isLocked = !user;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ duration: 0.6 }}
                          className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col cursor-pointer"
                          onClick={() => {
                            if (!isLocked) {
                              handlePreviewClick(item);
                            } else {
                              showToast("info", "请先登录后再预览。");
                            }
                          }}
                        >
                          {/* 大图预览区域 (模拟瀑布流卡片) */}
                          <div className="aspect-[4/3] w-full overflow-hidden bg-[#f5f5f7] relative">
                            {/* 使用一个非常轻量级的 SVG 作为默认背景，完全不依赖任何外部图片链接，保证 100% 成功加载 */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0071e3]/10 via-[#f5f5f7] to-[#28cd41]/10 flex items-center justify-center">
                              {item.file_type === 'MP4' ? (
                                <Video className="w-16 h-16 text-[#1d1d1f]/10" />
                              ) : item.file_type === 'STL' ? (
                                <Box className="w-16 h-16 text-[#1d1d1f]/10" />
                              ) : (
                                <FileText className="w-16 h-16 text-[#1d1d1f]/10" />
                              )}
                            </div>
                            
                            {/* 只有在有真实的自定义封面时才渲染 img 标签 */}
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-10"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              // 使用 XDOC 的预览服务，强制传入页码 p=1 来获取第一页作为缩略图
                              <img 
                                src={`https://view.xdocin.com/view?src=${encodeURIComponent(item.file_url)}&p=1&pdf=true`}
                                alt={item.title}
                                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 relative z-10"
                                onError={(e) => {
                                  // 如果由于跨域或文件不支持导致无法截取缩略图，静默隐藏，露出底部的渐变背景兜底
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            
                            {/* 悬浮遮罩 - 格式标签 */}
                            <div className="absolute top-4 right-4 z-10">
                              <div className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-md bg-white/90 shadow-sm text-gray-800">
                                {item.file_type === 'MP4' ? <Video className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                {item.file_type.toUpperCase()}
                              </div>
                            </div>

                            {/* 悬浮状态 - 预览按钮 */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                              <button 
                                className="btn-primary rounded-full px-6 py-3 flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isLocked) {
                                    handlePreviewClick(item);
                                  } else {
                                    showToast("info", "请先登录后再预览。");
                                  }
                                }}
                              >
                                {isLocked ? <Lock className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                {isLocked ? "登录预览" : "立即预览"}
                              </button>
                            </div>
                          </div>

                          {/* 极简信息区域 */}
                          <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-[16px] font-bold text-[#111] leading-snug mb-3 line-clamp-2 group-hover:text-[#0071e3] transition-colors" title={item.title}>
                              {item.title}
                            </h3>
                            
                            <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded bg-gray-100 font-medium">
                                  Lv {item.min_level}
                                </span>
                              </div>
                              
                              {/* 下载按钮 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadClick(item);
                                }}
                                disabled={isLocked || downloadProgress?.id === item.id}
                                className={`relative overflow-hidden w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                  isLocked 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : downloadProgress?.id === item.id
                                      ? 'bg-blue-50 text-blue-600 cursor-wait'
                                      : 'bg-gray-50 hover:bg-black hover:text-white text-gray-600 shadow-sm'
                                }`}
                                title={isLocked ? '登录即可下载' : '直接下载'}
                              >
                                {downloadProgress?.id === item.id ? (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50">
                                    <div 
                                      className="absolute bottom-0 left-0 right-0 bg-blue-200 transition-all duration-300"
                                      style={{ height: `${downloadProgress.progress}%` }}
                                    />
                                    <span className="relative z-10 text-[10px] font-bold text-blue-700">{downloadProgress.progress}%</span>
                                  </div>
                                ) : (
                                  isLocked ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />
                                )}
                              </button>
                            </div>
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
              className="btn-primary flex items-center gap-2 px-8 ripple-target"
            >
              <MessageSquare className="w-5 h-5" />
              立即入群
            </motion.button>
          </div>
        </div>
      </section>

      {/* Turnstile Captcha Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showCaptchaModal.isOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCaptchaModal({ isOpen: false, action: 'download', item: null })}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center"
              >
                <button 
                  onClick={() => setShowCaptchaModal({ isOpen: false, action: 'download', item: null })}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-all"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
                
                <h3 className="text-xl font-bold mb-2">安全验证</h3>
                <p className="text-gray-500 text-sm mb-6">为了保护资源安全，请先完成下方的人机验证</p>
                
                <div className="flex justify-center w-full overflow-hidden rounded-xl bg-[#f5f5f7] border border-transparent hover:border-[#d2d2d7] transition-colors min-h-[70px]">
                  <Turnstile
                    siteKey="0x4AAAAAAFEV-PHDZX-ZmnQP"
                    onSuccess={(token) => {
                      setTurnstileToken(token);
                      setShowCaptchaModal(prev => ({ ...prev, isOpen: false }));
                      // 验证通过后自动执行之前被拦截的操作
                      if (showCaptchaModal.item) {
                        if (showCaptchaModal.action === 'download') {
                          executeDownload(showCaptchaModal.item);
                        } else {
                          executePreview(showCaptchaModal.item);
                        }
                      }
                    }}
                    options={{
                      theme: "light",
                      language: "zh-cn"
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      transform: 'scale(1.02)',
                      transformOrigin: 'center center'
                    }}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* QR Modal */}
      {typeof document !== 'undefined' && createPortal(
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
        </AnimatePresence>,
        document.body
      )}

      {/* Preview Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {previewItem && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl md:rounded-[2rem] w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative z-10"
              >
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3]">
                    {previewItem.file_type.toLowerCase().includes('mp4') ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#1d1d1f] line-clamp-1">{previewItem.title}</h3>
                    <p className="text-xs text-[#86868b] uppercase font-bold">{previewItem.file_type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* 常驻控制按钮：切换引擎 & 下载 */}
                  {(previewItem.file_type.toLowerCase().includes('ppt') || previewItem.file_type.toLowerCase().includes('doc') || previewItem.file_type.toLowerCase().includes('xls')) && (
                    <div className="hidden sm:flex items-center bg-[#f5f5f7] p-1 rounded-full mr-2 border border-[#d2d2d7]/50">
                      <button 
                        onClick={() => {
                          if (previewEngine === 'microsoft') return;
                          setIsPreviewLoading(true);
                          setPreviewError(false);
                          setPreviewEngine('microsoft');
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${previewEngine === 'microsoft' ? 'bg-white text-[#0071e3] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                      >
                        Rayzo Pro
                      </button>
                      <button 
                        onClick={() => {
                          if (previewEngine === 'xdoc') return;
                          setIsPreviewLoading(true);
                          setPreviewError(false);
                          setPreviewEngine('xdoc');
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${previewEngine === 'xdoc' ? 'bg-white text-[#0071e3] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                      >
                        Rayzo Ultra
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => handleDownloadClick(previewItem)}
                    disabled={downloadProgress?.id === previewItem.id}
                    className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all mr-2 relative overflow-hidden ${
                      downloadProgress?.id === previewItem.id
                        ? "bg-[#f5f5f7] text-[#1d1d1f] border border-[#d2d2d7]/50 cursor-wait"
                        : "bg-[#0071e3]/10 hover:bg-[#0071e3]/20 text-[#0071e3]"
                    }`}
                  >
                    {downloadProgress?.id === previewItem.id && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-[#0071e3]/20 transition-all duration-300"
                        style={{ width: `${downloadProgress.progress}%` }}
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-2">
                      {downloadProgress?.id === previewItem.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0071e3]" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {downloadProgress?.id === previewItem.id ? `${downloadProgress.progress}%` : "下载原件"}
                    </div>
                  </button>

                  <button 
                    onClick={() => setPreviewItem(null)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-grow bg-[#f5f5f7] relative overflow-hidden flex items-center justify-center min-h-[50vh] md:min-h-[75vh]">
                
                {/* Floating Watermark */}
                <div className="absolute top-4 right-4 md:top-6 md:right-6 z-30 pointer-events-none select-none opacity-80 bg-white/70 backdrop-blur-md px-5 py-2.5 rounded-full border border-[#0071e3]/20 shadow-sm flex items-center gap-2 transition-all">
                  <span className="text-[#0071e3] font-black text-sm md:text-base tracking-wide">Rayzo</span>
                  <span className="text-[#0071e3]/30 text-sm">|</span>
                  <span className="text-[#0071e3] font-bold text-[10px] md:text-xs tracking-widest">让科创教育触手可及</span>
                </div>

                 {isPreviewLoading && !previewError && (
                   <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#f5f5f7]">
                     <Loader2 className="w-8 h-8 text-[#0071e3] animate-spin mb-4" />
                     <p className="text-[#86868b] text-sm font-medium">
                       {previewItem.file_type.toLowerCase().includes('mp4') || previewItem.file_type.toLowerCase().includes('png') || previewItem.file_type.toLowerCase().includes('jpg') 
                         ? "正在加载媒体文件..." 
                         : previewItem.file_type.toLowerCase().includes('ppt') 
                           ? `正在通过 ${previewEngine === 'microsoft' ? 'Rayzo Pro' : 'Rayzo Ultra'} 核心解析文档...`
                           : "正在启动本地文档预览插件..."}
                     </p>
                     <p className="text-[#86868b]/60 text-xs mt-2">首次加载可能需要 5-10 秒</p>

                     {isSlowLoading && (previewItem.file_type.toLowerCase().includes('ppt') || previewItem.file_type.toLowerCase().includes('doc') || previewItem.file_type.toLowerCase().includes('xls')) && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="mt-8 flex flex-col items-center animate-pulse"
                       >
                         <p className="text-[#0071e3] text-sm md:text-base font-bold mb-3 flex items-center gap-1">
                           似乎加载时间较长，您可以尝试切换引擎
                         </p>
                         <button 
                           onClick={() => {
                             setIsPreviewLoading(true);
                             setPreviewError(false);
                             setPreviewEngine(prev => prev === 'microsoft' ? 'xdoc' : 'microsoft');
                           }}
                           className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071e3]/10 hover:bg-[#0071e3]/20 text-[#0071e3] font-bold transition-colors shadow-sm"
                         >
                           <RefreshCw className="w-4 h-4" />
                           切换至 {previewEngine === 'microsoft' ? 'Rayzo Ultra' : 'Rayzo Pro'}
                         </button>
                       </motion.div>
                     )}
                   </div>
                 )}

                 {previewError && (
                   <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#f5f5f7] p-6 text-center">
                     <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                       <AlertCircle className="w-8 h-8 text-red-500" />
                     </div>
                     <h4 className="text-lg font-bold text-[#1d1d1f] mb-2">在线预览服务暂时不可用</h4>
                     <p className="text-[#86868b] text-sm max-w-md mb-6">
                       由于第三方预览服务的网络波动或文件过大，导致文档解析超时或失败。
                     </p>
                     <div className="flex flex-col sm:flex-row gap-3">
                       {(previewItem.file_type.toLowerCase().includes('ppt') || previewItem.file_type.toLowerCase().includes('doc') || previewItem.file_type.toLowerCase().includes('xls')) && (
                         <button 
                           onClick={() => {
                             setIsPreviewLoading(true);
                             setPreviewError(false);
                             setPreviewEngine(prev => prev === 'microsoft' ? 'xdoc' : 'microsoft');
                           }}
                           className="btn-secondary flex items-center justify-center gap-2 border border-[#0071e3]/20 text-[#0071e3] hover:bg-[#0071e3]/10"
                         >
                           <RefreshCw className="w-4 h-4" />
                           尝试切换引擎 ({previewEngine === 'microsoft' ? 'Rayzo Ultra' : 'Rayzo Pro'})
                         </button>
                       )}
                       <button 
                         onClick={() => {
                           setPreviewItem(null);
                           handleDownloadClick(previewItem);
                         }}
                         disabled={downloadProgress?.id === previewItem.id}
                         className={`btn-primary flex items-center justify-center gap-2 relative overflow-hidden ${downloadProgress?.id === previewItem.id ? 'cursor-wait' : ''}`}
                       >
                         {downloadProgress?.id === previewItem.id && (
                           <div 
                             className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300"
                             style={{ width: `${downloadProgress.progress}%` }}
                           />
                         )}
                         <div className="relative z-10 flex items-center gap-2">
                           {downloadProgress?.id === previewItem.id ? (
                             <Loader2 className="w-4 h-4 animate-spin text-white" />
                           ) : (
                             <Download className="w-4 h-4" />
                           )}
                           {downloadProgress?.id === previewItem.id ? `正在下载 ${downloadProgress.progress}%` : "直接下载到本地查看"}
                         </div>
                       </button>
                     </div>
                   </div>
                 )}

                 {previewItem.file_type.toLowerCase().includes('mp4') ? (
                   <video 
                     src={previewItem.file_url} 
                     controls 
                     autoPlay 
                     className={`w-full h-full object-contain transition-opacity duration-300 ${isPreviewLoading ? 'opacity-0' : 'opacity-100'}`}
                     onLoadedData={() => setIsPreviewLoading(false)}
                     onError={() => {
                       setIsPreviewLoading(false);
                       setPreviewError(true);
                     }}
                   />
                 ) : previewItem.file_type.toLowerCase().includes('png') || previewItem.file_type.toLowerCase().includes('jpg') ? (
                   <img 
                     src={previewItem.file_url} 
                     alt={previewItem.title} 
                     className={`max-w-full max-h-full object-contain p-4 transition-opacity duration-300 ${isPreviewLoading ? 'opacity-0' : 'opacity-100'}`}
                     onLoad={() => setIsPreviewLoading(false)}
                     onError={() => {
                       setIsPreviewLoading(false);
                       setPreviewError(true);
                     }}
                   />
                 ) : previewItem.file_type.toLowerCase().includes('ppt') ? (
                   <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isPreviewLoading ? 'opacity-0' : 'opacity-100'}`}>
                     <iframe 
                       src={getPreviewUrl(previewItem, previewEngine)} 
                       className="w-full h-full border-0"
                       title="Document Preview"
                       onLoad={() => {
                         // 给 iframe 额外的缓冲时间，因为它 load 触发时内部可能还没渲染完
                         setTimeout(() => setIsPreviewLoading(false), 800);
                       }}
                       onError={() => {
                         setIsPreviewLoading(false);
                         setPreviewError(true);
                       }}
                     />
                   </div>
                 ) : (
                   <div className={`absolute inset-0 w-full h-full flex flex-col transition-opacity duration-300 ${isPreviewLoading ? 'opacity-0' : 'opacity-100'}`}>
                     <DocViewer 
                       documents={[{ uri: previewItem.file_url, fileType: previewItem.file_type.toLowerCase() }]} 
                       pluginRenderers={DocViewerRenderers}
                       prefetchMethod="GET"
                       style={{ width: '100%', height: '100%', backgroundColor: '#f5f5f7' }}
                       config={{
                         header: {
                           disableHeader: true,
                           disableFileName: true,
                           retainURLParams: false
                         }
                       }}
                     />
                     {/* DocViewer doesn't have an explicit onLoad callback in this version, so we simulate it for UI smoothness */}
                     {setTimeout(() => { if (isPreviewLoading) setIsPreviewLoading(false); }, 1500) && null}
                   </div>
                 )}
               </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewItem(null)}
                className="absolute inset-0 z-0"
              />
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

