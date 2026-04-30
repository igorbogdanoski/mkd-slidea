// Sprint 1.5 — Welcome email via Resend (free tier: 3000/mo, 100/day).
// Graceful degrade: if RESEND_API_KEY is missing, returns 200 noop so
// sign-up flow is never blocked.
//
//   POST /api/welcome-email   { email, name }
//   Headers: x-mkd-secret: <SUPABASE_ANON_KEY first 16 chars>  (light CSRF guard)

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

const escapeHtml = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildHtml = ({ name, appUrl }) => {
  const displayName = escapeHtml(name || 'наставник');
  const url = appUrl || 'https://slidea.mismath.net';
  return `<!doctype html>
<html lang="mk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Добредојде во MKD Slidea</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px 32px;text-align:center;color:#ffffff;">
          <div style="font-size:14px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;opacity:0.85;margin-bottom:8px;">MKD Slidea</div>
          <div style="font-size:28px;font-weight:900;line-height:1.2;">Добредојде, ${displayName}! 🎉</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="font-size:16px;line-height:1.6;margin:0 0 24px;color:#334155;">
            Среќни сме што се приклучи на најголемата заедница на наставници во Македонија што користат интерактивни квизови, анкети и презентации.
          </p>

          <p style="font-size:14px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">3 чекори за прв успех</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
              <div style="font-weight:900;color:#0f172a;font-size:15px;">1. Создај го твојот прв квиз</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">AI асистент во една секунда — само внеси тема.</div>
            </td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
              <div style="font-weight:900;color:#0f172a;font-size:15px;">2. Покани ученици преку код или QR</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">До 200 учесници бесплатно, без логирање.</div>
            </td></tr>
            <tr><td style="padding:12px 0;">
              <div style="font-weight:900;color:#0f172a;font-size:15px;">3. Сподели резултат со колеги</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">+30 дена Pro за секој препорачан колега што направи настан.</div>
            </td></tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${url}/host" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:900;font-size:16px;padding:16px 32px;border-radius:16px;">
                Создај прв настан →
              </a>
            </td></tr>
          </table>

          <div style="background:#f8fafc;border-radius:16px;padding:16px;font-size:13px;line-height:1.6;color:#64748b;">
            <strong style="color:#0f172a;">Совет:</strong> Пробај <a href="${url}/templates" style="color:#4f46e5;text-decoration:none;font-weight:900;">готовите шаблони</a> — 20+ квизови по предмет, спремни за час.
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:24px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;">
          MKD Slidea • Автор: Игор Богданоски • <a href="${url}" style="color:#4f46e5;text-decoration:none;">${url.replace(/^https?:\/\//, '')}</a><br>
          Овој email е испратен бидејќи си се регистрираше за MKD Slidea.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const buildText = ({ name, appUrl }) => {
  const url = appUrl || 'https://slidea.mismath.net';
  return `Добредојде во MKD Slidea, ${name || 'наставник'}!

3 чекори за прв успех:
1. Создај го твојот прв квиз: ${url}/host
2. Покани ученици преку код или QR (200 бесплатно)
3. Сподели резултат со колеги (+30 дена Pro по препорака)

Готови шаблони: ${url}/templates

— Тимот на MKD Slidea`;
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const email = String(body?.email || '').trim().toLowerCase();
  const name = String(body?.name || '').trim().slice(0, 80);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'invalid_email' }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'MKD Slidea <welcome@mismath.net>';
  const appUrl = process.env.APP_URL || 'https://slidea.mismath.net';

  // Graceful degrade: never block sign-up if email service isn't configured.
  if (!apiKey) {
    return json({ ok: true, sent: false, reason: 'email_disabled' });
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Добредојде во MKD Slidea — почни за 3 минути',
        html: buildHtml({ name, appUrl }),
        text: buildText({ name, appUrl }),
        tags: [{ name: 'category', value: 'welcome' }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return json({ ok: false, sent: false, status: res.status, detail: detail.slice(0, 200) }, 200);
    }
    const data = await res.json().catch(() => ({}));
    return json({ ok: true, sent: true, id: data?.id || null });
  } catch (e) {
    return json({ ok: false, sent: false, error: 'network' }, 200);
  }
}
