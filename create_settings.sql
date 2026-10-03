CREATE TABLE IF NOT EXISTS public.global_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
INSERT INTO public.global_settings (id, value) 
VALUES ('announcement_banner', '{"enabled": false, "text": "🎉 欢迎加入 Rayzo 科创教育联盟！获取最新 3D 打印教学方案。", "link": ""}'::jsonb)
ON CONFLICT (id) DO NOTHING;

