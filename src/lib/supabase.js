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

// Keep-alive ping every 9 minutes to prevent Supabase cold starts on free tier
// Remove this if you upgrade to Supabase Pro
setInterval(() => {
  supabase.from('events').select('id').limit(1).then(() => {});
}, 9 * 60 * 1000);
