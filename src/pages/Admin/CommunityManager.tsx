import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Loader2, Search, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/utils';
import { useUserStore } from '@/store/useUserStore';
import { useNavigate } from 'react-router-dom';

export default function CommunityManager() {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 只允许 admin 访问内容管理
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      showToast('error', '无权限访问该页面');
      navigate('/admin');
    }
  }, [user, navigate]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      console.error('Fetch posts error:', err);
      showToast('error', '获取帖子列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (postId: string) => {
    if (!confirm('确定要永久删除这篇帖子吗？此操作不可恢复。')) return;

    setDeletingId(postId);
    try {
      // 1. 先删除关联的媒体记录（如果数据库没有配置级联删除）
      await supabase.from('post_media').delete().eq('post_id', postId);
      
      // 2. 删除帖子本身
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      
      if (error) throw error;

      showToast('success', '帖子已删除');
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      console.error('Delete post error:', err);
      showToast('error', '删除失败，请确保您有相应的权限');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#0071e3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-[#0071e3]" />
            <h1 className="text-3xl font-bold text-[#1d1d1f]">社区内容管理</h1>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索帖子、内容或作者..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7]/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 w-1/4">作者</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 w-1/3">标题 / 内容片段</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">发布时间</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={post.id} 
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={post.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} 
                            alt="avatar" 
                            className="w-10 h-10 rounded-full object-cover bg-gray-100"
                          />
                          <span className="font-medium text-gray-900">{post.profiles?.full_name || '匿名用户'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 mb-1 truncate max-w-xs" title={post.title}>
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs" title={post.content}>
                          {post.content}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.status === 'approved' ? 'bg-green-100 text-green-800' :
                          post.status === 'pending_manual' ? 'bg-orange-100 text-orange-800' :
                          post.status === 'pending_ai' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {post.status === 'approved' ? '已通过' :
                           post.status === 'pending_manual' ? '待人工审核' :
                           post.status === 'pending_ai' ? 'AI审核中' : '已拒绝'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => window.open(`/community`, '_blank')}
                          className="text-gray-400 hover:text-[#0071e3] transition-colors inline-flex items-center justify-center"
                          title="去社区查看"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingId === post.id}
                          className="text-gray-400 hover:text-red-600 transition-colors inline-flex items-center justify-center disabled:opacity-50"
                          title="删除帖子"
                        >
                          {deletingId === post.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      没有找到相关帖子
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
