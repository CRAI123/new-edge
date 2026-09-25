import { Link, useNavigate } from "react-router-dom";
import { User, LogIn, LayoutDashboard, LogOut, Settings, ChevronDown, Menu, X } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import MemberBadge from "./Badge/MemberBadge";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const { user, isAdmin, setUser } = useUserStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const levelNames = {
    1: "龙蛋会员",
    2: "幼龙会员",
    3: "鳞铸会员",
    4: "古龙典藏会员"
  };

  return (
    <div className="sticky top-0 z-[100] pt-3 md:pt-5 px-4 md:px-8 pb-3 pointer-events-none">
    <nav className="mx-auto max-w-7xl h-16 md:h-20 px-4 md:px-8 flex items-center justify-between rounded-2xl md:rounded-[2rem] bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] pointer-events-auto transition-all relative">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_10px_24px_-6px_rgba(0,113,227,0.35)] shimmer-border">
          <img 
            src="/logo.png" 
            alt="睿造打印工坊" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-lg md:text-xl font-bold tracking-tight text-[#1d1d1f] leading-none transition-colors group-hover:text-[#0071e3]">睿造打印工坊</span>
          <span className="text-[10px] md:text-[12px] text-[#86868b] font-medium mt-1">Rayzo print studio</span>
        </div>
      </Link>
      
      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-[#1d1d1f]">
        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0071e3] transition-colors nav-link-scan">首页</Link>
        <Link to="/printers" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0071e3] transition-colors nav-link-scan">设备方案</Link>
        <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0071e3] transition-colors nav-link-scan">原创周边</Link>
        <Link to="/resources" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0071e3] transition-colors nav-link-scan">课件资源</Link>
        <Link to="/advice" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0071e3] transition-colors nav-link-scan">创作工具</Link>
        <Link to="/team" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0071e3] transition-colors nav-link-scan">关于我们</Link>
        {isAdmin && (
          <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-[#0071e3] flex items-center gap-1 font-bold nav-link-scan group">
            <LayoutDashboard className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
            后台管理
          </Link>
        )}
      </div>

      {/* User Auth / Mobile Menu Button */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex"> {/* Only show desktop user auth on large screens */}
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

        {/* Mobile menu button */}
        <div className="lg:hidden">
          <button onClick={toggleMobileMenu} className="p-2 rounded-full hover:bg-[#f5f5f7] transition-all">
            {isMobileMenuOpen ? <X className="w-6 h-6 text-[#1d1d1f]" /> : <Menu className="w-6 h-6 text-[#1d1d1f]" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-[calc(100%+0.5rem)] left-0 w-full bg-white/95 backdrop-blur-2xl border border-white/80 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] rounded-2xl lg:hidden overflow-hidden z-[90]"
          >
            <div className="flex flex-col p-4 gap-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
              {/* Navigation Links */}
              <div className="flex flex-col gap-2">
                <Link to="/" onClick={toggleMobileMenu} className="flex items-center justify-between p-4 rounded-2xl bg-[#f5f5f7]/50 hover:bg-[#f5f5f7] active:bg-[#e5e5ea] transition-all text-[17px] font-semibold text-[#1d1d1f]">
                  首页
                  <ChevronDown className="w-5 h-5 -rotate-90 text-[#86868b]" />
                </Link>
                <Link to="/printers" onClick={toggleMobileMenu} className="flex items-center justify-between p-4 rounded-2xl bg-[#f5f5f7]/50 hover:bg-[#f5f5f7] active:bg-[#e5e5ea] transition-all text-[17px] font-semibold text-[#1d1d1f]">
                  设备方案
                  <ChevronDown className="w-5 h-5 -rotate-90 text-[#86868b]" />
                </Link>
                <Link to="/products" onClick={toggleMobileMenu} className="flex items-center justify-between p-4 rounded-2xl bg-[#f5f5f7]/50 hover:bg-[#f5f5f7] active:bg-[#e5e5ea] transition-all text-[17px] font-semibold text-[#1d1d1f]">
                  原创周边
                  <ChevronDown className="w-5 h-5 -rotate-90 text-[#86868b]" />
                </Link>
                <Link to="/resources" onClick={toggleMobileMenu} className="flex items-center justify-between p-4 rounded-2xl bg-[#f5f5f7]/50 hover:bg-[#f5f5f7] active:bg-[#e5e5ea] transition-all text-[17px] font-semibold text-[#1d1d1f]">
                  课件资源
                  <ChevronDown className="w-5 h-5 -rotate-90 text-[#86868b]" />
                </Link>
                <Link to="/advice" onClick={toggleMobileMenu} className="flex items-center justify-between p-4 rounded-2xl bg-[#f5f5f7]/50 hover:bg-[#f5f5f7] active:bg-[#e5e5ea] transition-all text-[17px] font-semibold text-[#1d1d1f]">
                  创作工具
                  <ChevronDown className="w-5 h-5 -rotate-90 text-[#86868b]" />
                </Link>
                <Link to="/team" onClick={toggleMobileMenu} className="flex items-center justify-between p-4 rounded-2xl bg-[#f5f5f7]/50 hover:bg-[#f5f5f7] active:bg-[#e5e5ea] transition-all text-[17px] font-semibold text-[#1d1d1f]">
                  关于我们
                  <ChevronDown className="w-5 h-5 -rotate-90 text-[#86868b]" />
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={toggleMobileMenu} className="flex items-center justify-between p-4 rounded-2xl bg-[#f5f5f7]/50 hover:bg-[#f5f5f7] active:bg-[#e5e5ea] transition-all text-[17px] font-semibold text-[#0071e3]">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5" />
                      后台管理
                    </div>
                    <ChevronDown className="w-5 h-5 -rotate-90 text-[#0071e3]" />
                  </Link>
                )}
              </div>

              {/* User Auth Section for Mobile */}
              <div className="border-t border-[#d2d2d7] pt-6 mt-4">
                {user ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 p-4 bg-[#f5f5f7] rounded-2xl">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-[#d2d2d7] shadow-sm">
                        <User className="w-6 h-6 text-[#86868b]" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-lg font-semibold text-[#1d1d1f] truncate">{user.fullName || "工坊成员"}</span>
                        <span className="text-sm text-[#86868b] truncate">{user.email}</span>
                      </div>
                    </div>
                    <div className="bg-[#f5f5f7] rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#86868b] uppercase font-bold tracking-wider mb-1">当前等级</span>
                        <span className="text-base font-bold text-[#1d1d1f]">{levelNames[user.level]}</span>
                      </div>
                      <MemberBadge level={user.level} size="md" />
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-2">
                      <Link to="/profile" onClick={toggleMobileMenu} className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#f5f5f7] active:bg-[#e5e5ea] transition-colors text-[16px] font-medium text-[#1d1d1f]">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-[#86868b]" />
                          个人中心
                        </div>
                        <ChevronDown className="w-5 h-5 -rotate-90 text-[#86868b]" />
                      </Link>
                      <Link to="/settings" onClick={toggleMobileMenu} className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#f5f5f7] active:bg-[#e5e5ea] transition-colors text-[16px] font-medium text-[#1d1d1f]">
                        <div className="flex items-center gap-3">
                          <Settings className="w-5 h-5 text-[#86868b]" />
                          账号设置
                        </div>
                        <ChevronDown className="w-5 h-5 -rotate-90 text-[#86868b]" />
                      </Link>
                      <button 
                        onClick={() => { handleLogout(); toggleMobileMenu(); }}
                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 active:bg-red-100 transition-colors text-[16px] font-medium text-red-600"
                      >
                        <div className="flex items-center gap-3">
                          <LogOut className="w-5 h-5" />
                          退出登录
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link to="/login" onClick={toggleMobileMenu} className="btn-primary w-full text-lg flex items-center justify-center gap-2 py-4 rounded-2xl">
                      <LogIn className="w-5 h-5" />
                      立即登录
                    </Link>
                    <Link to="/register" onClick={toggleMobileMenu} className="btn-secondary w-full text-lg flex items-center justify-center gap-2 py-4 rounded-2xl">
                      <User className="w-5 h-5" />
                      注册账号
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </nav>
    </div>
  );
}
