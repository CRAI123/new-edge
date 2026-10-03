import { useState, useEffect } from 'react';
import { Megaphone, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsManager() {
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${apiBaseUrl}/api/settings/banner`);
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          setEnabled(payload.data.enabled || false);
          setText(payload.data.text || '');
          setLink(payload.data.link || '');
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      // 从 Supabase 官方客户端获取最新的 session，这比直接读 localStorage 更可靠
      const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('未检测到登录状态，请刷新页面重试');
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${apiBaseUrl}/api/settings/banner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ enabled, text, link })
      });

      const payload = await res.json();
      if (payload.success) {
        setMessage({ type: 'success', text: '横幅设置保存成功，前台将立即生效。' });
      } else {
        throw new Error(payload.error || '保存失败');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '网络错误，请稍后再试' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1d1d1f] flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-[#0071e3]" />
            全局设置
          </h1>
          <p className="text-[#86868b] mt-2">管理前台顶部横幅公告等全局系统配置。</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#e5e5ea]">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#f5f5f7]">
            <div>
              <h2 className="text-xl font-bold text-[#1d1d1f]">首页顶部横幅</h2>
              <p className="text-sm text-[#86868b] mt-1">用于展示联盟、合作、重要通知等，将显示在所有页面的最上方。</p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#28cd41]"></div>
              <span className="ml-3 text-sm font-medium text-[#1d1d1f]">{enabled ? '显示中' : '已隐藏'}</span>
            </label>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-2">横幅展示文字 *</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                placeholder="例如：🎉 欢迎加入 Rayzo 科创教育联盟！获取最新 3D 打印教学方案。"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-2">点击跳转链接 (可选)</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                placeholder="例如：/team 或 https://example.com"
              />
              <p className="text-xs text-[#86868b] mt-2">如果是站内页面请以 / 开头，如果是外部网站请包含 https://</p>
            </div>

            {/* Preview */}
            <div className="pt-4">
              <label className="block text-sm font-medium text-[#1d1d1f] mb-3">前台预览效果</label>
              <div className={`bg-gradient-to-r from-[#0071e3] to-[#28cd41] text-white p-3 rounded-xl flex items-center justify-center text-sm font-medium ${!enabled ? 'opacity-50 grayscale' : ''}`}>
                <Megaphone className="w-4 h-4 mr-2" />
                {text || "横幅文字将在这里显示"}
                {link && (
                  <span className="underline underline-offset-2 ml-2 font-bold cursor-pointer">
                    了解更多 &gt;
                  </span>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-[#f5f5f7] flex items-center justify-between">
              <div>
                {message && (
                  <div className={`flex items-center gap-2 text-sm ${message.type === 'success' ? 'text-[#28cd41]' : 'text-red-500'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                  </div>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving || !text.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? '保存中...' : '保存设置'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}