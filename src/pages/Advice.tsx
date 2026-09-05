import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CheckCircle2, AlertCircle, TrendingUp, X, Sparkles, Loader2 } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import AIChatAssistant from "../components/AIChatAssistant";
import { supabase } from "@/lib/supabase";

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
}

export default function Advice() {
  const { updateStats } = useUserStore();
  const [recommendations, setRecommendations] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);

  useEffect(() => {
    // 页面浏览量统计
    updateStats('browse');
    fetchPrinters();
  }, [updateStats]);

  const fetchPrinters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: true });
    
    if (data) setRecommendations(data);
    setLoading(false);
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
            <h1 className="heading-medium mb-6">3D 打印机选购建议</h1>
            <p className="text-description max-w-3xl mx-auto">
              拒绝盲目跟风，基于真实评测与使用场景，为您推荐最合适的 3D 打印设备。
            </p>
          </motion.div>

          {/* Quick Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              { title: "看精度", desc: "对于教育场景，0.1mm 的层厚精度已足够满足大部分模型展示需求。" },
              { title: "看稳定性", desc: "全金属结构能有效减少打印过程中的共振，提高长周期打印的成功率。" },
              { title: "看生态", desc: "切片软件是否易用、耗材是否通用是影响长期使用体验的关键因子。" }
            ].map((guide, idx) => (
              <div key={idx} className="p-8 rounded-[2rem] bg-[#f5f5f7] border border-transparent hover:border-[#0071e3]/10 transition-all">
                <div className="w-10 h-10 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-bold mb-6">{idx + 1}</div>
                <h3 className="text-xl font-bold mb-4">{guide.title}</h3>
                <p className="text-[#86868b] leading-relaxed">{guide.desc}</p>
              </div>
            ))}
          </div>

          {/* Recommended Models */}
          <h2 className="text-3xl font-bold mb-12 text-center">本季诚意推荐</h2>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#0071e3] animate-spin mb-4" />
              <p className="text-[#86868b]">正在获取最新选购建议...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
              {recommendations.map((item, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="rounded-[3rem] bg-[#f5f5f7] overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-[#0071e3]/20 cursor-pointer"
                  onClick={() => setSelectedPrinter(item)}
                >
                  <div className="md:w-1/2 aspect-square relative bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center overflow-hidden group border-r border-[#f5f5f7]">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
                      <div className="absolute -top-10 -left-10 text-9xl font-black rotate-12 whitespace-nowrap">
                        {item.brand} {item.brand} {item.brand}
                      </div>
                      <div className="absolute top-1/2 -right-20 text-9xl font-black -rotate-12 whitespace-nowrap">
                        {item.brand} {item.brand} {item.brand}
                      </div>
                    </div>

                    {item.image && !item.image.includes('traeapi.us') && !item.image.includes('placeholder') ? (
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 z-10"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const placeholder = parent.querySelector('.brand-artistic-display');
                            if (placeholder) placeholder.classList.remove('hidden');
                            if (placeholder) placeholder.classList.add('flex');
                          }
                        }}
                      />
                    ) : null}

                    <div className={`brand-artistic-display ${item.image && !item.image.includes('traeapi.us') && !item.image.includes('placeholder') ? 'hidden' : 'flex'} absolute inset-0 flex-col items-center justify-center p-12 text-center z-0`}>
                      <div className="relative">
                        <span className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#0071e3] to-[#28cd41] opacity-20 blur-[1px] absolute -top-1 -left-1 select-none">
                          {item.brand.split(' ')[0]}
                        </span>
                        <span className="text-7xl font-black tracking-tighter text-[#1d1d1f] relative select-none">
                          {item.brand.split(' ')[0]}
                        </span>
                      </div>
                      <div className="mt-8 flex flex-col items-center">
                        <div className="h-1 w-12 bg-gradient-to-r from-[#0071e3] to-[#28cd41] rounded-full mb-6" />
                        <span className="text-xs font-bold tracking-[0.4em] text-[#86868b] uppercase">
                          PREMIUM SERIES
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-1/2 p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 mb-2 text-[#FFB800]">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-bold">{item.rating} / 5.0</span>
                      </div>
                      <span className="text-xs text-[#0071e3] font-bold uppercase tracking-wider mb-2 block">{item.brand}</span>
                      <h3 className="text-2xl font-bold mb-6">{item.title}</h3>
                      <div className="space-y-4 mb-8">
                        {item.pros.slice(0, 2).map(pro => (
                          <div key={pro} className="flex items-center gap-2 text-sm text-[#28cd41]">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{pro}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#1d1d1f]">{item.price}</span>
                      <button className="text-[#0071e3] font-semibold hover:underline">查看详情</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Printer Detail Modal */}
          <AnimatePresence>
            {selectedPrinter && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedPrinter(null)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
                >
                  <button 
                    onClick={() => setSelectedPrinter(null)}
                    className="absolute top-8 right-8 z-10 p-2 rounded-full bg-[#f5f5f7] hover:bg-[#d2d2d7] transition-all"
                  >
                    <X className="w-6 h-6 text-[#1d1d1f]" />
                  </button>

                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2 aspect-square relative bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center overflow-hidden rounded-[2.5rem] border border-[#f5f5f7]">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
                        <div className="absolute -top-10 -left-10 text-9xl font-black rotate-12 whitespace-nowrap">
                          {selectedPrinter.brand} {selectedPrinter.brand}
                        </div>
                      </div>

                      {selectedPrinter.image && !selectedPrinter.image.includes('traeapi.us') && !selectedPrinter.image.includes('placeholder') ? (
                        <img 
                          src={selectedPrinter.image} 
                          alt={selectedPrinter.title} 
                          className="w-full h-full object-cover z-10"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const placeholder = parent.querySelector('.brand-artistic-display');
                              if (placeholder) placeholder.classList.remove('hidden');
                              if (placeholder) placeholder.classList.add('flex');
                            }
                          }}
                        />
                      ) : null}

                      <div className={`brand-artistic-display ${selectedPrinter.image && !selectedPrinter.image.includes('traeapi.us') && !selectedPrinter.image.includes('placeholder') ? 'hidden' : 'flex'} absolute inset-0 flex-col items-center justify-center p-12 text-center z-0`}>
                        <div className="relative">
                          <span className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#0071e3] to-[#28cd41] opacity-20 blur-[1px] absolute -top-1 -left-1 select-none">
                            {selectedPrinter.brand.split(' ')[0]}
                          </span>
                          <span className="text-8xl font-black tracking-tighter text-[#1d1d1f] relative select-none">
                            {selectedPrinter.brand.split(' ')[0]}
                          </span>
                        </div>
                        <div className="mt-8 flex flex-col items-center">
                          <div className="h-1.5 w-20 bg-gradient-to-r from-[#0071e3] to-[#28cd41] rounded-full mb-8" />
                          <span className="text-sm font-bold tracking-[0.5em] text-[#86868b] uppercase">
                            PROFESSIONAL GRADE
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="md:w-1/2 p-12">
                      <div className="flex items-center gap-2 mb-4 text-[#FFB800]">
                        <Star className="w-5 h-5 fill-current" />
                        <span className="text-lg font-bold">{selectedPrinter.rating} / 5.0</span>
                      </div>
                      <span className="text-sm text-[#0071e3] font-bold uppercase tracking-widest mb-2 block">{selectedPrinter.brand}</span>
                      <h2 className="text-4xl font-bold mb-8 text-[#1d1d1f]">{selectedPrinter.title}</h2>
                      
                      <div className="space-y-8 mb-12">
                        <div>
                          <h4 className="text-sm font-bold text-[#86868b] uppercase tracking-wider mb-4">产品简介</h4>
                          <p className="text-[#1d1d1f] text-lg leading-relaxed">{selectedPrinter.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-sm font-bold text-[#28cd41] uppercase tracking-wider mb-4">优势 (Pros)</h4>
                            <ul className="space-y-3">
                              {selectedPrinter.pros.map(pro => (
                                <li key={pro} className="flex items-center gap-2 text-[#1d1d1f]">
                                  <CheckCircle2 className="w-4 h-4 text-[#28cd41]" />
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#86868b] uppercase tracking-wider mb-4">不足 (Cons)</h4>
                            <ul className="space-y-3">
                              {selectedPrinter.cons.map(con => (
                                <li key={con} className="flex items-center gap-2 text-[#86868b]">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-8 border-t border-[#f5f5f7]">
                        <span className="text-3xl font-bold text-[#1d1d1f]">{selectedPrinter.price}</span>
                        <a 
                          href={selectedPrinter.buy_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-primary px-10 py-4 inline-block text-center"
                        >
                          前往购买
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Comparison Table */}
          <div className="bg-[#f5f5f7] rounded-[3rem] p-12 md:p-20 mb-20">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-12 text-[#0071e3]">
                <TrendingUp className="w-8 h-8" />
                <h2 className="text-3xl font-bold text-[#1d1d1f]">核心参数横向对比</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#d2d2d7]">
                      <th className="py-6 font-semibold text-[#1d1d1f]">推荐机型</th>
                      <th className="py-6 font-semibold text-[#1d1d1f]">打印尺寸</th>
                      <th className="py-6 font-semibold text-[#1d1d1f]">打印速度</th>
                      <th className="py-6 font-semibold text-[#1d1d1f]">特色功能</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#86868b]">
                    {recommendations.slice(0, 3).map((item) => (
                      <tr key={item.id} className="border-b border-[#d2d2d7]/50 hover:bg-white/50 transition-colors">
                        <td className="py-6 font-medium text-[#1d1d1f]">{item.title}</td>
                        <td className="py-6">{item.brand === '拓竹科技 (Bambu Lab)' ? '256mm³' : item.brand === '创想三维 (Creality)' ? '350mm³' : '250mm³'}</td>
                        <td className="py-6">{item.brand === '拓竹科技 (Bambu Lab)' ? '600mm/s' : '500mm/s'}</td>
                        <td className="py-6">{item.pros[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
      <AIChatAssistant />
    </div>
  );
}
