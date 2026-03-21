import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials are missing. Real-time features will not work.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'mkd-slidea-auth',
    },
  }
);

// Immediate warm-up on app load + every 9 min interval
// Pings both REST (PostgREST) and Auth (GoTrue) — separate services on free tier
const warmUp = () => {
  supabase.from('events').select('id').limit(1).then(() => {});
  supabase.auth.getSession().then(() => {});
};
warmUp();
setInterval(warmUp, 9 * 60 * 1000);
