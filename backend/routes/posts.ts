﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import express, { type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

// Constants are evaluated dynamically inside functions to support serverless hot-reloading
const getSupabaseUrl = () => process.env.SUPABASE_URL as string;
const getSupabaseKey = () => process.env.SUPABASE_KEY as string;
const getOpenAIBaseUrl = () => process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const getOpenAIApiKey = () => process.env.OPENAI_API_KEY as string;

// Initialize Supabase admin client (since this is backend, we use the service role key)
const supabaseAdmin = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_KEY as string);

const router = express.Router();

// GET /api/posts - Get posts with pagination and category filter
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, limit = '20', offset = '0', userId } = req.query;

    // Get public approved posts
    let query = supabaseAdmin
      .from('posts')
      .select(`
        *,
        profiles (full_name, avatar_url),
        post_media (id, media_type, media_url, status)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (category && category !== '全部') {
      query = query.eq('category', category);
    }

    const { data: approvedPosts, error } = await query;
    if (error) throw error;

    let finalPosts = approvedPosts || [];

    // If userId is provided, fetch their pending/rejected posts and prepend them
    if (userId && offset === '0') {
      const { data: userPrivatePosts, error: privateError } = await supabaseAdmin
        .from('posts')
        .select(`
          *,
          profiles (full_name, avatar_url),
          post_media (id, media_type, media_url, status)
        `)
        .eq('user_id', userId)
        .in('status', ['pending_ai', 'pending_manual', 'rejected'])
        .order('created_at', { ascending: false });
        
      if (!privateError && userPrivatePosts) {
        // Prepend user's private posts to the feed
        finalPosts = [...userPrivatePosts, ...finalPosts];
      }
    }

    res.json({ success: true, data: finalPosts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Real AI Moderation trigger using Vision Model
async function triggerAIModeration(postId: string, mediaUrls: string[], postContent: string, userSupabase: any) {
  try {
    console.log(`[AI Moderation] Started for post ${postId}`);
    
    const apiKey = getOpenAIApiKey();
    const baseUrl = getOpenAIBaseUrl();

    // 如果没有配置 API Key，退回到自动拦截
    if (!apiKey) {
      console.log(`[AI Moderation] No API key found, defaulting to manual review`);
      await userSupabase.from('posts').update({ status: 'pending_manual', moderation_reason: '未配置AI审核密钥，已转交人工审核' }).eq('id', postId);
      await userSupabase.from('post_media').update({ status: 'pending_manual', moderation_reason: '未配置AI审核密钥，已转交人工审核' }).eq('post_id', postId);
      return;
    }

    // 构建发给大模型的内容
    const contentPayload: any[] = [
      {
        type: "text",
        text: `你是一个3D打印社区的严格审核员。请检查以下用户发布的文本和图片。
        
        审核规则：
        1. 内容必须与3D打印强相关（包括3D建模、切片软件、3D打印机硬件、耗材、3D打印作品展示、求助交流等）。
        2. 如果内容与3D打印无关（如无关的风景照、无关的日常自拍、其他无关领域的广告等），请返回 REJECTED，并说明“内容与3D打印无关”。
        3. 如果包含色情、暴力、严重政治敏感、或明显恶意的广告引流，请返回 REJECTED，并给出拒绝原因。
        4. 如果内容符合3D打印主题且无违规，请返回 APPROVED。
        
        必须且只能返回 JSON 格式，如下所示：
        {"status": "APPROVED" | "REJECTED", "reason": "如果拒绝，请写原因，通过则为空"}
        
        用户文本内容：
        ${postContent}`
      }
    ];

    // 添加图片进行多模态分析
    const imageMedia = mediaUrls.filter(url => !url.toLowerCase().endsWith('.stl') && !url.toLowerCase().endsWith('.obj'));
    
    // 我们目前探测到你的账号下可用的模型有 qwen3.8-max, qwen3.7-plus, glm-5.3 等。
    // 但是这些模型在 3hdmx 的代理渠道下可能不支持传入 image_url，如果遇到 400 错误，可以把这里的 image_url 注释掉，降级为纯文本审核。
    for (const img of imageMedia.slice(0, 3)) {
      contentPayload.push({
        type: "image_url",
        image_url: { url: img }
      });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "qwen3.8-max", // 你的可用列表中有这个强大的模型
        messages: [
          {
            role: "user",
            content: contentPayload
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;
    const result = JSON.parse(resultText);

    const isApproved = result.status === 'APPROVED';
    const newStatus = isApproved ? 'approved' : 'pending_manual';
    const reason = isApproved ? null : `AI 拦截: ${result.reason || '潜在违规'}`;
    
    console.log(`[AI Moderation] Result for post ${postId}: ${newStatus}`);

    await userSupabase
      .from('posts')
      .update({ status: newStatus, moderation_reason: reason })
      .eq('id', postId);

    await userSupabase
      .from('post_media')
      .update({ status: newStatus, moderation_reason: reason })
      .eq('post_id', postId);
        
  } catch (error) {
    console.error(`[AI Moderation Error] for post ${postId}:`, error);
    // 审核出错时，安全起见，转入人工审核
    await userSupabase
      .from('posts')
      .update({ status: 'pending_manual', moderation_reason: 'AI 审核服务出错，转为人工审核' })
      .eq('id', postId);
    await userSupabase
      .from('post_media')
      .update({ status: 'pending_manual', moderation_reason: 'AI 审核服务出错，转为人工审核' })
      .eq('post_id', postId);
  }
}

// POST /api/posts - Create a new post
router.post('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

    // Use user's JWT to authenticate the request to Supabase
    const userSupabase = createClient(getSupabaseUrl(), getSupabaseKey(), {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    const { title, content, category, mediaUrls, turnstileToken } = req.body;

    // Verify Turnstile Token if not in development
    if (process.env.NODE_ENV !== 'development') {
      if (!turnstileToken || turnstileToken === 'mock-dev-token') {
        return res.status(400).json({ success: false, error: '缺少人机验证 Token' });
      }

      const turnstileVerify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAAFEV-E3t1P_5v7HhQ2u4P_vX7H0',
          response: turnstileToken,
        }),
      });

      const turnstileResult = await turnstileVerify.json();
      if (!turnstileResult.success) {
        return res.status(400).json({ success: false, error: '人机验证失败，请重试' });
      }
    }

    // 1. Insert post (defaults to pending_ai due to DB default)
    const { data: postData, error: postError } = await userSupabase
      .from('posts')
      .insert([
        {
          title,
          content,
          category,
          user_id: user.id
        }
      ])
      .select()
      .single();

    if (postError) throw postError;

    // 2. Insert media if any
    if (mediaUrls && mediaUrls.length > 0) {
      const mediaRecords = mediaUrls.map((url: string) => ({
        post_id: postData.id,
        media_type: url.toLowerCase().endsWith('.stl') || url.toLowerCase().endsWith('.obj') ? 'model' : 'image',
        media_url: url
      }));

      const { error: mediaError } = await userSupabase
        .from('post_media')
        .insert(mediaRecords);

      if (mediaError) throw mediaError;
    }

    // 3. Trigger AI Moderation synchronously to prevent Vercel serverless function from freezing
    await triggerAIModeration(postData.id, mediaUrls || [], `${title}\n${content}`, userSupabase);

    res.status(201).json({ success: true, data: postData, message: '发布成功，内容已进入智能审核' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/posts/retry-moderation - Manually retry AI moderation
router.post('/retry-moderation', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

    // 只能由拥有管理员/审核员权限的请求调用
    const userSupabase = createClient(getSupabaseUrl(), getSupabaseKey(), {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    // 校验权限 (这里简单起见，实际 RLS 也会保护 update)
    const { data: profile } = await userSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'reviewer')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { postId } = req.body;
    if (!postId) return res.status(400).json({ error: 'postId is required' });

    // 获取帖子的完整信息用于重新审核
    const { data: post, error: fetchError } = await userSupabase
      .from('posts')
      .select('title, content')
      .eq('id', postId)
      .single();
      
    if (fetchError || !post) throw fetchError || new Error('Post not found');

    const { data: mediaData } = await userSupabase
      .from('post_media')
      .select('media_url')
      .eq('post_id', postId);

    const mediaUrls = mediaData?.map(m => m.media_url) || [];

    // 重置状态为 pending_ai 给予视觉反馈
    await userSupabase.from('posts').update({ status: 'pending_ai', moderation_reason: '正在重新进行AI审核...' }).eq('id', postId);
    await userSupabase.from('post_media').update({ status: 'pending_ai' }).eq('post_id', postId);

    // 触发异步审核
    triggerAIModeration(postId, mediaUrls, `${post.title}\n${post.content}`, userSupabase);

    res.json({ success: true, message: '已重新触发 AI 审核' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a comment to a post
router.post('/:id/comments', async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabaseAdmin
      .from('post_comments')
      .insert([
        { post_id: postId, user_id: userId, content }
      ])
      .select(`
        id, content, created_at,
        profiles (id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.json({ success: true, comment: data });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const { id: postId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('post_comments')
      .select(`
        id, content, created_at, user_id,
        profiles (id, full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, comments: data });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle like for a post
router.post('/:id/like', async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    // Check if like exists
    const { data: existingLike, error: checkError } = await supabaseAdmin
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "No rows found"
      throw checkError;
    }

    let action = 'liked';

    if (existingLike) {
      // Unlike
      await supabaseAdmin
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
        
      // Decrement counter
      await supabaseAdmin.rpc('decrement_post_likes', { p_post_id: postId });
      action = 'unliked';
    } else {
      // Like
      await supabaseAdmin
        .from('post_likes')
        .insert([{ post_id: postId, user_id: userId }]);
        
      // Increment counter
      await supabaseAdmin.rpc('increment_post_likes', { p_post_id: postId });
    }

    // Get updated like count
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    res.json({ success: true, action, likes_count: post?.likes_count || 0 });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Increment views
router.post('/:id/view', async (req, res) => {
  try {
    const { id: postId } = req.params;
    await supabaseAdmin.rpc('increment_post_views', { p_post_id: postId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error incrementing view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
