import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, AlertTriangle, FileText, CheckCircle, XCircle, Info } from "lucide-react";

export default function CommunityGuidelines() {
  const lastUpdated = "2026年10月03日";

  const sections = [
    {
      id: "acceptance",
      title: "1. 协议的接受与修改",
      content: (
        <div className="space-y-4 text-[#86868b] leading-relaxed">
          <p>
            欢迎访问并使用大神社区（以下简称“本社区”）。本社区是为 3D 打印爱好者、创作者及专业人士提供的专属交流平台。
          </p>
          <p>
            当您注册、登录、浏览或在本社区发布任何内容（包括但不限于文字、图片、3D模型文件、链接等）时，即视为您已完全阅读、理解并同意接受本《大神社区规范与免责声明》（以下简称“本声明”）的全部内容。<strong>如果您不同意本声明的任何条款，请立即停止使用本社区服务。</strong>
          </p>
          <p>
            平台保留随时修改本声明的权利，修改后的内容将在本页面更新，并自更新之日起生效。用户继续使用本社区即视为同意修改后的声明。
          </p>
        </div>
      )
    },
    {
      id: "content-rules",
      title: "2. 社区内容发布规范",
      content: (
        <div className="space-y-4 text-[#86868b] leading-relaxed">
          <p>
            本社区是 <strong>3D 打印垂直领域的专业交流平台</strong>。为维护良好的交流环境，用户在发布内容时必须遵守以下规范：
          </p>
          <div className="bg-[#f5f5f7] p-5 rounded-2xl border border-gray-200/50 mt-4">
            <h4 className="font-bold text-[#1d1d1f] flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              鼓励发布的内容
            </h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>3D 打印相关的技术讨论、求助与经验分享。</li>
              <li>原创 3D 建模作品展示、STL/OBJ 模型文件分享。</li>
              <li>切片软件（如 Cura, Bambu Studio 等）的参数设置与教程。</li>
              <li>3D 打印机硬件改造、耗材测评与维护经验。</li>
            </ul>
          </div>
          
          <div className="bg-red-50 p-5 rounded-2xl border border-red-100 mt-4">
            <h4 className="font-bold text-[#1d1d1f] flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5 text-red-500" />
              严禁发布的内容（违者将直接删除并封禁账号）
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-red-900/80">
              <li><strong>非相关内容</strong>：任何与 3D 打印无关的日常自拍、风景照、无关领域的讨论等。</li>
              <li><strong>违法违规信息</strong>：煽动颠覆国家政权、破坏国家统一、散布谣言、破坏社会稳定的内容。</li>
              <li><strong>色情与低俗</strong>：包含色情、淫秽、性暗示、低俗或暴力的文字、图片和 3D 模型。</li>
              <li><strong>侵权内容</strong>：未经授权搬运、倒卖他人享有著作权的 3D 模型或商业图纸。</li>
              <li><strong>恶意引流与广告</strong>：未经官方允许的商业广告、微商引流、赌博或诈骗信息。</li>
              <li><strong>人身攻击</strong>：对其他用户进行谩骂、侮辱、诽谤、人肉搜索等网络暴力行为。</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "moderation",
      title: "3. 平台审核与管理机制",
      content: (
        <div className="space-y-4 text-[#86868b] leading-relaxed">
          <p>为了保障社区的健康发展，平台采取 <strong>AI 智能审核 + 人工巡查</strong> 的双重管理机制：</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>AI 自动拦截：</strong> 您发布的所有内容（含图片）将首先经过 AI 视觉大模型审核。若系统判定内容与 3D 打印无关或涉嫌违规，将自动拦截并拒绝发布。</li>
            <li><strong>人工审核与巡查：</strong> 社区管理员和指定的社区审核员有权对社区内容进行不定期巡查，并处理用户的举报。</li>
            <li><strong>管理权限：</strong> 平台有权在不事先通知用户的情况下，直接采取包括但不限于：删除违规帖子、删除违规媒体文件、对违规账号进行降级、禁言或永久封禁等措施。</li>
          </ul>
        </div>
      )
    },
    {
      id: "disclaimer",
      title: "4. 免责声明（避风港原则）",
      content: (
        <div className="space-y-4 text-[#86868b] leading-relaxed">
          <p className="font-medium text-[#1d1d1f]">
            请务必仔细阅读以下免责条款，平台在法律允许的最大范围内不对以下情况承担责任：
          </p>
          <ul className="list-disc pl-5 space-y-3">
            <li><strong>用户生成内容 (UGC) 责任自负：</strong> 社区内的所有文字、图片、模型文件均由用户自行上传。平台作为网络服务提供者，仅提供信息存储空间服务。用户发布的内容仅代表其个人观点，不代表平台立场。用户须对自己在社区内的所有行为及发布的内容承担全部法律责任。</li>
            <li><strong>知识产权避风港：</strong> 平台尊重知识产权。如权利人发现社区内存在侵犯其合法权益的内容，请及时通过官方联系方式向平台发送侵权通知并提供相关证明。平台将在核实后依据“避风港原则”采取删除、屏蔽或断开链接等必要措施。平台不对用户的侵权行为承担直接或连带赔偿责任。</li>
            <li><strong>AI 审核局限性免责：</strong> 平台引入了人工智能（AI）视觉与文本大模型对用户发布的内容进行初步筛查。但受限于当前技术水平，<strong>AI 审核可能存在误判、漏判或识别延迟的情况</strong>。平台不保证 AI 审核能 100% 拦截所有违规内容，也不对因 AI 误判导致正常内容被拦截而产生的任何直接或间接损失负责。最终内容合规性的解释权归平台人工审核团队所有。</li>
            <li><strong>下载与使用风险：</strong> 用户从社区下载的任何 3D 模型或相关文件，其可用性、安全性及打印结果由用户自行评估。平台不对因使用社区下载文件导致的硬件损坏、材料浪费或任何直接/间接损失负责。</li>
            <li><strong>不可抗力：</strong> 因黑客攻击、计算机病毒、网络故障、政府行为等不可抗力因素导致的服务中断、数据丢失，平台不承担相关法律责任。</li>
          </ul>
        </div>
      )
    },
    {
      id: "copyright",
      title: "5. 知识产权与授权",
      content: (
        <div className="space-y-4 text-[#86868b] leading-relaxed">
          <p>
            用户在平台发布原创内容（含模型、图片、文字），其知识产权仍归用户所有。
          </p>
          <p>
            但在本社区发布内容，即视为用户<strong>免费、不可撤销地授予平台</strong>在全球范围内对该内容进行展示、分发、推广及在平台内部其他板块使用的权利。
          </p>
        </div>
      )
    },
    {
      id: "contact",
      title: "6. 举报与联系方式",
      content: (
        <div className="space-y-4 text-[#86868b] leading-relaxed">
          <p>
            如果您在社区发现任何违规内容，或您的合法权益受到侵害，请及时与我们联系。
          </p>
          <div className="bg-[#f5f5f7] p-4 rounded-xl inline-block mt-2">
            <p className="font-medium text-[#1d1d1f]">联系邮箱：studio@post.rayzo.cn</p>
          </div>
          <p className="text-sm mt-4">
            平台将在收到有效通知后的合理时间内尽快处理。
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm"
          >
            <Shield className="w-8 h-8" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight mb-4"
          >
            大神社区规范与免责声明
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#86868b] text-lg"
          >
            最后更新于：{lastUpdated}
          </motion.p>
        </div>

        {/* Notice Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-orange-50 border border-orange-200 rounded-3xl p-6 md:p-8 mb-12 flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-orange-900 mb-2">重要提示</h3>
            <p className="text-orange-800/80 leading-relaxed">
              为营造专业、纯粹的 3D 打印交流环境并遵守相关法律法规，请所有用户在发帖前仔细阅读本声明。<strong>发布任何与 3D 打印无关、违法违规或侵权的内容，都将面临删帖及封号处理。</strong> 平台对用户发布的内容享有最终审核及处置权，且对用户行为不承担连带法律责任。
            </p>
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-12">
          {sections.map((section, index) => (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#0071e3]" />
                {section.title}
              </h2>
              {section.content}
            </motion.section>
          ))}
        </div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Link
            to="/community"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#0071e3] text-white font-medium hover:bg-[#0077ED] transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            我已阅读并同意，返回社区
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
