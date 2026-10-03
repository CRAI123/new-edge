-- ========================================================
-- Community Features: Comments and Likes
-- ========================================================

-- 1. Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Comment Policies
CREATE POLICY "Anyone can view comments" 
ON public.post_comments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.post_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.post_comments FOR DELETE 
USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- 2. Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- Enable RLS for likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Like Policies
CREATE POLICY "Anyone can view likes" 
ON public.post_likes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can like posts" 
ON public.post_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" 
ON public.post_likes FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Create function to increment/decrement post likes and views safely
CREATE OR REPLACE FUNCTION increment_post_likes(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = likes_count + 1
  WHERE id = p_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_post_likes(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = p_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_post_views(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts
  SET views_count = views_count + 1
  WHERE id = p_post_id;
END;
$$;
