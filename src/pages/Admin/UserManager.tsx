import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  User as UserIcon, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  Mail,
  Calendar,
  Award
} from "lucide-react";
import MemberBadge from "@/components/Badge/MemberBadge";
import { MemberLevel } from "@/store/useUserStore";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  level: number;
  status: string;
  created_at: string;
  login_count: number;
  download_count: number;
}

export default function UserManager() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // 注意：这里需要 profiles 表与 auth.users 的关联，或者在 profiles 中冗余 email
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err.message);
      // Mock data if table doesn't exist yet
      setUsers([
        { id: '1', full_name: "张小明", email: "zhang@example.com", role: "teacher", level: 3, status: "active", created_at: "2026-08-15", login_count: 45, download_count: 12 },
        { id: '2', full_name: "王大壮", email: "wang@example.com", role: "student", level: 1, status: "pending", created_at: "2026-09-02", login_count: 2, download_count: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert(`更新失败: ${err.message}`);
    }
  };

  const handleUpdateLevel = async (id: string, currentLevel: number) => {
    const newLevel = prompt("请输入新的会员等级 (1-4):", currentLevel.toString());
    if (!newLevel || isNaN(parseInt(newLevel))) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ level: parseInt(newLevel) })
        .eq('id', id);

      if (error) throw error;
      setUsers(users.map(u => u.id === id ? { ...u, level: parseInt(newLevel) } : u));
    } catch (err: any) {
      alert(`更新失败: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1d1d1f]">用户与会员管理</h1>
            <p className="text-[#86868b] mt-1">管理用户权限、审核身份及等级状态</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
            <input 
              type="text" 
              placeholder="搜索用户名、邮箱或机构..."
              className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#ececef] transition-colors">
              <Filter className="w-4 h-4" />
              身份过滤
            </button>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white hover:shadow-xl hover:shadow-black/5 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center border border-[#d2d2d7]">
                    <UserIcon className="w-7 h-7 text-[#86868b]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1d1d1f]">{user.full_name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        user.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {user.status === 'active' ? '已激活' : '待审核'}
                      </span>
                      <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider bg-[#f5f5f7] px-2 py-0.5 rounded-full">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full hover:bg-[#f5f5f7] flex items-center justify-center text-[#86868b]">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-[#86868b]">
                  <Mail className="w-4 h-4" />
                  {user.email || '未绑定邮箱'}
                </div>
                <div className="flex items-center gap-3 text-sm text-[#86868b]">
                  <Calendar className="w-4 h-4" />
                  加入于 {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-3 text-sm text-[#86868b]">
                  <Award className="w-4 h-4" />
                  当前等级: <MemberBadge level={user.level as MemberLevel} size="sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[#f5f5f7]">
                <div className="text-center">
                  <p className="text-xs text-[#86868b] font-medium mb-1">登录频次</p>
                  <p className="text-lg font-bold text-[#1d1d1f]">{user.login_count}</p>
                </div>
                <div className="text-center border-l border-[#f5f5f7]">
                  <p className="text-xs text-[#86868b] font-medium mb-1">下载量</p>
                  <p className="text-lg font-bold text-[#1d1d1f]">{user.download_count}</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                {user.status === 'pending' ? (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(user.id, 'active')}
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#0071e3] text-white text-sm font-bold hover:bg-[#0077ed] transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      批准入会
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(user.id, 'rejected')}
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-[#d2d2d7] text-red-500 text-sm font-bold hover:bg-red-50 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      拒绝
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleUpdateLevel(user.id, user.level)}
                    className="col-span-2 py-3 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] text-sm font-bold hover:bg-[#ececef] transition-all"
                  >
                    调整会员等级
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
