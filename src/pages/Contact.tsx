import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStatus("success");
        (e.target as HTMLFormElement).reset();
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <div className="pt-24 min-h-screen">
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h1 className="heading-medium mb-6">联系我们</h1>
            <p className="text-description max-w-2xl mx-auto">
              无论您有任何问题或合作意向，我们都随时待命。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h3 className="text-2xl font-bold mb-8">联系方式</h3>
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-[#0071e3]" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">电子邮件</h4>
                    <p className="text-[#86868b]">support@rzprint.com</p>
                    <p className="text-[#86868b]">business@rzprint.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-[#28cd41]" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">客服热线</h4>
                    <p className="text-[#86868b]">400-123-4567</p>
                    <p className="text-[#86868b]">周一至周五 9:00 - 18:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-[#0071e3]" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">公司地址</h4>
                    <p className="text-[#86868b]">湖南省长沙市高新区科技园</p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="mt-12 rounded-3xl overflow-hidden aspect-video bg-[#f5f5f7]">
                <img 
                  src="https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=Minimalist+map+illustration+of+a+city+district+with+a+single+blue+pin+clean+Apple+style&image_size=landscape_4_3" 
                  alt="Map"
                  className="w-full h-full object-cover grayscale opacity-50"
                />
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-[#f5f5f7] p-8 md:p-12 rounded-[3rem]">
              <h3 className="text-2xl font-bold mb-8">在线留言</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">姓名</label>
                    <input 
                      name="name"
                      required
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-[#d2d2d7] focus:border-[#0071e3] outline-none transition-all"
                      placeholder="如何称呼您"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">电话</label>
                    <input 
                      name="phone"
                      required
                      type="tel" 
                      className="w-full px-4 py-3 rounded-xl border border-[#d2d2d7] focus:border-[#0071e3] outline-none transition-all"
                      placeholder="您的联系电话"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">电子邮箱</label>
                  <input 
                    name="email"
                    required
                    type="email" 
                    className="w-full px-4 py-3 rounded-xl border border-[#d2d2d7] focus:border-[#0071e3] outline-none transition-all"
                    placeholder="example@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">需求描述</label>
                  <textarea 
                    name="message"
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-[#d2d2d7] focus:border-[#0071e3] outline-none transition-all resize-none"
                    placeholder="请告诉我们您的具体需求或建议..."
                  ></textarea>
                </div>
                
                <button 
                  disabled={status === "loading"}
                  type="submit" 
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                >
                  {status === "loading" ? "发送中..." : status === "success" ? "发送成功！" : status === "error" ? "发送失败，请重试" : (
                    <>发送消息 <Send className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
