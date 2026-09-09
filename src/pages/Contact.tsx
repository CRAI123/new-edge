import { motion } from "framer-motion";
import { Mail, MapPin, Send } from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      message: formData.get("message"),
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mailto = `mailto:2623681461@qq.com?subject=${encodeURIComponent(`【网站留言】来自 ${data.name} 的咨询`)}&body=${encodeURIComponent(`姓名：${data.name}\n邮箱：${data.email}\n电话：${data.phone}\n\n留言内容：\n${data.message}`)}`;
      
      setStatus("success");
      (e.target as HTMLFormElement).reset();
      
      setTimeout(() => {
        setStatus("idle");
        if (window.confirm("留言已记录！是否打开邮件客户端发送正式邮件？")) {
          window.location.href = mailto;
        }
      }, 2500);
    } catch (error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="pt-24 min-h-screen">
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] text-xs font-bold uppercase tracking-wider mb-6">
              Get In Touch
            </div>
            <h1 className="heading-medium mb-6">联系我们</h1>
            <p className="text-description max-w-2xl mx-auto">
              青少年创客团队 · 邮件沟通优先 · 我们会在工作日 1~3 日内逐一回复。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-2xl font-bold mb-8"
              >
                联系方式
              </motion.h3>
              <div className="space-y-6">
                {[
                  { icon: <Mail className="w-6 h-6 text-[#0071e3]" />, title: "联系邮箱", lines: ["2623681461@qq.com", "合作 · 咨询 · 资源需求"] },
                  { icon: <MapPin className="w-6 h-6 text-[#0071e3]" />, title: "工作室所在地", lines: ["湖南 · 长沙", "学生创客团队，线下交流请提前邮件预约"] }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className="flex items-start gap-6 p-6 rounded-[2rem] bg-[#f5f5f7] card-hover shimmer-card group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm glow-ring">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 text-[#1d1d1f]">{item.title}</h4>
                      {item.lines.map((line, i) => (
                        <p key={i} className="text-[#86868b]">{line}</p>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Map Placeholder */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-12 rounded-3xl overflow-hidden aspect-video bg-[#f5f5f7] shimmer-border group tilt-card"
              >
                <img 
                  src="https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic+manga+illustration+city+street+map+with+simple+location+pin+marker+clean+line+art+cell+shading+soft+light+colors+simple+plain+background+no+brand+logo+no+watermark+authentic+anime+style&image_size=landscape_4_3" 
                  alt="Map"
                  className="w-full h-full object-cover grayscale opacity-70 group-hover:opacity-90 group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </motion.div>
            </div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-[#f5f5f7] p-8 md:p-12 rounded-[3rem] shimmer-border group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0071e3]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-8 text-[#1d1d1f]">在线留言</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="input-glow">
                      <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">姓名</label>
                      <input 
                        name="name"
                        required
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border border-[#d2d2d7] bg-white outline-none transition-all"
                        placeholder="如何称呼您"
                      />
                    </div>
                    <div className="input-glow">
                      <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">联系邮箱</label>
                      <input 
                        name="contact_email"
                        type="email" 
                        className="w-full px-4 py-3 rounded-xl border border-[#d2d2d7] bg-white outline-none transition-all"
                        placeholder="选填：便于我们及时回复"
                      />
                    </div>
                  </div>
                  <div className="input-glow">
                    <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">电子邮箱</label>
                    <input 
                      name="email"
                      required
                      type="email" 
                      className="w-full px-4 py-3 rounded-xl border border-[#d2d2d7] bg-white outline-none transition-all"
                      placeholder="example@company.com"
                    />
                  </div>
                  <div className="input-glow">
                    <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">需求描述</label>
                    <textarea 
                      name="message"
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-[#d2d2d7] bg-white outline-none transition-all resize-none"
                      placeholder="请告诉我们您的具体需求或建议..."
                    ></textarea>
                  </div>
                  
                  <button 
                    disabled={status === "loading"}
                    type="submit" 
                    className="w-full btn-primary py-4 flex items-center justify-center gap-2 btn-shine ripple-target"
                  >
                    {status === "loading" ? "发送中..." : status === "success" ? "发送成功！" : status === "error" ? "发送失败，请重试" : (
                      <>发送消息 <Send className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
