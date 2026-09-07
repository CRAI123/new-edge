import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs: number;
  copiable?: boolean;
}

interface ToastState {
  toasts: ToastMessage[];
  push: (toast: Omit<ToastMessage, 'id'>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const randomId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = randomId();
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          type: toast.type,
          title: toast.title,
          message: toast.message,
          durationMs: toast.durationMs ?? 3000,
          copiable: toast.copiable ?? toast.type === 'error',
        },
      ],
    }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  clear: () => set({ toasts: [] }),
}));
