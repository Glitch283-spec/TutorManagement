import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env as Record<string, string | undefined>;

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in apps/frontend/.env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
