import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import Team from "@/pages/Team";
import Contact from "@/pages/Contact";
import Resources from "@/pages/Resources";
import Advice from "@/pages/Advice";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminDashboard from "@/pages/Admin/Dashboard";
import ResourceManager from "@/pages/Admin/ResourceManager";
import UserManager from "@/pages/Admin/UserManager";
import PrinterManager from "@/pages/Admin/PrinterManager";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/useUserStore";

export default function App() {
  const { setUser, setAdmin } = useUserStore();

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
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/advice" element={<Advice />} />
            <Route path="/team" element={<Team />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/resources" element={<ResourceManager />} />
            <Route path="/admin/users" element={<UserManager />} />
            <Route path="/admin/printers" element={<PrinterManager />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
