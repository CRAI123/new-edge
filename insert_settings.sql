INSERT INTO public.global_settings (id, value) 
VALUES ('announcement_banner', '{"enabled": true, "text": "🎉 欢迎加入 Rayzo 科创教育联盟！获取最新 3D 打印教学方案。", "link": ""}'::jsonb)
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

