// GET /api/email/drip-cron — Daily email drip cron (Vercel Cron, 09:00 UTC)
// Sends onboarding emails at day 3, 7, 14 after signup.
// Protected by CRON_SECRET header set in Vercel dashboard.
//
// Requires: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET

export const config = { runtime: 'edge' };

const SB_URL  = process.env.SUPABASE_URL;
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND  = process.env.RESEND_API_KEY;
const FROM    = process.env.EMAIL_FROM || 'MKD Slidea <hello@mismath.net>';
const APP_URL = process.env.APP_URL   || 'https://slidea.mismath.net';
const SECRET  = process.env.CRON_SECRET;

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { 'Content-Type': 'application/json' },
});

async function sb(path, params = {}) {
  const url = new URL(`${SB_URL}/rest/v1/${path}`);
  for (const [k, v] of Object.entries(params)) {
    // Array values append multiple same-name params (e.g. two `created_at`
    // range filters combined with AND by PostgREST) instead of overwriting.
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

async function sbPost(path, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
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

// ─── Email Templates ──────────────────────────────────────────────────────────

const header = (title) => `
  <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
    <div style="font-size:12px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:6px;">MKD Slidea</div>
    <div style="font-size:24px;font-weight:900;color:#fff;line-height:1.3;">${title}</div>
  </div>`;

const footer = `
  <div style="background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;">
    MKD Slidea · <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">slidea.mismath.net</a>
  </div>`;

const wrap = (inner) => `<!doctype html><html lang="mk"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.06);">
        ${inner}
      </table>
    </td></tr>
  </table>
</body></html>`;

function buildDay3(name) {
  const n = name || 'наставник';
  const html = wrap(`
    ${header(`3 совети за ${n} 💡`)}
    <tr><td style="padding:32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
        Минаа 3 дена откако се приклучи. Еве 3 практични совети за подобри резултати:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
          <div style="font-weight:900;color:#1e293b;font-size:15px;">⚡ Користи AI за да заштедиш 90% од времето</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">Внеси тема → добиваш целосен квиз за 30 секунди. Без рачно пишување.</div>
        </td></tr>
        <tr><td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
          <div style="font-weight:900;color:#1e293b;font-size:15px;">🎯 Почни со Word Cloud за загревање</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">„Со еден збор, кажи ми за темата..." — сите учествуваат за 30 секунди.</div>
        </td></tr>
        <tr><td style="padding:14px 0;">
          <div style="font-weight:900;color:#1e293b;font-size:15px;">📊 Следи ги резултатите по ученик</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">Во Dashboard → Статистики гледаш кој ученик дал кој одговор.</div>
        </td></tr>
      </table>
      <div style="text-align:center;margin-top:28px;">
        <a href="${APP_URL}/host" style="background:#4f46e5;color:#fff;text-decoration:none;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;display:inline-block;">
          Создај нов настан →
        </a>
      </div>
    </td></tr>
    ${footer}
  `);
  return {
    subject: '3 совети за поанажирани ученици — MKD Slidea',
    html,
    text: `3 совети за ${n}:\n1. Користи AI — квиз за 30 сек\n2. Почни со Word Cloud\n3. Следи резултати по ученик\n\n${APP_URL}/host`,
  };
}

function buildDay7(name) {
  const n = name || 'наставник';
  const html = wrap(`
    ${header(`${n}, пробале сте ги шаблоните? 📚`)}
    <tr><td style="padding:32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
        Имаме 100+ готови шаблони за македонски предмети — математика, физика, историја, јазик…
        Спремни, само кликни и почни.
      </p>
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="font-size:13px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">Популарни оваа недела</div>
        <div style="font-size:14px;color:#1e293b;line-height:2;">
          📐 Математика — Разломки (6-то одделение)<br>
          🔬 Физика — Ньутонови закони (8-мо)<br>
          📖 Историја — Прва светска војна (8-мо)<br>
          💻 Информатика — Python основи (9-то)
        </div>
      </div>
      <div style="text-align:center;">
        <a href="${APP_URL}/templates" style="background:#4f46e5;color:#fff;text-decoration:none;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;display:inline-block;">
          Разгледај шаблони →
        </a>
      </div>
    </td></tr>
    ${footer}
  `);
  return {
    subject: 'Готови квизови за вашиот предмет — MKD Slidea',
    html,
    text: `100+ готови шаблони за МК предмети: ${APP_URL}/templates`,
  };
}

function buildDay14(name) {
  const n = name || 'наставник';
  const html = wrap(`
    ${header(`${n}, твоите ученици ве чекаат 🏆`)}
    <tr><td style="padding:32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
        Минаа 2 недели. Ако сè уште не си создал час, еве најлесниот почеток:
      </p>
      <div style="background:linear-gradient(135deg,#eef2ff,#f5f3ff);border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #e0e7ff;">
        <div style="font-weight:900;color:#4338ca;font-size:16px;margin-bottom:8px;">🚀 Брзо старт — 5 минути</div>
        <ol style="margin:0;padding:0 0 0 20px;font-size:14px;color:#334155;line-height:2;">
          <li>Кликни „+ Нов настан" во Dashboard</li>
          <li>Избери „AI Генерирај" и внеси тема</li>
          <li>Прикажи го кодот на проекторот</li>
          <li>Учениците се приклучуваат — готово!</li>
        </ol>
      </div>
      <p style="font-size:14px;color:#64748b;margin:0 0 24px;">
        <strong style="color:#1e293b;">Или:</strong> Надгради на Pro план (5€/месец) и добивај до 2.000 AI генерирања месечно, CSV извоз и напредни статистики.
      </p>
      <div style="text-align:center;">
        <a href="${APP_URL}/host" style="background:#4f46e5;color:#fff;text-decoration:none;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;display:inline-block;margin-right:12px;">
          Почни сега →
        </a>
        <a href="${APP_URL}/pricing" style="background:#f8fafc;color:#4f46e5;text-decoration:none;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;display:inline-block;border:1.5px solid #e0e7ff;">
          Гледај планови
        </a>
      </div>
    </td></tr>
    ${footer}
  `);
  return {
    subject: 'Сè уште те чекаме, ' + n + ' — создај прв час денес',
    html,
    text: `Почни со MKD Slidea: ${APP_URL}/host | Планови: ${APP_URL}/pricing`,
  };
}

const DRIP_BUILDERS = { 3: buildDay3, 7: buildDay7, 14: buildDay14 };

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  // Vercel cron calls with Authorization: Bearer <CRON_SECRET>
  if (SECRET) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${SECRET}`) return json({ error: 'unauthorized' }, 401);
  }

  if (!SB_URL || !SB_KEY) return json({ error: 'no_supabase' }, 500);
  if (!RESEND)             return json({ ok: true, sent: 0, reason: 'resend_disabled' });

  const today = new Date();
  let totalSent = 0;
  const errors = [];

  for (const day of [3, 7, 14]) {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - day);
    const dateStr = cutoff.toISOString().slice(0, 10);

    // Profiles created on that day (window: that calendar day UTC)
    const profiles = await sb('profiles', {
      select: 'id,email,name,plan',
      created_at: [`gte.${dateStr}T00:00:00Z`, `lte.${dateStr}T23:59:59Z`],
      order: 'created_at',
      limit: '100',
    }).catch(() => []);

    if (!Array.isArray(profiles) || profiles.length === 0) continue;

    // Get already-sent drip_day=day logs for these users
    const ids = profiles.map(p => p.id);
    const logs = await sb('email_drip_log', {
      select: 'user_id',
      drip_day: `eq.${day}`,
      user_id: `in.(${ids.join(',')})`,
    }).catch(() => []);

    const sent = new Set(Array.isArray(logs) ? logs.map(l => l.user_id) : []);

    for (const profile of profiles) {
      if (sent.has(profile.id) || !profile.email) continue;

      const builder = DRIP_BUILDERS[day];
      if (!builder) continue;

      const { subject, html, text } = builder(profile.name);
      const ok = await sendEmail(profile.email, subject, html, text);

      if (ok) {
        await sbPost('email_drip_log', { user_id: profile.id, email: profile.email, drip_day: day });
        totalSent++;
      } else {
        errors.push(`${profile.email}:day${day}`);
      }
    }
  }

  return json({ ok: true, sent: totalSent, errors: errors.length > 0 ? errors : undefined });
}
