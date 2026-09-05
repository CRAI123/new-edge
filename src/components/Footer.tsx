import { Printer, Github, Twitter, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#f5f5f7] py-20 px-6 md:px-12 lg:px-24 text-[#86868b] text-sm">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-[#d2d2d7] pb-16 mb-8">
        <div className="flex flex-col gap-6">
          <Link to="/" className="flex items-center gap-3 text-[#1d1d1f] group">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shadow-sm">
              <img src="/logo.png" alt="睿造打印工坊" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight leading-none">睿造打印工坊</span>
              <span className="text-xs text-[#86868b] font-medium mt-1">Rayzo print studio</span>
            </div>
          </Link>
          <p className="leading-relaxed">
            连接创意与未来教育。我们不仅提供专业的 3D 打印选购建议，更致力于为每一位科创教育者提供最优质的课件资源与实验室建设支持。
          </p>
        </div>
        
        <div>
          <h4 className="text-[#1d1d1f] font-semibold mb-6">核心业务</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/products" className="hover:text-[#0071e3] transition-colors">实验室集成方案</Link></li>
            <li><Link to="/resources" className="hover:text-[#0071e3] transition-colors">信息科技课件</Link></li>
            <li><Link to="/advice" className="hover:text-[#0071e3] transition-colors">硬件横向评测</Link></li>
            <li><a href="#" className="hover:text-[#0071e3] transition-colors">科创空间规划</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#1d1d1f] font-semibold mb-6">教育资源</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/resources" className="hover:text-[#0071e3] transition-colors">小学资源包</Link></li>
            <li><Link to="/resources" className="hover:text-[#0071e3] transition-colors">初中课件集</Link></li>
            <li><Link to="/resources" className="hover:text-[#0071e3] transition-colors">高中创新项目</Link></li>
            <li><a href="#" className="hover:text-[#0071e3] transition-colors">教师培训计划</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#1d1d1f] font-semibold mb-6">联系与支持</h4>
          <ul className="flex flex-col gap-3 text-[#1d1d1f]">
            <li>热线：400-123-4567</li>
            <li>邮箱：support@rzprint.com</li>
            <li className="text-[#86868b]">地址：湖南省长沙市高新区科技园</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center text-[#86868b]">
          <p>© 2026 Rayzo print studio. 保留所有权利。</p>
          <div className="flex gap-6">
            <a href="#" className="hover:underline">隐私政策</a>
            <a href="#" className="hover:underline">使用条款</a>
            <a href="#" className="hover:underline">销售政策</a>
          </div>
        </div>
        <div className="flex gap-4">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#d2d2d7] hover:bg-[#0071e3] transition-colors cursor-pointer flex items-center justify-center text-white">
            <Github className="w-4 h-4" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#d2d2d7] hover:bg-[#0071e3] transition-colors cursor-pointer flex items-center justify-center text-white">
            <Twitter className="w-4 h-4" />
          </a>
          <Link to="/contact" className="w-8 h-8 rounded-full bg-[#d2d2d7] hover:bg-[#0071e3] transition-colors cursor-pointer flex items-center justify-center text-white">
            <MessageCircle className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
