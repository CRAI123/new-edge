import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LineAnimationBackground from "@/components/LineAnimationBackground";
import CookieConsent from "@/components/CookieConsent";
import ToastViewport from "@/components/ToastViewport";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import Team from "@/pages/Team";
import Contact from "@/pages/Contact";
import Resources from "@/pages/Resources";
import Advice from "@/pages/Advice";
import Printers from "@/pages/Printers";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Sales from "@/pages/Sales";
import OrderGenerator from "@/pages/OrderGenerator";
import AdminDashboard from "@/pages/Admin/Dashboard";
import ResourceManager from "@/pages/Admin/ResourceManager";
import UserManager from "@/pages/Admin/UserManager";
import PrinterManager from "@/pages/Admin/PrinterManager";
import AdminOrderManager from "@/pages/Admin/OrderManager";
import LogisticsTracker from "@/pages/LogisticsTracker";
import OrderTrack from "@/pages/OrderTrack";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/useUserStore";

export default function App() {
  const { setUser, setAdmin } = useUserStore();

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
        downloadCount: profile?.download_count || 0
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
      <div className="flex flex-col min-h-screen relative overflow-hidden">
        <LineAnimationBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/advice" element={<Advice />} />
              <Route path="/printers" element={<Printers />} />
              <Route path="/team" element={<Team />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/order-generator" element={<OrderGenerator />} />
              <Route path="/logistics" element={<LogisticsTracker />} />
              <Route path="/order/:orderNo" element={<OrderTrack />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/resources" element={<ResourceManager />} />
              <Route path="/admin/users" element={<UserManager />} />
              <Route path="/admin/printers" element={<PrinterManager />} />
              <Route path="/admin/orders" element={<AdminOrderManager />} />
            </Routes>
          </main>
          <Footer />
          <CookieConsent />
          <ToastViewport />
        </div>
      </div>
    </Router>
  );
}
