export const config = {
  runtime: 'edge',
};

import { kv } from '@vercel/kv';

// Persistent distributed rate limiting (Vercel KV / Upstash).
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;
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

// ─────────────────────────────────────────────────────────────────
// Sprint 7.F — Few-shot examples + JSON schema validator (no deps).
// Sprint 7.C — Vision: optional `imageBase64` + `imageMime` for OCR/illustration grounding.
// Sprint 6.3 — MK education vocabulary corpus (anonymous; service-role only).
// ─────────────────────────────────────────────────────────────────

// MK + EN stopwords for vocab tokenizer. Keeps the corpus signal-rich.
const STOPWORDS = new Set([
  'и','или','но','па','за','на','во','со','од','до','се','си','е','ќе','не','го','ја','ги',
  'тоа','оваа','овој','тие','оние','еден','една','едно','како','што','кој','која','кое',
  'каде','зошто','кога','ако','тогаш','исто','многу','малку','уште','само','веќе','сите',
  'мене','тебе','нему','неа','нив','нас','вас','наш','ваш','нивен','моја','твоја','свој',
  'the','a','an','of','to','in','on','for','and','or','but','is','are','was','were','be',
  'this','that','these','those','it','its','as','by','at','from','with','about','into',
]);

const tokenizeForVocab = (text) => {
  if (typeof text !== 'string' || !text.trim()) return [];
  const seen = new Set();
  const tokens = [];
  for (const raw of text.toLowerCase().split(/[^a-zа-яёѓѕјљњќџ0-9-]+/iu)) {
    const w = raw.trim();
    if (!w || w.length < 3 || w.length > 32) continue;
    if (STOPWORDS.has(w)) continue;
    if (/^\d+$/.test(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    tokens.push(w);
    if (tokens.length >= 12) break;
  }
  return tokens;
};

async function logVocab(prompt, subject) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;
  const tokens = tokenizeForVocab(prompt);
  if (!tokens.length) return;
  const safeSubject = (typeof subject === 'string' && subject.trim()) ? subject.slice(0, 60) : null;
  await Promise.allSettled(
    tokens.map((word) =>
      fetch(`${url}/rest/v1/rpc/bump_vocab`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ p_word: word, p_subject: safeSubject }),
      }).catch(() => null)
    )
  );
}

const FEWSHOT = {
  quiz: `Пример (quiz):
{"question":"Колку е 7 × 8?","type":"quiz","is_quiz":true,"options":[{"text":"54","is_correct":false},{"text":"56","is_correct":true},{"text":"63","is_correct":false},{"text":"49","is_correct":false}]}`,
  poll: `Пример (poll):
{"question":"Кој начин на учење ти помага најмногу?","type":"poll","is_quiz":false,"options":[{"text":"Видео-уроци","is_correct":false},{"text":"Читање","is_correct":false},{"text":"Решавање задачи","is_correct":false}]}`,
  wordcloud: `Пример (wordcloud):
{"question":"Со еден збор: што ти асоцира на пролет?","type":"wordcloud","is_quiz":false,"options":[]}`,
  open: `Пример (open):
{"question":"Опиши накратко што научи денес на час.","type":"open","is_quiz":false,"options":[]}`,
  rating: `Пример (rating):
{"question":"Колку ти беше јасна лекцијата (1–5)?","type":"rating","is_quiz":false,"options":[]}`,
  ranking: `Пример (ranking):
{"question":"Подреди ги темите по важност за тебе.","type":"ranking","is_quiz":false,"options":[{"text":"Алгебра","is_correct":false},{"text":"Геометрија","is_correct":false},{"text":"Статистика","is_correct":false}]}`,
};

function validateOutput(parsed, type) {
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'not_object' };
  if (typeof parsed.question !== 'string' || parsed.question.trim().length < 3) {
    return { ok: false, reason: 'bad_question' };
  }
  if (parsed.question.length > 300) parsed.question = parsed.question.slice(0, 300);
  if (parsed.type !== type) parsed.type = type;
  parsed.is_quiz = type === 'quiz';
  if (!Array.isArray(parsed.options)) parsed.options = [];

  const noOptionTypes = new Set(['wordcloud', 'open', 'rating']);
  if (noOptionTypes.has(type)) {
    parsed.options = [];
    return { ok: true };
  }

  parsed.options = parsed.options
    .filter((o) => o && typeof o.text === 'string' && o.text.trim().length > 0)
    .slice(0, 6)
    .map((o) => ({
      text: String(o.text).slice(0, 150),
      is_correct: !!o.is_correct,
    }));

  if (parsed.options.length < 2) return { ok: false, reason: 'too_few_options' };

  if (type === 'quiz') {
    const correctCount = parsed.options.filter((o) => o.is_correct).length;
    if (correctCount === 0) {
      parsed.options[0].is_correct = true;
    } else if (correctCount > 1) {
      let kept = false;
      parsed.options = parsed.options.map((o) => {
        if (o.is_correct && !kept) { kept = true; return o; }
        return { ...o, is_correct: false };
      });
    }
  } else {
    parsed.options = parsed.options.map((o) => ({ ...o, is_correct: false }));
  }

  return { ok: true };
}

async function callGemini({ apiKey, model, systemInstructions, imageBase64, imageMime, temperature = 0.7 }) {
  const parts = [{ text: systemInstructions }];
  if (imageBase64 && typeof imageBase64 === 'string') {
    parts.push({
      inlineData: {
        mimeType: imageMime || 'image/png',
        data: imageBase64,
      },
    });
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          response_mime_type: 'application/json',
          max_output_tokens: 400,
          temperature,
        },
      }),
    }
  );
  const data = await response.json();
  const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!resultText) throw new Error('No content returned from AI');
  return JSON.parse(resultText);
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

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

  try {
    const today = new Date().toISOString().slice(0, 10);
    const dayKey = `ai:daily:${today}`;
    const dayCount = await kv.incr(dayKey);
    if (dayCount === 1) await kv.expire(dayKey, 60 * 60 * 26);
    if (dayCount > DAILY_BUDGET) {
      return new Response(
        JSON.stringify({ error: 'Дневниот лимит на AI барања е достигнат. Обидете се утре.' }),
        { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' } }
      );
    }
  } catch { /* ignore */ }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { prompt, type, strategy = 'default', bloom, gradeLevel, subject, imageBase64, imageMime } = body;

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

  const hasImage = typeof imageBase64 === 'string' && imageBase64.length > 100;
  const minPromptLen = hasImage ? 0 : 3; // image alone is enough context
  const maxImageBytesB64 = 4 * 1024 * 1024; // ~3MB binary

  if (!type || !VALID_TYPES.includes(type)) {
    return new Response(JSON.stringify({ error: 'Невалиден тип на активност.' }), { status: 400 });
  }
  if (!VALID_STRATEGIES.includes(strategy)) {
    return new Response(JSON.stringify({ error: 'Невалидна стратегија.' }), { status: 400 });
  }
  if (typeof prompt !== 'string' || prompt.trim().length < minPromptLen || prompt.length > 500) {
    return new Response(JSON.stringify({ error: 'Промптот мора да биде до 500 знаци.' }), { status: 400 });
  }
  if (hasImage && imageBase64.length > maxImageBytesB64) {
    return new Response(JSON.stringify({ error: 'Сликата е преголема (max 3MB).' }), { status: 413 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI API key not configured' }), { status: 500 });
  }

  const isAdvanced = strategy === 'cot' || strategy === 'tot';
  const modelToUse = isAdvanced
    ? (process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro')
    : (process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash');

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
    strategyInstructions = 'Користи Chain-of-Thought (CoT): прво анализирај ја темата подлабоко, идентификувај ги клучните образовни цели и размисли кој е најдобриот концепт пред да го генерираш JSON-от.';
  } else if (strategy === 'tot') {
    strategyInstructions = 'Користи Tree-of-Thoughts (ToT): генерирај 3 различни идеи во себе, оцени ги според нивото на Bloom-овата таксономија и избери ја онаа што најмногу поттикнува критичко размислување.';
  }

  const visionInstructions = hasImage
    ? 'ВАЖНО: Корисникот прикачи слика. Прочитај го текстот / содржината на сликата (OCR + анализа) и генерирај прашање што директно се однесува на тоа што е прикажано. Ако има математичка задача, направи квиз со точниот одговор. Ако има текст, направи прашање за разбирање.'
    : '';

  const fewShot = FEWSHOT[type] || '';

  const systemInstructions = `Ти си светски експерт за Prompt Engineering и EdTech за MKD Slidea.
Креирај ${type === 'quiz' ? 'КВИЗ' : 'ИНТЕРАКТИВНА АКТИВНОСТ'} (${type}) на тема: "${prompt || '(види прикачена слика)'}".
${pedagogicalContext}
${strategyInstructions}
${visionInstructions}

ПРАВИЛА:
1. Излезот МОРА да биде САМО валиден JSON објект (без markdown wrappers, без објаснувања).
2. Користи чист МАКЕДОНСКИ литературен јазик; точна интерпункција и правопис.
3. Прашањето да е јасно, недвосмислено, едукативно и возрасно соодветно.
4. За тип "quiz": ТОЧНО 3 ИЛИ 4 опции, ТОЧНО ЕДНА со "is_correct": true; погрешните одговори да бидат веродостојни (не очигледно глупави).
5. За тип "poll" / "ranking": 3-5 опции; сите со "is_correct": false.
6. За "wordcloud", "open", "rating": options МОРА да биде празна низа [].
7. Не повторувај го прашањето во опциите. Не користи „сите наведени" / „ниту едно".

JSON Шема:
{"question":"...","type":"${type}","is_quiz":${type === 'quiz'},"options":[...]}

${fewShot}`;

  let parsed;
  let attempt = 0;
  let lastErr = null;
  while (attempt < 2) {
    attempt += 1;
    try {
      const candidate = await callGemini({
        apiKey,
        model: modelToUse,
        systemInstructions,
        imageBase64: hasImage ? imageBase64 : null,
        imageMime,
        temperature: attempt === 1 ? 0.7 : 0.4, // tighter on retry
      });
      const v = validateOutput(candidate, type);
      if (v.ok) {
        parsed = candidate;
        break;
      }
      lastErr = v.reason;
    } catch (err) {
      lastErr = err?.message || 'parse_error';
    }
  }

  if (!parsed) {
    console.error('AI Generation: validator failed —', lastErr);
    return new Response(
      JSON.stringify({ error: 'AI не врати валиден формат. Обидете се повторно.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Sprint 6.3 — fire-and-forget anonymous vocab log. No PII, no event_id.
  try { logVocab(prompt, safeSubject); } catch { /* ignore */ }

  return new Response(JSON.stringify(parsed), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
