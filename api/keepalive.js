export const config = { runtime: 'edge' };

export default async function handler() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
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
