import { Link, useNavigate } from "react-router-dom";
import { User, LogIn, LayoutDashboard, LogOut, Settings, ChevronDown } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import MemberBadge from "./Badge/MemberBadge";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const { user, isAdmin, setUser } = useUserStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
  };

  const levelNames = {
    1: "龙蛋会员",
    2: "幼龙会员",
    3: "鳞铸会员",
    4: "古龙典藏会员"
  };

  return (
    <nav className="glass-nav px-6 md:px-12 h-20 flex items-center justify-between sticky top-0 z-[100]">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_10px_24px_-6px_rgba(0,113,227,0.35)] shimmer-border">
          <img 
            src="/logo.png" 
            alt="睿造打印工坊" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-[#1d1d1f] leading-none transition-colors group-hover:text-[#0071e3]">睿造打印工坊</span>
          <span className="text-[12px] text-[#86868b] font-medium mt-1">Rayzo print studio</span>
        </div>
      </Link>
      
      <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-[#1d1d1f]">
        <Link to="/" className="hover:text-[#0071e3] transition-colors nav-link-scan">首页</Link>
        <Link to="/printers" className="hover:text-[#0071e3] transition-colors nav-link-scan">设备方案</Link>
        <Link to="/products" className="hover:text-[#0071e3] transition-colors nav-link-scan">原创周边</Link>
        <Link to="/resources" className="hover:text-[#0071e3] transition-colors nav-link-scan">课件资源</Link>
        <Link to="/advice" className="hover:text-[#0071e3] transition-colors nav-link-scan">创作工具</Link>
        <Link to="/team" className="hover:text-[#0071e3] transition-colors nav-link-scan">关于我们</Link>
        {isAdmin && (
          <Link to="/admin" className="text-[#0071e3] flex items-center gap-1 font-bold nav-link-scan group">
            <LayoutDashboard className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
            后台管理
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div 
            className="relative"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <div className="flex items-center gap-3 cursor-pointer p-1 rounded-full hover:bg-[#f5f5f7] transition-all">
              <MemberBadge level={user.level} size="sm" />
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-[#d2d2d7] shadow-sm overflow-hidden">
                <User className="w-5 h-5 text-[#86868b]" />
              </div>
              <ChevronDown className={`w-4 h-4 text-[#86868b] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-72 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#d2d2d7] overflow-hidden origin-top-right"
                >
                  <div className="p-5 border-b border-[#f5f5f7]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center border border-[#d2d2d7]">
                        <User className="w-6 h-6 text-[#86868b]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[17px] font-semibold text-[#1d1d1f] truncate w-40">{user.fullName || "工坊成员"}</span>
                        <span className="text-[13px] text-[#86868b] truncate w-40">{user.email}</span>
                      </div>
                    </div>
                    
                    <div className="bg-[#f5f5f7] rounded-xl p-3 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#86868b] uppercase font-bold tracking-wider">当前等级</span>
                        <span className="text-[14px] font-bold text-[#1d1d1f]">{levelNames[user.level]}</span>
                      </div>
                      <MemberBadge level={user.level} size="sm" />
                    </div>
                  </div>

                  <div className="p-2">
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#f5f5f7] transition-colors text-[15px] text-[#1d1d1f]">
                      <User className="w-4 h-4 text-[#86868b]" />
                      个人中心
                    </Link>
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#f5f5f7] transition-colors text-[15px] text-[#1d1d1f]">
                      <Settings className="w-4 h-4 text-[#86868b]" />
                      账号设置
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#f5f5f7] transition-colors text-[15px] text-[#0071e3] font-medium">
                        <LayoutDashboard className="w-4 h-4" />
                        后台管理
                      </Link>
                    )}
                  </div>

                  <div className="p-2 border-t border-[#f5f5f7]">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-[15px] text-red-600 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all">
              <LogIn className="w-4 h-4" />
              登录
            </Link>
            <Link to="/register" className="btn-primary text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              注册
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
