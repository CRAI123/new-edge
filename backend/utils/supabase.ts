import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Backend: Supabase URL or Key is missing in environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
