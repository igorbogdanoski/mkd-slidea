// GET /api/check-backup-health — Daily cron (Vercel Cron, 10:00 UTC).
// The self-hosted Postgres backup script (VPS cron) writes a heartbeat to
// public.system_health on every successful run. This checks that heartbeat
// and emails the founder if it's gone stale (>26h — the backup runs daily
// at 03:00, so 26h gives one missed run some slack before alerting) — a
// silently-broken backup cron previously looked identical to a working one.
// Protected by CRON_SECRET header set in Vercel dashboard.

export const config = { runtime: 'edge' };

import { logServerError } from './_lib/logError.js';

const SB_URL  = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND  = process.env.RESEND_API_KEY;
const FROM    = process.env.RESEND_FROM || 'MKD Slidea <hello@mismath.net>';
const ALERT_TO = process.env.BILLING_EMAIL;
const SECRET  = process.env.CRON_SECRET;
const STALE_AFTER_HOURS = 26;

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

async function sendAlert(hoursStale) {
  if (!RESEND || !ALERT_TO) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [ALERT_TO],
      subject: `⚠️ MKD Slidea: backup-от не се извршил веќе ${Math.round(hoursStale)}ч`,
      text: `Последниот успешен backup на self-hosted Postgres беше пред ${Math.round(hoursStale)} часа — очекувано е секои 24ч. Провери го cron-от на VPS-от (/root/backups/backup-mkdslidea.sh, crontab -l).`,
    }),
  });
  return res.ok;
}

export default async function handler(req) {
  if (SECRET) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${SECRET}`) return json({ error: 'unauthorized' }, 401);
  }
  if (!SB_URL || !SB_KEY) return json({ error: 'no_supabase' }, 500);

  try {
    const res = await fetch(`${SB_URL}/rest/v1/system_health?key=eq.backup&select=last_success_at`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Accept: 'application/json' },
    });
    const rows = await res.json();
    const lastSuccess = rows?.[0]?.last_success_at;

    if (!lastSuccess) {
      await sendAlert(9999);
      return json({ ok: true, alerted: true, reason: 'no_heartbeat_yet' });
    }

    const hoursStale = (Date.now() - new Date(lastSuccess).getTime()) / (60 * 60 * 1000);
    if (hoursStale > STALE_AFTER_HOURS) {
      const alerted = await sendAlert(hoursStale);
      return json({ ok: true, alerted, hoursStale: Math.round(hoursStale) });
    }

    return json({ ok: true, alerted: false, hoursStale: Math.round(hoursStale) });
  } catch (err) {
    await logServerError('server', err, { route: 'api/check-backup-health' });
    return json({ error: 'internal_error' }, 500);
  }
}
