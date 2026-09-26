import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing in environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

/**
 * 记录用户重要操作日志
 * 数据库中已配置触发器，每个用户最多只保留 50 条最新记录，防止数据库爆满。
 */
export const logUserActivity = async (userId: string, action: string, details: Record<string, any> = {}) => {
  if (!userId) return;
  try {
    await supabase.from('user_activities').insert([{
      user_id: userId,
      action,
      details
    }]);
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
};
