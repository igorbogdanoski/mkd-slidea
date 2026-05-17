// POST /api/push-subscribe
// Body: { subscription: PushSubscription, eventCode: string }
// Saves browser push subscription linked to an event session.
// DELETE /api/push-subscribe
// Body: { endpoint: string } — removes subscription

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabase(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'resolution=merge-duplicates' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`);
  }
  return res;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, DELETE', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }

  try {
    const body = await req.json();

    if (req.method === 'DELETE') {
      const { endpoint } = body;
      if (!endpoint) return new Response(JSON.stringify({ error: 'endpoint required' }), { status: 400 });
      await supabase(`/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, 'DELETE');
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST') {
      const { subscription, eventCode } = body;
      if (!subscription?.endpoint) return new Response(JSON.stringify({ error: 'subscription required' }), { status: 400 });

      await supabase('/push_subscriptions', 'POST', {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
        event_code: eventCode || null,
        created_at: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
