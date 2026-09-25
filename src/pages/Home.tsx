import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Zap, BookOpen, ShoppingBag, Sparkles, Award, Users, FileCheck, Palette, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

// 高级 3D 悬浮卡片组件
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1200 }}
      className={`relative ${className}`}
    >
      <div style={{ transform: "translateZ(40px)" }} className="h-full">
        {children}
      </div>
    </motion.div>
  );
}

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

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCounter({ target, suffix, label, icon, color }: { target: number; suffix?: string; label: string; icon: React.ReactNode; color: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const count = useCountUp(target, 2200, inView);
  return (
    <TiltCard>
      <div ref={ref} className="p-6 md:p-8 rounded-[2rem] bg-white/60 backdrop-blur-md border border-[#f0f0f5] shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 relative overflow-hidden group h-full">
        <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full ${color} blur-3xl group-hover:opacity-100 transition-opacity duration-500 opacity-50`}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="mb-6 p-3.5 w-fit rounded-2xl bg-white border border-[#f0f0f5] shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">{icon}</div>
          <div className="text-4xl md:text-5xl font-bold gradient-text-dual mb-2 leading-none tracking-tight">
            {count}{suffix}
          </div>
          <div className="text-sm text-[#86868b] font-medium">{label}</div>
        </div>
      </div>
    </TiltCard>
  );
}

// 动态运行时间组件
function UptimeCounter({ startDate }: { startDate: string }) {
  const [uptime, setUptime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const start = new Date(startDate).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = now - start;
      
      setUptime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm mt-8 mx-auto"
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#28cd41] animate-pulse shadow-[0_0_8px_rgba(40,205,65,0.8)]"></div>
        <span className="text-[13px] font-medium text-[#86868b]">平台已稳定运行</span>
      </div>
      <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#1d1d1f] font-mono">
        <span>{uptime.days}</span><span className="text-[12px] font-normal text-[#86868b] mr-1">天</span>
        <span>{uptime.hours.toString().padStart(2, '0')}</span><span className="text-[12px] font-normal text-[#86868b] mr-1">时</span>
        <span>{uptime.minutes.toString().padStart(2, '0')}</span><span className="text-[12px] font-normal text-[#86868b] mr-1">分</span>
        <span className="text-[#0071e3] w-5 text-center inline-block">{uptime.seconds.toString().padStart(2, '0')}</span><span className="text-[12px] font-normal text-[#86868b]">秒</span>
      </div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex flex-col items-center justify-center text-center section-padding bg-[#fafafc] overflow-hidden">
        {/* 现代网格背景 */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        {/* 背景装饰光晕 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            animate={{ 
              x: [0, 30, -20, 0],
              y: [0, -30, 20, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#0071e3]/20 to-[#00c6ff]/20 blur-[120px] animate-halo"
          />
          <motion.div 
            animate={{ 
              x: [0, -40, 20, 0],
              y: [0, 40, -30, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-32 -right-24 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#28cd41]/20 to-[#0071e3]/10 blur-[130px] animate-halo" 
          />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl z-10"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card shadow-sm mb-8 animate-fade-up badge-pulse">
            <Sparkles className="w-4 h-4 text-[#0071e3] animate-pulse" />
            <span className="text-sm font-medium">3D 打印 · 信息科技 · 教育资源</span>
          </motion.div>
          <motion.h1 variants={itemVariants} className="heading-large mb-6 animate-fade-up delay-1">
            连接创意与 <span className="gradient-text-hero">未来教育</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-description mb-10 max-w-2xl mx-auto animate-fade-up delay-2">
            睿造打印工坊 (Rayzo print studio) 致力于中小学信息科技教育，提供全方位的教育资源包、原创IP周边与创作小工具，助力创意智造。
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center gap-4 md:gap-6 animate-fade-up delay-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Link to="/resources" className="btn-primary text-lg px-8 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 ripple-target h-[56px] w-full sm:w-[220px]">
                <span>获取课件资源</span> <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Link to="/advice" className="btn-secondary text-lg px-8 flex items-center justify-center bg-white ripple-target h-[56px] w-full sm:w-[220px]">
                <span>探索创作工具</span>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* 动态运行时间 */}
          <div className="flex justify-center w-full relative z-20">
            <UptimeCounter startDate="2025-01-01T00:00:00+08:00" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          className="mt-20 w-full max-w-5xl z-10"
        >
          <TiltCard>
            <div className="w-full aspect-video rounded-[3rem] shadow-2xl overflow-hidden bg-white border border-white/50 shimmer-border group animate-float">
              <img 
                src="https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+teenage+students+creative+maker+studio+3D+design+computer+colorful+mascot+robot+clean+line+art+cell+shading+soft+lighting+simple+bright+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_16_9" 
                alt="Rayzo Print Studio"
                className="w-full h-full object-cover transition-transform duration-[1.4s] group-hover:scale-105"
              />
            </div>
          </TiltCard>
        </motion.div>
      </section>

      {/* Stats Section - 数字滚动动画 */}
      <section className="section-padding bg-white relative z-10 -mt-10">
        <div className="max-w-7xl mx-auto p-4 md:p-8 rounded-[2.5rem] bg-white/50 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCounter
              target={128}
              suffix="+"
              label="合作中小学校"
              icon={<Users className="w-6 h-6 text-[#0071e3]" />}
              color="bg-[#0071e3]/20"
            />
            <StatCounter
              target={560}
              suffix="+"
              label="精选课件资源"
              icon={<FileCheck className="w-6 h-6 text-[#28cd41]" />}
              color="bg-[#28cd41]/20"
            />
            <StatCounter
              target={42}
              suffix="+"
              label="展示机型方案"
              icon={<Printer className="w-6 h-6 text-[#0071e3]" />}
              color="bg-[#00c6ff]/20"
            />
            <StatCounter
              target={8}
              suffix="+"
              label="创作小工具"
              icon={<Sparkles className="w-6 h-6 text-[#28cd41]" />}
              color="bg-[#28cd41]/20"
            />
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="section-padding bg-[#f5f5f7] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[420px] h-[420px] rounded-full bg-[#0071e3]/8 blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white text-[#86868b] text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                Core Services
              </div>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.08 }}
              className="heading-medium mb-4"
            >
              核心 <span className="gradient-text-dual">业务</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.16 }}
              className="text-description"
            >
              从原创内容到教育资源，提供一站式综合服务。
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {[
              {
                icon: <Printer className="w-10 h-10 text-[#0071e3]" />,
                title: "设备方案参考",
                desc: "创客团队真实使用整理的3D打印设备选型速览，含优缺点对比，供选购前综合参考。",
                link: "/printers",
                accent: "from-sky-50 to-transparent"
              },
              {
                icon: <ShoppingBag className="w-10 h-10 text-[#0071e3]" />,
                title: "原创IP周边",
                desc: "即将上线，价格超低。睿造原创IP形象设计与周边文创产品，敬请期待。",
                link: "/products",
                accent: "from-blue-50 to-transparent"
              },
              {
                icon: <BookOpen className="w-10 h-10 text-[#28cd41]" />,
                title: "信息科技课件",
                desc: "涵盖小学、初中、高中信息科技课程，包含创意设计、编程等全套教学资源包。",
                link: "/resources",
                accent: "from-emerald-50 to-transparent"
              },
              {
                icon: <Palette className="w-10 h-10 text-[#28cd41]" />,
                title: "创作工具箱",
                desc: "为创作者打造的实用小工具集合，包含素材模板、参数计算器与创意灵感指南。",
                link: "/advice",
                accent: "from-emerald-50 to-transparent"
              }
            ].map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                <TiltCard className="h-full">
                  <div className={`p-8 md:p-10 rounded-[2.5rem] bg-white border border-[#eaeaea] shadow-sm hover:shadow-2xl hover:shadow-[#0071e3]/10 transition-all duration-500 flex flex-col h-full relative overflow-hidden group`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.accent} opacity-40 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-8 p-4 bg-white/80 backdrop-blur-md border border-white w-fit rounded-2xl shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">{service.icon}</div>
                      <h3 className="text-2xl font-bold mb-4 text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors duration-300">{service.title}</h3>
                      <p className="text-[#86868b] leading-relaxed mb-8 flex-grow">{service.desc}</p>
                      <Link to={service.link} className="inline-flex items-center gap-2 text-[#0071e3] font-semibold w-fit group/link bg-white/50 px-4 py-2 rounded-full border border-transparent hover:border-[#0071e3]/20 hover:bg-[#0071e3]/5 transition-all">
                        了解更多 <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Education Focus Section */}
      <section className="section-padding bg-white relative overflow-hidden">
        {/* 辅助装饰光晕 */}
        <div className="absolute top-10 right-10 w-[360px] h-[360px] rounded-full bg-[#28cd41]/10 blur-[90px] animate-halo pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-block px-4 py-1 rounded-full bg-[#E6F4FF] text-[#0071e3] text-sm font-bold mb-6">教育专项</div>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.08 }}
              className="heading-medium mb-8 leading-tight"
            >
              助力中小学 <span className="gradient-text-dual">科创教育</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.16 }}
              className="text-description mb-10"
            >
              我们深知教育者的需求，精心打造了符合国家信息科技课程标准的课件包。从创意设计基础到编程项目实践，让课堂教学更有趣、更高效。
            </motion.p>
            <div className="grid grid-cols-2 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <TiltCard>
                  <div className="p-6 rounded-3xl bg-[#f5f5f7] shadow-sm card-hover relative overflow-hidden group shimmer-card h-full">
                    <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-[#0071e3]/10 blur-2xl group-hover:bg-[#0071e3]/25 transition-colors"></div>
                    <div className="relative">
                      <div className="text-4xl font-bold gradient-text-dual mb-2 leading-none">500+</div>
                      <div className="text-sm text-[#86868b]">精选课件资源</div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.28 }}
              >
                <TiltCard>
                  <div className="p-6 rounded-3xl bg-[#f5f5f7] shadow-sm card-hover relative overflow-hidden group shimmer-card h-full">
                    <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-[#28cd41]/10 blur-2xl group-hover:bg-[#28cd41]/25 transition-colors"></div>
                    <div className="relative">
                      <div className="text-4xl font-bold gradient-text-dual mb-2 leading-none">128+</div>
                      <div className="text-sm text-[#86868b]">合作中小学校</div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.36 }}
            >
              <Link to="/resources" className="btn-primary px-10 py-4 ripple-target inline-flex items-center justify-center">
                <span>浏览课件库</span>
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, x: 30 }}
            whileInView={{ scale: 1, opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.12 }}
            className="flex-1 w-full"
          >
            <TiltCard>
              <div 
                className="rounded-[3rem] shadow-2xl overflow-hidden relative shimmer-border group animate-float"
              >
                <img 
                  src="https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+cute+3D+robot+mascot+character+on+computer+screen+elementary+school+child+happy+designing+clean+line+art+cell+shading+soft+pastel+colors+simple+clean+white+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=square_hd" 
                  alt="Education Resources"
                  className="w-full h-full object-cover transition-transform duration-[1.4s] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-[#f5f5f7] text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="max-w-4xl mx-auto py-24 rounded-[4rem] bg-gradient-to-br from-[#E6F4FF] via-white to-[#F6FFED] shadow-xl border border-white relative overflow-hidden card-hover shimmer-card"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0071e3]/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-halo"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#28cd41]/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl animate-halo" style={{ animationDelay: "1.5s" }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-[#00c6ff]/10 blur-[120px] animate-halo" style={{ animationDelay: "0.8s" }}></div>
          
          <h2 className="heading-medium mb-8 z-10 relative">
            加入 <span className="gradient-text-dual">睿造打印工坊</span>
          </h2>
          <p className="text-description mb-12 px-6 z-10 relative max-w-2xl mx-auto">
            立即注册以获取免费的信息科技课件资源包，并订阅最新的创作工具更新邮件。
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 md:gap-6 z-10 relative">
            <Link to="/register" className="btn-primary text-lg px-12 ripple-target inline-flex items-center justify-center h-[56px] w-full sm:w-[220px]">
              <span>免费注册</span>
            </Link>
            <Link to="/contact" className="btn-secondary text-lg px-12 bg-white ripple-target inline-flex items-center justify-center h-[56px] w-full sm:w-[220px]">
              <span>咨询合作</span>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
