import { motion } from "framer-motion";

const members = [
  {
    name: "张睿",
    role: "创始人 / 教育技术专家",
    bio: "拥有 15 年科创教育与工业设计经验，致力于将最前沿的 3D 打印技术引入中小学课堂。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Professional+headshot+of+a+tech+founder+in+a+minimalist+office+modern+lighting+professional+photography&image_size=square"
  },
  {
    name: "李造",
    role: "课程架构师",
    bio: "资深创客教育专家，主导了睿造多项信息科技课件的研发，对项目式学习 (PBL) 有着深厚见解。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Professional+headshot+of+a+male+engineer+tech+environment+clean+look&image_size=square"
  },
  {
    name: "王睿",
    role: "选型咨询主管",
    bio: "深谙各类 3D 打印设备性能，致力于为每一位用户提供最中立、最专业的硬件选型建议。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Professional+headshot+of+a+female+product+manager+modern+studio+lighting&image_size=square"
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
            className="text-center mb-20"
          >
            <h1 className="heading-medium mb-6">关于我们</h1>
            <p className="text-description max-w-2xl mx-auto">
              我们是一群热爱创造的人，致力于通过技术的革新，为世界带来更多美好的可能。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {members.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.2 }}
                className="text-center"
              >
                <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-6 shadow-lg grayscale hover:grayscale-0 transition-all duration-500">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
                <p className="text-[#0071e3] font-medium mb-4">{member.role}</p>
                <p className="text-[#86868b] leading-relaxed px-4">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-[#f5f5f7]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-8 italic">"我们的使命是让科创教育触手可及。"</h2>
              <div className="space-y-8">
                <div>
                  <h4 className="text-xl font-semibold mb-2">创新驱动</h4>
                  <p className="text-[#86868b]">我们从不满足于现状，始终在探索信息科技教育的新范式。</p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">专业中立</h4>
                  <p className="text-[#86868b]">基于海量实测数据，为您提供最客观的选购指导与技术支持。</p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">教育赋能</h4>
                  <p className="text-[#86868b]">技术的最终目的是赋能教育，让每个孩子都能在创造中学习。</p>
                </div>
              </div>
            </div>
            <div className="rounded-[3rem] overflow-hidden shadow-2xl">
              <img 
                src="https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Modern+minimalist+team+workspace+natural+lighting+plants+clean+design+Apple+style&image_size=portrait_4_3" 
                alt="Workspace"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
