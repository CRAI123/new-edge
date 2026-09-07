import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ArrowRight, BookOpen, GraduationCap, Building2, X, ShieldCheck, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/useUserStore";
import { showToast } from "@/lib/utils";

export default function Register() {
  const { setUser } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"teacher" | "student" | "individual">("individual");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState<string[]>(new Array(8).fill(""));
  const [agreePolicy, setAgreePolicy] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, "");
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next
    if (index < 7 && value) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(data)) return;

    const pasteData = data.substring(0, 8).split("");
    const newOtp = [...otp];
    pasteData.forEach((char, index) => {
      newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus the last filled input or the next one
    const nextIndex = Math.min(pasteData.length, 7);
    inputRefs.current[nextIndex]?.focus();
  };

  useEffect(() => {
    if (isVerifying) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isVerifying]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreePolicy) {
      setError("请先阅读并同意服务条款与隐私政策");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role,
            school: role !== "individual" ? school : undefined,
          }
        }
      });

      if (error) throw error;
      
      // Instead of alert, show the OTP modal
      setIsVerifying(true);
    } catch (err: any) {
      setError(err.message || "注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const token = otp.join("");
    if (token.length < 8) {
      setError("请输入完整的 8 位验证码");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });

      if (error) throw error;
      
      if (data?.user) {
        // 验证成功后，立即从 profiles 表获取完整的用户信息
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          // 如果 profile 还没创建好（触发器延迟），手动构建一个基础 profile
          setUser({
            id: data.user.id,
            email: data.user.email || "",
            fullName: name,
            role: role as any,
            level: 1,
            loginCount: 1,
            browseCount: 0,
            downloadCount: 0
          });
        } else {
          // 将从数据库获取的真实数据存入全局 store
          setUser({
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            role: profile.role,
            level: profile.level,
            loginCount: profile.login_count,
            browseCount: profile.browse_count,
            downloadCount: profile.download_count
          });
        }
      }

      showToast("success", "验证成功！欢迎加入睿造打印工坊");
      navigate("/");
    } catch (err: any) {
      setError(err.message || "验证失败，请检查验证码是否正确");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-[#f5f5f7] px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-[3rem] p-10 md:p-16 shadow-xl border border-white/50 relative z-10 shimmer-border group"
      >
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3 text-[#1d1d1f]">开启创意之旅</h1>
          <p className="text-[#86868b]">加入睿造打印工坊，获取海量科创资源</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && !isVerifying && (
            <div className="p-4 rounded-xl bg-red-50 text-red-500 text-sm border border-red-100">
              {error}
            </div>
          )}
          {/* Role Selection */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: "individual", icon: <User />, label: "个人用户" },
              { id: "teacher", icon: <GraduationCap />, label: "教育工作者" },
              { id: "student", icon: <BookOpen />, label: "在校学生" }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id as any)}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  role === item.id 
                    ? "border-[#0071e3] bg-[#0071e3]/5 text-[#0071e3]" 
                    : "border-transparent bg-[#f5f5f7] text-[#86868b] hover:bg-[#ececef]"
                }`}
              >
                <div className="w-6 h-6">{item.icon}</div>
                <span className="text-xs font-bold">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">姓名</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
                <input 
                  required
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  placeholder="您的姓名"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">电子邮箱</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>
          </div>

          {role !== "individual" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">所在学校 / 机构</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
                <input 
                  required
                  type="text" 
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  placeholder="学校或机构名称"
                />
              </div>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">设置密码</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                placeholder="至少 8 位字符"
              />
            </div>
          </div>

          <div>
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-[#f5f5f7]/60 hover:bg-[#f5f5f7] transition-colors cursor-pointer border border-transparent hover:border-[#0071e3]/10">
              <div className="mt-0.5">
                <input 
                  type="checkbox" 
                  checked={agreePolicy}
                  onChange={(e) => {
                    setAgreePolicy(e.target.checked);
                    if (e.target.checked && error) setError(null);
                  }}
                  className="w-4 h-4 rounded border-[#d2d2d7] text-[#0071e3] focus:ring-[#0071e3]/10"
                />
              </div>
              <div className="flex-grow text-sm text-[#86868b] leading-relaxed">
                我已阅读并同意睿造打印工坊的{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#0071e3] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  服务条款
                </Link>
                {" "}与{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#0071e3] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  隐私政策
                </Link>
                ，并同意我们使用 Cookie 来提升体验。
              </div>
            </label>
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg shadow-lg shadow-blue-500/20"
          >
            {loading ? "注册中..." : (
              <>创建账号 <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <p className="mt-12 text-center text-sm text-[#86868b]">
          已经有账号了？{" "}
          <Link to="/login" className="text-[#0071e3] font-semibold hover:underline">
            立即登录
          </Link>
        </p>
      </motion.div>

      {/* OTP Verification Modal */}
      <AnimatePresence>
        {isVerifying && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md"
              onClick={() => setIsVerifying(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-visible p-8 md:p-12 z-[1000] shimmer-border group"
            >
              <button 
                onClick={() => setIsVerifying(false)}
                className="absolute right-8 top-8 p-2 rounded-full hover:bg-[#f5f5f7] transition-colors"
              >
                <X className="w-6 h-6 text-[#86868b]" />
              </button>

              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-[#0071e3]/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-10 h-10 text-[#0071e3]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1d1d1f] mb-3">安全验证</h2>
                <p className="text-[#86868b] px-4">
                  我们已向您的邮箱 <span className="text-[#1d1d1f] font-semibold">{email}</span> 发送了 8 位验证码，请查收并填写。
                </p>
              </div>

              {error && isVerifying && (
                <div className="mb-8 p-4 rounded-xl bg-red-50 text-red-500 text-sm border border-red-100 text-center">
                  {error}
                </div>
              )}

              <div className="flex flex-col items-center gap-8">
                <div className="flex items-center gap-2 md:gap-3" onPaste={handlePaste}>
                  <div className="flex gap-2 md:gap-3">
                    {otp.slice(0, 4).map((data, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        value={data}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="w-10 h-14 md:w-12 md:h-16 text-center text-2xl font-bold bg-[#f5f5f7] border-2 border-transparent rounded-2xl focus:border-[#0071e3] focus:bg-white focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                      />
                    ))}
                  </div>
                  
                  <div className="w-4 h-[2px] bg-[#d2d2d7] rounded-full mx-1" />

                  <div className="flex gap-2 md:gap-3">
                    {otp.slice(4, 8).map((data, index) => (
                      <input
                        key={index + 4}
                        ref={(el) => (inputRefs.current[index + 4] = el)}
                        type="text"
                        maxLength={1}
                        value={data}
                        onChange={(e) => handleOtpChange(e.target, index + 4)}
                        onKeyDown={(e) => handleKeyDown(e, index + 4)}
                        className="w-10 h-14 md:w-12 md:h-16 text-center text-2xl font-bold bg-[#f5f5f7] border-2 border-transparent rounded-2xl focus:border-[#0071e3] focus:bg-white focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                <div className="w-full space-y-4">
                  <button 
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.some(v => v === "")}
                    className="w-full btn-primary py-4 text-lg shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? "验证中..." : "完成注册"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      handleSubmit(new Event('submit') as any);
                      showToast("info", "验证码已重新发送，请检查您的邮箱。");
                    }}
                    className="w-full py-2 text-[#86868b] hover:text-[#0071e3] text-sm font-medium transition-colors"
                  >
                    没收到验证码？<span className="underline">重新发送</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
