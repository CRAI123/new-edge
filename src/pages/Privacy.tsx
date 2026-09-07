import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft, Cookie, User, Database, Lock, Mail, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacy() {
  const sections = [
    {
      icon: <User className="w-5 h-5" />,
      title: "一、我们收集的信息",
      content: (
        <div className="space-y-3">
          <p>
            睿造打印工坊（以下简称"我们"）非常重视您的个人信息与隐私保护。本隐私政策将向您说明我们如何收集、使用、存储和保护您的个人信息。
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#86868b]">
            <li>
              <b className="text-[#1d1d1f]">账号信息：</b>您注册或登录时提供的姓名、邮箱、用户角色（教师 / 学生 / 个人 / 管理员）、所在学校或机构。
            </li>
            <li>
              <b className="text-[#1d1d1f]">登录验证信息：</b>Supabase Auth 用于登录验证的密码哈希、邮箱验证码发送记录、GitHub OAuth 登录凭据。
            </li>
            <li>
              <b className="text-[#1d1d1f]">行为数据：</b>页面浏览次数、资源下载次数、登录次数等统计信息，与账号绑定用于等级成长系统。
            </li>
            <li>
              <b className="text-[#1d1d1f]">Cookie 与日志：</b>维持会话所需的 Cookie、设备类型、浏览器 User-Agent、访问时间等匿名日志。
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: "二、信息的使用方式",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-[#86868b]">
          <li>提供核心服务：账号登录、课件资源下载、创作工具使用、IP周边展示与咨询、社群交流等。</li>
          <li>身份与权限：根据用户角色与 LV 等级（LV1 龙蛋 ~ LV4 古龙）控制资源访问。</li>
          <li>账户安全：检测异常登录、防止滥用、验证管理员身份（邮箱 2623681461@qq.com）。</li>
          <li>产品改进：分析页面访问情况，优化内容结构与用户体验（可在 Cookie 设置中关闭分析类）。</li>
          <li>消息通知：重要政策变更、系统维护通知通过注册邮箱发送（非营销）。</li>
          <li>AI 辅助服务：资源归档、内容分类、文案润色等通过 DeepSeek API 处理，AI 生成内容默认进入草稿状态，需管理员人工审核后发布。</li>
        </ul>
      ),
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "三、数据存储与安全",
      content: (
        <div className="space-y-3">
          <p>
            我们采用行业标准的安全措施保护您的数据：
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#86868b]">
            <li>
              <b className="text-[#1d1d1f]">数据存储：</b>所有业务数据（用户资料 profiles、资源 resources、内容管理等）存储于 Supabase 云端，数据库使用行级安全策略（RLS）。
            </li>
            <li>
              <b className="text-[#1d1d1f]">密码安全：</b>密码使用 Supabase Auth 内置的 bcrypt 算法单向哈希，我们无法查看您的明文密码。
            </li>
            <li>
              <b className="text-[#1d1d1f]">通信加密：</b>全站启用 HTTPS / TLS 1.3，API 请求均经过认证。
            </li>
            <li>
              <b className="text-[#1d1d1f]">文件安全：</b>用户上传的课程资源存储于 Supabase Storage 私有 bucket（course-materials），通过签名 URL 访问。
            </li>
            <li>
              <b className="text-[#1d1d1f]">邮件发送：</b>8 位数字验证码通过 Resend SMTP 服务投递，仅用于身份验证，不用于其他营销目的。
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: <Cookie className="w-5 h-5" />,
      title: "四、Cookie 政策",
      content: (
        <div className="space-y-3">
          <p>我们根据您的同意偏好，将 Cookie 分为以下三类：</p>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#0071e3]/5 border border-[#0071e3]/10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#0071e3] text-white text-[10px] font-bold uppercase tracking-wider">
                  始终启用
                </span>
                <h5 className="font-bold text-[#1d1d1f]">必要 Cookie</h5>
              </div>
              <p className="text-sm text-[#86868b]">
                Supabase Auth 会话、XSRF 防护令牌、您的登录状态与偏好。关闭将导致网站无法正常使用。
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#f5f5f7]">
              <h5 className="font-bold text-[#1d1d1f] mb-1.5">分析 Cookie</h5>
              <p className="text-sm text-[#86868b]">
                用于统计哪些页面受欢迎、停留时长等匿名数据，帮助我们优化内容。不关联个人真实身份。
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#f5f5f7]">
              <h5 className="font-bold text-[#1d1d1f] mb-1.5">营销 Cookie</h5>
              <p className="text-sm text-[#86868b]">
                用于后续活动个性化推荐（如启用），可随时在底部 Cookie 栏修改偏好。
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "五、信息共享与第三方",
      content: (
        <div className="space-y-3">
          <p className="text-[#86868b]">
            我们<strong>不出售、不交易、不对外出租</strong>您的个人信息。仅在以下场景与受约束的第三方共享：
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#86868b]">
            <li><b className="text-[#1d1d1f]">Supabase Inc：</b>数据库、Auth、存储服务，受其隐私政策约束（总部美国，GDPR 合规）。</li>
            <li><b className="text-[#1d1d1f]">GitHub Inc：</b>OAuth 登录时根据您授权返回基础 Profile（邮箱、昵称、头像）。</li>
            <li><b className="text-[#1d1d1f]">Resend Inc：</b>邮件验证码投递服务，仅接收邮件地址与一次性验证码内容。</li>
            <li><b className="text-[#1d1d1f]">DeepSeek：</b>AI 辅助内容整理（归档、分类、文案润色）时使用，发送的仅为处理指令与待整理内容本身，不包含任何用户个人敏感信息。</li>
            <li><b className="text-[#1d1d1f]">法律法规要求：</b>当司法机关依法要求时，我们会在最小范围内提供必要信息。</li>
          </ul>
        </div>
      ),
    },
    {
      icon: <RefreshCcw className="w-5 h-5" />,
      title: "六、您的权利与数据处置",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-[#86868b]">
          <li><b className="text-[#1d1d1f]">访问权：</b>登录后可在个人中心查看您的全部资料与使用统计。</li>
          <li><b className="text-[#1d1d1f]">更正权：</b>可随时修改姓名、学校、角色等个人资料。</li>
          <li><b className="text-[#1d1d1f]">删除权：</b>可书面申请删除账号及所有个人数据，我们将在 30 天内处理完毕（法律要求保留的除外）。</li>
          <li><b className="text-[#1d1d1f]">撤回同意：</b>随时通过底部 Cookie 栏修改 Cookie 偏好，或邮件联系撤回其他同意。</li>
          <li><b className="text-[#1d1d1f]">注销账号：</b>发送邮件到 2623681461@qq.com，标题注明「账号注销申请」。</li>
        </ul>
      ),
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: "七、联系我们",
      content: (
        <div className="space-y-2 text-[#86868b]">
          <p>运营主体：睿造打印工坊（Rayzo Print Studio · 学生创客团队）</p>
          <p>所在地：湖南 · 长沙</p>
          <p>管理员 / 数据保护联系人邮箱：<span className="text-[#0071e3] font-semibold">2623681461@qq.com</span></p>
          <p>沟通方式：邮件为主要渠道，工作日 1~3 日内回复</p>
          <p>我们将在收到您请求后的 <b className="text-[#1d1d1f]">15 个工作日内</b>予以答复。</p>
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
          <div className="bg-gradient-to-br from-[#0071e3] via-[#0071e3] to-[#28cd41] px-10 md:px-16 py-14 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white blur-3xl" />
              <div className="absolute -left-10 bottom-0 w-64 h-64 rounded-full bg-white blur-3xl" />
            </div>
            <div className="relative flex items-start gap-5">
              <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.28em] font-bold text-white/80 mb-2">
                  Legal · Privacy Policy
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
                  隐私政策
                </h1>
                <p className="text-white/85 text-sm md:text-base leading-relaxed max-w-2xl">
                  我们深知数据对您的重要性，本政策将以透明、易懂的方式说明睿造打印工坊如何采集、使用并保护您的个人信息。
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold">
                    生效日期：2026 年 9 月 6 日
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold">
                    最近更新：2026 年 9 月 6 日
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
                  <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
                    {sec.icon}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#1d1d1f]">{sec.title}</h2>
                </div>
                <div className="text-[15px] leading-relaxed text-[#86868b]">
                  {sec.content}
                </div>
              </motion.section>
            ))}
          </div>

          {/* 底部 CTA */}
          <div className="mx-8 md:mx-16 mb-12 md:mb-16 rounded-[2rem] bg-gradient-to-r from-[#E6F4FF] to-[#F6FFED] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-grow">
              <h3 className="text-lg md:text-xl font-bold text-[#1d1d1f] mb-1.5">仍有疑问？</h3>
              <p className="text-sm text-[#86868b]">
                欢迎通过管理员邮箱 2623681461@qq.com 与我们直接沟通。
              </p>
            </div>
            <Link to="/contact" className="btn-primary px-8 py-3 whitespace-nowrap shrink-0 shadow-lg shadow-blue-500/20">
              联系管理员
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
