import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Eye, Image as ImageIcon, FileBox, Plus, X, UploadCloud, Play } from 'lucide-react';
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
  
  // Post Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postCategory, setPostCategory] = useState('分享');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      let url = '/api/posts?limit=20';
      if (activeTab !== '全部') url += `&category=${activeTab}`;
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + url);
      const { data } = await res.json();
      if (data) setPosts(data);
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

  const handleCreatePost = async () => {
    if (!user) return showToast('error', '请先登录');
    if (!title.trim() || !content.trim()) return showToast('error', '标题和内容不能为空');
    
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#1d1d1f]">大神社区</h1>
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
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3"/> {post.likes_count}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

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

              <div className="p-4 border-t border-gray-100 flex justify-end sticky bottom-0 bg-white z-10">
                <button
                  onClick={handleCreatePost}
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                  className="btn-primary px-8 py-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
