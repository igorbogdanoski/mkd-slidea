// POST /api/push-send  — Node.js serverless (web-push needs Node crypto)
// Body: { eventCode: string, title: string, body: string, url?: string }
// Authorization: Bearer <CRON_SECRET>
// Fetches all push_subscriptions for the event and sends Web Push notifications.

import webpush from 'web-push';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

webpush.setVapidDetails(
  'mailto:bogdanoskiigor@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function getSubscriptions(eventCode) {
  const url = `${SUPABASE_URL}/rest/v1/push_subscriptions?event_code=eq.${encodeURIComponent(eventCode)}&select=endpoint,p256dh,auth`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const { eventCode, title, body: msgBody, url } = req.body;
    if (!eventCode || !title) {
      return res.status(400).json({ error: 'eventCode + title required' });
    }

    const subs = await getSubscriptions(eventCode);
    if (subs.length === 0) return res.json({ sent: 0 });

    const payload = JSON.stringify({
      title,
      body: msgBody || '',
      url: url || `/join/${eventCode}`,
      icon: '/favicon.svg',
    });

    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 86400 }
        )
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Remove expired subscriptions (410 Gone)
    const expiredEndpoints = results
      .map((r, i) => ({ r, sub: subs[i] }))
      .filter(({ r }) => r.status === 'rejected' && r.reason?.statusCode === 410)
      .map(({ sub }) => sub.endpoint);

    if (expiredEndpoints.length > 0) {
      await Promise.allSettled(expiredEndpoints.map((ep) =>
        fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(ep)}`, {
          method: 'DELETE',
          headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        })
      ));
    }

    res.json({ sent, failed, total: subs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
