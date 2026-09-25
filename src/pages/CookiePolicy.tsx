import { motion } from "framer-motion";
import { ArrowLeft, Cookie, Info, Settings, ShieldCheck, Activity, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function CookiePolicy() {
  const sections = [
    {
      icon: <Info className="w-5 h-5" />,
      title: "一、什么是 Cookie？",
      content: (
        <div className="space-y-3 text-[#86868b]">
          <p>
            Cookie 是您访问网站时，存储在您计算机或移动设备上的小型文本文件。它们被广泛用于让网站正常运行，或使其运行得更高效，同时向网站的所有者提供重要的运行数据。
          </p>
          <p>
            在法律层面，“Cookie”、“LocalStorage”、“SessionStorage”以及“设备指纹”等所有存储在用户设备上的追踪技术，均统称为“Cookie 及同类技术”。本政策适用于我们使用的所有这些技术。
          </p>
        </div>
      ),
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: "二、我们如何使用 Cookie？",
      content: (
        <div className="space-y-3 text-[#86868b]">
          <p>
            继续浏览本网站即表示您同意我们使用 Cookies。我们主要将 Cookie 用于以下核心目的：
          </p>
          <ul className="list-disc pl-5 space-y-2.5">
            <li>
              <b className="text-[#1d1d1f]">保持登录状态：</b>利用 LocalStorage 安全地保存您的身份凭证（Token），让您在访问课件资源等受保护内容时，享受无缝体验，无需重复验证。
            </li>
            <li>
              <b className="text-[#1d1d1f]">了解使用情况：</b>帮助我们分析流量来源和页面热度，以便我们持续改进平台架构与内容。
            </li>
            <li>
              <b className="text-[#1d1d1f]">个性化体验：</b>记住您的偏好设置，如是否已阅读首页的 Cookie 同意横幅，避免重复打扰。
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "三、我们使用的 Cookie 类型",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7]/50">
            <h5 className="font-bold text-[#1d1d1f] mb-1.5 flex items-center gap-2">
              绝对必要的 Cookie
              <span className="px-2 py-0.5 rounded-full bg-[#1d1d1f] text-white text-[10px] uppercase tracking-wider">
                必需
              </span>
            </h5>
            <p className="text-sm text-[#86868b] leading-relaxed">
              这些 Cookie（包括 LocalStorage）是网站正常运行所必需的（例如维持您的账户登录状态），无法在我们的系统中关闭。如果您强行在浏览器中禁用它们，将导致网站核心功能不可用。
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7]/50">
            <h5 className="font-bold text-[#1d1d1f] mb-1.5">性能与分析 Cookie</h5>
            <p className="text-sm text-[#86868b] leading-relaxed">
              允许我们计算访问量和流量来源，以便衡量和改进我们网站的性能，查看访问者在网站上的活动。这些数据均以匿名聚合形式收集。
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7]/50">
            <h5 className="font-bold text-[#1d1d1f] mb-1.5">功能性 Cookie</h5>
            <p className="text-sm text-[#86868b] leading-relaxed">
              使网站能够提供增强的功能和个性化内容，可能由我们或我们信任的第三方提供商设置。
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: <Activity className="w-5 h-5" />,
      title: "四、如何管理您的 Cookie？",
      content: (
        <div className="space-y-4 text-[#86868b]">
          <p>
            大多数现代 Web 浏览器允许您通过浏览器设置来控制大部分 Cookie。要了解有关 Cookie 的更多信息，包括如何查看已设置的 Cookie 以及如何管理和删除它们，请访问浏览器的帮助中心。
          </p>
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 text-orange-800 text-sm flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p>请注意，如果您选择在浏览器中彻底清除 LocalStorage 或禁用 Cookie，您将被登出当前账户，且部分交互功能（如记住您的阅读偏好）将被重置。</p>
          </div>
        </div>
      ),
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: "五、联系我们",
      content: (
        <div className="space-y-2 text-[#86868b]">
          <p>如果您对我们使用 Cookie 的方式有任何疑问，欢迎随时与我们取得联系。</p>
          <p>管理员邮箱：<span className="text-[#0071e3] font-semibold">2623681461@qq.com</span></p>
          <p>通讯地址：湖南 · 长沙</p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-20 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#0071e3] transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          返回首页
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[3rem] bg-white shadow-sm border border-white overflow-hidden shimmer-border group"
        >
          {/* 页头 */}
          <div className="bg-gradient-to-br from-[#f5922f] via-[#f5512f] to-[#e63946] px-10 md:px-16 py-14 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white blur-3xl" />
              <div className="absolute -left-10 bottom-0 w-64 h-64 rounded-full bg-[#ffb703] blur-3xl" />
            </div>
            <div className="relative flex items-start gap-5">
              <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
                <Cookie className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.28em] font-bold text-white/80 mb-2">
                  Legal · Cookie Policy
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
                  Cookie 政策
                </h1>
                <p className="text-white/85 text-sm md:text-base leading-relaxed max-w-2xl">
                  我们在睿造打印工坊使用 Cookies 及同类技术，以提升您的浏览体验、分析网站流量，并为您提供更安全的服务。
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold">
                    生效日期：2026 年 9 月 6 日
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold">
                    版本 v1.0
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 正文 */}
          <div className="px-8 md:px-16 py-12 md:py-16 space-y-14">
            {sections.map((sec, idx) => (
              <motion.section
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: idx * 0.04 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-[#f5f5f7]">
                  <div className="w-10 h-10 rounded-2xl bg-[#f5922f]/10 text-[#f5512f] flex items-center justify-center shrink-0">
                    {sec.icon}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#1d1d1f]">{sec.title}</h2>
                </div>
                <div className="text-[15px] leading-relaxed">
                  {sec.content}
                </div>
              </motion.section>
            ))}
          </div>

          {/* 底部 CTA */}
          <div className="mx-8 md:mx-16 mb-12 md:mb-16 rounded-[2rem] bg-gradient-to-r from-[#fff3e0] to-[#ffefe5] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-grow">
              <h3 className="text-lg md:text-xl font-bold text-[#1d1d1f] mb-1.5">仍有疑问？</h3>
              <p className="text-sm text-[#86868b]">
                如果您对 Cookie 的使用方式有任何顾虑，请随时与我们沟通。
              </p>
            </div>
            <Link to="/contact" className="btn-primary px-8 py-3 whitespace-nowrap shrink-0 shadow-lg shadow-orange-500/20 bg-[#f5512f] hover:bg-[#e63946] border-none">
              联系我们
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
