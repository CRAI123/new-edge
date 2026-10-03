﻿import express, { type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_KEY = process.env.SUPABASE_KEY as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const router = express.Router();

// GET /api/posts - Get posts with pagination and category filter
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, limit = '20', offset = '0' } = req.query;

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles (full_name, avatar_url),
        post_media (id, media_type, media_url)
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (category && category !== '全部') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/posts - Create a new post
router.post('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

    // Use user's JWT to authenticate the request to Supabase
    const userSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    const { title, content, category, mediaUrls } = req.body;

    // 1. Insert post
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

    res.status(201).json({ success: true, data: postData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
