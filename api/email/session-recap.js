// POST /api/email/session-recap
// Called from Host.jsx "Прати AI Рекап" button after session ends.
// Fetches poll results, generates AI summary via Gemini Flash, emails host via Resend.
//
// Body: { event_id }
// Auth: Authorization: Bearer <supabase_access_token> — identity is derived
// server-side from the verified JWT, never from a client-supplied header.

export const config = { runtime: 'edge' };

import { getAuthedUser } from '../_lib/auth.js';
import { getClientIp, checkRateLimit } from '../_lib/rateLimit.js';

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

const SB_URL  = process.env.SUPABASE_URL;
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND  = process.env.RESEND_API_KEY;
const GEMINI  = process.env.GEMINI_API_KEY;
const MODEL   = process.env.GEMINI_FLASH_MODEL || 'gemini-3.6-flash';
const FROM    = process.env.EMAIL_FROM || 'MKD Slidea <hello@mismath.net>';
const APP_URL = process.env.APP_URL   || 'https://slidea.mismath.net';

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});

async function sbFetch(path, params = {}) {
  const url = new URL(`${SB_URL}/rest/v1/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Accept: 'application/json' },
  });
  return res.json();
}

async function geminiSummarize(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.4 },
      }),
    }
  );
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

function buildRecapHtml({ eventTitle, code, participantCount, recap, dashboardUrl }) {
  const safeTitle = (eventTitle || `#${code}`).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeRecap = (recap || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.7;">')
    .replace(/\n/g, '<br>');
  return `<!doctype html><html lang="mk"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.06);">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
          <div style="font-size:12px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:6px;">MKD Slidea · AI Рекап</div>
          <div style="font-size:22px;font-weight:900;color:#fff;line-height:1.3;">${safeTitle}</div>
          <div style="font-size:14px;color:rgba(255,255,255,.7);margin-top:8px;">${participantCount} учесници · Код: ${code}</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <div style="background:#f8fafc;border-left:4px solid #6366f1;border-radius:0 12px 12px 0;padding:20px;margin-bottom:24px;">
            <div style="font-size:12px;font-weight:900;color:#6366f1;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">🤖 AI Анализа</div>
            <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.7;">${safeRecap || 'Нема доволно податоци за AI анализа.'}</p>
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="${dashboardUrl}" style="background:#4f46e5;color:#fff;text-decoration:none;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;display:inline-block;">
              Гледај целосни статистики →
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
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, {
    status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type,authorization' }
  });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const ip = getClientIp(req);
  const rate = await checkRateLimit('session-recap', ip, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rate.allowed) return json({ error: 'rate_limited' }, 429);

  const authedUser = await getAuthedUser(req);
  if (!authedUser?.id) return json({ error: 'unauthorized' }, 401);
  const userId = authedUser.id;

  let body;
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const eventId = String(body?.event_id || '').trim();
  if (!eventId) return json({ error: 'missing_params' }, 400);
  if (!SB_URL || !SB_KEY)  return json({ error: 'no_supabase' }, 500);

  // Load event
  const [event] = await sbFetch('events', {
    select: 'id,title,code,user_id',
    id: `eq.${eventId}`,
    limit: '1',
  }).catch(() => []);

  if (!event || event.user_id !== userId) return json({ error: 'not_found' }, 404);

  // Load host profile
  const [profile] = await sbFetch('profiles', {
    select: 'email,name',
    id: `eq.${userId}`,
    limit: '1',
  }).catch(() => []);

  if (!profile?.email) return json({ error: 'no_email' }, 400);

  // Load polls + votes
  const polls = await sbFetch('polls', {
    select: 'id,title,type,options,correct_option',
    event_id: `eq.${eventId}`,
    order: 'position',
    limit: '30',
  }).catch(() => []);

  const votes = await sbFetch('votes', {
    select: 'poll_id,value,session_id',
    poll_id: `in.(${(polls || []).map(p => p.id).join(',') || 'null'})`,
    limit: '500',
  }).catch(() => []);

  // Count unique participants
  const sessions = new Set((votes || []).map(v => v.session_id));
  const participantCount = sessions.size;

  // Build stats summary for AI
  const statsLines = (polls || []).map(poll => {
    const pollVotes = (votes || []).filter(v => v.poll_id === poll.id);
    if (pollVotes.length === 0) return `- ${poll.title} (нема одговори)`;
    if (poll.type === 'quiz' && poll.correct_option != null) {
      const correct = pollVotes.filter(v => v.value === poll.correct_option).length;
      const pct = Math.round((correct / pollVotes.length) * 100);
      return `- ${poll.title}: ${pct}% точни (${pollVotes.length} одговори)`;
    }
    return `- ${poll.title}: ${pollVotes.length} одговори`;
  }).join('\n');

  const prompt = `Ти си педагошки асистент. Анализирај ги резултатите од интерактивниот час и дај кратко резиме (3-5 реченици на македонски).

Настан: "${event.title || `#${event.code}`}"
Учесници: ${participantCount}
Резултати по прашање:
${statsLines || '(нема прашања)'}

Дај:
1. Општ впечаток (1 реченица)
2. Кои теми беа добро разбрани
3. Кои теми треба повторување
4. Еден конкретен совет за следниот час

Одговори директно, без вовед.`;

  let recap = null;
  if (GEMINI && polls?.length > 0) {
    recap = await geminiSummarize(prompt).catch(() => null);
  }

  if (!RESEND) {
    return json({ ok: true, sent: false, recap, reason: 'resend_disabled' });
  }

  const dashboardUrl = `${APP_URL}/dashboard`;
  const html = buildRecapHtml({
    eventTitle: event.title,
    code: event.code,
    participantCount,
    recap,
    dashboardUrl,
  });

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [profile.email],
      subject: `AI Рекап: ${event.title || `Настан #${event.code}`} — ${participantCount} учесници`,
      html,
      text: `AI Рекап за "${event.title || event.code}":\n\n${recap || 'Нема доволно податоци.'}\n\n${dashboardUrl}`,
      tags: [{ name: 'category', value: 'session_recap' }],
    }),
  }).catch(() => null);

  const sent = emailRes?.ok === true;
  return json({ ok: true, sent, participantCount, pollCount: (polls || []).length });
}
