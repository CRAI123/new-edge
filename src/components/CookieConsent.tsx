import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Check, X, ShieldCheck, FileText } from "lucide-react";

const STORAGE_KEY = "ruizao_cookie_consent";

type ConsentType = "essential" | "analytics" | "marketing";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const t = setTimeout(() => setShow(true), 800);
        return () => clearTimeout(t);
      }
    } catch (_) {
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const saveConsent = (data: Record<ConsentType, boolean>) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (_) { /* noop */ }
    setShow(false);
  };

  const handleAcceptAll = () => {
    const all = { essential: true, analytics: true, marketing: true };
    saveConsent(all);
  };

  const handleAcceptSelected = () => {
    saveConsent({ ...consents, essential: true });
  };

  const handleRejectAll = () => {
    saveConsent({ essential: true, analytics: false, marketing: false });
  };

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 120 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 120 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed z-[9998] bottom-0 left-0 right-0 px-4 pb-4 md:pb-8 pointer-events-none"
          >
            <div className="max-w-5xl mx-auto pointer-events-auto">
              <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] border border-white/60 overflow-hidden shimmer-card group">
                <div className="grid lg:grid-cols-[auto_1fr_auto] gap-6 lg:gap-8 p-6 md:p-8 items-stretch relative z-10">
                  <div className="flex items-start gap-4 items-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0071e3]/10 to-[#28cd41]/10 flex items-center justify-center shrink-0 border border-white shadow-inner">
                      <Cookie className="w-7 h-7 text-[#0071e3]" />
                    </div>
                    <div className="lg:max-w-md">
                      <h3 className="text-lg md:text-xl font-bold text-[#1d1d1f] mb-1.5">
                        Cookie 与隐私偏好
                      </h3>
                      <p className="text-sm text-[#86868b] leading-relaxed">
                        我们使用 Cookie 来改进您的浏览体验、分析网站流量并提供个性化内容。
                        您可以选择接受、自定义或拒绝非必要 Cookie。
                      </p>
                      <button
                        onClick={() => setShowPolicy(true)}
                        className="mt-2 text-xs font-semibold text-[#0071e3] hover:underline inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        查看完整隐私政策
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 text-xs lg:border-l lg:border-[#d2d2d7]/50 lg:pl-8">
                    {(
                      [
                        { key: "essential", label: "必要 Cookie", desc: "网站正常运行必需", disabled: true },
                        { key: "analytics", label: "分析 Cookie", desc: "匿名流量统计" },
                        { key: "marketing", label: "营销 Cookie", desc: "个性化推荐" },
                      ] as { key: ConsentType; label: string; desc: string; disabled?: boolean }[]
                    ).map((item) => (
                      <label
                        key={item.key}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full ${
                          item.disabled ? "bg-[#f5f5f7]" : "bg-white hover:bg-[#f5f5f7] cursor-pointer border border-transparent hover:border-[#0071e3]/10"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={consents[item.key]}
                          disabled={item.disabled}
                          onChange={(e) =>
                            setConsents((prev) => ({ ...prev, [item.key]: e.target.checked }))
                          }
                          className="w-4 h-4 rounded border-[#d2d2d7] text-[#0071e3] focus:ring-[#0071e3]/10 shrink-0"
                        />
                        <div className="flex-grow min-w-0 whitespace-nowrap">
                          <div className="font-bold text-[#1d1d1f] inline-block mr-2">
                            {item.label}
                          </div>
                          <span className="text-[#86868b]">· {item.desc}</span>
                        </div>
                        {item.disabled && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] text-[10px] font-bold uppercase tracking-wider shrink-0">
                            始终启用
                          </span>
                        )}
                      </label>
                    ))}
                  </div>

                  <div className="flex lg:flex-col gap-2 lg:gap-3 lg:w-52">
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 md:flex-none btn-primary py-3 md:py-3.5 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-blue-500/20"
                    >
                      <Check className="w-4 h-4" />
                      全部接受
                    </button>
                    <button
                      onClick={handleAcceptSelected}
                      className="flex-1 md:flex-none py-3 md:py-3 rounded-2xl border border-[#d2d2d7] text-[#1d1d1f] font-semibold hover:bg-[#f5f5f7] transition-all"
                    >
                      保存选择
                    </button>
                    <button
                      onClick={handleRejectAll}
                      className="flex-1 md:flex-none py-3 md:py-3 rounded-2xl text-[#86868b] font-semibold hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all text-sm"
                    >
                      仅必要项
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPolicy && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#1d1d1f]/60 backdrop-blur-md"
              onClick={() => setShowPolicy(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[85vh] shimmer-border group"
            >
              <div className="sticky top-0 bg-gradient-to-r from-[#0071e3] to-[#28cd41] px-8 py-6 flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-grow pt-0.5">
                  <div className="text-xs uppercase tracking-[0.22em] font-bold text-white/85">
                    隐私政策
                  </div>
                  <div className="text-xl font-bold text-white mt-1">睿造打印工坊隐私政策</div>
                </div>
                <button
                  onClick={() => setShowPolicy(false)}
                  className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center shrink-0 transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              <div className="px-8 py-6 overflow-y-auto max-h-[calc(85vh-180px)] text-sm text-[#86868b] leading-relaxed space-y-5">
                <section>
                  <h4 className="font-bold text-[#1d1d1f] mb-2 text-base">1. 信息收集</h4>
                  <p>
                    我们仅在您自愿注册、登录或使用服务时收集必要信息，包括邮箱、姓名及用户角色。
                    所有账号验证通过 Supabase Auth 完成，密码采用行业标准加密存储。
                  </p>
                </section>
                <section>
                  <h4 className="font-bold text-[#1d1d1f] mb-2 text-base">2. Cookie 使用</h4>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><b className="text-[#1d1d1f]">必要 Cookie：</b>维持登录会话与偏好设置，始终启用。</li>
                    <li><b className="text-[#1d1d1f]">分析 Cookie：</b>用于匿名统计页面访问情况以优化用户体验。</li>
                    <li><b className="text-[#1d1d1f]">营销 Cookie：</b>用于后续活动的个性化推荐（如启用）。</li>
                  </ul>
                </section>
                <section>
                  <h4 className="font-bold text-[#1d1d1f] mb-2 text-base">3. 数据使用</h4>
                  <p>
                    您的个人信息仅用于提供本网站核心服务（账号、资源下载、消息通知），不会出售、出租或共享给第三方用于营销目的。
                    Supabase、GitHub OAuth、Resend、DeepSeek 等第三方服务提供商受其各自隐私政策约束。
                  </p>
                </section>
                <section>
                  <h4 className="font-bold text-[#1d1d1f] mb-2 text-base">4. 您的权利</h4>
                  <p>
                    您可随时请求查看、更正或删除您的个人数据，或撤回对非必要 Cookie 的同意。
                    联系方式：<span className="text-[#0071e3] font-semibold">2623681461@qq.com</span>（湖南长沙）。
                  </p>
                </section>
                <section>
                  <h4 className="font-bold text-[#1d1d1f] mb-2 text-base">5. 政策更新</h4>
                  <p>
                    本政策于 2026 年 9 月 6 日更新。我们将在变更时通过站内通知告知。
                  </p>
                </section>
                <div className="pt-2">
                  <button
                    onClick={() => setShowPolicy(false)}
                    className="w-full btn-primary py-3.5 font-semibold"
                  >
                    我已了解
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
