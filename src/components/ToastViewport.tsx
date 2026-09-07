import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore, type ToastType, useToastStore as _ts } from '@/store/useToastStore';

const TYPE_META: Record<ToastType, { accent: string; icon: typeof CheckCircle2; ring: string; label: string }> = {
  success: {
    accent: 'text-emerald-500',
    icon: CheckCircle2,
    ring: 'ring-emerald-500/20',
    label: '成功',
  },
  error: {
    accent: 'text-rose-500',
    icon: AlertCircle,
    ring: 'ring-rose-500/20',
    label: '错误',
  },
  info: {
    accent: 'text-[#0071e3]',
    icon: Info,
    ring: 'ring-[#0071e3]/20',
    label: '提示',
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.warn('复制失败:', err);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      whileTap={{ scale: 0.92 }}
      className={cn(
        'shrink-0 rounded-full p-1.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40',
        copied
          ? 'bg-emerald-50 text-emerald-600'
          : 'text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#0071e3]',
      )}
      aria-label={copied ? '已复制' : '复制错误信息'}
      title={copied ? '已复制' : '复制错误信息'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'check' : 'copy'}
          initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6, rotate: 12 }}
          transition={{ duration: 0.18 }}
          className="block"
        >
          {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2.6} /> : <Copy className="h-3.5 w-3.5" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

function ToastCard({ toast }: { toast: ReturnType<typeof _ts.getState>['toasts'][number] }) {
  const meta = TYPE_META[toast.type] ?? TYPE_META.info;
  const Icon = meta.icon;
  const dismiss = useToastStore((s) => s.dismiss);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (paused) return;
    const start = Date.now() - elapsed;
    const timer = window.setInterval(() => {
      const e = Date.now() - start;
      setElapsed(e);
      if (e >= toast.durationMs) {
        dismiss(toast.id);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [paused, toast.durationMs, toast.id, dismiss, elapsed]);

  const progressPct = Math.max(0, 100 - (elapsed / toast.durationMs) * 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 56, y: 0, scale: 0.94 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'pointer-events-auto relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-xl shadow-[0_18px_48px_-20px_rgba(0,0,0,0.28)] ring-1',
        meta.ring,
        'shimmer-card',
      )}
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-start gap-3 p-4 pr-3">
        <div className={cn('pt-0.5 shrink-0', meta.accent)}>
          <Icon className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] truncate">
              {toast.title || meta.label}
            </p>
            <div className="flex shrink-0 items-center gap-0.5">
              {toast.copiable && <CopyButton text={toast.message} />}
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 rounded-full p-1 text-[#86868b] transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40"
                aria-label="关闭提示"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-1 text-[13px] leading-6 text-[#555558] break-words whitespace-pre-wrap">
            {toast.message}
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#e8e8ed]">
            <motion.div
              className={cn(
                'h-full rounded-full',
                toast.type === 'success' && 'bg-gradient-to-r from-[#0071e3] via-[#28cd41] to-[#00c6ff]',
                toast.type === 'error' && 'bg-gradient-to-r from-rose-500 to-orange-400',
                toast.type === 'info' && 'bg-gradient-to-r from-[#0071e3] to-[#00c6ff]',
              )}
              style={{ width: `${progressPct}%` }}
              transition={{ duration: 0.05, ease: 'linear' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] flex items-end justify-end p-4 sm:p-6 md:p-8">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
