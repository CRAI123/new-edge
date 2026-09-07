import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  User as UserIcon, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  Mail,
  Calendar,
  Award,
  Loader2,
  AlertCircle,
  Eye,
  Crown,
  Flame,
  Check
} from "lucide-react";
import MemberBadge from "@/components/Badge/MemberBadge";
import { MemberLevel } from "@/store/useUserStore";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/lib/utils";

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
  browse_count: number;
}

export default function UserManager() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [editingLevelUserId, setEditingLevelUserId] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message || "无法获取用户数据，请检查 RLS 权限");
      }

      console.log("真实用户数据:", data);
      setUsers((data || []) as Profile[]);
      if ((data?.length ?? 0) > 0) {
        showToast("success", `成功同步 ${data!.length} 位真实用户数据`);
      }
    } catch (err: any) {
      console.error('获取用户失败:', err.message);
      setError(err.message || "加载失败");
      setUsers([]);
      showToast("error", err.message || "用户数据加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setSavingUserId(id);
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
      showToast("success", `状态已更新为「${statusMap[newStatus]?.label || newStatus}」`);
    } catch (err: any) {
      showToast("error", `更新失败: ${err.message}`);
    } finally {
      setSavingUserId(null);
    }
  };

  const handleSelectLevel = async (id: string, newLevel: number) => {
    try {
      setSavingUserId(id);
      const { error } = await supabase
        .from('profiles')
        .update({ level: newLevel, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setUsers(users.map(u => u.id === id ? { ...u, level: newLevel } : u));
      setEditingLevelUserId(null);
      showToast("success", `会员等级已调整为 LV.${newLevel}`);
    } catch (err: any) {
      showToast("error", `更新失败: ${err.message}`);
    } finally {
      setSavingUserId(null);
    }
  };

  const handleMenuClick = (user: Profile) => {
    showToast("info", `「${user.full_name || user.email}」用户视角预览功能将在后续版本上线，敬请期待`);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = searchQuery.trim() === "" 
        ? true 
        : (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) 
          || (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === "all" ? true : u.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  const roleMap: Record<string, string> = {
    "admin": "超级管理员",
    "teacher": "教师会员",
    "student": "学生会员",
    "individual": "个人会员",
  };

  const statusMap: Record<string, { label: string; cls: string }> = {
    "active": { label: "已激活", cls: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    "pending": { label: "待审核", cls: "bg-amber-50 text-amber-600 border border-amber-100" },
    "rejected": { label: "已拒绝", cls: "bg-rose-50 text-rose-600 border border-rose-100" },
    "banned": { label: "已冻结", cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  };

  const levelOptions: { lv: MemberLevel; label: string; desc: string }[] = [
    { lv: 1, label: "LV.1", desc: "龙蛋会员" },
    { lv: 2, label: "LV.2", desc: "幼龙会员" },
    { lv: 3, label: "LV.3", desc: "飞龙会员" },
    { lv: 4, label: "LV.4", desc: "巨龙会员" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 px-6 md:px-12 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1d1d1f]">用户与会员管理</h1>
            <p className="text-[#86868b] mt-1">
              共 {users.length} 位注册用户 · 
              待审核 {users.filter(u => u.status === 'pending').length} 人 · 
              已激活 {users.filter(u => u.status === 'active').length} 人
            </p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-white border border-[#0071e3]/20 text-[#0071e3] font-semibold hover:bg-[#0071e3]/5 transition-all shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ripple-target"
          >
            <Eye className={"w-4 h-4 " + (loading ? "animate-spin" : "")} />
            {loading ? "同步中..." : "刷新真实数据"}
          </button>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white mb-8 flex flex-col md:flex-row gap-4 shimmer-card group relative z-10">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索真实用户名、邮箱..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#ececef] transition-colors outline-none font-medium text-sm"
            >
              <option value="all">全部身份</option>
              <option value="admin">管理员</option>
              <option value="teacher">教师</option>
              <option value="student">学生</option>
              <option value="individual">个人</option>
            </select>
          </div>
        </div>

        {/* Loading / Error / Empty */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] shadow-sm shimmer-border group relative z-10">
            <Loader2 className="w-10 h-10 text-[#0071e3] animate-spin mb-4" />
            <p className="text-[#86868b]">正在从数据库同步真实用户数据...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 bg-rose-50/50 border border-rose-100 rounded-[2.5rem]">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">数据加载失败</h3>
            <p className="text-rose-600 mb-6 max-w-md text-center px-4">{error}</p>
            <p className="text-[#86868b] text-sm max-w-lg text-center px-4 mb-6">
              请确认已在 Supabase SQL Editor 运行了本页提供的补丁 SQL，
              并在 Auth 中注册过至少一个测试账号。
            </p>
            <button
              onClick={fetchUsers}
              className="px-6 py-3 rounded-2xl bg-[#0071e3] text-white font-bold hover:bg-[#0077ed] transition-all ripple-target"
            >
              重新加载
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] shadow-sm border border-white shimmer-border group relative z-10">
            <UserIcon className="w-16 h-16 text-[#86868b]/20 mb-6" />
            <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">
              {users.length === 0 ? "暂无注册用户" : "没有匹配的用户"}
            </h3>
            <p className="text-[#86868b] text-center max-w-md px-4">
              {users.length === 0 
                ? "当有用户通过网站右上角注册后，会自动出现在此处。您也可以在 Supabase Auth 中手动创建账号测试。"
                : "请尝试调整搜索关键词或身份过滤条件。"}
            </p>
          </div>
        ) : (
          /* Users Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUsers.map((user, idx) => {
              const s = statusMap[user.status] || statusMap["active"];
              const isAdmin = user.role === "admin";
              const isEditingLevel = editingLevelUserId === user.id;
              const isSaving = savingUserId === user.id;
              let cardCls = "bg-white rounded-[2.5rem] p-8 shadow-sm border hover:shadow-xl hover:shadow-black/5 transition-all group relative shimmer-card";
              cardCls += isAdmin
                ? " ring-2 ring-[#0071e3]/20 border-white"
                : " border-white";
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  layout
                  className={cardCls}
                >
                  {isAdmin && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#0071e3] to-[#28cd41] text-white text-[10px] font-black flex items-center gap-1 shadow-lg">
                        <Crown className="w-3 h-3" />
                        ADMIN
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      {(() => {
                        let avatarCls = "w-14 h-14 rounded-2xl flex items-center justify-center border";
                        avatarCls += isAdmin
                          ? " bg-gradient-to-br from-[#0071e3]/10 to-[#28cd41]/10 border-[#0071e3]/20"
                          : " bg-[#f5f5f7] border-[#d2d2d7]";
                        const iconCls = "w-7 h-7 " + (isAdmin ? "text-[#0071e3]" : "text-[#86868b]");
                        return (
                          <>
                            <div className={avatarCls}>
                              <UserIcon className={iconCls} />
                            </div>
                          </>
                        );
                      })()}
                      <div>
                        <h3 className="text-lg font-bold text-[#1d1d1f]">
                          {user.full_name || "未命名用户"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${s.cls}`}>
                            {s.label}
                          </span>
                          <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider bg-[#f5f5f7] px-2.5 py-0.5 rounded-full">
                            {roleMap[user.role] || user.role || "用户"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleMenuClick(user)}
                      className="w-8 h-8 rounded-full hover:bg-[#f5f5f7] flex items-center justify-center text-[#86868b] hover:text-[#0071e3] hover:bg-[#0071e3]/5 transition-all"
                      title="更多操作"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3.5 mb-8">
                    <div className="flex items-center gap-3 text-sm text-[#86868b] break-all">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span title={user.email}>{user.email || '未绑定邮箱'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#86868b]">
                      <Calendar className="w-4 h-4 shrink-0" />
                      加入于 {new Date(user.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#86868b]">
                      <Award className="w-4 h-4 shrink-0" />
                      <div className="flex items-center gap-2">
                        <span className="shrink-0">当前等级:</span>
                        <MemberBadge level={(user.level || 1) as MemberLevel} size="sm" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-5 border-t border-[#f5f5f7]">
                    <div className="text-center px-2">
                      <p className="text-[10px] text-[#86868b] font-medium mb-1">登录</p>
                      <p className="text-base font-bold text-[#1d1d1f]">{user.login_count ?? 0}</p>
                    </div>
                    <div className="text-center border-x border-[#f5f5f7] px-2">
                      <p className="text-[10px] text-[#86868b] font-medium mb-1">浏览</p>
                      <p className="text-base font-bold text-[#1d1d1f]">{user.browse_count ?? 0}</p>
                    </div>
                    <div className="text-center px-2">
                      <p className="text-[10px] text-[#86868b] font-medium mb-1">下载</p>
                      <p className="text-base font-bold text-[#1d1d1f]">{user.download_count ?? 0}</p>
                    </div>
                  </div>

                  {/* 底部操作区 */}
                  <AnimatePresence mode="wait">
                    {!isEditingLevel ? (
                      <motion.div
                        key="actions"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-7 grid grid-cols-2 gap-3">
                          {user.status === 'pending' ? (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(user.id, 'active')}
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#0071e3] text-white text-sm font-bold hover:bg-[#0077ed] transition-all disabled:opacity-60 disabled:cursor-not-allowed ripple-target"
                              >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                批准入会
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(user.id, 'rejected')}
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-rose-200 text-rose-600 text-sm font-bold hover:bg-rose-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                拒绝
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => setEditingLevelUserId(user.id)}
                              disabled={isSaving}
                              className="col-span-2 py-3 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] text-sm font-bold hover:bg-[#ececef] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4 text-orange-500" />}
                              调整会员等级 (当前 LV{user.level || 1})
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="level-selector"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-7">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2">
                              <Flame className="w-4 h-4 text-orange-500" />
                              选择新的会员等级
                            </span>
                            <button
                              onClick={() => setEditingLevelUserId(null)}
                              className="text-xs text-[#86868b] hover:text-[#0071e3] font-semibold px-2.5 py-1 rounded-xl hover:bg-[#f5f5f7] transition-all"
                            >
                              取消
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            {levelOptions.map(opt => {
                              const active = (user.level || 1) === opt.lv;
                              return (
                                <button
                                  key={opt.lv}
                                  onClick={() => handleSelectLevel(user.id, opt.lv)}
                                  disabled={isSaving}
                                  className={(() => {
                                    let cls = "relative p-4 rounded-2xl text-left transition-all border-2";
                                    cls += active
                                      ? " bg-gradient-to-br from-[#0071e3]/5 to-[#28cd41]/5 border-[#0071e3]/30 shadow-inner"
                                      : " bg-[#fafafa] border-transparent hover:border-[#d2d2d7] hover:bg-white";
                                    cls += " disabled:opacity-60 disabled:cursor-not-allowed";
                                    return cls;
                                  })()}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <MemberBadge level={opt.lv} size="sm" />
                                    {active && <Check className="w-3.5 h-3.5 text-[#0071e3]" />}
                                  </div>
                                  <p className="text-[11px] text-[#86868b] font-medium">{opt.desc}</p>
                                </button>
                              );
                            })}
                          </div>
                          {user.status !== 'pending' && (
                            <button
                              onClick={() => setEditingLevelUserId(null)}
                              className="mt-4 w-full py-2.5 rounded-xl text-xs text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all font-semibold"
                            >
                              ← 返回其他操作
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
