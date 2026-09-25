import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X, Cookie } from "lucide-react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 检查本地是否已经有同意记录
    const hasConsented = localStorage.getItem("rayzo_cookie_consent");
    if (!hasConsented) {
      // 延迟一秒显示，避免刚打开页面就弹出来显得太突兀
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("rayzo_cookie_consent", "true");
    setIsVisible(false);
  };

  const handleDecline = () => {
    // 即便拒绝，也记录下来，防止每次刷新都弹
    localStorage.setItem("rayzo_cookie_consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:max-w-sm z-[200]"
        >
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0071e3]/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <button 
              onClick={handleDecline}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 mb-4 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0071e3]/10 to-[#28cd41]/10 flex items-center justify-center shrink-0 shadow-sm border border-white/50">
                <Cookie className="w-5 h-5 text-[#0071e3]" />
              </div>
              <div>
                <h3 className="text-[#1d1d1f] font-bold mb-1">我们重视您的隐私</h3>
                <p className="text-xs text-[#86868b] leading-relaxed">
                  本网站使用 Cookies 及其同类技术来提升您的浏览体验、提供安全登录并分析网站流量。继续使用即表示您同意我们的使用政策。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <Link 
                to="/cookie-policy" 
                onClick={() => setIsVisible(false)}
                className="flex-1 text-center py-2.5 text-xs font-semibold text-[#0071e3] hover:bg-[#0071e3]/5 rounded-xl transition-colors"
              >
                了解更多
              </Link>
              <button 
                onClick={handleAccept}
                className="flex-1 py-2.5 bg-[#1d1d1f] hover:bg-[#0071e3] text-white text-xs font-semibold rounded-xl transition-colors shadow-md"
              >
                同意并继续
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}