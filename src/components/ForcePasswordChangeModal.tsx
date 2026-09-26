import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";

export default function ForcePasswordChangeModal() {
  const { user, setUser } = useUserStore();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("新密码至少需要 8 个字符");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      // 1. Update Auth password
      const { error: updateAuthError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateAuthError) throw updateAuthError;

      // 2. Clear the flag in profiles table
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ require_password_change: false })
        .eq('id', user.id);

      if (updateProfileError) throw updateProfileError;

      showToast("success", "密码修改成功，请牢记您的新密码！");
      
      // Trigger exit animation before removing from DOM
      setIsVisible(false);
      setTimeout(() => {
        setUser({
          ...user,
          require_password_change: false
        });
      }, 300); // Wait for exit animation to complete

    } catch (err: any) {
      console.error("Force password change error:", err);
      setError(err.message || "密码修改失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-6" style={{ pointerEvents: 'auto' }}>
          <motion.div 
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-lg"
          />
          <motion.div 
            key="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 overflow-hidden border border-white/20"
          >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#ff3b30]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#ff3b30]" />
            </div>
            <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">需要修改密码</h3>
            <p className="text-[#86868b] text-sm">
              检测到您的密码安全性极低，为了保障您的账户安全，您重置密码后方可继续使用系统。
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-[#ff3b30]/10 text-[#ff3b30] p-4 rounded-xl flex items-center gap-3 text-sm font-medium"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">新密码</label>
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
              <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">确认新密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
                <input 
                  required
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  placeholder="再次输入密码"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 提交中...</>
              ) : (
                "确认修改并进入系统"
              )}
            </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
