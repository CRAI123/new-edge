import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useUserStore } from "@/store/useUserStore";
import { supabase } from "@/lib/supabase";
import { User, Activity, Clock, ShieldCheck, Mail, LogIn, MousePointerClick, Download, Layers, Camera, X, Sparkles, Plane } from "lucide-react";
import MemberBadge from "@/components/Badge/MemberBadge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import { createPortal } from "react-dom";
import { showToast } from "@/lib/utils";

interface UserActivity {
  id: string;
  action: string;
  details: any;
  created_at: string;
}

const levelNames: Record<number, string> = {
  1: "龙蛋会员",
  2: "幼龙会员",
  3: "鳞铸会员",
  4: "古龙典藏会员"
};

// 登机牌风格数字通行证
function DigitalCardModal({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: any }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 阻止滚动穿透
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // 高清分辨率
        useCORS: true,
        backgroundColor: "#000000" // 确保背景色为黑色，与 wrapper 一致
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rayzo_Boarding_Pass_${user.fullName || "User"}.png`;
      a.click();
      showToast("success", "登机牌已保存到本地！");
    } catch (error) {
      console.error(error);
      showToast("error", "生成图片失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const ticketDate = format(new Date(), "yyyy.MM.dd");
  const ticketTime = format(new Date(), "HH:mm");
  const uidStr = user?.id?.split('-')[0]?.toUpperCase() || "UNKNOWN";
  
  // 根据 UID 生成稳定的伪随机条形码图案
  const generateBarcode = (uid: string) => {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = ((hash << 5) - hash) + uid.charCodeAt(i);
      hash = hash & hash;
    }
    const seed = Math.abs(hash);
    const pattern = [];
    const length = 32;
    for (let i = 0; i < length; i++) {
      // 提取 seed 中的不同位来决定条形码的宽度 (1-4)
      const w = ((seed >> (i % 20)) & 3) + 1;
      pattern.push(w);
    }
    return pattern;
  };
  
  const barcodePattern = generateBarcode(uidStr);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm flex flex-col items-center"
      >
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute -top-14 right-0 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm z-50"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 截图区域：黑色背景容器包裹登机牌 */}
        <div 
          ref={cardRef}
          className="p-6 bg-black rounded-[2.5rem] relative w-full flex justify-center"
        >
          {/* 背景氛围光 */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0071e3]/20 to-[#28cd41]/20 blur-3xl rounded-[2.5rem]"></div>
          
          {/* 登机牌主体 */}
          <div className="relative w-full max-w-[320px] flex flex-col z-10 drop-shadow-2xl">
            
            {/* 登机牌上半部分 */}
            <div className="bg-[#111113] border border-white/10 border-b-0 rounded-t-3xl p-6 pb-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0071e3] to-[#28cd41]"></div>
              
              <div className="flex justify-between items-center mb-8 mt-2">
                <span className="text-white/50 text-[10px] tracking-[0.2em] font-mono">BOARDING PASS</span>
                <span className="text-[#28cd41] text-[9px] tracking-[0.2em] font-mono border border-[#28cd41]/30 bg-[#28cd41]/10 px-2 py-0.5 rounded-full">
                  {levelNames[user.level] ? 'VIP CLASS' : 'ECONOMY'}
                </span>
              </div>

              <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col">
                  <span className="text-4xl font-black text-white tracking-tighter">RYZ</span>
                  <span className="text-white/40 text-[9px] font-mono mt-1 tracking-widest">RAYZO</span>
                </div>
                
                <div className="flex-1 flex items-center justify-center px-4 relative">
                  <div className="absolute w-full border-t-[1.5px] border-dashed border-white/20"></div>
                  <Plane className="w-5 h-5 text-[#0071e3] relative z-10 bg-[#111113] px-1" />
                </div>

                <div className="flex flex-col text-right">
                  <span className="text-4xl font-black text-white tracking-tighter">FUT</span>
                  <span className="text-white/40 text-[9px] font-mono mt-1 tracking-widest">FUTURE</span>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <div className="text-white/40 text-[9px] font-mono tracking-wider mb-1">PASSENGER</div>
                  <div className="text-white font-bold text-lg uppercase tracking-wide">{user.fullName || "GUEST"}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-white/40 text-[9px] font-mono tracking-wider mb-1">FLIGHT</div>
                    <div className="text-[#00c6ff] font-mono font-bold text-base">RZ-2026</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-[9px] font-mono tracking-wider mb-1">DATE</div>
                    <div className="text-white font-mono font-bold text-base">{ticketDate}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-white/40 text-[9px] font-mono tracking-wider mb-1">GATE</div>
                    <div className="text-white font-mono font-bold text-base">A1</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-[9px] font-mono tracking-wider mb-1">TIME</div>
                    <div className="text-white font-mono font-bold text-base">{ticketTime}</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-[9px] font-mono tracking-wider mb-1">SEAT</div>
                    <div className="text-white font-mono font-bold text-base">{user.loginCount || 1}A</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 登机牌中间撕孔部分 */}
            <div className="bg-[#111113] h-8 flex items-center justify-between relative border-x border-white/10">
              <div className="w-4 h-8 bg-black rounded-r-full border border-white/10 border-l-0 -ml-[1px]"></div>
              <div className="flex-1 border-t-[1.5px] border-dashed border-white/20 mx-3"></div>
              <div className="w-4 h-8 bg-black rounded-l-full border border-white/10 border-r-0 -mr-[1px]"></div>
            </div>

            {/* 登机牌下半部分 (条形码) */}
            <div className="bg-[#111113] border border-white/10 border-t-0 rounded-b-3xl p-6 pt-4 relative overflow-hidden">
              <div className="w-full h-14 flex justify-between items-end opacity-90 mb-4">
                {barcodePattern.map((w, i) => (
                  <div key={i} className="bg-white h-full rounded-sm" style={{ width: `${w * 1.2}px` }}></div>
                ))}
              </div>
              <div className="flex justify-between items-center w-full text-white/40 text-[10px] font-mono tracking-[0.2em] mb-3">
                <span>UID:{uidStr}</span>
                <span>{user.role === 'admin' ? 'ADMIN' : 'MEMBER'}</span>
              </div>
              
              {/* 品牌标识声明 */}
              <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#0071e3] to-[#28cd41] flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">R</span>
                  </div>
                  <span className="text-white/60 text-[9px] tracking-wider font-semibold">Generated by Rayzo Print</span>
                </div>
                <span className="text-[#0071e3]/60 text-[8px] tracking-widest font-mono">RAYZO.CN</span>
              </div>
            </div>

          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-8 w-full flex justify-center">
          <button 
            onClick={handleDownload}
            disabled={isGenerating}
            className="btn-primary w-full max-w-[240px] py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,113,227,0.4)] hover:shadow-[0_0_30px_rgba(0,113,227,0.6)] transition-all font-bold text-base"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span>保存登机牌打卡</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

export default function Profile() {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCardOpen, setIsCardOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from("user_activities")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data) {
          setActivities(data);
        }
      } catch (err) {
        console.error("Error fetching activities", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#f5f5f7]">
      {/* 挂载名片弹窗 */}
      <DigitalCardModal 
        isOpen={isCardOpen} 
        onClose={() => setIsCardOpen(false)} 
        user={user} 
      />
      
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#1d1d1f]">个人中心</h1>
          <p className="text-[#86868b] mt-2">查看您的账号信息与最近动态</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：用户信息卡片 */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-[2rem] p-8 shadow-sm border border-white shimmer-border relative overflow-hidden group"
            >
              {/* 卡片背景装饰 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#0071e3]/5 to-[#28cd41]/5 rounded-bl-[100px] pointer-events-none" />
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0071e3] to-[#28cd41] text-white flex items-center justify-center mb-4 shadow-lg ring-4 ring-[#f5f5f7] group-hover:scale-105 transition-transform duration-300">
                  <User className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-[#1d1d1f] mb-1">{user.fullName || "工坊成员"}</h2>
                <div className="flex items-center gap-1.5 text-[#86868b] mb-4">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5f5f7] mb-6">
                  <MemberBadge level={user.level} size="sm" />
                  <span className="text-sm font-semibold text-[#1d1d1f]">{levelNames[user.level]}</span>
                </div>

                {/* 生成数字名片按钮 */}
                <button
                  onClick={() => setIsCardOpen(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1d1d1f] to-[#333] text-white font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-black/20 transition-all hover:-translate-y-0.5"
                >
                  <Camera className="w-4 h-4" />
                  生成我的数字名片
                </button>
              </div>

              <div className="space-y-4 pt-6 mt-6 border-t border-[#f5f5f7] relative z-10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#86868b] flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> 用户角色</span>
                  <span className="font-medium text-[#1d1d1f] capitalize">{user.role === 'individual' ? '个人用户' : user.role === 'teacher' ? '教育工作者' : user.role === 'student' ? '在校学生' : '管理员'}</span>
                </div>
              </div>
            </motion.div>

            {/* 统计数据 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-white shimmer-border grid grid-cols-2 gap-4"
            >
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#E6F4FF] to-white border border-[#0071e3]/10">
                <div className="flex items-center gap-2 mb-2 text-[#0071e3]">
                  <LogIn className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">登录次数</span>
                </div>
                <div className="text-2xl font-black text-[#1d1d1f]">{user.loginCount || 1}</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#F6FFED] to-white border border-[#28cd41]/10">
                <div className="flex items-center gap-2 mb-2 text-[#28cd41]">
                  <Download className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">下载资源</span>
                </div>
                <div className="text-2xl font-black text-[#1d1d1f]">{user.downloadCount || 0}</div>
              </div>
            </motion.div>
          </div>

          {/* 右侧：活动时间轴 */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-white shimmer-border min-h-full"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#1d1d1f]">最近动态</h3>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 rounded-full border-3 border-[#0071e3]/20 border-t-[#0071e3] animate-spin mb-4"></div>
                  <p className="text-sm text-[#86868b]">加载动态中...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-[#f5f5f7] rounded-[2rem] border border-dashed border-[#d2d2d7]">
                  <Clock className="w-12 h-12 text-[#86868b]/30 mb-4" />
                  <p className="text-[#1d1d1f] font-semibold">暂无动态记录</p>
                  <p className="text-[#86868b] text-sm mt-2">您的浏览和下载行为将显示在这里</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-[#f5f5f7] ml-4 space-y-8 pb-4">
                  {activities.map((activity, idx) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="relative pl-8"
                    >
                      <div className="absolute w-4 h-4 bg-white border-2 border-[#0071e3] rounded-full -left-[9px] top-1.5 shadow-sm ring-4 ring-white" />
                      <div className="bg-[#f5f5f7] p-5 rounded-2xl border border-[#eaeaea] hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-[#1d1d1f] text-base group-hover:text-[#0071e3] transition-colors">{activity.action}</h4>
                          <span className="text-xs font-mono text-[#86868b] bg-white px-2 py-1 rounded-md shadow-sm border border-[#eaeaea]">
                            {format(new Date(activity.created_at), "MM-dd HH:mm")}
                          </span>
                        </div>
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <div className="mt-3 bg-white p-3 rounded-xl text-xs text-[#86868b] border border-[#eaeaea]">
                            <pre className="font-mono whitespace-pre-wrap">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
