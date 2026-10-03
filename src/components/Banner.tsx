import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Megaphone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BannerData {
  enabled: boolean;
  text: string;
  link: string;
}

export default function Banner() {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${apiBaseUrl}/api/settings/banner`);
        if (res.ok) {
          const payload = await res.json();
          if (payload.success && payload.data) {
            setBanner(payload.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch banner:", err);
      }
    };

    fetchBanner();
  }, []);

  // 只有在首页 (路径为 '/') 才显示横幅
  if (!banner || !banner.enabled || !isVisible || location.pathname !== '/') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0, scale: 0.95 }}
        animate={{ height: 'auto', opacity: 1, scale: 1 }}
        exit={{ height: 0, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-gradient-to-r from-[#0071e3] to-[#28cd41] text-white relative z-50 overflow-hidden rounded-2xl shadow-lg border border-white/20 backdrop-blur-md"
      >
        <div className="px-5 py-3 md:py-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex-1 flex items-center justify-center min-w-0">
              <Megaphone className="w-4 h-4 mr-2 flex-shrink-0 opacity-80" />
              <p className="text-sm font-medium truncate">
                {banner.text}
              </p>
              {banner.link && (
                <span className="flex-shrink-0 ml-2">
                  {banner.link.startsWith('http') ? (
                    <a 
                      href={banner.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white font-bold underline underline-offset-2 flex items-center text-sm hover:text-white/80 transition-colors"
                    >
                      了解更多 <ChevronRight className="w-3 h-3 ml-0.5" />
                    </a>
                  ) : (
                    <Link 
                      to={banner.link} 
                      className="text-white font-bold underline underline-offset-2 flex items-center text-sm hover:text-white/80 transition-colors"
                    >
                      了解更多 <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  )}
                </span>
              )}
            </div>
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsVisible(false)}
                className="flex p-1 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
              >
                <span className="sr-only">关闭横幅</span>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
