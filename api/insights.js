export const config = {
  runtime: 'edge',
};

import { kv } from '@vercel/kv';

const fallbackMap = new Map();
const RATE_LIMIT = 6;
const RATE_WINDOW_MS = 60 * 1000;

const MODEL = process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash';

function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function fallbackLimit(ip) {
  const now = Date.now();
  const entry = fallbackMap.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }
  entry.count++;
  fallbackMap.set(ip, entry);
  return {
    allowed: entry.count <= RATE_LIMIT,
    resetAt: entry.resetAt,
    remaining: Math.max(0, RATE_LIMIT - entry.count),
  };
}

async function checkRate(ip) {
  const bucket = Math.floor(Date.now() / RATE_WINDOW_MS);
  const key = `rate:insights:${ip}:${bucket}`;
  try {
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, Math.ceil(RATE_WINDOW_MS / 1000));
    return {
      allowed: count <= RATE_LIMIT,
      resetAt: (bucket + 1) * RATE_WINDOW_MS,
      remaining: Math.max(0, RATE_LIMIT - count),
    };
  } catch {
    return fallbackLimit(ip);
  }
}

const cleanText = (value, max = 200) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const ip = getClientIp(req);
  const rate = await checkRate(ip);
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: 'Премногу AI барања. Обидете се повторно по 1 минута.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))),
        },
      }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const eventTitle = cleanText(body?.eventTitle || 'Настан', 120);
  const polls = Array.isArray(body?.polls) ? body.polls.slice(0, 40) : [];

  if (polls.length === 0) {
    return new Response(JSON.stringify({ error: 'Нема доволно податоци за анализа.' }), { status: 400 });
  }

  const normalized = polls.map((p) => ({
    question: cleanText(p.question, 180),
    type: cleanText(p.type, 20),
    totalVotes: Number(p.totalVotes || 0),
    responseRate: Number(p.responseRate || 0),
    isQuiz: !!p.isQuiz,
    quizAccuracy: p.quizAccuracy === null || p.quizAccuracy === undefined ? null : Number(p.quizAccuracy),
    topAnswers: Array.isArray(p.topAnswers)
      ? p.topAnswers.slice(0, 4).map((a) => ({
          text: cleanText(a.text, 80),
          votes: Number(a.votes || 0),
          isCorrect: !!a.isCorrect,
        }))
      : [],
    // Pre-computed misconception signal: dominant wrong answer if it pulled
    // ≥30% votes — feeds the AI to author a targeted intervention.
    dominantWrong: (() => {
      if (!p.isQuiz || !Array.isArray(p.topAnswers)) return null;
      const total = p.topAnswers.reduce((a, x) => a + Number(x.votes || 0), 0);
      if (!total) return null;
      const wrong = p.topAnswers.filter((x) => !x.isCorrect);
      if (!wrong.length) return null;
      const top = [...wrong].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];
      const share = (top.votes || 0) / total;
      if (share < 0.3) return null;
      return { text: cleanText(top.text, 80), share: Math.round(share * 100) };
    })(),
  }));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI API key not configured' }), { status: 500 });
  }

  const systemPrompt = `Ти си педагошки AI коуч за наставници во Македонија.
Ќе добиеш JSON со резултати од час и треба да вратиш КРАТКИ, практични и мерливи препораки.

Врати САМО валиден JSON со шема:
{
  "overview": "краток резиме (2-3 реченици)",
  "weakPoints": [
    {"topic":"...","signal":"...","recommendation":"..."}
  ],
  "misconceptions": [
    {"question":"кратко прашањето","wrongAnswer":"што избрале","share":40,"explanation":"зошто грешат","intervention":"конкретен начин како да се исправи во 2-3 минути"}
  ],
  "nextLessonPlan": [
    "...",
    "...",
    "..."
  ],
  "quickActions": [
    "...",
    "...",
    "..."
  ]
}

Правила:
- Македонски јазик.
- Биди конкретен, без општи фрази.
- Ако некој quiz има точност под 60%, третирај го како слаба точка.
- За СЕКОЕ прашање со dominantWrong (≥30% избрале погрешен одговор) додај една ставка во "misconceptions" со јасно објаснување на грешката и конкретна интервенција.
- nextLessonPlan да биде листа од 3-5 чекори за следен час.
- quickActions да биде листа од 3 брзи интервенции што наставникот може да ги направи веднаш.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nEVENT: ${eventTitle}\nDATA:\n${JSON.stringify(normalized)}`,
            }],
          }],
          generationConfig: {
            response_mime_type: 'application/json',
            max_output_tokens: 1400,
            temperature: 0.35,
          },
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No content returned');

    const parsed = JSON.parse(text);
    const result = {
      overview: cleanText(parsed?.overview || 'Нема доволно податоци за детална анализа.', 500),
      weakPoints: Array.isArray(parsed?.weakPoints) ? parsed.weakPoints.slice(0, 6).map((w) => ({
        topic: cleanText(w?.topic, 120),
        signal: cleanText(w?.signal, 180),
        recommendation: cleanText(w?.recommendation, 220),
      })) : [],
      misconceptions: Array.isArray(parsed?.misconceptions) ? parsed.misconceptions.slice(0, 8).map((m) => ({
        question: cleanText(m?.question, 160),
        wrongAnswer: cleanText(m?.wrongAnswer, 120),
        share: Math.max(0, Math.min(100, Number(m?.share || 0))),
        explanation: cleanText(m?.explanation, 240),
        intervention: cleanText(m?.intervention, 280),
      })).filter((m) => m.question && m.intervention) : [],
      nextLessonPlan: Array.isArray(parsed?.nextLessonPlan)
        ? parsed.nextLessonPlan.slice(0, 6).map((item) => cleanText(item, 220)).filter(Boolean)
        : [],
      quickActions: Array.isArray(parsed?.quickActions)
        ? parsed.quickActions.slice(0, 6).map((item) => cleanText(item, 180)).filter(Boolean)
        : [],
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Insights generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Не успеавме да генерираме AI Insights. Обидете се повторно.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
