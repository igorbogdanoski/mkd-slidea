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

// Warm up both REST and Auth on load + every 4 min to avoid cold starts
// Auth is pinged via HTTP directly to avoid Web Locks conflicts
export const warmUp = async () => {
  const jobs = [
    supabase.from('events').select('id').limit(1),
  ];

  if (supabaseUrl && supabaseAnonKey) {
    jobs.push(
      fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: { apikey: supabaseAnonKey },
      })
    );
  }

  if (typeof window !== 'undefined') {
    jobs.push(fetch('/api/keepalive'));
  }

  await Promise.allSettled(jobs);
};
warmUp();
setInterval(warmUp, 4 * 60 * 1000);
