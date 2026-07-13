// GET /api/email/renewal-reminder — Daily cron (Vercel Cron, 08:00 UTC).
// Emails paid-plan customers whose subscription (profiles.pro_until) expires
// within 3 days, so a lapsed subscription isn't just silently downgraded
// (see api/_lib/planEnforcement.js effectivePlan) with no attempt to renew.
// Protected by CRON_SECRET header set in Vercel dashboard.
//
// Requires: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET

export const config = { runtime: 'edge' };

import { logServerError } from '../_lib/logError.js';

const SB_URL  = process.env.SUPABASE_URL;
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND  = process.env.RESEND_API_KEY;
const FROM    = process.env.RESEND_FROM || 'MKD Slidea <hello@mismath.net>';
const APP_URL = process.env.APP_URL || 'https://slidea.mismath.net';
const SECRET  = process.env.CRON_SECRET;

const PAID_PLANS = ['pro', 'monthly', 'quarterly', 'semester', 'yearly'];

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { 'Content-Type': 'application/json' },
});

async function sb(path, params = {}) {
  const url = new URL(`${SB_URL}/rest/v1/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, item);
    } else {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Accept: 'application/json' },
  });
  return res.json();
}

async function sbPatch(path, params, body) {
  const url = new URL(`${SB_URL}/rest/v1/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function sendEmail(to, subject, html, text) {
  if (!RESEND) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  });
  return res.ok;
}

function buildReminderEmail(name, planLabel, expiresOn) {
  const n = name || 'наставник';
  const html = `<!doctype html><html lang="mk"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.06);">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
          <div style="font-size:12px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:6px;">MKD Slidea</div>
          <div style="font-size:22px;font-weight:900;color:#fff;line-height:1.3;">Твојот план ${planLabel} истекува наскоро</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
            Здраво ${n}, твојот план истекува на <strong>${expiresOn}</strong>. По истекот, сметката автоматски се враќа на бесплатниот план и ги губиш платените функции (export, AI Insights, повеќе учесници).
          </p>
          <div style="text-align:center;margin-top:24px;">
            <a href="${APP_URL}/pricing" style="background:#4f46e5;color:#fff;text-decoration:none;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;display:inline-block;">
              Продолжи го планот →
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;">
          MKD Slidea · <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">slidea.mismath.net</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return {
    subject: `Твојот план истекува на ${expiresOn}`,
    html,
    text: `Твојот MKD Slidea план истекува на ${expiresOn}. Продолжи: ${APP_URL}/pricing`,
  };
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  if (SECRET) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${SECRET}`) return json({ error: 'unauthorized' }, 401);
  }

  if (!SB_URL || !SB_KEY) return json({ error: 'no_supabase' }, 500);
  if (!RESEND) return json({ ok: true, sent: 0, reason: 'resend_disabled' });

  const now = new Date();
  const cutoff = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  let sent = 0;
  const errors = [];

  try {
    const candidates = await sb('profiles', {
      select: 'id,email,name,plan,pro_until,renewal_reminder_sent_at',
      plan: `in.(${PAID_PLANS.join(',')})`,
      pro_until: [`gte.${now.toISOString()}`, `lte.${cutoff.toISOString()}`],
      limit: '200',
    }).catch(() => []);

    if (Array.isArray(candidates)) {
      for (const p of candidates) {
        if (!p.email) continue;

        // Skip if already reminded for THIS expiration window — a renewal
        // pushes pro_until forward, which naturally makes an old reminder
        // timestamp fall outside the new "4 days before expiry" window,
        // so the next cycle gets its own reminder without any manual reset.
        if (p.renewal_reminder_sent_at) {
          const reminderAt = new Date(p.renewal_reminder_sent_at).getTime();
          const proUntil = new Date(p.pro_until).getTime();
          if (reminderAt > proUntil - 4 * 24 * 60 * 60 * 1000) continue;
        }

        const expiresOn = new Date(p.pro_until).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' });
        const { subject, html, text } = buildReminderEmail(p.name, p.plan, expiresOn);
        const ok = await sendEmail(p.email, subject, html, text);
        if (ok) {
          sent++;
          await sbPatch('profiles', { id: `eq.${p.id}` }, { renewal_reminder_sent_at: now.toISOString() });
        } else {
          errors.push(p.id);
        }
      }
    }
  } catch (err) {
    await logServerError('server', err, { route: 'api/email/renewal-reminder' });
    return json({ error: 'internal_error' }, 500);
  }

  return json({ ok: true, sent, errors: errors.length });
}
