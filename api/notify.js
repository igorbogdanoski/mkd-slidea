export const config = { runtime: 'edge' };

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const NOTIFY_SECRET = process.env.NOTIFY_SECRET;

async function sbGet(table, filters, select) {
  const url = new URL(`${SB_URL}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  url.searchParams.set('limit', '1');
  for (const [k, v] of Object.entries(filters)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  const rows = await res.json();
  return rows?.[0] ?? null;
}

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('ok');

  // Verify shared secret set in Supabase webhook header
  if (NOTIFY_SECRET) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${NOTIFY_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let body;
  try { body = await req.json(); } catch { return new Response('ok'); }

  // Supabase Database Webhook payload shape: { type:'INSERT', table:'questions', record:{...} }
  const q = body.record;
  if (!q?.event_id || !q?.text) return new Response('ok');
  // Skip already-approved questions (no moderation queue)
  if (q.is_approved === true) return new Response('ok');

  if (!SB_URL || !SB_KEY || !RESEND_KEY) return new Response('ok');

  const event = await sbGet('events', { 'id': `eq.${q.event_id}` }, 'title,code,user_id');
  if (!event?.user_id) return new Response('ok');

  const profile = await sbGet('profiles', { 'id': `eq.${event.user_id}` }, 'email,name');
  if (!profile?.email) return new Response('ok');

  const eventName = event.title || `#${event.code}`;
  const author = q.author || 'Анонимен';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MKD Slidea <onboarding@resend.dev>',
      to: [profile.email],
      subject: `💬 Ново прашање на „${eventName}"`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:24px">
          <div style="background:#4f46e5;border-radius:16px 16px 0 0;padding:24px 32px">
            <p style="color:rgba(255,255,255,.7);margin:0;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">MKD Slidea</p>
            <h1 style="color:#fff;margin:8px 0 0;font-size:22px;font-weight:900">Ново прашање чека одобрување</h1>
          </div>
          <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:32px">
            <div style="background:#f8fafc;border-left:4px solid #4f46e5;border-radius:0 12px 12px 0;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;font-size:18px;font-weight:700;color:#1e293b">"${q.text}"</p>
              <p style="margin:10px 0 0;font-size:13px;color:#64748b;font-weight:600">— ${author}</p>
            </div>
            <p style="color:#64748b;font-size:14px;margin:0 0 24px">Настан: <strong style="color:#1e293b">${eventName}</strong></p>
            <a href="https://slidea.mismath.net/host"
               style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;
                      padding:14px 28px;border-radius:12px;font-weight:900;font-size:15px">
              Одговори сега →
            </a>
            <p style="color:#cbd5e1;font-size:12px;margin:32px 0 0">
              MKD Slidea · slidea.mismath.net · Одјавете се во поставки
            </p>
          </div>
        </div>`,
    }),
  });

  return new Response('ok');
}
