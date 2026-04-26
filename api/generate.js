export const config = {
  runtime: 'edge',
};

import { kv } from '@vercel/kv';

// Persistent distributed rate limiting (Vercel KV / Upstash).
// Fallback to in-memory map only when KV is not configured/reachable.
const rateLimitMap = new Map();
const RATE_LIMIT = 10;       // max requests per user per minute
const RATE_WINDOW_MS = 60 * 1000;

// Global daily AI budget — prevents bill explosions from abuse or runaway loops.
// Override via env: AI_DAILY_BUDGET (request count, not tokens).
const DAILY_BUDGET = parseInt(process.env.AI_DAILY_BUDGET || '500', 10);

function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimitFallback(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return {
    allowed: entry.count <= RATE_LIMIT,
    limit: RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - entry.count),
    resetAt: entry.resetAt,
  };
}

async function checkRateLimit(ip) {
  const bucket = Math.floor(Date.now() / RATE_WINDOW_MS);
  const key = `rate:generate:${ip}:${bucket}`;

  try {
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, Math.ceil(RATE_WINDOW_MS / 1000));
    }
    return {
      allowed: count <= RATE_LIMIT,
      limit: RATE_LIMIT,
      remaining: Math.max(0, RATE_LIMIT - count),
      resetAt: (bucket + 1) * RATE_WINDOW_MS,
    };
  } catch {
    return checkRateLimitFallback(ip);
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Rate limiting
  const ip = getClientIp(req);
  const rate = await checkRateLimit(ip);
  if (!rate.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
    return new Response(
      JSON.stringify({ error: 'Премногу барања. Обидете се повторно за 1 минута.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(rate.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(rate.resetAt / 1000)),
        },
      }
    );
  }

  // Global daily budget — admin-level circuit breaker.
  try {
    const today = new Date().toISOString().slice(0, 10);
    const dayKey = `ai:daily:${today}`;
    const dayCount = await kv.incr(dayKey);
    if (dayCount === 1) await kv.expire(dayKey, 60 * 60 * 26); // ~26h
    if (dayCount > DAILY_BUDGET) {
      return new Response(
        JSON.stringify({ error: 'Дневниот лимит на AI барања е достигнат. Обидете се утре.' }),
        { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' } }
      );
    }
  } catch { /* KV missing — fall through, daily cap won't apply */ }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { prompt, type, strategy = 'default', bloom, gradeLevel, subject } = body;

  const VALID_TYPES = ['poll', 'quiz', 'wordcloud', 'open', 'rating', 'ranking'];
  const VALID_STRATEGIES = ['default', 'cot', 'tot'];
  const VALID_BLOOM = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

  const BLOOM_GUIDE = {
    remember:   'Bloom — Запомнување: фокус на факти, дефиниции, термини. Прашањата проверуваат препознавање.',
    understand: 'Bloom — Разбирање: ученикот објаснува, парафразира или интерпретира концепт.',
    apply:      'Bloom — Примена: ученикот применува знаење во нова ситуација или решава проблем.',
    analyze:    'Bloom — Анализа: ученикот разложува информации, идентификува причини и врски.',
    evaluate:   'Bloom — Евалуација: ученикот критички оценува тврдења, аргументи или решенија.',
    create:     'Bloom — Создавање: ученикот синтетизира ново решение, идеја или продукт.',
  };

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3 || prompt.length > 500) {
    return new Response(JSON.stringify({ error: 'Промптот мора да биде меѓу 3 и 500 знаци.' }), { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return new Response(JSON.stringify({ error: 'Невалиден тип на активност.' }), { status: 400 });
  }
  if (!VALID_STRATEGIES.includes(strategy)) {
    return new Response(JSON.stringify({ error: 'Невалидна стратегија.' }), { status: 400 });
  }

  // Use GEMINI_API_KEY (no VITE_ prefix — VITE_ env vars are client-only, not available in Edge Functions)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI API key not configured' }), { status: 500 });
  }

  // Quota Saving Logic: Use Flash for simple tasks, Flash for complex too (2.0 is fast+capable)
  // Upgrade to gemini-2.5-pro for CoT/ToT when quota allows
  // Tier 1 (paid) → use GA models. 2.5-flash is cheaper + better than 2.0-flash.
  // 2.5-pro is reserved for advanced reasoning (CoT/ToT).
  const isAdvanced = strategy === 'cot' || strategy === 'tot';
  const modelToUse = isAdvanced
    ? (process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro')
    : (process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash');

  // Optional pedagogical context (sanitized lengths to prevent prompt injection bloat).
  const safeBloom = VALID_BLOOM.includes(bloom) ? bloom : null;
  const safeGrade = typeof gradeLevel === 'string' ? gradeLevel.slice(0, 40) : '';
  const safeSubject = typeof subject === 'string' ? subject.slice(0, 60) : '';

  const pedagogicalContext = [
    safeBloom ? BLOOM_GUIDE[safeBloom] : '',
    safeGrade ? `Возрасна група / одделение: ${safeGrade}.` : '',
    safeSubject ? `Предмет: ${safeSubject}.` : '',
  ].filter(Boolean).join(' ');

  let strategyInstructions = '';
  if (strategy === 'cot') {
    strategyInstructions = 'Користи Chain-of-Thought (CoT): Прво анализирај ја темата подлабоко, идентификувај ги клучните образовни цели и размисли кој е најдобриот концепт за прашање пред да го генерираш JSON-от.';
  } else if (strategy === 'tot') {
    strategyInstructions = 'Користи Tree-of-Thoughts (ToT): Генерирај 3 различни идеи за ова прашање во себе, оцени ги според нивото на Bloom-овата таксономија и избери ја онаа што најмногу поттикнува критичко размислување кај учениците.';
  }

  const systemInstructions = `Ти си светски експерт за Prompt Engineering и EdTech за MKD Slidea.
Креирај ${type === 'quiz' ? 'КВИЗ' : 'ИНТЕРАКТИВНА АКТИВНОСТ'} на тема: "${prompt}".
${pedagogicalContext}
${strategyInstructions}

ПРАВИЛА:
1. Излезот МОРА да биде САМО валиден JSON објект (без markdown, без објаснувања).
2. Користи чист МАКЕДОНСКИ јазик (литературен).
3. Прашањата треба да бидат провокативни, интересни и едукативни.

JSON Шема за ${type}:
{
  "question": "Коректно формулирано прашање",
  "type": "${type}",
  "is_quiz": ${type === 'quiz'},
  "options": [
    {"text": "Одговор 1", "is_correct": true},
    {"text": "Одговор 2", "is_correct": false}
  ]
}

За квиз точно 3-4 опции. За wordcloud, open и rating опциите се [].
За rating прашањето треба да биде оцена од 1 до 5.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemInstructions }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            max_output_tokens: 300,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('No content returned from AI');
    }

    const parsed = JSON.parse(resultText);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    return new Response(
      JSON.stringify({ error: 'Грешка при генерирање на содржината со AI.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
