export const config = { runtime: 'edge' };

export default async function handler() {
  // Server-side: use non-VITE_ env vars (VITE_ prefix is client-only)
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return new Response('missing env', { status: 500 });
  try {
    // Ping REST (PostgREST) and Auth (GoTrue) in parallel — both cold-start separately
    await Promise.all([
      fetch(`${url}/rest/v1/events?select=id&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      }),
      fetch(`${url}/auth/v1/health`, {
        headers: { apikey: key },
      }),
    ]);
    return new Response('ok', { status: 200 });
  } catch {
    return new Response('error', { status: 500 });
  }
}
