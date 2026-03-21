import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials are missing. Real-time features will not work.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Warm up both REST and Auth on load + every 9 min
// Auth is pinged via HTTP directly to avoid Web Locks conflicts
const warmUp = () => {
  supabase.from('events').select('id').limit(1).then(() => {});
  if (supabaseUrl && supabaseAnonKey) {
    fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseAnonKey },
    }).catch(() => {});
  }
};
warmUp();
setInterval(warmUp, 9 * 60 * 1000);
