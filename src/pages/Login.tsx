import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Github, X, ShieldCheck, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/useUserStore";
import { safeAlert } from "@/lib/utils";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState<string[]>(new Array(8).fill(""));
  const [agreePolicy, setAgreePolicy] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { setUser, setAdmin } = useUserStore();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("请输入电子邮箱");
      return;
    }
    if (!agreePolicy) {
      setError("请先阅读并同意服务条款与隐私政策");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) throw error;
      setIsVerifying(true);
    } catch (err: any) {
      setError(err.message || "发送验证码失败，请检查邮箱是否已注册");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, "");
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

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
        type: 'magiclink' // Or 'signup' depending on how it was sent, usually magiclink for signin
      });

      if (error) {
        // Try 'signup' if magiclink fails, just in case
        const { data: data2, error: error2 } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'signup'
        });
        if (error2) throw error; // Throw the first error if both fail
        if (data2.user) {
          await handleLoginSuccess(data2.user);
        }
      } else if (data.user) {
        await handleLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || "验证失败，请检查验证码是否正确");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (supabaseUser: any) => {
    // 获取用户 Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    const metadata = supabaseUser.user_metadata;
    let role = profile?.role || metadata.role || 'individual';
    
    // 强制管理员邮箱判断
    if (supabaseUser.email === '2623681461@qq.com') {
      role = 'admin';
    }

    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      fullName: profile?.full_name || metadata.full_name || metadata.name || "工坊成员",
      role: role as any,
      level: profile?.level || 1,
      loginCount: profile?.login_count || 1,
      browseCount: profile?.browse_count || 0,
      downloadCount: profile?.download_count || 0
    });

    if (role === 'admin') {
      setAdmin(true);
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreePolicy) {
      setError("请先阅读并同意服务条款与隐私政策");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 快捷管理员登录 (admin123)
      if (email === "2623681461@qq.com" && password === "admin123") {
        setAdmin(true);
        setUser({
          id: "admin-id",
          email: "2623681461@qq.com",
          fullName: "系统管理员 (快捷登录)",
          role: "admin",
          level: 4,
          loginCount: 999,
          browseCount: 999,
          downloadCount: 999
        });
        navigate("/admin");
        return;
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      if (data.user) {
        await handleLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || "登录失败，请检查您的账号密码");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    if (!agreePolicy) {
      setError("请先阅读并同意服务条款与隐私政策");
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "GitHub 登录失败");
    }
  };

  useEffect(() => {
    if (isVerifying) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isVerifying]);

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-[#f5f5f7] px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] p-10 md:p-12 shadow-xl border border-white/50 shimmer-border group"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3 text-[#1d1d1f]">欢迎回来</h1>
          <p className="text-[#86868b]">登录您的睿造打印工坊账号</p>
        </div>

        <div className="space-y-6">
          {error && !isVerifying && (
            <div className="p-4 rounded-xl bg-red-50 text-red-500 text-sm border border-red-100">
              {error}
            </div>
          )}
          
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

          <div className="flex flex-col gap-4">
            <form onSubmit={handleSendOtp}>
              <button 
                disabled={loading}
                type="submit" 
                className="w-full bg-[#f5f5f7] text-[#1d1d1f] py-3 rounded-xl font-medium hover:bg-[#ececef] transition-all flex items-center justify-center gap-2"
              >
                {loading ? "发送中..." : "使用邮箱验证码登录"}
              </button>
            </form>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#d2d2d7]"></div>
              <span className="flex-shrink mx-4 text-[#86868b] text-xs uppercase">或者使用密码</span>
              <div className="flex-grow border-t border-[#d2d2d7]"></div>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  placeholder="请输入密码"
                />
              </div>
              <button 
                disabled={loading}
                type="submit" 
                className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg shadow-lg shadow-blue-500/20"
              >
                {loading ? "登录中..." : (
                  <>密码登录 <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#d2d2d7]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#86868b]">其他登录方式</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGithubLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#d2d2d7] hover:bg-[#f5f5f7] transition-all font-medium text-[#1d1d1f]"
          >
            <Github className="w-5 h-5" />
            GitHub 账号登录
          </button>
        </div>

        {/* 隐私政策同意 */}
        <div className="mt-8">
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

        <p className="mt-10 text-center text-sm text-[#86868b]">
          还没有账号？{" "}
          <Link to="/register" className="text-[#0071e3] font-semibold hover:underline">
            立即注册
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
                <h2 className="text-2xl font-bold text-[#1d1d1f] mb-3">登录验证</h2>
                <p className="text-[#86868b] px-4">
                  我们已向您的邮箱 <span className="text-[#1d1d1f] font-semibold">{email}</span> 发送了 8 位验证码。
                </p>
              </div>

              {error && isVerifying && (
                <div className="mb-8 p-4 rounded-xl bg-red-50 text-red-500 text-sm border border-red-100 text-center">
                  {error}
                </div>
              )}

              <div className="flex flex-col items-center gap-8">
                <div className="flex items-center gap-2 md:gap-3">
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
                    {loading ? "验证中..." : "立即登录"}
                  </button>
                  <button 
                    type="button"
                    onClick={handleSendOtp}
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
