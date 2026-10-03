import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle, XCircle, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/utils';
import { useUserStore } from '@/store/useUserStore';
import { useNavigate } from 'react-router-dom';

export default function ModerationManager() {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 只允许 admin 和 reviewer 访问
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'reviewer')) {
      showToast('error', '无权限访问该页面');
      navigate('/admin');
    }
  }, [user, navigate]);

  const fetchPendingPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (full_name, avatar_url),
          post_media (id, media_type, media_url, status)
        `)
        .eq('status', 'pending_manual')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      console.error('Fetch pending posts error:', err);
      // More descriptive error so the user knows if it's a DB issue or just empty
      showToast('error', `获取待审核列表失败: ${err.message || '请检查数据库字段是否已更新'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const handleModerate = async (postId: string, action: 'approved' | 'rejected') => {
    setProcessingId(postId);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          status: action,
          moderation_reason: action === 'rejected' ? '人工审核拒绝' : '人工审核通过'
        })
        .eq('id', postId);

      if (error) throw error;

      await supabase
        .from('post_media')
        .update({ status: action })
        .eq('post_id', postId);

      showToast('success', `已${action === 'approved' ? '通过' : '拒绝'}该帖子`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      console.error('Moderation error:', err);
      showToast('error', '操作失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRetryAI = async (postId: string) => {
    setProcessingId(postId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('未登录');

      const response = await fetch('/api/posts/retry-moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ postId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '请求失败');
      }

      showToast('success', '已重新触发 AI 审核，正在处理中...');
      // 从当前待审核列表中暂时移除，因为它变成了 pending_ai
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      console.error('Retry AI error:', err);
      showToast('error', `AI 审核重试失败: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#0071e3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-[#1d1d1f]">内容审核</h1>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-80" />
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">暂无待审核内容</h3>
            <p className="text-[#86868b]">AI 已处理完毕，当前没有需要人工复核的帖子。</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-[#d2d2d7]/50 flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src={post.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} 
                        className="w-8 h-8 rounded-full"
                        alt="avatar"
                      />
                      <span className="font-medium text-[#1d1d1f]">{post.profiles?.full_name || '匿名用户'}</span>
                      <span className="text-xs text-[#86868b] bg-[#f5f5f7] px-2 py-1 rounded-md">
                        {new Date(post.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">{post.title}</h3>
                    <p className="text-[#1d1d1f]/80 text-sm whitespace-pre-wrap">{post.content}</p>
                    {post.moderation_reason && (
                      <p className="text-xs text-orange-600 mt-2 bg-orange-50 inline-block px-2 py-1 rounded">
                        AI 拦截原因: {post.moderation_reason}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <button
                      onClick={() => handleRetryAI(post.id)}
                      disabled={processingId === post.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3]/20 rounded-xl font-medium transition-colors"
                      title="重新提交给AI进行审核"
                    >
                      {processingId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      AI重试
                    </button>
                    <button
                      onClick={() => handleModerate(post.id, 'approved')}
                      disabled={processingId === post.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl font-medium transition-colors"
                    >
                      {processingId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      通过
                    </button>
                    <button
                      onClick={() => handleModerate(post.id, 'rejected')}
                      disabled={processingId === post.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors"
                    >
                      {processingId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      拒绝
                    </button>
                  </div>
                </div>

                {post.post_media && post.post_media.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {post.post_media.map((media: any) => (
                      <div key={media.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#f5f5f7] border border-[#d2d2d7]">
                        {media.media_type === 'image' ? (
                          <img src={media.media_url} alt="附件" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[#86868b]">
                            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-xs font-medium">3D模型文件</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}