import { motion } from "framer-motion";
import { Calculator, Table, Clock, AlertTriangle, Wrench, Thermometer, Layers, Droplets, Wind, Sparkles, Loader2 } from "lucide-react";

const slicingParams = [
  {
    material: "PLA",
    color: "bg-[#28cd41]",
    textColor: "text-[#28cd41]",
    bgLight: "bg-[#28cd41]/10",
    nozzleTemp: "190 ~ 220°C",
    bedTemp: "50 ~ 70°C",
    layerHeight: "0.12 ~ 0.28mm",
    printSpeed: "40 ~ 80mm/s",
    cooling: "全开",
    enclosure: "无需",
    features: "易打印、低翘曲、色彩丰富"
  },
  {
    material: "ABS",
    color: "bg-[#f59e0b]",
    textColor: "text-[#f59e0b]",
    bgLight: "bg-[#f59e0b]/10",
    nozzleTemp: "230 ~ 260°C",
    bedTemp: "90 ~ 110°C",
    layerHeight: "0.15 ~ 0.3mm",
    printSpeed: "30 ~ 60mm/s",
    cooling: "半开 / 关闭",
    enclosure: "建议",
    features: "高强度、耐高温、需封闭环境"
  },
  {
    material: "PETG",
    color: "bg-[#0071e3]",
    textColor: "text-[#0071e3]",
    bgLight: "bg-[#0071e3]/10",
    nozzleTemp: "220 ~ 250°C",
    bedTemp: "70 ~ 85°C",
    layerHeight: "0.12 ~ 0.28mm",
    printSpeed: "30 ~ 70mm/s",
    cooling: "50% ~ 80%",
    enclosure: "可选",
    features: "韧性好、透明可选、耐化学"
  }
];

const troubleshootingItems = [
  {
    title: "堵头 / 不出料",
    icon: <Wrench className="w-5 h-5" />,
    color: "bg-[#ef4444]/10 text-[#ef4444]",
    points: [
      "检查耗材是否在喷嘴处熔化并冷却堵塞",
      "适当提高喷嘴温度 5~10°C 重试",
      "使用清理针或专用清理耗材通喷嘴",
      "确认耗材进料齿轮松紧度合适"
    ]
  },
  {
    title: "翘边 / 底部分离",
    icon: <Layers className="w-5 h-5" />,
    color: "bg-[#f59e0b]/10 text-[#f59e0b]",
    points: [
      "确认平台清洁，无灰尘油污残留",
      "检查首层是否过于贴近或远离平台",
      "添加裙边（Brim）或 raft 增加接触面积",
      "降低冷却风扇速度，保持环境温度稳定"
    ]
  },
  {
    title: "层分离 / 断裂",
    icon: <Droplets className="w-5 h-5" />,
    color: "bg-[#8b5cf6]/10 text-[#8b5cf6]",
    points: [
      "适当提高喷嘴温度，增强层间粘合",
      "降低打印速度，给每层足够熔合时间",
      "检查环境是否有冷风直吹打印件",
      "确认耗材干燥，吸湿材料需烘干后使用"
    ]
  }
];

export default function Advice() {
  return (
    <div className="pt-24 min-h-screen">
      <section className="section-padding bg-white relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-[#00c6ff]/10 blur-[120px] pointer-events-none animate-halo"></div>
        <div className="absolute bottom-0 right-1/4 w-[460px] h-[460px] rounded-full bg-[#8b5cf6]/10 blur-[120px] pointer-events-none animate-halo" style={{ animationDelay: "1.2s" }}></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Creator Toolkit
            </div>
            <h1 className="heading-medium mb-6">
              <span className="gradient-text-dual">创作者工具箱</span>·让打印更高效
            </h1>
            <p className="text-description max-w-3xl mx-auto">
              汇集常用创作辅助工具与经验速查，帮助青少年创客在每一次打印中快速定位参数、预估效率、解决常见问题。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="rounded-[2.5rem] bg-[#f5f5f7] p-8 md:p-10 shimmer-card group"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#00c6ff] text-white flex items-center justify-center shadow-lg glow-ring">
                  <Calculator className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1d1d1f]">打印成本估算</h3>
                  <p className="text-[#86868b] text-sm mt-1">基于耗材用量与时长的快速参考</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">耗材重量 (g)</label>
                    <div className="h-12 rounded-2xl bg-white px-4 flex items-center border border-[#d2d2d7]/60 text-[#1d1d1f]">
                      —
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">打印时长 (小时)</label>
                    <div className="h-12 rounded-2xl bg-white px-4 flex items-center border border-[#d2d2d7]/60 text-[#1d1d1f]">
                      —
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">耗材类型</label>
                    <div className="h-12 rounded-2xl bg-white px-4 flex items-center border border-[#d2d2d7]/60 text-[#86868b]">
                      待选择
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">估算结果</label>
                    <div className="h-12 rounded-2xl bg-gradient-to-r from-[#0071e3]/10 to-[#28cd41]/10 px-4 flex items-center text-[#1d1d1f] font-semibold border border-[#0071e3]/20">
                      —
                    </div>
                  </div>
                </div>

                <button className="w-full h-12 rounded-2xl bg-[#f5f5f7] border-2 border-dashed border-[#d2d2d7] text-[#86868b] font-semibold flex items-center justify-center gap-2 hover:border-[#0071e3]/40 hover:text-[#0071e3] transition-colors">
                  <Loader2 className="w-4 h-4" />
                  即将上线
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="rounded-[2.5rem] bg-[#f5f5f7] p-8 md:p-10 shimmer-card group"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#28cd41] to-[#a3e635] text-white flex items-center justify-center shadow-lg glow-ring">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1d1d1f]">G-code 时长体积估算</h3>
                  <p className="text-[#86868b] text-sm mt-1">快速了解模型规模与生产节奏</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">模型尺寸 (长 × 宽 × 高, mm)</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-12 rounded-2xl bg-white px-4 flex items-center justify-center border border-[#d2d2d7]/60 text-[#86868b]">
                        长 —
                      </div>
                      <div className="h-12 rounded-2xl bg-white px-4 flex items-center justify-center border border-[#d2d2d7]/60 text-[#86868b]">
                        宽 —
                      </div>
                      <div className="h-12 rounded-2xl bg-white px-4 flex items-center justify-center border border-[#d2d2d7]/60 text-[#86868b]">
                        高 —
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">层高 / 填充密度</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-12 rounded-2xl bg-white px-4 flex items-center border border-[#d2d2d7]/60 text-[#86868b]">
                        层高 —
                      </div>
                      <div className="h-12 rounded-2xl bg-white px-4 flex items-center border border-[#d2d2d7]/60 text-[#86868b]">
                        填充 —
                      </div>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#E6F4FF] to-[#F6FFED] border border-[#0071e3]/10">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#86868b] mb-1">预估打印时长</p>
                        <p className="text-xl font-bold gradient-text-dual">—</p>
                      </div>
                      <div>
                        <p className="text-[#86868b] mb-1">预估耗材体积</p>
                        <p className="text-xl font-bold gradient-text-dual">—</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full h-12 rounded-2xl bg-[#f5f5f7] border-2 border-dashed border-[#d2d2d7] text-[#86868b] font-semibold flex items-center justify-center gap-2 hover:border-[#28cd41]/40 hover:text-[#28cd41] transition-colors">
                  <Loader2 className="w-4 h-4" />
                  即将上线
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#f5f5f7] relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white text-[#86868b] text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
              <Table className="w-3.5 h-3.5" />
              Quick Reference
            </div>
            <h2 className="heading-medium mb-4">切片参数速查表</h2>
            <p className="text-description max-w-2xl mx-auto">基于工作室日常创作经验整理的常用耗材参数区间，供切片时快速参考。</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {slicingParams.map((item, idx) => (
              <motion.div
                key={item.material}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: idx * 0.1 }}
                className="rounded-[2.5rem] bg-white p-8 shimmer-border group card-hover tilt-card"
              >
                <div className={`w-16 h-16 rounded-2xl ${item.color} text-white flex items-center justify-center font-bold text-2xl mb-6 shadow-lg glow-ring`}>
                  {item.material.charAt(0)}
                </div>
                <h3 className={`text-3xl font-black mb-2 ${item.textColor}`}>{item.material}</h3>
                <p className="text-[#86868b] text-sm mb-6 leading-relaxed">{item.features}</p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f5f5f7]">
                    <Thermometer className={`w-5 h-5 ${item.textColor} shrink-0 mt-0.5`} />
                    <div className="flex-grow min-w-0">
                      <p className="text-xs text-[#86868b] uppercase tracking-wider mb-1">喷嘴温度</p>
                      <p className="font-bold text-[#1d1d1f]">{item.nozzleTemp}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f5f5f7]">
                    <Layers className={`w-5 h-5 ${item.textColor} shrink-0 mt-0.5`} />
                    <div className="flex-grow min-w-0">
                      <p className="text-xs text-[#86868b] uppercase tracking-wider mb-1">热床温度</p>
                      <p className="font-bold text-[#1d1d1f]">{item.bedTemp}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f5f5f7]">
                    <Layers className={`w-5 h-5 ${item.textColor} shrink-0 mt-0.5`} />
                    <div className="flex-grow min-w-0">
                      <p className="text-xs text-[#86868b] uppercase tracking-wider mb-1">推荐层厚</p>
                      <p className="font-bold text-[#1d1d1f]">{item.layerHeight}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-2xl ${item.bgLight}`}>
                      <p className="text-xs text-[#86868b] uppercase tracking-wider mb-1">打印速度</p>
                      <p className="font-bold text-[#1d1d1f] text-sm">{item.printSpeed}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${item.bgLight}`}>
                      <p className="text-xs text-[#86868b] uppercase tracking-wider mb-1">散热风扇</p>
                      <p className="font-bold text-[#1d1d1f] text-sm">{item.cooling}</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl ${item.bgLight}`}>
                    <div className="flex items-center gap-2">
                      <Wind className={`w-4 h-4 ${item.textColor}`} />
                      <p className="text-xs text-[#86868b] uppercase tracking-wider">封闭环境</p>
                      <p className="ml-auto font-bold text-[#1d1d1f]">{item.enclosure}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] text-xs font-bold uppercase tracking-wider mb-6">
              <AlertTriangle className="w-3.5 h-3.5" />
              Troubleshooting
            </div>
            <h2 className="heading-medium mb-4">常见问题排查</h2>
            <p className="text-description max-w-2xl mx-auto">汇总创作过程中最常遇到的几类故障现象与基础排查方向，帮助创客独立解决问题。</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {troubleshootingItems.map((issue, idx) => (
              <motion.div
                key={issue.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: idx * 0.1 }}
                className="rounded-[2.5rem] bg-[#f5f5f7] p-8 shimmer-card group card-hover"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${issue.color}`}>
                    {issue.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#1d1d1f]">{issue.title}</h3>
                </div>
                <ul className="space-y-3">
                  {issue.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-[#86868b] text-sm leading-relaxed">
                      <span className="w-6 h-6 rounded-full bg-white text-[#1d1d1f] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto rounded-[2.5rem] bg-gradient-to-r from-[#fef3c7] via-[#fef9e7] to-[#fce7f3] p-8 md:p-10 border border-[#f59e0b]/20 shimmer-border group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#f59e0b] flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-[#1d1d1f] mb-2">免责说明</h4>
                <p className="text-[#86868b] leading-relaxed text-[15px]">
                  本页面所有工具内容与参数速查均基于创作者个人经验与工作室日常实践整理，仅供学习参考与创意辅助使用。
                  实际打印结果会受到设备状态、耗材批次、环境温湿度、机械校准水平等多重因素综合影响，
                  请创客朋友们结合自身设备情况灵活调整，本站不对工具输出结果或参数建议的实际效果作任何担保，
                  因使用工具建议导致的任何损失由使用者自行承担。
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
