// POST /api/push-notify  (Edge)
// Called by the host when changing the active poll.
// Auth: Authorization: Bearer <supabase_access_token>
// Body: { eventCode, title, body, url }
// Verifies the caller owns the event, then sends push to all subscribers.

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return new Response('Unauthorized', { status: 401 });

  try {
    const { eventCode, title, body, url } = await req.json();
    if (!eventCode || !title) {
      return new Response(JSON.stringify({ error: 'eventCode + title required' }), { status: 400 });
    }

    // Verify token → get user id
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!userRes.ok) return new Response('Unauthorized', { status: 401 });
    const userData = await userRes.json();
    const userId = userData?.id;
    if (!userId) return new Response('Unauthorized', { status: 401 });

    // Verify user owns the event
    const evRes = await fetch(
      `${SUPABASE_URL}/rest/v1/events?code=eq.${encodeURIComponent(eventCode)}&user_id=eq.${userId}&select=id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    const events = await evRes.json();
    if (!Array.isArray(events) || events.length === 0) {
      return new Response('Forbidden', { status: 403 });
    }

    // Forward to push-send with internal CRON_SECRET
    const host = new URL(req.url).origin;
    const sendRes = await fetch(`${host}/api/push-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({ eventCode, title, body, url }),
    });

    const result = await sendRes.json().catch(() => ({}));
    return new Response(JSON.stringify(result), {
      status: sendRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
