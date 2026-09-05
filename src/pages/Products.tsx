import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const solutions = [
  {
    id: 1,
    name: "科创教育实验室集成",
    category: "教育方案",
    description: "为中小学提供从空间规划、设备选型到课程导入的一站式实验室建设方案。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Modern+bright+STEM+classroom+3D+printing+lab+minimalist+design+Apple+style&image_size=square",
    tags: ["空间规划", "设备集成", "课程导入"]
  },
  {
    id: 2,
    name: "教师专业成长培训",
    category: "服务方案",
    description: "针对信息科技教师，提供 3D 设计、切片技巧、设备维护及项目式教学 (PBL) 实战培训。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Teacher+training+session+modern+office+minimalist+tech+environment&image_size=square",
    tags: ["实战操作", "教案开发", "认证支持"]
  },
  {
    id: 3,
    name: "企业小批量试制支持",
    category: "工业方案",
    description: "利用主流高性能设备，为初创企业提供快速原型开发与材料选型咨询服务。",
    image: "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Industrial+prototyping+studio+high-end+3D+printers+minimalist+professional&image_size=square",
    tags: ["快速原型", "材料咨询", "工艺优化"]
  }
];

export default function Products() {
  return (
    <div className="pt-24 min-h-screen">
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h1 className="heading-medium mb-6">实验室与集成服务</h1>
            <p className="text-description max-w-2xl mx-auto">
              我们不仅推荐设备，更致力于构建完整的数字化智造生态，为教育与创作赋能。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {solutions.map((item) => (
              <motion.div 
                key={item.id}
                whileHover={{ y: -10 }}
                className="group rounded-[2.5rem] bg-[#f5f5f7] overflow-hidden transition-all duration-300 border border-transparent hover:border-[#0071e3]/20 shadow-sm hover:shadow-xl"
              >
                <div className="aspect-square overflow-hidden bg-white">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-10">
                  <span className="text-xs font-bold text-[#0071e3] uppercase tracking-widest mb-3 block">
                    {item.category}
                  </span>
                  <h3 className="text-2xl font-bold mb-4 text-[#1d1d1f]">{item.name}</h3>
                  <p className="text-[#86868b] mb-8 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {item.tags.map(tag => (
                      <span key={tag} className="px-4 py-1.5 bg-white rounded-full text-xs font-medium text-[#1d1d1f] border border-[#d2d2d7]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link to="/contact" className="w-full btn-secondary py-3 text-center inline-block">
                    咨询合作方案
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="section-padding bg-[#f5f5f7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4 text-[#1d1d1f]">合作流程</h2>
            <p className="text-[#86868b] text-lg">从需求沟通到方案落地，我们全程为您提供专业支持。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "需求调研", desc: "深入了解您的使用场景与预算范围。" },
              { step: "02", title: "方案定制", desc: "基于实测数据推荐最优硬件与课程组合。" },
              { step: "03", title: "交付安装", desc: "专业的工程师上门进行设备调试与环境搭建。" },
              { step: "04", title: "持续赋能", desc: "提供长期的技术支持与课程资源更新服务。" }
            ].map((s, idx) => (
              <div key={idx} className="relative p-10 bg-white rounded-[2rem] shadow-sm">
                <span className="text-6xl font-bold text-[#0071e3]/5 absolute top-6 left-6 leading-none">{s.step}</span>
                <h4 className="text-xl font-bold mb-4 relative z-10 text-[#1d1d1f]">{s.title}</h4>
                <p className="text-[#86868b] relative z-10 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
