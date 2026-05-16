// Manual checkout order creator.
// Insert pending order in Supabase + send email notification (Resend, optional).
//
//   POST /api/v1/create-order
//   Body: { order_id, plan, amount, currency, method, email, full_name,
//           org_name, tax_id, needs_invoice, note, user_id }
//
// Stripe ќе го замени ова кога ќе се интегрира. Засега: full audit trail во
// Supabase + email до admin и customer.

export const config = { runtime: 'edge' };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-mkd-secret',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
  });

const PLAN_AMOUNTS = {
  monthly: 5, quarterly: 10, semester: 15, yearly: 20,
};

const PLAN_DAYS = {
  monthly: 31, quarterly: 93, semester: 186, yearly: 366,
};

const escapeHtml = (s) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const sanitize = (s, max = 500) =>
  String(s || '').replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '').slice(0, max);

const validEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

async function insertOrder(env, payload) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, status: 0, error: 'Supabase env missing' };

  const r = await fetch(`${url}/rest/v1/manual_orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  if (!r.ok) return { ok: false, status: r.status, error: text };
  return { ok: true, status: r.status, data: text };
}

async function sendEmail(env, { to, subject, html, replyTo }) {
  if (!env.RESEND_API_KEY) return { ok: false, skipped: true };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM || 'MKD Slidea <orders@slidea.mismath.net>',
      to: Array.isArray(to) ? to : [to],
      reply_to: replyTo || env.BILLING_EMAIL || 'billing@slidea.mismath.net',
      subject,
      html,
    }),
  });
  return { ok: r.ok, status: r.status };
}

const customerHtml = (o) => `<!doctype html>
<html lang="mk"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
<tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;color:#fff;">
<div style="font-size:12px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;opacity:.85;">MKD Slidea</div>
<div style="font-size:24px;font-weight:900;margin-top:8px;">Нарачка ${escapeHtml(o.order_id)}</div>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Здраво ${escapeHtml(o.full_name || '')},</p>
<p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 24px;">
Ја примивме твојата нарачка за <b>${escapeHtml(o.plan)}</b> план. По уплата, активацијата следи во рок од 24h.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:16px;margin-bottom:24px;">
<tr><td style="padding:16px;border-bottom:1px solid #e2e8f0;"><b>Order ID</b><br><span style="font-family:monospace;color:#4f46e5;">${escapeHtml(o.order_id)}</span></td></tr>
<tr><td style="padding:16px;border-bottom:1px solid #e2e8f0;"><b>План</b>: ${escapeHtml(o.plan)}</td></tr>
<tr><td style="padding:16px;border-bottom:1px solid #e2e8f0;"><b>Износ</b>: ${escapeHtml(String(o.amount))} ${escapeHtml(o.currency)}</td></tr>
<tr><td style="padding:16px;"><b>Метод</b>: ${escapeHtml(o.method)}</td></tr>
</table>
<p style="font-size:14px;color:#64748b;line-height:1.6;margin:0;">
Не заборавај да го впишеш Order ID-то во „Note“ или „Цел на дознака“ при плаќањето.
Прашања? Одговори на овој email.
</p>
</td></tr></table></td></tr></table></body></html>`;

const adminHtml = (o) => `<!doctype html><html><body style="font-family:system-ui;background:#f8fafc;padding:24px;">
<h2 style="color:#0f172a;">Нова нарачка ${escapeHtml(o.order_id)}</h2>
<table cellpadding="8" style="border-collapse:collapse;background:#fff;border-radius:8px;">
<tr><td><b>План</b></td><td>${escapeHtml(o.plan)}</td></tr>
<tr><td><b>Износ</b></td><td>${escapeHtml(String(o.amount))} ${escapeHtml(o.currency)}</td></tr>
<tr><td><b>Метод</b></td><td>${escapeHtml(o.method)}</td></tr>
<tr><td><b>Email</b></td><td>${escapeHtml(o.email)}</td></tr>
<tr><td><b>Име</b></td><td>${escapeHtml(o.full_name || '')}</td></tr>
<tr><td><b>Фирма</b></td><td>${escapeHtml(o.org_name || '')}</td></tr>
<tr><td><b>ЕДБ</b></td><td>${escapeHtml(o.tax_id || '')}</td></tr>
<tr><td><b>Фактура</b></td><td>${o.needs_invoice ? 'ДА' : 'не'}</td></tr>
<tr><td><b>Note</b></td><td>${escapeHtml(o.note || '')}</td></tr>
<tr><td><b>User ID</b></td><td>${escapeHtml(o.user_id || 'guest')}</td></tr>
</table></body></html>`;

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const env = (typeof process !== 'undefined' && process.env) || {};

  const plan = sanitize(body.plan, 32);
  const method = sanitize(body.method, 32);
  const email = sanitize(body.email, 200);
  const order_id = sanitize(body.order_id, 64);

  if (!plan || !PLAN_AMOUNTS[plan]) return json({ error: 'Invalid plan' }, 400);
  if (!['paypal', 'bank_eur', 'bank_mkd'].includes(method)) return json({ error: 'Invalid method' }, 400);
  if (!validEmail(email)) return json({ error: 'Invalid email' }, 400);
  if (!/^SLD-[A-Z0-9-]{6,}$/.test(order_id)) return json({ error: 'Invalid order_id' }, 400);

  const amount = PLAN_AMOUNTS[plan];
  const currency = 'EUR';

  const payload = {
    order_id,
    plan,
    amount,
    currency,
    method,
    email,
    full_name: sanitize(body.full_name, 120),
    org_name: sanitize(body.org_name, 200),
    tax_id: sanitize(body.tax_id, 50),
    needs_invoice: !!body.needs_invoice,
    note: sanitize(body.note, 500),
    user_id: body.user_id ? sanitize(body.user_id, 64) : null,
    plan_days: PLAN_DAYS[plan],
    status: 'pending',
    created_at: new Date().toISOString(),
    ip: req.headers.get('x-forwarded-for') || null,
    user_agent: sanitize(req.headers.get('user-agent') || '', 300),
  };

  const ins = await insertOrder(env, payload);
  if (!ins.ok) return json({ error: 'DB insert failed', detail: ins.error }, 500);

  // Fire-and-forget emails (don't block response on failure).
  try {
    await Promise.all([
      sendEmail(env, {
        to: email,
        subject: `MKD Slidea — Нарачка ${order_id} примена`,
        html: customerHtml(payload),
      }),
      env.BILLING_EMAIL && sendEmail(env, {
        to: env.BILLING_EMAIL,
        subject: `[NEW ORDER] ${order_id} · ${plan} · ${amount} ${currency}`,
        html: adminHtml(payload),
        replyTo: email,
      }),
    ]);
  } catch (e) {
    // Log only — order е веќе впишана.
    console.error('email send failed:', e?.message);
  }

  return json({ ok: true, order_id, status: 'pending' });
}
