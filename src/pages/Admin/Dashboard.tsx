import { motion } from "framer-motion";
import { 
  Users, 
  FileUp, 
  Activity, 
  TrendingUp, 
  ChevronRight,
  Package,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const stats = [
    { label: "总用户数", value: "1,284", icon: <Users />, color: "bg-blue-500" },
    { label: "资源下载", value: "856", icon: <TrendingUp />, color: "bg-green-500" },
    { label: "活跃会员", value: "432", icon: <Activity />, color: "bg-purple-500" },
    { label: "课程课件", value: "128", icon: <Package />, color: "bg-orange-500" },
  ];

  const recentActivities = [
    { user: "张老师", action: "上传了新课件", target: "初中信息技术-3D建模入门", time: "10分钟前" },
    { user: "李同学", action: "下载了资源", target: "Rayzo 打印机维护手册", time: "25分钟前" },
    { user: "王主管", action: "审核了新会员", target: "龙蛋会员 -> 幼龙会员", time: "1小时前" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1d1d1f]">后台管理概览</h1>
            <p className="text-[#86868b] mt-1">欢迎回来，系统管理员</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/resources" className="btn-primary flex items-center gap-2 px-6">
              <FileUp className="w-4 h-4" />
              发布新资源
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-white flex items-center gap-5"
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.color} text-white flex items-center justify-center shadow-lg shadow-black/5`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-[#86868b]">{stat.label}</p>
                <p className="text-2xl font-bold text-[#1d1d1f]">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white">
              <h2 className="text-xl font-bold mb-6 text-[#1d1d1f]">快速入口</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/admin/users" className="group p-6 rounded-3xl bg-[#f5f5f7] hover:bg-[#0071e3] transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-white transition-colors">用户管理</h3>
                      <p className="text-sm text-[#86868b] group-hover:text-white/80 transition-colors">审核会员状态与等级</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#86868b] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
                <Link to="/admin/resources" className="group p-6 rounded-3xl bg-[#f5f5f7] hover:bg-[#0071e3] transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-white transition-colors">课件资源</h3>
                      <p className="text-sm text-[#86868b] group-hover:text-white/80 transition-colors">上传与维护教育资源</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#86868b] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
                <Link to="/admin/printers" className="group p-6 rounded-3xl bg-[#f5f5f7] hover:bg-[#0071e3] transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-white transition-colors">设备管理</h3>
                      <p className="text-sm text-[#86868b] group-hover:text-white/80 transition-colors">维护前台打印机数据</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#86868b] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white">
              <h2 className="text-xl font-bold mb-6 text-[#1d1d1f]">近期动态</h2>
              <div className="space-y-6">
                {recentActivities.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 pb-6 border-b border-[#f5f5f7] last:border-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#0071e3]">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#1d1d1f]">{item.user}</span>
                        <span className="text-xs text-[#86868b]">{item.time}</span>
                      </div>
                      <p className="text-sm text-[#86868b]">
                        {item.action} <span className="text-[#1d1d1f] font-medium">{item.target}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-[#0071e3] to-[#00c6ff] rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20">
              <h2 className="text-xl font-bold mb-2">系统状态</h2>
              <p className="text-white/80 text-sm mb-6">所有服务运行正常</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Supabase 连接</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20">在线</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>存储空间</span>
                  <span>45.8 GB / 100 GB</span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-white h-full w-[45%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
