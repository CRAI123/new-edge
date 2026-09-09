import { Sparkles, Github, MessageCircle, Mail, ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  
  return (
    <footer className="bg-[#f5f5f7] py-20 px-6 md:px-12 lg:px-24 text-[#86868b] text-sm relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[380px] h-[380px] rounded-full bg-[#0071e3]/6 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#28cd41]/8 blur-[120px] pointer-events-none"></div>
      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-[#d2d2d7] pb-16 mb-8">
        <div className="flex flex-col gap-6">
          <Link to="/" className="flex items-center gap-3 text-[#1d1d1f] group">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_8px_20px_-4px_rgba(0,113,227,0.35)] shimmer-border avatar-ring">
              <img src="/logo.png" alt="睿造打印工坊" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight leading-none transition-colors group-hover:text-[#0071e3]">睿造打印工坊</span>
              <span className="text-xs text-[#86868b] font-medium mt-1">Rayzo print studio</span>
            </div>
          </Link>
          <p className="leading-relaxed">
            连接创意与未来教育。我们致力于为每一位科创教育者提供最优质的课件资源、原创IP周边与创作工具箱支持。
          </p>
          <div className="flex gap-3 pt-1">
            <span className="px-3 py-1 rounded-full bg-white border border-[#d2d2d7] text-xs text-[#1d1d1f] chip">创客教育</span>
            <span className="px-3 py-1 rounded-full bg-white border border-[#d2d2d7] text-xs text-[#1d1d1f] chip">STEM 创新</span>
          </div>
        </div>
        
        <div>
          <h4 className="text-[#1d1d1f] font-semibold mb-6">核心业务</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/printers" className="hover:text-[#0071e3] transition-colors nav-link-scan inline-block">设备方案参考</Link></li>
            <li><Link to="/products" className="hover:text-[#0071e3] transition-colors nav-link-scan inline-block">原创IP周边</Link></li>
            <li><Link to="/resources" className="hover:text-[#0071e3] transition-colors nav-link-scan inline-block">信息科技课件</Link></li>
            <li><Link to="/advice" className="hover:text-[#0071e3] transition-colors nav-link-scan inline-block">创作工具箱</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#1d1d1f] font-semibold mb-6">教育资源</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/resources" className="hover:text-[#0071e3] transition-colors nav-link-scan inline-block">小学资源包</Link></li>
            <li><Link to="/resources" className="hover:text-[#0071e3] transition-colors nav-link-scan inline-block">初中课件集</Link></li>
            <li><Link to="/resources" className="hover:text-[#0071e3] transition-colors nav-link-scan inline-block">高中创新项目</Link></li>
            <li><Link to="/advice" className="hover:text-[#0071e3] transition-colors nav-link-scan inline-block">创作小工具</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#1d1d1f] font-semibold mb-6">联系与支持</h4>
          <ul className="flex flex-col gap-3">
            <li className="text-[#1d1d1f]">邮箱：<a href="mailto:2623681461@qq.com" className="hover:text-[#0071e3] transition-colors">2623681461@qq.com</a></li>
            <li className="text-[#86868b]">所在地：湖南 · 长沙 · 学生创客团队</li>
            <li className="pt-1"><Link to="/contact" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#d2d2d7] hover:bg-[#0071e3] hover:text-white hover:border-[#0071e3] text-[#1d1d1f] text-xs font-semibold transition-all btn-shine">
              邮件联系
            </Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center text-[#86868b]">
          <p>© 2026 Rayzo print studio. 保留所有权利。</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:underline hover:text-[#0071e3] transition-colors nav-link-scan inline-block">隐私政策</Link>
            <Link to="/terms" className="hover:underline hover:text-[#0071e3] transition-colors nav-link-scan inline-block">使用条款</Link>
            <Link to="/sales" className="hover:underline hover:text-[#0071e3] transition-colors nav-link-scan inline-block">免责声明</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4">
            <a href="mailto:2623681461@qq.com" title="发送邮件" className="w-9 h-9 rounded-full bg-[#d2d2d7] hover:bg-[#28cd41] transition-all duration-300 cursor-pointer flex items-center justify-center text-white hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-4px_rgba(40,205,65,0.45)] group relative avatar-ring">
              <Mail className="w-4 h-4" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" title="GitHub" className="w-9 h-9 rounded-full bg-[#d2d2d7] hover:bg-[#1d1d1f] transition-all duration-300 cursor-pointer flex items-center justify-center text-white hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-4px_rgba(0,0,0,0.4)] group relative avatar-ring">
              <Github className="w-4 h-4" />
            </a>
            <Link to="/contact" title="联系我们" className="w-9 h-9 rounded-full bg-[#d2d2d7] hover:bg-[#0071e3] transition-all duration-300 cursor-pointer flex items-center justify-center text-white hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-4px_rgba(0,113,227,0.5)] group relative avatar-ring">
              <MessageCircle className="w-4 h-4" />
            </Link>
          </div>
          <button
            onClick={scrollToTop}
            title="返回顶部"
            className="w-11 h-11 rounded-full bg-white border border-[#d2d2d7] hover:bg-[#0071e3] hover:text-white hover:border-[#0071e3] transition-all duration-300 flex items-center justify-center text-[#1d1d1f] shadow-sm hover:-translate-y-1 hover:shadow-[0_10px_24px_-8px_rgba(0,113,227,0.5)]"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
