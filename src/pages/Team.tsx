import { motion } from "framer-motion";

const members = [
  {
    name: "刘宸睿",
    role: "创始人 · 学生创客 ",
    bio: "中学生创客 · 睿造打印工坊发起人，热爱三维设计与科创教育，希望把创意智造和原创IP的乐趣带给更多同学。",
    image: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+portrait+teenage+boy+student+maker+friendly+warm+smile+soft+blue+hoodie+clean+line+art+cell+shading+simple+plain+white+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=square_hd"
  },
  {
    name: "何佳奇",
    role: "联合创始人 · 学生创客 · 产品负责人",
    bio: "中学生创客 · 产品负责人，负责项目落地执行，高效推进团队创意变成现实。",
    image: "https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+portrait+teenage+boy+student+product+manager+energetic+confident+expression+casual+jacket+clean+line+art+cell+shading+simple+plain+light+gray+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=square_hd"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 max-w-5xl mx-auto">
            {members.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: idx * 0.15, duration: 0.8 }}
                whileHover={{ y: -8 }}
                className="rounded-[2.5rem] bg-gradient-to-br from-white to-[#f5f5f7] p-10 md:p-12 shadow-sm border border-white hover:shadow-2xl hover:border-[#0071e3]/15 transition-all duration-500 text-center relative overflow-hidden group card-hover shimmer-border"
              >
                <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-[#0071e3]/8 blur-3xl group-hover:bg-[#0071e3]/15 transition-colors opacity-60"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-[#28cd41]/8 blur-3xl group-hover:bg-[#28cd41]/15 transition-colors opacity-60"></div>
                <div className="relative z-10">
                  <div className="relative w-52 h-52 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0071e3]/30 to-[#28cd41]/30 blur-xl animate-halo"></div>
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-2xl transition-transform duration-500 group-hover:scale-105" 
                    />
                  </div>
                  <h3 className="text-3xl font-bold mb-3 text-[#1d1d1f]">{member.name}</h3>
                  <div className="mb-5">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F4FF] text-[#0071e3] font-semibold text-sm border border-[#0071e3]/15 chip">
                      {member.role}
                    </span>
                  </div>
                  <p className="text-[#86868b] leading-relaxed text-[15px]">{member.bio}</p>
                </div>
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
                src="https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+creative+workspace+studio+teenage+students+collaborating+maker+desk+laptop+3D+printer+clean+line+art+cell+shading+soft+natural+lighting+simple+light+wooden+interior+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9" 
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
