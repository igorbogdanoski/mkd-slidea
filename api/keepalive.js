export const config = { runtime: 'edge' };

export default async function handler() {
  try {
    const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/events?select=id&limit=1`;
    await fetch(url, {
      headers: {
        apikey: process.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });
    return new Response('ok', { status: 200 });
  } catch {
    return new Response('error', { status: 500 });
  }
}
