import { motion } from "framer-motion";
import { 
  Users, 
  FileUp, 
  Activity, 
  TrendingUp, 
  ChevronRight,
  Package,
  Clock,
  Printer,
  FileCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    downloads: 0,
    activeMembers: 0,
    resources: 0
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      // 1. 获取总用户数
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      // 2. 获取活跃会员 (status为active)
      const { count: activeMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
        
      // 3. 获取资源总数和下载量
      const { count: resourcesCount, data: resourcesData } = await supabase
        .from('resources')
        .select('downloads, title, created_at', { count: 'exact' });
        
      const totalDownloads = resourcesData?.reduce((sum, item) => sum + (item.downloads || 0), 0) || 0;

      // 只有在能正常获取到数据时才更新状态
      if (totalUsers !== null) {
        setStatsData({
          totalUsers: totalUsers || 0,
          activeMembers: activeMembers || 0,
          resources: resourcesCount || 0,
          downloads: totalDownloads
        });
      }

      // 4. 尝试获取最新的真实动态
      const { data: latestUsers } = await supabase
        .from('profiles')
        .select('full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      const activities = [];
      
      if (resourcesData && resourcesData.length > 0) {
        const sortedResources = [...resourcesData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        sortedResources.slice(0, 2).forEach(r => {
          activities.push({
            user: "管理员",
            action: "上传了新资源",
            target: r.title,
            time: new Date(r.created_at).toLocaleDateString(),
            timestamp: new Date(r.created_at).getTime()
          });
        });
      }

      if (latestUsers && latestUsers.length > 0) {
        latestUsers.forEach(u => {
          activities.push({
            user: u.full_name || "新用户",
            action: "注册了账号",
            target: "",
            time: new Date(u.created_at).toLocaleDateString(),
            timestamp: new Date(u.created_at).getTime()
          });
        });
      }

      activities.sort((a, b) => b.timestamp - a.timestamp);
      
      if (activities.length > 0) {
        setRecentActivities(activities.slice(0, 3));
      }

    } catch (error: any) {
      console.error("获取真实数据失败:", error);
      setStatsData({ totalUsers: 0, downloads: 0, activeMembers: 0, resources: 0 });
      setRecentActivities([]);
    }
  };

  const stats = [
    { label: "总用户数", value: statsData.totalUsers.toLocaleString(), icon: <Users />, color: "bg-blue-500" },
    { label: "资源下载", value: statsData.downloads.toLocaleString(), icon: <TrendingUp />, color: "bg-green-500" },
    { label: "活跃会员", value: statsData.activeMembers.toLocaleString(), icon: <Activity />, color: "bg-purple-500" },
    { label: "课程课件", value: statsData.resources.toLocaleString(), icon: <Package />, color: "bg-orange-500" },
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
              className="bg-white p-6 rounded-3xl shadow-sm border border-white flex items-center gap-5 shimmer-card group relative"
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
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border group relative z-10">
              <h2 className="text-xl font-bold mb-6 text-[#1d1d1f]">快速入口</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <Link to="/admin/printers" className="group p-6 rounded-3xl bg-[#f5f5f7] hover:bg-[#28cd41] transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-white transition-colors">设备管理</h3>
                      <p className="text-sm text-[#86868b] group-hover:text-white/80 transition-colors">维护前台打印机展示数据</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Printer className="w-4 h-4 text-[#86868b] group-hover:text-white transition-colors" />
                      <ChevronRight className="w-5 h-5 text-[#86868b] group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
                <Link to="/admin/orders" className="group p-6 rounded-3xl bg-[#f5f5f7] hover:bg-[#0071e3] transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-white transition-colors">订单管理</h3>
                      <p className="text-sm text-[#86868b] group-hover:text-white/80 transition-colors">处理客户订单与状态</p>
                    </div>
                    <Package className="w-5 h-5 text-[#86868b] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
                <Link to="/order-generator" className="group p-6 rounded-3xl bg-gradient-to-br from-violet-50 to-white hover:from-[#8b5cf6] hover:to-[#7c3aed] transition-all duration-300 border border-violet-100 hover:border-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-white transition-colors">订单生成器</h3>
                      <p className="text-sm text-[#86868b] group-hover:text-white/80 transition-colors">自定义订单与分享图</p>
                    </div>
                    <FileCheck className="w-5 h-5 text-[#8b5cf6] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border group relative z-10">
              <h2 className="text-xl font-bold mb-6 text-[#1d1d1f]">近期动态</h2>
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="w-12 h-12 text-[#86868b]/20 mb-4" />
                  <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">暂无动态</h3>
                  <p className="text-sm text-[#86868b] max-w-sm">
                    当有新用户注册、或您上传了新的课件资源后，动态会自动出现在这里。
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {recentActivities.map((item: any, index: number) => (
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
              )}
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
