import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUserStore } from "@/store/useUserStore";
import { supabase } from "@/lib/supabase";
import { User, Lock, Save, AlertTriangle, Key } from "lucide-react";
import { showToast } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user, setUser } = useUserStore();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    setFullName(user.fullName || "");
  }, [user, navigate]);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast("error", "姓名不能为空");
      return;
    }
    
    setLoadingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      
      // Update Auth metadata as well
      await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      setUser({ ...user, fullName });
      showToast("success", "个人信息已更新");
    } catch (err: any) {
      showToast("error", err.message || "更新失败");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      showToast("error", "密码长度至少需要 8 位");
      return;
    }
    if (password !== confirmPassword) {
      showToast("error", "两次输入的密码不一致");
      return;
    }

    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setPassword("");
      setConfirmPassword("");
      showToast("success", "密码修改成功");
    } catch (err: any) {
      showToast("error", err.message || "密码修改失败");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#f5f5f7]">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#1d1d1f]">账号设置</h1>
          <p className="text-[#86868b] mt-2">管理您的个人资料和安全设置</p>
        </motion.div>

        <div className="space-y-8">
          {/* 个人资料设置 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-[2rem] p-8 shadow-sm border border-white shimmer-border"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#1d1d1f]">基本资料</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="max-w-md space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">注册邮箱</label>
                <input 
                  type="email" 
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent text-[#86868b] cursor-not-allowed"
                />
                <p className="text-xs text-[#86868b] mt-2">邮箱作为登录凭证，暂不支持修改</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">姓名 / 昵称</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="您的姓名"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#d2d2d7] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={loadingProfile || fullName === user.fullName}
                className="btn-primary px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {loadingProfile ? "保存中..." : <><Save className="w-4 h-4" /> 保存更改</>}
              </button>
            </form>
          </motion.div>

          {/* 密码安全设置 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-[2rem] p-8 shadow-sm border border-white shimmer-border"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#28cd41]/10 text-[#28cd41] flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#1d1d1f]">安全设置</h2>
            </div>

            <form onSubmit={handleUpdatePassword} className="max-w-md space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">新密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="至少 8 位字符"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[#d2d2d7] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">确认新密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[#d2d2d7] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loadingPassword || !password || !confirmPassword}
                className="px-6 py-2.5 rounded-xl bg-[#1d1d1f] text-white hover:bg-black font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {loadingPassword ? "更新中..." : "更新密码"}
              </button>
            </form>
            
            <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 max-w-md">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700">
                <strong>注意：</strong> 如果您是通过邮箱验证码（快捷登录）创建的账号，首次设置密码后，下次可以使用密码直接登录。
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
