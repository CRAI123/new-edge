import { motion } from "framer-motion";
import { ArrowLeft, Scale, FileCheck, Upload, Download, UserCog, AlertTriangle, Gavel, BookOpen, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function Terms() {
  const sections = [
    {
      icon: <FileCheck className="w-5 h-5" />,
      title: "一、服务协议的接受",
      content: (
        <div className="space-y-3 text-[#86868b]">
          <p>
            欢迎使用睿造打印工坊（Rayzo Print Studio，以下简称"本网站"或"我们"）。本使用条款（以下简称"条款"）是您与睿造打印工坊之间关于使用本网站服务所订立的协议。
          </p>
          <p>
            <b className="text-[#1d1d1f]">
              一旦您注册账号、使用邮箱验证码登录、或实际使用本站任何服务，即视为您已完整阅读、理解并同意接受本条款所有内容。</b>
            如您不同意本条款的任何约定，请您立即停止使用本网站。
          </p>
          <p>
            本条款适用于所有访问者、注册用户、付费会员、管理员（以下统称"用户"或您"）。我们有权根据法律法规变化及业务调整修改本条款，新版本将于公布时在站内公告通知，继续使用视为接受。
          </p>
        </div>
      ),
    },
    {
      icon: <UserCog className="w-5 h-5" />,
      title: "二、账号注册与使用规则",
      content: (
        <ul className="list-disc pl-5 space-y-2.5 text-[#86868b]">
          <li>
            <b className="text-[#1d1d1f]">身份真实性：</b>注册时需提供真实、准确、完整的姓名、邮箱，并根据实际身份选择"个人用户 / 教育工作者 / 在校学生"角色；如需修改可在账号设置更新。
          </li>
          <li>
            <b className="text-[#1d1d1f]">账号安全：</b>您有责任妥善保管邮箱、密码及 8 位 OTP 验证码。因您本人原因导致账号被盗用，损失由您自行承担；发现异常请第一时间联系 2623681461@qq.com 冻结账号。
          </li>
          <li>
            <b className="text-[#1d1d1f]">角色划分：</b>本网站将用户分为四级会员等级（LV1 龙蛋 / LV2 幼龙 / LV3 鳞铸 / LV4 古龙），不同等级可下载的课件资源范围不同，等级按登录 / 浏览 / 下载行为自动成长。
          </li>
          <li>
            <b className="text-[#1d1d1f]">管理员权限：</b>邮箱 2623681461@qq.com 拥有最高 admin 权限，可审核发布机型、管理用户、处理违规封禁账号。
          </li>
          <li>
            <b className="text-[#1d1d1f]">账号借用禁止：</b>账号仅限本人使用，不得出借、售卖、共享、出借给他人批量下载，一经查实立即封号处理。
          </li>
        </ul>
      ),
    },
    {
      icon: <Upload className="w-5 h-5" />,
      title: "三、用户上传与内容守则",
      content: (
        <div className="space-y-3 text-[#86868b]">
          <p>
            当您上传文件、课件、或在本站任何交互模块发布内容时，请严格遵守以下规定：
          </p>
          <ul className="list-disc pl-5 space-y-2.5">
            <li>
              <b className="text-[#1d1d1f]">版权合规：</b>您必须拥有上传内容（PPT、PDF、MP4、STL 模型、设计稿等）的合法权利，不得上传盗版教材、他人享有版权的商业书籍扫描件、未经授权的作品或软件。
            </li>
            <li>
              <b className="text-[#1d1d1f]">合法合规：</b>不得发布包含色情、暴力、赌博、毒品、反动、虚假诈骗、侵犯隐私、恶意代码等违反《中华人民共和国网络安全法》等任何中国法律法规及地方法规的内容。
            </li>
            <li>
              <b className="text-[#1d1d1f]">AI 辅助整理：</b>本站可使用 AI 工具对投稿内容进行归档、分类、结构化整理，结果默认以"草稿"形式存在，需经管理员人工审核通过后才会公开展示；AI 生成的辅助内容不保证 100% 准确，请以人工复核结果为准。
            </li>
            <li>
              <b className="text-[#1d1d1f]">举报与处置：</b>违规内容接举报后 24 小时内先行下架，严重违规者永久封号，并按《网络安全法》配合监管部门要求提供必要信息。
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: <Download className="w-5 h-5" />,
      title: "四、下载与知识产权声明",
      content: (
        <ul className="list-disc pl-5 space-y-2.5 text-[#86868b]">
          <li>
            <b className="text-[#1d1d1f]">个人非商用：</b>本站所有课件、模型、模板等数字资源，仅授权用户个人学习 / 课堂教学 / 校内活动使用，不得转载、重新打包售卖、或放到抖音、B站、百度文库等任何商业平台；学校内部可在校园范围内再分发。
          </li>
          <li>
            <b className="text-[#1d1d1f]">合作授权：</b>机构、培训机构如需批量使用或纳入课程体系，请联系邮箱 2623681461@qq.com 沟通合作方案与授权。
          </li>
          <li>
            <b className="text-[#1d1d1f]">保留权利：</b>本站及资源作者保留署名权；下载仅授予您个人非独占、不可转让、有限使用许可。
          </li>
          <li>
            <b className="text-[#1d1d1f]">用户反馈聚合：</b>平台内出现的任何评分、评价、推荐指数，均来自用户真实投稿与反馈的聚合展示，仅供学习参考，不代表任何官方立场。
          </li>
          <li>
            <b className="text-[#1d1d1f]">外链跳转：</b>页面中若存在指向第三方平台的链接，跳转后产生的任何行为均与本站无关，本站免责。
          </li>
        </ul>
      ),
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      title: "五、免责声明（重要）",
      content: (
        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-3 text-[#86868b]">
          <p>
            本网站按"现状"提供服务，在法律允许的最大范围内，<b className="text-[#1d1d1f]">不做任何形式的保证</b>，包括但不限于：
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>创作工具、参数建议、成本估算、模板素材等仅供学习参考，实际效果受个人操作水平、环境条件、材料差异等多重因素影响；</li>
            <li>AI 辅助生成的内容基于公开信息与模型能力聚合，可能存在误差或信息滞后，使用前请自行核实；</li>
            <li>第三方链接、第三方图片、第三方平台可能随时调整内容、接口、价格或出现故障；</li>
            <li>第三方图片 CDN 防盗链或网络异常可能导致资源链接无法加载，平台提供的 Artistic Display 仅作为兜底展示方案。</li>
          </ul>
          <p>
            在任何情况下，睿造打印工坊因合同、侵权（包括疏忽）、严格责任或其他方式承担的间接、附带、特殊、后果性或惩罚性赔偿（即使已被告知发生此类损害的可能性），全部赔偿总额度不超过用户已实际支付的费用金额（如有）。本平台以青少年创客学习交流为目的，不承担任何商业交易或工程决策所引发的连带责任。
          </p>
        </div>
      ),
    },
    {
      icon: <Gavel className="w-5 h-5" />,
      title: "六、违约与终止",
      content: (
        <ul className="list-disc pl-5 space-y-2.5 text-[#86868b]">
          <li>用户违反本条款任何一条，我们有权视情节轻重采取：<b className="text-[#1d1d1f]">口头警告 → 临时冻结 → 永久封号 → 追究法律责任</b>。</li>
          <li>封号后用户可主动注销账号，注销后仍需承担在此之前因违法违纪行为产生的义务（如版权侵权赔偿责任）。</li>
          <li>本条款的订立、执行、解释、争议解决适用<b className="text-[#1d1d1f]">中华人民共和国法律</b>（不含港澳台地区法律）。</li>
          <li>因本条款引起的争议，以友好协商优先；协商不成时，任何一方均有权向<b className="text-[#1d1d1f]">湖南省长沙市</b>有管辖权的人民法院起诉。</li>
          <li>本条款标题仅为阅读便利设置，不影响条款的任何含义或解释。</li>
        </ul>
      ),
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "七、其他通用条款",
      content: (
        <ul className="list-disc pl-5 space-y-2.5 text-[#86868b]">
          <li>本条款任何部分被认定为无效或不可执行，其余条款效力不受影响。</li>
          <li>延迟行使或未行使本条款项下任何权利，不视为对该权利的放弃。</li>
          <li>本站有权将本协议全部或部分权利义务转让给关联公司，届时将通过站内公告通知。</li>
        </ul>
      ),
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: "八、联系方式",
      content: (
        <div className="space-y-2 text-[#86868b]">
          <p>条款接受过程中如有任何疑问、建议投诉举报：</p>
          <p>管理员邮箱：<span className="text-[#0071e3] font-semibold">2623681461@qq.com</span></p>
          <p>通讯地址：湖南省长沙市高新区科技园 · 睿造打印工坊法务部收</p>
          <p>受理工作日 09:00 - 18:00（周一至周五，法定节假日除外）</p>
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
          <div className="bg-gradient-to-br from-[#1d1d1f] via-[#1d1d1f] to-[#0071e3] px-10 md:px-16 py-14 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-[#28cd41] blur-3xl -translate-y-1/3 translate-x-1/3" />
              <div className="absolute left-0 bottom-0 w-80 h-80 rounded-full bg-[#00c6ff] blur-3xl translate-y-1/3 -translate-x-1/4" />
            </div>
            <div className="relative flex items-start gap-5">
              <div className="w-16 h-16 rounded-3xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
                <Scale className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.28em] font-bold text-white/75 mb-2">
                  Legal · Terms of Service
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
                  使用条款
                </h1>
                <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-2xl">
                  在使用睿造打印工坊服务前，请您务必仔细阅读以下条款。您的使用行为将视为对本条款的接受。
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
                  <div className="w-10 h-10 rounded-2xl bg-[#1d1d1f]/10 text-[#1d1d1f] flex items-center justify-center shrink-0">
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

          <div className="mx-8 md:mx-16 mb-12 md:mb-16 rounded-[2rem] bg-[#1d1d1f] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div className="flex-grow">
              <h3 className="text-lg md:text-xl font-bold mb-1.5">我已阅读完毕</h3>
              <p className="text-sm text-white/70">
                若您继续使用睿造打印工坊的任何服务，即视为您已同意本使用条款全部内容。
              </p>
            </div>
            <Link to="/register" className="px-8 py-3 rounded-full bg-white text-[#1d1d1f] font-bold shadow-lg hover:bg-[#f5f5f7] transition-colors whitespace-nowrap shrink-0">
              立即注册
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
