export const config = {
  runtime: 'edge',
};

import { kv } from '@vercel/kv';

const fallbackMap = new Map();
const RATE_LIMIT = 4;
const RATE_WINDOW_MS = 60 * 1000;

const MODEL = process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash';
const MAX_ANSWERS = 60;
const MAX_ANSWER_LEN = 600;

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
  const key = `rate:grade:${ip}:${bucket}`;
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

const cleanText = (value, max = 200) =>
  String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const ip = getClientIp(req);
  const rate = await checkRate(ip);
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: 'Премногу барања за оценување. Обидете се по 1 минута.' }),
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

  const question = cleanText(body?.question, 400);
  const rubric = cleanText(body?.rubric, 600);
  const maxScore = Math.max(1, Math.min(100, Number(body?.maxScore || 10)));
  const answersIn = Array.isArray(body?.answers) ? body.answers.slice(0, MAX_ANSWERS) : [];

  if (!question || answersIn.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Потребно е прашање и барем еден одговор.' }),
      { status: 400 }
    );
  }

  const answers = answersIn
    .map((a, i) => ({
      id: cleanText(a?.id || String(i), 60),
      text: cleanText(a?.text, MAX_ANSWER_LEN),
    }))
    .filter((a) => a.text);

  if (answers.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Нема валидни одговори за оценување.' }),
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI API key not configured' }), { status: 500 });
  }

  const systemPrompt = `Ти си педагошки AI оценувач за наставници во Македонија.
Ќе добиеш отворено прашање, рубрика (опционално) и листа од студентски одговори.
За СЕКОЈ одговор врати оценка од 0 до ${maxScore}, кратко објаснување (1 реченица) и сигнал.

Врати САМО валиден JSON со шема:
{
  "results": [
    {"id":"...", "score": 0, "max": ${maxScore}, "feedback":"...", "signal":"correct|partial|incorrect|offtopic"}
  ]
}

Правила:
- Македонски јазик во "feedback".
- Биди фер: ако нема рубрика, оцени според релевантност, точност и комплетност.
- score = 0 за празни/offtopic одговори.
- Не измислувај ID — користи го точно ID од влезот.
- Кратко "feedback" (макс 140 знаци).`;

  const payload = {
    question,
    rubric: rubric || '(нема рубрика — оцени по педагошки критериуми)',
    maxScore,
    answers,
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nDATA:\n${JSON.stringify(payload)}` }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            max_output_tokens: 2200,
            temperature: 0.2,
          },
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No content returned');

    const parsed = JSON.parse(text);
    const validIds = new Set(answers.map((a) => a.id));
    const results = Array.isArray(parsed?.results)
      ? parsed.results
          .filter((r) => r && validIds.has(String(r.id)))
          .map((r) => {
            const score = Math.max(0, Math.min(maxScore, Number(r.score || 0)));
            const sig = ['correct', 'partial', 'incorrect', 'offtopic'].includes(r.signal)
              ? r.signal
              : score >= maxScore * 0.8
              ? 'correct'
              : score >= maxScore * 0.4
              ? 'partial'
              : 'incorrect';
            return {
              id: String(r.id),
              score,
              max: maxScore,
              feedback: cleanText(r.feedback, 200),
              signal: sig,
            };
          })
      : [];

    const total = results.reduce((a, b) => a + b.score, 0);
    const avg = results.length ? total / results.length : 0;

    return new Response(
      JSON.stringify({
        results,
        summary: {
          count: results.length,
          maxScore,
          averageScore: Math.round(avg * 100) / 100,
          averagePct: Math.round((avg / maxScore) * 100),
          breakdown: {
            correct: results.filter((r) => r.signal === 'correct').length,
            partial: results.filter((r) => r.signal === 'partial').length,
            incorrect: results.filter((r) => r.signal === 'incorrect').length,
            offtopic: results.filter((r) => r.signal === 'offtopic').length,
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Grade generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Не успеавме да оцениме. Обидете се повторно.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
