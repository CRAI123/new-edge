import { motion } from "framer-motion";
import { Shield, Star, Zap, Gem } from "lucide-react";
import { MemberLevel } from "@/store/useUserStore";

interface MemberBadgeProps {
  level: MemberLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const levelConfig = {
  1: {
    icon: <Zap className="w-full h-full" />,
    label: "龙蛋会员",
    color: "bg-[#F6FFED] text-[#28cd41] border-[#B7EB8F]",
    gradient: "from-[#28cd41] to-[#34d058]"
  },
  2: {
    icon: <Star className="w-full h-full" />,
    label: "幼龙会员",
    color: "bg-[#E6F4FF] text-[#0071e3] border-[#91CAFF]",
    gradient: "from-[#0071e3] to-[#00c6ff]"
  },
  3: {
    icon: <Shield className="w-full h-full" />,
    label: "鳞铸会员",
    color: "bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]",
    gradient: "from-[#2F54EB] to-[#597EF7]"
  },
  4: {
    icon: <Gem className="w-full h-full" />,
    label: "古龙典藏",
    color: "bg-[#FFF7E6] text-[#FA8C16] border-[#FFD591]",
    gradient: "from-[#FA8C16] to-[#FFA940]"
  }
};

export default function MemberBadge({ level, size = "md", showLabel = true }: MemberBadgeProps) {
  const config = levelConfig[level];
  
  const sizeClasses = {
    sm: "w-6 h-6 p-1",
    md: "w-10 h-10 p-2",
    lg: "w-16 h-16 p-4"
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={`${sizeClasses[size]} rounded-xl border ${config.color} shadow-sm flex items-center justify-center relative overflow-hidden`}
      >
        <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${config.gradient}`}></div>
        <div className="relative z-10">{config.icon}</div>
      </motion.div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-[#1d1d1f]">{config.label}</span>
          <span className="text-[10px] text-[#86868b] uppercase tracking-wider">LV{level}</span>
        </div>
      )}
    </div>
  );
}
