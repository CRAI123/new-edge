-- Add moderation status to posts
ALTER TABLE public.posts ADD COLUMN status TEXT NOT NULL DEFAULT 'pending_ai'; -- 'pending_ai', 'pending_manual', 'approved', 'rejected'
ALTER TABLE public.posts ADD COLUMN moderation_reason TEXT;

-- Add moderation status to post_media
ALTER TABLE public.post_media ADD COLUMN status TEXT NOT NULL DEFAULT 'pending_ai'; -- 'pending_ai', 'pending_manual', 'approved', 'rejected'
ALTER TABLE public.post_media ADD COLUMN moderation_reason TEXT;

-- Update RLS policies for posts to only show approved posts to general public
DROP POLICY IF EXISTS "Enable read access for all users on posts" ON posts;

CREATE POLICY "Enable read access for approved posts or own posts" ON posts
FOR SELECT USING (
  status = 'approved' 
  OR auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'reviewer')
  )
);

-- Update RLS policies for post_media to only show approved media
DROP POLICY IF EXISTS "Enable read access for all users on post_media" ON post_media;

CREATE POLICY "Enable read access for approved media or own media" ON post_media
FOR SELECT USING (
  status = 'approved' 
  OR EXISTS (
    SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'reviewer')
  )
);

-- Allow insert for pending_ai status by authenticated users
DROP POLICY IF EXISTS "Enable update for users on their own pending posts" ON posts;
CREATE POLICY "Enable update for users on their own pending posts" ON posts
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for users on their own pending post_media" ON post_media;
CREATE POLICY "Enable update for users on their own pending post_media" ON post_media
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Enable update for reviewers/admins on posts" ON posts
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'reviewer')
  )
);

CREATE POLICY "Enable update for reviewers/admins on post_media" ON post_media
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'reviewer')
  )
);
