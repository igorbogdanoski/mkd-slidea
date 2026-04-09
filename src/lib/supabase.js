import { createClient } from '@supabase/supabase-js';
import { debugWarn } from '../utils/observability';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials are missing. Real-time features will not work.");
}

// Multi-tab resilient configuration
// Use crossTab: false to minimize lock contention, rely on broadcast fallback instead
// Use lock for atomicity where needed (participant voting per session)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      // Reduce lock contention across tabs by using memory storage for tokens
      // and relying on real-time broadcasters for sync instead
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Warm up both REST and Auth on load + every 4 min to avoid cold starts
// Auth is pinged via HTTP directly to avoid Web Locks conflicts
let warmUpInFlight = null;
export const warmUp = async () => {
  if (warmUpInFlight) return warmUpInFlight;

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

  warmUpInFlight = Promise.allSettled(jobs).finally(() => {
    warmUpInFlight = null;
  });

  return warmUpInFlight;
};

let sessionInFlight = null;
export const authGetSessionSafe = async () => {
  if (sessionInFlight) return sessionInFlight;

  sessionInFlight = (async () => {
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await supabase.auth.getSession();
        return result;
      } catch (err) {
        lastError = err;
        const msg = String(err?.message || err || '');
        const isLockError = msg.includes('lock:sb-') || msg.toLowerCase().includes('lock');
        if (isLockError) {
          debugWarn('auth session lock contention recovered', { attempt: attempt + 1, message: msg.slice(0, 140) });
        }
        if (!isLockError || attempt === 2) break;
        await new Promise((r) => setTimeout(r, 250 + attempt * 350));
      }
    }
    return { data: { session: null }, error: lastError };
  })().finally(() => {
    sessionInFlight = null;
  });

  return sessionInFlight;
};
warmUp();
setInterval(warmUp, 4 * 60 * 1000);
