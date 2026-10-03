-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '分享', -- '分享', '求助', '模型' 等
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create post_media table (for images or STL files)
CREATE TABLE post_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image', 'stl'
  media_url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create post_comments table
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS Policies for posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on posts" ON posts
FOR SELECT USING (TRUE);

CREATE POLICY "Enable insert for authenticated users on posts" ON posts
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON posts
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON posts
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for post_media
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on post_media" ON post_media
FOR SELECT USING (TRUE);

CREATE POLICY "Enable insert for authenticated users on post_media" ON post_media
FOR INSERT TO authenticated WITH CHECK (EXISTS (
  SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid()
));

CREATE POLICY "Enable delete for users based on post ownership" ON post_media
FOR DELETE TO authenticated USING (EXISTS (
  SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid()
));

-- RLS Policies for post_comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on post_comments" ON post_comments
FOR SELECT USING (TRUE);

CREATE POLICY "Enable insert for authenticated users on post_comments" ON post_comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON post_comments
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create Storage Bucket for Community Media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media',
  'community-media',
  TRUE,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'model/stl', 'application/sla', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Storage Policies for community-media
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-media');

CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-media' AND auth.uid() = owner);

CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'community-media' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-media' AND auth.uid() = owner);