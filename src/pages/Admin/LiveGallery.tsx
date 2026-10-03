import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Maximize, Minimize, Heart, Eye, Play, Pause, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface Post {
  id: string;
  title: string;
  likes_count: number;
  views_count: number;
  profiles: { full_name: string; avatar_url: string };
  post_media: { id: string; media_type: string; media_url: string }[];
}

export default function LiveGallery() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGalleryPosts();
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const fetchGalleryPosts = async () => {
    try {
      // 获取所有已通过审核的帖子，并且必须包含图片媒体
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id, title, likes_count, views_count,
          profiles (full_name, avatar_url),
          post_media (id, media_type, media_url)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50); // 获取最新的 50 条

      if (error) throw error;

      // 过滤出有图片的帖子
      const imagePosts = (data as any[]).filter(post => 
        post.post_media && post.post_media.some((m: any) => m.media_type === 'image')
      );

      // 为了确保滚动效果足够长，如果图片太少，我们复制几份
      let displayPosts = [...imagePosts];
      while (displayPosts.length > 0 && displayPosts.length < 20) {
        displayPosts = [...displayPosts, ...imagePosts];
      }

      setPosts(displayPosts);
    } catch (err) {
      console.error("Failed to fetch gallery posts", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  // 将帖子分配到 3 列
  const columns = [[], [], []] as Post[][];
  posts.forEach((post, i) => {
    columns[i % 3].push(post);
  });

  const renderColumn = (colPosts: Post[], colIndex: number, direction: 'up' | 'down', speed: number) => {
    if (colPosts.length === 0) return null;
    
    // 为了无缝循环滚动，我们需要将数组复制一份
    const doubledPosts = [...colPosts, ...colPosts];

    return (
      <div className="flex-1 overflow-hidden relative group" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <div 
          className={`flex flex-col gap-6 absolute w-full ${direction === 'up' ? 'animate-marquee-up' : 'animate-marquee-down'}`}
          style={{ 
            animationDuration: `${speed}s`,
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        >
          {doubledPosts.map((post, idx) => {
            const coverImage = post.post_media.find(m => m.media_type === 'image')?.media_url;
            if (!coverImage) return null;

            return (
              <div 
                key={`${post.id}-${idx}`} 
                className="relative rounded-[2rem] overflow-hidden bg-[#1d1d1f] aspect-auto shadow-2xl group/card cursor-pointer transform transition-transform duration-500 hover:scale-[1.02] hover:z-10"
              >
                <img 
                  src={coverImage} 
                  alt={post.title} 
                  className="w-full h-full object-cover min-h-[300px]"
                  loading="lazy"
                />
                
                {/* 悬停时的渐变遮罩和信息 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                  <h3 className="text-white font-bold text-xl mb-3 translate-y-4 group-hover/card:translate-y-0 transition-transform duration-500 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <div className="flex items-center justify-between translate-y-4 group-hover/card:translate-y-0 transition-transform duration-500 delay-75">
                    <div className="flex items-center gap-2">
                      <img 
                        src={post.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} 
                        alt="avatar" 
                        className="w-8 h-8 rounded-full border-2 border-white/20"
                      />
                      <span className="text-white/90 text-sm font-medium">{post.profiles?.full_name || '匿名大神'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80 text-xs font-medium">
                      <span className="flex items-center gap-1 backdrop-blur-md bg-white/10 px-2 py-1 rounded-full"><Eye className="w-3 h-3"/> {post.views_count || 0}</span>
                      <span className="flex items-center gap-1 backdrop-blur-md bg-white/10 px-2 py-1 rounded-full"><Heart className="w-3 h-3 text-rose-400"/> {post.likes_count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          @keyframes marquee-up {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          @keyframes marquee-down {
            0% { transform: translateY(-50%); }
            100% { transform: translateY(0); }
          }
          .animate-marquee-up {
            animation: marquee-up linear infinite;
          }
          .animate-marquee-down {
            animation: marquee-down linear infinite;
          }
        `}
      </style>
      
      <div ref={containerRef} className="w-full h-screen bg-[#0a0a0a] overflow-hidden relative flex flex-col font-sans selection:bg-[#0071e3] selection:text-white">
        
        {/* 背景光晕装饰 */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#0071e3]/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#28cd41]/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

        {/* 顶部控制栏 */}
        <div className={`absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between transition-opacity duration-500 ${isFullscreen && !isPaused ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
          <div className="flex items-center gap-4">
            {!isFullscreen && (
              <Link to="/admin" className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center justify-center text-white transition-all">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <div className="flex flex-col">
              <h1 className="text-white font-bold text-2xl tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                社区直播画廊
              </h1>
              <p className="text-white/50 text-sm">Community Live Exhibition</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="px-4 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center gap-2 text-white font-medium transition-all"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? "继续" : "暂停"}
            </button>
            <button 
              onClick={toggleFullscreen}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center justify-center text-white transition-all"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 画廊主体内容 */}
        <div className="flex-1 w-full max-w-[1600px] mx-auto p-6 pt-24 pb-6 flex gap-6 h-full relative z-10">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
              <p>加载视觉盛宴中...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-xl font-medium">社区暂无带图片的审核通过内容</p>
            </div>
          ) : (
            <>
              {/* 3列交错滚动：第一列向下，第二列向上，第三列向下，速度不一产生视差 */}
              {renderColumn(columns[0], 0, 'down', 60)}
              {renderColumn(columns[1], 1, 'up', 45)}
              {renderColumn(columns[2], 2, 'down', 55)}
            </>
          )}
        </div>
        
        {/* 底部渐变遮罩，让图片滚动消失时显得自然 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
      </div>
    </>
  );
}