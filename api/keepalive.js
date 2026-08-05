export const config = { runtime: 'edge' };

// Runs daily (vercel.json), not every 5 minutes as it once did.
//
// This existed to keep a Supabase Cloud free-tier project from cold-starting.
// Production has since moved to self-hosted Supabase on a VPS, where the
// containers never sleep, so the frequent ping bought nothing — ~8,600
// invocations a month for no effect. It is kept at daily rather than deleted
// because SUPABASE_URL in the Vercel environment may still point at the old
// Cloud project we kept as a fallback, and Cloud pauses a project after seven
// days of inactivity. One ping a day prevents that under either configuration,
// at ~30 invocations a month.

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
