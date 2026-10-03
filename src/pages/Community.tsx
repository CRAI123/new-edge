import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Eye, Image as ImageIcon, FileBox, Plus, X, UploadCloud, Play, CheckCircle, Shield, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/useUserStore';
import { showToast } from '@/lib/utils';
import STLViewer from '@/components/STLViewer';

import { useNavigate } from 'react-router-dom';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  likes_count: number;
  views_count: number;
  created_at: string;
  profiles: { full_name: string; avatar_url: string };
  post_media: { id: string; media_type: string; media_url: string }[];
}

export default function Community() {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState('全部');
  const [showPostModal, setShowPostModal] = useState(false);
  
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Post Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postCategory, setPostCategory] = useState('分享');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(() => {
    return localStorage.getItem('rayzo_community_agreed') === 'true';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync agreement state to localStorage
  useEffect(() => {
    localStorage.setItem('rayzo_community_agreed', agreedToGuidelines.toString());
  }, [agreedToGuidelines]);

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      let url = '/api/posts?limit=20';
      if (activeTab !== '全部') url += `&category=${activeTab}`;
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + url);
      const { data } = await res.json();
      if (data) {
        setPosts(data);
        // Check which posts the user has liked
        if (user) {
          const { data: likes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id);
          
          if (likes) {
            setLikedPosts(new Set(likes.map(l => l.post_id)));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch posts', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setMediaFiles(prev => [...prev, ...filesArray].slice(0, 9)); // Max 9 files
    }
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}/community?post=${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: '大神社区',
          text: '快来看看这篇关于3D打印的帖子！',
          url: url
        });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('success', '链接已复制到剪贴板');
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return showToast('error', '请先登录');
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      const { success, action, likes_count } = await res.json();
      
      if (success) {
        setPosts(posts.map(p => p.id === postId ? { ...p, likes_count } : p));
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (action === 'liked') newSet.add(postId);
          else newSet.delete(postId);
          return newSet;
        });
      }
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  };

  const handleOpenComments = async (postId: string) => {
    setSelectedPostId(postId);
    setShowCommentModal(true);
    setComments([]);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/posts/${postId}/comments`);
      const { success, comments } = await res.json();
      if (success) setComments(comments);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  const handlePostComment = async () => {
    if (!user) return showToast('error', '请先登录');
    if (!newComment.trim()) return;
    if (!selectedPostId) return;
    
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/posts/${selectedPostId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, content: newComment.trim() })
      });
      
      const { success, comment } = await res.json();
      
      if (success) {
        setComments([...comments, comment]);
        setNewComment('');
        showToast('success', '评论成功');
      }
    } catch (err) {
      console.error('Failed to post comment', err);
      showToast('error', '评论失败');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user) return showToast('error', '请先登录');
    if (!title.trim() || !content.trim()) return showToast('error', '标题和内容不能为空');
    if (!agreedToGuidelines) return showToast('error', '请阅读并同意社区规范');
    
    setIsSubmitting(true);
    try {
      let mediaUrls: string[] = [];
      
      // Upload media files if any
      if (mediaFiles.length > 0) {
        showToast('info', '正在上传图片...');
        for (const file of mediaFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('community-media')
            .upload(`posts/${fileName}`, file);
            
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('community-media')
            .getPublicUrl(`posts/${fileName}`);
            
          mediaUrls.push(publicUrl);
        }
      }

      // Create post via API
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          title,
          content,
          category: postCategory,
          mediaUrls
        })
      });
      
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.error);
      
      showToast('success', '发布成功！');
      setShowPostModal(false);
      setTitle('');
      setContent('');
      setMediaFiles([]);
      // Do not reset agreedToGuidelines so the user doesn't have to check it again
      fetchPosts();
    } catch (err: any) {
      showToast('error', `发布失败: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 px-4 md:px-8">
      {!user ? (
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md w-full">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-[#0071e3]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4">欢迎来到大神社区</h2>
            <p className="text-gray-500 mb-8">在这里发现 3D 打印的无限可能，分享你的创意模型，与大神们交流心得。</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full py-3 rounded-full font-bold text-lg"
            >
              立即登录 / 注册
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div className="flex flex-col items-start gap-2">
              <h1 className="text-3xl font-bold text-[#1d1d1f]">大神社区</h1>
              <a 
                href="/community-guidelines" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-sm text-[#0071e3] bg-[#0071e3]/10 hover:bg-[#0071e3]/20 px-3 py-1 rounded-full transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                社区规范与免责声明
              </a>
            </div>
            <button 
              onClick={() => {
                if (!user) {
                  showToast('info', '请先登录');
                  return;
                }
                setShowPostModal(true);
              }}
              className="btn-primary px-6 py-2 rounded-full flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 发布内容
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {['全部', '分享', '求助', '模型'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-[#1d1d1f] text-white' : 'bg-white text-[#1d1d1f] hover:bg-gray-100'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Masonry Grid */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
            {posts.map((post) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={post.id}
                className="break-inside-avoid bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                {/* Cover Image/Preview */}
                {post.post_media && post.post_media.length > 0 ? (
                  <div className="relative">
                    {post.post_media[0].media_type === 'image' ? (
                      <img src={post.post_media[0].media_url} alt={post.title} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden group">
                        <STLViewer url={post.post_media[0].media_url} />
                        <div className="absolute inset-0 bg-transparent z-10"></div> {/* 防止在列表中直接拖拽 */}
                      </div>
                    )}
                    {post.post_media.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full text-white text-xs flex items-center gap-1 z-20">
                        <ImageIcon className="w-3 h-3" /> {post.post_media.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-[#0071e3]/10 to-[#28cd41]/10"></div>
                )}

                <div className="p-4 relative z-10 bg-white">
                  <h3 className="font-bold text-[#1d1d1f] line-clamp-2 mb-2 group-hover:text-[#0071e3] transition-colors">{post.title}</h3>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <img 
                        src={post.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'}
                        alt="avatar"
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-xs text-[#86868b] truncate max-w-[80px]">
                        {post.profiles?.full_name || '匿名大神'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-[#86868b]">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3"/> {post.views_count}</span>
                      <span className={`flex items-center gap-1 transition-colors ${likedPosts.has(post.id) ? 'text-rose-500' : ''}`}><Heart className={`w-3 h-3 ${likedPosts.has(post.id) ? 'fill-current' : ''}`}/> {post.likes_count}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Comment Modal */}
        <AnimatePresence>
          {showCommentModal && selectedPostId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCommentModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
              >
                <div className="p-6 border-b border-[#f5f5f7] flex items-center justify-between sticky top-0 bg-white z-10">
                  <h2 className="text-xl font-bold text-[#1d1d1f] flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-[#0071e3]" />
                    评论
                  </h2>
                  <button onClick={() => setShowCommentModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-[#f5f5f7]/50 space-y-6">
                  {comments.length === 0 ? (
                    <div className="text-center text-[#86868b] py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>还没有人评论，快来抢沙发吧！</p>
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex gap-4">
                        <img 
                          src={comment.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'}
                          alt="avatar"
                          className="w-10 h-10 rounded-full border border-white shadow-sm shrink-0"
                        />
                        <div className="flex-1">
                          <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-[#1d1d1f] text-sm">{comment.profiles?.full_name || '匿名大神'}</span>
                              <span className="text-xs text-[#86868b]">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[#1d1d1f] text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-[#f5f5f7] bg-white">
                  <div className="flex gap-3">
                    <img 
                      src={user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'}
                      alt="your avatar"
                      className="w-10 h-10 rounded-full border border-gray-200 shrink-0"
                    />
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={user ? "写下你的评论..." : "请先登录后再评论"}
                        disabled={!user || isSubmittingComment}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handlePostComment();
                          }
                        }}
                        className="flex-1 bg-[#f5f5f7] border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-[#0071e3]/20 focus:outline-none transition-all disabled:opacity-50"
                      />
                      <button
                        onClick={handlePostComment}
                        disabled={!user || !newComment.trim() || isSubmittingComment}
                        className="bg-[#0071e3] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#0077ed] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmittingComment ? '发送中...' : '发送'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Post Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowPostModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-10">
                <h2 className="text-xl font-bold text-[#1d1d1f]">发布内容</h2>
                <button 
                  onClick={() => setShowPostModal(false)}
                  disabled={isSubmitting}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  {/* Category Selection */}
                  <div className="flex gap-3">
                    {['分享', '求助', '模型'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPostCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${postCategory === cat ? 'bg-[#0071e3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="填写标题会有更多赞哦~"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xl font-bold border-none outline-none placeholder:text-gray-300"
                  />

                  <textarea
                    placeholder="分享你的3D打印日常、参数设置或是遇到的小问题..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className="w-full resize-none border-none outline-none text-gray-700 placeholder:text-gray-400"
                  />

                  {/* Media Upload Area */}
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      accept="image/*,.stl,.obj"
                      className="hidden"
                    />
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {mediaFiles.map((file, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                          {file.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                              <FileBox className="w-8 h-8 mb-1" />
                              <span className="text-[10px] font-medium truncate w-full px-2 text-center">{file.name}</span>
                            </div>
                          )}
                          <button 
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      
                      {mediaFiles.length < 9 && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:text-[#0071e3] hover:border-[#0071e3] hover:bg-blue-50/50 transition-all"
                        >
                          <Plus className="w-6 h-6 mb-1" />
                          <span className="text-xs font-medium">照片/模型</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 bg-white z-10">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${agreedToGuidelines ? 'bg-[#0071e3] border-[#0071e3]' : 'border-gray-300 group-hover:border-[#0071e3]'}`}>
                    {agreedToGuidelines && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={agreedToGuidelines}
                    onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                  />
                  <span className="text-sm text-gray-600">
                    我已阅读并同意 <a href="/community-guidelines" target="_blank" rel="noopener noreferrer" className="text-[#0071e3] hover:underline" onClick={(e) => e.stopPropagation()}>《大神社区规范与免责声明》</a>
                  </span>
                </label>
                
                <button
                  onClick={handleCreatePost}
                  disabled={isSubmitting || !title.trim() || !content.trim() || !agreedToGuidelines}
                  className="btn-primary px-8 py-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      发布中...
                    </>
                  ) : (
                    '发布'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
