import { motion } from "framer-motion";

const members = [
  {
    name: "刘宸睿",
    role: "创始人 · 学生创客 ",
    bio: "中学生创客 · 睿造打印工坊发起人，热爱三维设计与科创教育，希望把创意智造和原创IP的乐趣带给更多同学。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Teenage+student+maker+portrait+in+modern+creative+studio+clean+natural+lighting+Apple+style+minimalist&image_size=square"
  },
  {
    name: "何佳奇",
    role: "联合创始人 · 学生创客 · 产品负责人",
    bio: "中学生创客 · 产品负责人，负责项目落地执行，高效推进团队创意变成现实。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Teenage+male+student+with+glasses+in+maker+lab+clean+portrait+bright+lighting+minimal&image_size=square"
  },
  {
    name: "王睿",
    role: "IP与设计负责人",
    bio: "学生团队核心成员，负责睿造原创IP形象、文创周边与视觉设计，希望用温暖的设计点亮创客作品。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Teenage+female+art+student+portrait+in+colorful+design+studio+clean+bright+minimal&image_size=square"
  }
];

export default function Team() {
  return (
    <div className="pt-24 min-h-screen">
      {/* Team Header */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] text-xs font-bold uppercase tracking-wider mb-6">
              About Us
            </div>
            <h1 className="heading-medium mb-6">关于我们</h1>
            <p className="text-description max-w-2xl mx-auto">
              我们是一群来自校园的青少年创客团队，<span className="text-[#1d1d1f] font-semibold">用课堂之外的时间</span>打造这个小而美的创意工坊 —— 分享课件、打磨原创IP、一起做些让学习更有趣的小工具。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {members.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: idx * 0.15, duration: 0.8 }}
                whileHover={{ y: -6 }}
                className="text-center"
              >
                <div className="w-48 h-48 mx-auto mb-6 shadow-lg grayscale hover:grayscale-0 transition-all duration-700 shimmer-border group relative avatar-ring tilt-card rounded-full overflow-hidden">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-[#1d1d1f]">{member.name}</h3>
                <p className="text-[#0071e3] font-medium mb-4 chip inline-block px-3 py-1 rounded-full bg-[#E6F4FF]">{member.role}</p>
                <p className="text-[#86868b] leading-relaxed px-4">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-[#f5f5f7] relative overflow-hidden">
        <div className="absolute top-10 right-10 w-[380px] h-[380px] rounded-full bg-[#28cd41]/10 blur-[100px] animate-halo pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-[420px] h-[420px] rounded-full bg-[#0071e3]/10 blur-[100px] animate-halo pointer-events-none" style={{ animationDelay: "1.5s" }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-8 italic text-[#1d1d1f] leading-tight">
                "我们的使命是让<span className="gradient-text-dual not-italic">科创教育</span>触手可及。"
              </h2>
              <div className="space-y-8">
                {[
                  { t: "创新驱动", d: "我们从不满足于现状，始终在探索信息科技教育的新范式。" },
                  { t: "原创至上", d: "坚持原创IP与课件内容自主研发，每个创意都饱含独特的设计温度。" },
                  { t: "教育赋能", d: "技术的最终目的是赋能教育，让每个孩子都能在创造中学习。" }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 + idx * 0.1 }}
                    className="p-6 rounded-2xl bg-white shadow-sm card-hover shimmer-card group"
                  >
                    <h4 className="text-xl font-semibold mb-2 text-[#1d1d1f]">{item.t}</h4>
                    <p className="text-[#86868b]">{item.d}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.1 }}
              className="rounded-[3rem] overflow-hidden shadow-2xl shimmer-border group animate-float tilt-card"
            >
              <img 
                src="https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Modern+minimalist+team+workspace+natural+lighting+plants+clean+design+Apple+style&image_size=portrait_4_3" 
                alt="Workspace"
                className="w-full h-full object-cover transition-transform duration-[1.4s] group-hover:scale-105"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
