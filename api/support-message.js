// POST /api/support-message
// Body: { message: string, email?: string, pageUrl?: string }
// Stores a support/feedback submission from the in-app widget
// (src/components/SupportWidget.jsx) and emails a copy to BILLING_EMAIL.
// Works for logged-out visitors too (email is optional, user_id null).

export const config = { runtime: 'edge' };

import { getAuthedUser } from './_lib/auth.js';
import { getClientIp, checkRateLimit } from './_lib/rateLimit.js';
import { logServerError } from './_lib/logError.js';

const SB_URL   = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SB_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND   = process.env.RESEND_API_KEY;
const FROM     = process.env.RESEND_FROM || 'MKD Slidea <hello@mismath.net>';
const ALERT_TO = process.env.BILLING_EMAIL;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;
const MAX_MESSAGE_LEN = 4000;

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

async function notifyAdmin(message, email, pageUrl) {
  if (!RESEND || !ALERT_TO) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [ALERT_TO],
        reply_to: email || undefined,
        subject: `💬 Ново прашање/фидбек${email ? ` од ${email}` : ''}`,
        text: `${message}\n\n---\nОд: ${email || '(непознат корисник)'}\nСтраница: ${pageUrl || '(непозната)'}`,
      }),
    });
  } catch { /* best-effort — the message is already saved in support_messages */ }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const rate = await checkRateLimit('support-message', getClientIp(req), RATE_LIMIT, RATE_WINDOW_MS);
  if (!rate.allowed) return json({ error: 'rate_limited' }, 429);

  if (!SB_URL || !SB_KEY) return json({ error: 'no_supabase' }, 500);

  try {
    const body = await req.json();
    const message = (body.message || '').trim().slice(0, MAX_MESSAGE_LEN);
    if (!message) return json({ error: 'message required' }, 400);

    const authedUser = await getAuthedUser(req);
    const email = authedUser?.email || (typeof body.email === 'string' ? body.email.trim().slice(0, 200) : null);
    const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.slice(0, 500) : null;

    const res = await fetch(`${SB_URL}/rest/v1/support_messages`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        user_id: authedUser?.id || null,
        email,
        message,
        page_url: pageUrl,
      }),
    });
    if (!res.ok) throw new Error(`insert failed: ${res.status} ${await res.text()}`);

    await notifyAdmin(message, email, pageUrl);

    return json({ ok: true });
  } catch (err) {
    await logServerError('server', err, { route: 'api/support-message' });
    return json({ error: 'internal_error' }, 500);
  }
}
