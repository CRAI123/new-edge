import { motion } from "framer-motion";
import { ArrowLeft, Info, Download, Wrench, PackageOpen, Mail, MapPin, Clock, ShieldAlert, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Sales() {
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
          <div className="bg-gradient-to-br from-[#0071e3] via-[#00c6ff] to-[#28cd41] px-10 md:px-16 py-14 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full bg-white blur-3xl" />
              <div className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full bg-white/60 blur-3xl" />
            </div>
            <div className="relative flex items-start gap-5">
              <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.28em] font-bold text-white/80 mb-2">
                  Legal · Disclaimer & Service
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
                  免责声明与服务说明
                </h1>
                <p className="text-white/85 text-sm md:text-base leading-relaxed max-w-2xl">
                  睿造打印工坊作为青少年创客学习交流平台，致力于科创内容分享与创意展示，以下内容请您在使用前仔细阅读。
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold">
                  生效日期：2026 年 9 月 7 日
                </span>
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold">
                  版本 v1.0
                </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 md:px-16 py-12 md:py-16 space-y-14">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-[#f5f5f7]">
                <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#1d1d1f]">一、网站定位声明</h2>
              </div>
              <div className="text-[15px] leading-relaxed text-[#86868b] space-y-4">
                <div className="p-6 rounded-2xl bg-[#E6F4FF] border border-[#0071e3]/15">
                  <p className="leading-relaxed">
                    <strong className="text-[#1d1d1f]">睿造打印工坊不销售任何硬件设备</strong>，
                    所有<strong className="text-[#1d1d1f]">3D打印机</strong>、
                    <strong className="text-[#1d1d1f]">硬件</strong>、
                    <strong className="text-[#1d1d1f]">耗材</strong>等内容如存在仅为
                    <strong className="text-[#1d1d1f]">教育资料或个人笔记</strong>，
                    <strong className="text-[#1d1d1f]">不构成购买代理或官方推荐承诺</strong>。
                  </p>
                </div>
                <p>
                  本网站定位为青少年创客学习交流与作品分享平台，内容围绕 3D 设计创意、课程资源、创作工具、
                  原创 IP 周边展示等方向展开，旨在为信息科技学习兴趣群体提供学习参考与灵感启发。
                </p>
                <p>
                  网站中出现的任何设备图片、型号名称、材料类型等信息，均来自公开资料整理或创作者个人使用记录，
                  目的在于描述创作过程与学习背景，不代表对任何品牌、产品、服务的背书或推荐。
                </p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.04 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-[#f5f5f7]">
                <div className="w-10 h-10 rounded-2xl bg-[#28cd41]/10 text-[#28cd41] flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#1d1d1f]">二、资源下载规则</h2>
              </div>
              <div className="text-[15px] leading-relaxed text-[#86868b]">
                <ul className="space-y-3 pl-1">
                  <li className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#28cd41]/10 text-[#28cd41] text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span><strong className="text-[#1d1d1f]">个人非商用：</strong>本站提供的课件、模型、教案等数字资源，授权您用于个人学习、课堂教学、课后练习等非商业场景。</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#28cd41]/10 text-[#28cd41] text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span><strong className="text-[#1d1d1f]">比赛展示授权：</strong>下载内容可用于青少年科创比赛、校内公开课、学生作品展示等非营利活动中作为辅助素材，需在展示文档中注明「素材来源。</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span><strong className="text-[#1d1d1f]">不打包转卖：</strong>严禁将本站资源整体打包、二次上传至其他平台进行售卖、收费分享、批量分发或用于任何营利性用途。</span>
                  </li>
                </ul>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.08 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-[#f5f5f7]">
                <div className="w-10 h-10 rounded-2xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#1d1d1f]">三、创作工具使用免责</h2>
              </div>
              <div className="text-[15px] leading-relaxed text-[#86868b] space-y-4">
                <p>
                本站「创作者工具箱」栏目所提供的参数速查、估算工具、故障排查指南等内容，<strong className="text-[#1d1d1f]">均基于创客团队的创作经验整理</strong>，
                目的在于启发思路、辅助学习，<strong className="text-[#1d1d1f]">不担保任何实际使用效果</strong>。
                </p>
                <p>
                  3D 打印与三维设计的实际成果受诸多变量影响，包括但不限于：设备个体差异、耗材批次波动、环境温湿度变化、
                  机械校准水平、使用者操作习惯等，请您结合实际情况灵活调整参数与方案。
                </p>
                <p className="p-4 rounded-2xl bg-[#fef3c7]/60 border border-[#f59e0b]/20">
                  <strong className="text-[#1d1d1f]">因使用本站工具建议、参数参考或排查思路所导致的任何直接或间接损失，均由使用者自行承担责任。</strong>
                </p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.12 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-[#f5f5f7]">
                <div className="w-10 h-10 rounded-2xl bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center shrink-0">
                  <PackageOpen className="w-5 h-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#1d1d1f]">四、原创周边定制说明</h2>
              </div>
              <div className="text-[15px] leading-relaxed text-[#86868b] space-y-4">
                <p>
                  「原创 IP 周边」栏目所展示的潮玩手办、文创贴纸、教具周边等内容，<strong className="text-[#1d1d1f]">仅用于创意作品展示与设计理念分享</strong>，
                  不构成要约或销售承诺。
                </p>
                <p>
                  <strong className="text-[#1d1d1f]">如需定制咨询仅通过邮件进行沟通</strong>，
                  您可将使用场景、期望方向、设计需求发送至指定邮箱，团队将根据可行性与创作方向。
                </p>
                <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7]/50">
                  <p className="text-[#1d1d1f] font-semibold mb-2">本站不提供以下服务：</p>
                  <ul className="space-y-1.5 text-sm">
                    <li>· 线上购物车、在线下单与在线支付功能</li>
                    <li>· 现货商品库存查询与发货配送</li>
                    <li>· 批量商品订单处理与物流追踪</li>
                  </ul>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.16 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-[#f5f5f7]">
                <div className="w-10 h-10 rounded-2xl bg-[#ec4899]/10 text-[#ec4899] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#1d1d1f]">五、服务时间说明</h2>
              </div>
              <div className="text-[15px] leading-relaxed text-[#86868b] space-y-4">
                <p>
                  睿造打印工坊是由学生创客团队运营维护，团队成员利用课余时间维护内容与回复咨询，<strong className="text-[#1d1d1f]">非商业化运营模式</strong>。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-[#f5f5f7]">
                    <p className="text-sm text-[#86868b] uppercase tracking-wider mb-2">邮件回复时效</p>
                    <p className="text-xl font-bold gradient-text-dual">工作日 1 ~ 3 日</p>
                    <p className="text-xs text-[#86868b] mt-1">周一至周五，法定节假日顺延</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#f5f5f7]">
                    <p className="text-sm text-[#86868b] uppercase tracking-wider mb-2">内容更新节奏</p>
                    <p className="text-xl font-bold gradient-text-dual">不定期更新</p>
                    <p className="text-xs text-[#86868b] mt-1">随学习进度与创作产出更新</p>
                  </div>
                </div>
                <p className="text-sm">
                  感谢您的理解与耐心等待，团队会尽力在时效范围内逐一回复每一封邮件。
                </p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.2 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-[#f5f5f7]">
                <div className="w-10 h-10 rounded-2xl bg-[#00c6ff]/10 text-[#00c6ff] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#1d1d1f]">六、联系方式</h2>
              </div>
              <div className="text-[15px] leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-[#E6F4FF] to-white border border-[#0071e3]/15">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white text-[#0071e3] flex items-center justify-center shadow-sm">
                        <Mail className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-[#86868b] uppercase tracking-wider">联系邮箱</p>
                    </div>
                    <p className="text-xl font-bold text-[#1d1d1f]">2623681461@qq.com</p>
                    <p className="text-xs text-[#86868b] mt-2">适用于：定制咨询、资源合作、内容反馈</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-[#F6FFED] to-white border border-[#28cd41]/15">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white text-[#28cd41] flex items-center justify-center shadow-sm">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-[#86868b] uppercase tracking-wider">工作室地址</p>
                    </div>
                    <p className="text-xl font-bold text-[#1d1d1f]">湖南省长沙市</p>
                    <p className="text-xs text-[#86868b] mt-2">学生创客团队，线下交流仅接受提前邮件预约</p>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          <div className="mx-8 md:mx-16 mb-12 md:mb-16 rounded-[2rem] bg-gradient-to-r from-[#1d1d1f] to-[#0071e3] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div className="flex-grow">
              <h3 className="text-lg md:text-xl font-bold mb-1.5 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#28cd41]" />
                感谢您的理解与支持
              </h3>
              <p className="text-sm text-white/75">
                睿造打印工坊与青少年创客共同成长，打造纯粹的创作与学习氛围。
              </p>
            </div>
            <Link to="/contact" className="px-8 py-3 rounded-full bg-white text-[#1d1d1f] font-bold shadow-lg hover:bg-[#f5f5f7] transition-colors whitespace-nowrap shrink-0">
              发送邮件
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
