// GET /api/email/pending-reminder
// Daily cron: sends admin digest of manual_orders pending for 2+ hours.
// Protected by CRON_SECRET (Authorization: Bearer <secret>).
//
// vercel.json schedule: "0 7 * * *" (07:00 UTC = 09:00 MKT)

export const config = { runtime: 'edge' };

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

async function queryPending(env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `${url}/rest/v1/manual_orders?select=order_id,plan,amount,currency,method,email,full_name,org_name,created_at&status=eq.pending&created_at=lte.${encodeURIComponent(cutoff)}&order=created_at.asc&limit=50`,
    {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Accept': 'application/json',
      },
    }
  );
  if (!res.ok) return [];
  return res.json();
}

const METHOD = { paypal: 'PayPal', bank_eur: 'IBAN/SWIFT', bank_mkd: 'МКД сметка' };

function buildAdminHtml(orders) {
  const total = orders.reduce((s, o) => s + Number(o.amount || 0), 0);
  const rows = orders.map((o) => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:10px 12px;font-family:monospace;color:#4f46e5;font-weight:900;">${o.order_id}</td>
      <td style="padding:10px 12px;font-weight:700;">${o.full_name || '—'}<br><span style="font-size:12px;color:#64748b;">${o.email}</span></td>
      <td style="padding:10px 12px;font-weight:700;">${o.plan}</td>
      <td style="padding:10px 12px;font-weight:900;">€${Number(o.amount).toFixed(2)}</td>
      <td style="padding:10px 12px;color:#7c3aed;font-weight:700;">${METHOD[o.method] || o.method}</td>
      <td style="padding:10px 12px;font-size:11px;color:#94a3b8;">${new Date(o.created_at).toLocaleString('mk-MK')}</td>
    </tr>`).join('');

  return `<!doctype html>
<html lang="mk"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;"><tr><td align="center">
<table width="680" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
<tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px;text-align:center;color:#fff;">
  <div style="font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;opacity:.85;">MKD Slidea · Admin Digest</div>
  <div style="font-size:22px;font-weight:900;margin-top:6px;">${orders.length} нарачки чекаат потврда</div>
  <div style="font-size:13px;opacity:.8;margin-top:4px;">Вкупно: €${total.toFixed(2)}</div>
</td></tr>
<tr><td style="padding:24px 32px;">
  <p style="color:#334155;font-weight:700;margin:0 0 16px;">
    Следниве нарачки се во статус <b>pending</b> подолго од 2 часа. Потврди ги во
    <a href="https://slidea.mismath.net/dashboard" style="color:#4f46e5;">Dashboard → Нарачки</a>.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;font-size:13px;">
    <thead>
      <tr style="background:#f8fafc;">
        <th style="padding:10px 12px;text-align:left;font-weight:900;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Order ID</th>
        <th style="padding:10px 12px;text-align:left;font-weight:900;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Клиент</th>
        <th style="padding:10px 12px;text-align:left;font-weight:900;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">План</th>
        <th style="padding:10px 12px;text-align:left;font-weight:900;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">€</th>
        <th style="padding:10px 12px;text-align:left;font-weight:900;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Метод</th>
        <th style="padding:10px 12px;text-align:left;font-weight:900;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Создадено</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</td></tr>
<tr><td style="padding:16px 32px 28px;text-align:center;">
  <a href="https://slidea.mismath.net/dashboard"
     style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:900;padding:14px 32px;border-radius:14px;font-size:14px;">
    Отвори Dashboard →
  </a>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

export default async function handler(req) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('authorization') || '';
  const env = (typeof process !== 'undefined' && process.env) || {};
  const secret = env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const orders = await queryPending(env);
  if (orders.length === 0) {
    return json({ ok: true, sent: false, reason: 'No pending orders older than 2h' });
  }

  const adminEmail = env.BILLING_EMAIL || env.RESEND_FROM_EMAIL;
  if (!adminEmail || !env.RESEND_API_KEY) {
    return json({ ok: false, error: 'BILLING_EMAIL or RESEND_API_KEY missing', count: orders.length });
  }

  const today = new Date().toLocaleDateString('mk-MK', { day: '2-digit', month: 'short', year: 'numeric' });
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM || 'MKD Slidea System <system@slidea.mismath.net>',
      to: [adminEmail],
      subject: `[MKD Slidea] ${orders.length} нарачки чекаат потврда · ${today}`,
      html: buildAdminHtml(orders),
    }),
  });

  return json({ ok: res.ok, sent: res.ok, count: orders.length, status: res.status });
}
