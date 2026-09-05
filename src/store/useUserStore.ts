import { create } from 'zustand';

export type MemberLevel = 1 | 2 | 3 | 4;

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'teacher' | 'student' | 'individual' | 'admin';
  level: MemberLevel;
  loginCount: number;
  browseCount: number;
  downloadCount: number;
}

interface UserState {
  user: UserProfile | null;
  isAdmin: boolean;
  setUser: (user: UserProfile | null) => void;
  setAdmin: (isAdmin: boolean) => void;
  updateStats: (type: 'login' | 'browse' | 'download') => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAdmin: false,
  setUser: (user) => set({ user, isAdmin: user?.role === 'admin' }),
  setAdmin: (isAdmin) => set({ isAdmin }),
  updateStats: (type) => set((state) => {
    if (!state.user) return state;
    
    const newUser = { ...state.user };
    if (type === 'login') newUser.loginCount += 1;
    if (type === 'browse') newUser.browseCount += 1;
    if (type === 'download') newUser.downloadCount += 1;

    // 简单的升级逻辑示例
    let newLevel = newUser.level;
    const totalActivity = newUser.loginCount + newUser.browseCount + newUser.downloadCount;
    
    if (totalActivity > 100) newLevel = 4;
    else if (totalActivity > 50) newLevel = 3;
    else if (totalActivity > 10) newLevel = 2;
    else newLevel = 1;

    newUser.level = newLevel as MemberLevel;
    
    return { user: newUser };
  }),
}));
