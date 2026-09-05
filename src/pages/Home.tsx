import { motion } from "framer-motion";
import { ArrowRight, Zap, BookOpen, ShoppingBag, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center section-padding bg-[#f5f5f7] overflow-hidden">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl z-10"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm mb-8">
            <Sparkles className="w-4 h-4 text-[#0071e3]" />
            <span className="text-sm font-medium">3D 打印 · 信息科技 · 教育资源</span>
          </motion.div>
          <motion.h1 variants={itemVariants} className="heading-large mb-6">
            连接创意与 <span className="apple-gradient-blue">未来教育</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-description mb-10 max-w-2xl mx-auto">
            睿造打印工坊 (Rayzo print studio) 致力于中小学信息科技教育，提供全方位的课件资源包与专业的 3D 打印设备选型建议，助力创意智造。
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-6">
            <Link to="/resources" className="btn-primary text-lg px-8 py-3 flex items-center gap-2 shadow-lg shadow-blue-500/20">
              获取课件资源 <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/advice" className="btn-secondary text-lg px-8 py-3 bg-white">
              查看选购建议
            </Link>
          </motion.div>
        </motion.div>
        
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          className="mt-20 w-full max-w-5xl aspect-video rounded-[3rem] shadow-2xl overflow-hidden bg-white border border-white/50"
        >
          <img 
            src="https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Modern+classroom+with+3D+printers+students+learning+information+technology+clean+Apple+style+lighting+bright+airy&image_size=landscape_16_9" 
            alt="Rayzo Print Education"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </section>

      {/* Core Services Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="heading-medium mb-4">核心业务</h2>
          <p className="text-description">从硬件技术到教育资源，提供一站式综合服务。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="w-10 h-10 text-[#0071e3]" />,
              title: "设备选型建议",
              desc: "基于深度评测与实测数据，为个人及学校提供最中立、最专业的 3D 打印机购买指导。",
              link: "/advice"
            },
            {
              icon: <BookOpen className="w-10 h-10 text-[#28cd41]" />,
              title: "信息科技课件",
              desc: "涵盖小学、初中、高中信息科技课程，包含 3D 建模、编程等全套教学资源包。",
              link: "/resources"
            },
            {
              icon: <ShoppingBag className="w-10 h-10 text-[#0071e3]" />,
              title: "设备方案推荐",
              desc: "基于多年科创教育经验，为您提供量身定制的 3D 打印设备选型与实验室建设方案。",
              link: "/products"
            }
          ].map((service, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -10 }}
              className="p-10 rounded-[2.5rem] bg-[#f5f5f7] border border-transparent hover:border-[#0071e3]/10 transition-all duration-300 flex flex-col h-full"
            >
              <div className="mb-8 p-4 bg-white w-fit rounded-2xl shadow-sm">{service.icon}</div>
              <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
              <p className="text-[#86868b] leading-relaxed mb-8 flex-grow">{service.desc}</p>
              <Link to={service.link} className="text-[#0071e3] font-semibold flex items-center gap-2 hover:underline group">
                了解更多 <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Education Focus Section */}
      <section className="section-padding bg-[#f5f5f7]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1">
            <div className="inline-block px-4 py-1 rounded-full bg-[#E6F4FF] text-[#0071e3] text-sm font-bold mb-6">教育专项</div>
            <h2 className="heading-medium mb-8 leading-tight">
              助力中小学 <span className="apple-gradient-green">科创教育</span>
            </h2>
            <p className="text-description mb-10">
              我们深知教育者的需求，精心打造了符合国家信息科技课程标准的课件包。从 3D 建模基础到开源硬件集成，让课堂教学更有趣、更高效。
            </p>
            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="p-6 rounded-3xl bg-white shadow-sm">
                <div className="text-3xl font-bold text-[#0071e3] mb-2">500+</div>
                <div className="text-sm text-[#86868b]">精选课件资源</div>
              </div>
              <div className="p-6 rounded-3xl bg-white shadow-sm">
                <div className="text-3xl font-bold text-[#28cd41] mb-2">100+</div>
                <div className="text-sm text-[#86868b]">合作中小学校</div>
              </div>
            </div>
            <Link to="/resources" className="btn-primary px-10 py-4">浏览课件库</Link>
          </div>
          <div className="flex-1 w-full">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="rounded-[3rem] shadow-2xl overflow-hidden relative"
            >
              <img 
                src="https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=3D+model+of+a+cute+robot+on+a+computer+screen+elementary+school+student+designing+Apple+aesthetic&image_size=square_hd" 
                alt="Education Resources"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-white text-center">
        <div className="max-w-4xl mx-auto py-24 rounded-[4rem] bg-gradient-to-br from-[#E6F4FF] via-white to-[#F6FFED] shadow-xl border border-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-100/50 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          
          <h2 className="heading-medium mb-8 z-10 relative">加入 睿造打印工坊</h2>
          <p className="text-description mb-12 px-6 z-10 relative max-w-2xl mx-auto">
            立即注册以获取免费的信息科技课件资源包，并订阅最新的 3D 打印选购指南。
          </p>
          <div className="flex flex-wrap justify-center gap-6 z-10 relative">
            <Link to="/register" className="btn-primary text-lg px-12 py-4">
              免费注册
            </Link>
            <Link to="/contact" className="btn-secondary text-lg px-12 py-4 bg-white">
              咨询合作
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
