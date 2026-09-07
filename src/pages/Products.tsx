import { motion } from "framer-motion";
import { Mail, Palette, Sticker, GraduationCap, MessageSquare } from "lucide-react";

const categories = [
  {
    id: 1,
    name: "潮玩手办",
    icon: <Palette className="w-6 h-6" />,
    color: "from-[#0071e3] to-[#00c6ff]",
    description: "基于原创IP形象设计的系列摆件与角色周边，融合青少年创客的创意灵感，每一件作品都承载着独特的故事与想象力。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Colorful+creative+designer+toys+figures+teen+maker+studio+style+artistic+display+minimalist+lighting&image_size=square_hd",
    tags: ["原创设计", "创意摆件", "IP衍生"]
  },
  {
    id: 2,
    name: "文创贴纸",
    icon: <Sticker className="w-6 h-6" />,
    color: "from-[#28cd41] to-[#a3e635]",
    description: "创客工作室主题贴纸与手账素材，记录3D创作过程中的灵感瞬间，适合笔记本、工具箱、学习用品的个性装饰。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Creative+stationery+stickers+teen+maker+workshop+theme+colorful+artistic+minimalist+flat+lay&image_size=square_hd",
    tags: ["手账素材", "主题贴纸", "个性装饰"]
  },
  {
    id: 3,
    name: "教具周边",
    icon: <GraduationCap className="w-6 h-6" />,
    color: "from-[#8b5cf6] to-[#ec4899]",
    description: "面向科创课堂的教学辅助用品与学习工具周边，助力青少年在动手实践中理解三维设计与空间思维的核心概念。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Educational+STEM+teaching+aids+creative+learning+tools+teen+classroom+colorful+modern+minimalist&image_size=square_hd",
    tags: ["教学辅助", "科创课堂", "学习工具"]
  },
  {
    id: 4,
    name: "定制咨询服务",
    icon: <MessageSquare className="w-6 h-6" />,
    color: "from-[#f59e0b] to-[#ef4444]",
    description: "为学校社团、创客空间、学生活动提供IP形象定制与周边设计的一对一咨询，通过邮件沟通需求与创意方案。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Creative+consultation+desk+teen+maker+design+session+colorful+inspiring+workspace+minimalist&image_size=square_hd",
    tags: ["一对一咨询", "社团定制", "创意方案"]
  }
];

export default function Products() {
  return (
    <div className="pt-24 min-h-screen">
      <section className="section-padding bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#0071e3]/8 blur-[120px] pointer-events-none animate-halo"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#28cd41]/10 blur-[120px] pointer-events-none animate-halo" style={{ animationDelay: "1.5s" }}></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] text-xs font-bold uppercase tracking-wider mb-6">
              Original IP Collection
            </div>
            <h1 className="heading-medium mb-6">
              <span className="gradient-text-dual">原创IP周边</span>·点亮创意
            </h1>
            <p className="text-description max-w-2xl mx-auto">
              青少年创客 × 3D创作 — 每一件周边都源自工作室成员的真实创意，记录成长路上的灵感火花。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: idx * 0.12 }}
                whileHover={{ y: -8 }}
                className="group rounded-[2.5rem] bg-[#f5f5f7] overflow-hidden transition-all duration-300 border border-transparent hover:border-[#0071e3]/20 shadow-sm hover:shadow-2xl shimmer-card tilt-card"
              >
                <div className="aspect-[16/10] overflow-hidden bg-white shimmer-border relative">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className={`absolute top-6 left-6 w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-xl glow-ring`}>
                    {item.icon}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
                <div className="p-10">
                  <h3 className="text-2xl font-bold mb-4 text-[#1d1d1f]">{item.name}</h3>
                  <p className="text-[#86868b] mb-8 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="px-4 py-1.5 bg-white rounded-full text-xs font-medium text-[#1d1d1f] border border-[#d2d2d7] chip hover:border-[#0071e3]/30 hover:text-[#0071e3] transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#f5f5f7] relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-[3rem] bg-white p-10 md:p-16 shadow-sm shimmer-border group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#0071e3]/10 to-[#28cd41]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#0071e3] to-[#28cd41] text-white flex items-center justify-center shadow-xl glow-ring">
                  <Mail className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="heading-medium text-left !mb-0">服务说明</h2>
                </div>
              </div>

              <div className="space-y-6 text-[#86868b] leading-relaxed text-[15px]">
                <div className="p-6 rounded-2xl bg-[#f5f5f7] border-l-4 border-[#0071e3]">
                  <p className="text-[#1d1d1f] font-semibold mb-2">本站不提供线上商城，不售卖任何实物商品。</p>
                  <p>本页面所有周边内容仅用于创意展示与作品分享，目的在于呈现青少年创客工作室的创作成果与设计理念。</p>
                </div>

                <div className="p-6 rounded-2xl bg-[#f5f5f7] border-l-4 border-[#28cd41]">
                  <p className="text-[#1d1d1f] font-semibold mb-2">如需定制或进一步了解周边设计，欢迎通过邮件咨询。</p>
                  <p>我们接受学校社团、创客活动、班级集体等场景的IP形象与周边设计咨询，通过邮件沟通您的创意需求与使用场景，共同探讨创作方向与可行性方案。</p>
                </div>

                <div className="p-8 rounded-2xl bg-gradient-to-r from-[#E6F4FF] via-white to-[#F6FFED] border border-[#0071e3]/10">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-grow">
                      <h4 className="font-bold text-[#1d1d1f] mb-1">定制咨询邮箱</h4>
                      <p className="text-2xl font-bold gradient-text-dual">2623681461@qq.com</p>
                    </div>
                    <div className="text-sm text-[#86868b]">
                      <p>请在邮件中简要说明：使用场景、期望方向、数量范围</p>
                      <p>我们会在工作日 1~3 日内回复</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
