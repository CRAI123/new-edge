import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LineAnimationBackground from "@/components/LineAnimationBackground";
import CookieBanner from "@/components/CookieBanner";
import ToastViewport from "@/components/ToastViewport";
import ForcePasswordChangeModal from "@/components/ForcePasswordChangeModal";
import Home from "@/pages/Home";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/useUserStore";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";

// 路由级代码分割：非首页 / 管理后台页面全部延迟加载
const Products = lazy(() => import("@/pages/Products"));
const Team = lazy(() => import("@/pages/Team"));
const Contact = lazy(() => import("@/pages/Contact"));
const Resources = lazy(() => import("@/pages/Resources"));
const Advice = lazy(() => import("@/pages/Advice"));
const Printers = lazy(() => import("@/pages/Printers"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Sales = lazy(() => import("@/pages/Sales"));
const CookiePolicy = lazy(() => import("@/pages/CookiePolicy"));
const OrderGenerator = lazy(() => import("@/pages/OrderGenerator"));
const AdminDashboard = lazy(() => import("@/pages/Admin/Dashboard"));
const ResourceManager = lazy(() => import("@/pages/Admin/ResourceManager"));
const UserManager = lazy(() => import("@/pages/Admin/UserManager"));
const PrinterManager = lazy(() => import("@/pages/Admin/PrinterManager"));
const AdminOrderManager = lazy(() => import("@/pages/Admin/OrderManager"));
const LogisticsTracker = lazy(() => import("@/pages/LogisticsTracker"));
const OrderTrack = lazy(() => import("@/pages/OrderTrack"));
const Profile = lazy(() => import("@/pages/Profile"));
const Settings = lazy(() => import("@/pages/Settings"));

// 懒加载占位 UI — 保持与现有视觉一致
function PageSkeleton() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#fafafc]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-3 border-[#0071e3]/20 border-t-[#0071e3] animate-spin"></div>
        <div className="text-sm md:text-base text-[#86868b]">加载中…</div>
      </div>
    </div>
  );
}

const pageTransition = {
  initial: { opacity: 0, y: 15, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -15, filter: "blur(4px)" },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
};

function AnimatedRoutes() {
  const location = useLocation();
  
  // 滚动到顶部，带有平滑动画
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<motion.div {...pageTransition}><Home /></motion.div>} />
        <Route path="/products" element={<motion.div {...pageTransition}><Products /></motion.div>} />
        <Route path="/resources" element={<motion.div {...pageTransition}><Resources /></motion.div>} />
        <Route path="/advice" element={<motion.div {...pageTransition}><Advice /></motion.div>} />
        <Route path="/printers" element={<motion.div {...pageTransition}><Printers /></motion.div>} />
        <Route path="/team" element={<motion.div {...pageTransition}><Team /></motion.div>} />
        <Route path="/contact" element={<motion.div {...pageTransition}><Contact /></motion.div>} />
        <Route path="/login" element={<motion.div {...pageTransition}><Login /></motion.div>} />
        <Route path="/register" element={<motion.div {...pageTransition}><Register /></motion.div>} />
        <Route path="/privacy" element={<motion.div {...pageTransition}><Privacy /></motion.div>} />
        <Route path="/terms" element={<motion.div {...pageTransition}><Terms /></motion.div>} />
        <Route path="/cookie-policy" element={<motion.div {...pageTransition}><CookiePolicy /></motion.div>} />
        <Route path="/sales" element={<motion.div {...pageTransition}><Sales /></motion.div>} />
        <Route path="/order-generator" element={<motion.div {...pageTransition}><OrderGenerator /></motion.div>} />
        <Route path="/logistics" element={<motion.div {...pageTransition}><LogisticsTracker /></motion.div>} />
        <Route path="/order/:orderNo" element={<motion.div {...pageTransition}><OrderTrack /></motion.div>} />
        <Route path="/profile" element={<motion.div {...pageTransition}><Profile /></motion.div>} />
        <Route path="/settings" element={<motion.div {...pageTransition}><Settings /></motion.div>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<motion.div {...pageTransition}><AdminDashboard /></motion.div>} />
        <Route path="/admin/resources" element={<motion.div {...pageTransition}><ResourceManager /></motion.div>} />
        <Route path="/admin/users" element={<motion.div {...pageTransition}><UserManager /></motion.div>} />
        <Route path="/admin/printers" element={<motion.div {...pageTransition}><PrinterManager /></motion.div>} />
        <Route path="/admin/orders" element={<motion.div {...pageTransition}><AdminOrderManager /></motion.div>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const { user, setUser, setAdmin } = useUserStore();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleRippleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const rippleTarget = target.closest(".ripple-target") as HTMLElement | null;
      if (!rippleTarget) return;

      const rect = rippleTarget.getBoundingClientRect();
      const dot = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      dot.style.width = dot.style.height = size + "px";
      dot.style.left = x + "px";
      dot.style.top = y + "px";
      dot.className = "ripple-dot";

      rippleTarget.appendChild(dot);
      setTimeout(() => dot.remove(), 700);
    };

    document.addEventListener("click", handleRippleClick);
    return () => document.removeEventListener("click", handleRippleClick);
  }, []);

  useEffect(() => {
    let cursorEl: HTMLDivElement | null = null;
    let animFrame: number | null = null;
    let targetX = -9999;
    let targetY = -9999;
    let currentX = targetX;
    let currentY = targetY;

    const init = () => {
      cursorEl = document.createElement("div");
      cursorEl.className = "cursor-follower";
      document.body.appendChild(cursorEl);
    };

    const animate = () => {
      if (!cursorEl) return;
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      cursorEl.style.transform = `translate(${currentX}px, ${currentY}px)`;
      animFrame = requestAnimationFrame(animate);
    };

    const handleMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!cursorEl) init();
      if (!animFrame) animate();
    };

    const handleLeave = () => {
      if (cursorEl) cursorEl.style.opacity = "0";
    };

    const handleEnter = () => {
      if (cursorEl) cursorEl.style.opacity = "1";
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
      if (animFrame) cancelAnimationFrame(animFrame);
      if (cursorEl) cursorEl.remove();
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.warn("Profile fetch warning (might be network/RLS):", error.message);
          return null;
        }
        return profile;
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
        return null;
      }
    };

    const syncUser = async (session: any) => {
      if (!session?.user) {
        setUser(null);
        setAdmin(false);
        return;
      }

      const profile = await fetchProfile(session.user.id);
      const metadata = session.user.user_metadata;
      
      // 优先级：数据库 role > 强制管理员邮箱判断 > 元数据 role > 默认 individual
      let role = profile?.role || metadata.role || 'individual';
      
      if (session.user.email === '2623681461@qq.com') {
        role = 'admin';
      }
      
      setUser({
        id: session.user.id,
        email: session.user.email || "",
        fullName: profile?.full_name || metadata.full_name || metadata.name || "管理员",
        role: role as any,
        level: profile?.level || 1,
        loginCount: profile?.login_count || 1,
        browseCount: profile?.browse_count || 0,
        downloadCount: profile?.download_count || 0,
        require_password_change: profile?.require_password_change || false
      });
      
      if (role === 'admin') setAdmin(true);
    };

    // 1. 初始化时检查当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser(session);
    });

    // 2. 监听 Auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setAdmin]);

  return (
    <Router>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0071e3] to-[#28cd41] origin-left z-[99999] pointer-events-none"
        style={{ scaleX }}
      />
      <div className="flex flex-col min-h-screen relative overflow-hidden">
        <LineAnimationBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 w-full relative">
            <Suspense fallback={<PageSkeleton />}>
              <AnimatedRoutes />
            </Suspense>
          </main>
          <Footer />
          <CookieBanner />
          <ToastViewport />
          
          {/* Force Password Change Modal is mounted at the app root level */}
          {user?.require_password_change && <ForcePasswordChangeModal />}
        </div>
      </div>
    </Router>
  );
}
