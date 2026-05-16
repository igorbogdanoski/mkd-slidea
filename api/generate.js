export const config = {
  runtime: 'edge',
};

import { kv } from '@vercel/kv';
import { embedText, toPgVector } from './_lib/embeddings.js';
import { checkAiQuota } from './_lib/planEnforcement.js';
import {
  FEWSHOT_BY_TYPE,
  buildPedagogicalContext,
  buildReasoningInstructions,
  buildSystemInstructions,
  isAdvancedReasoningStrategy,
  validateGeneratePayload,
} from './_lib/promptEngineering.js';

// Sprint 8.1.4 — RAG retrieval (curriculum + community templates)
// toggleable via ENV `RAG_ENABLED` (default: '1' = on if SUPABASE configured)
const RAG_ENABLED = (process.env.RAG_ENABLED ?? '1') !== '0';

async function ragRetrieve({ prompt, subject, gradeLevel }) {
  if (!RAG_ENABLED) return { curriculum: [], templates: [] };
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { curriculum: [], templates: [] };

  const queryText = [prompt, subject, gradeLevel].filter(Boolean).join(' · ').slice(0, 2000);
  const vec = await embedText(queryText, { taskType: 'RETRIEVAL_QUERY' });
  if (!vec) return { curriculum: [], templates: [] };
  const pgvec = toPgVector(vec);

  const headers = {
    'Content-Type': 'application/json',
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  const callRpc = async (fn, body) => {
    try {
      const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  };

  const [curriculum, templates] = await Promise.all([
    callRpc('match_curriculum', {
      query_embedding: pgvec,
      match_count: 3,
      p_grade: gradeLevel || null,
      p_subject: subject || null,
    }),
    callRpc('match_templates', {
      query_embedding: pgvec,
      match_count: 2,
      p_subject: subject || null,
      p_grade: gradeLevel || null,
    }),
  ]);
  return { curriculum, templates };
}

function buildRagContext({ curriculum, templates }) {
  const lines = [];
  if (Array.isArray(curriculum) && curriculum.length) {
    lines.push('КОНТЕКСТ ОД МК КУРИКУЛУМ (за усогласеност со БРО/МОН):');
    curriculum.forEach((c, i) => {
      const head = [c.subject, c.grade, c.topic, c.subtopic].filter(Boolean).join(' › ');
      lines.push(`  [${i + 1}] ${head}: ${String(c.text || '').slice(0, 240)}`);
    });
  }
  if (Array.isArray(templates) && templates.length) {
    lines.push('СЛИЧНИ ВЕРИФИЦИРАНИ ШАБЛОНИ ОД ЗАЕДНИЦАТА (за стил/тон):');
    templates.forEach((t, i) => {
      const head = [t.subject, t.grade].filter(Boolean).join(' · ');
      lines.push(`  [${i + 1}] ${t.title}${head ? ` (${head})` : ''}: ${String(t.description || '').slice(0, 160)}`);
    });
  }
  if (!lines.length) return '';
  lines.push('Користи го контекстот за усогласеност со курикулум и стил, но НЕ копирај го дословно.');
  return lines.join('\n');
}

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

// Strip likely-PII patterns before tokenization (emails, URLs, phone-ish
// digit runs, @handles). We then split, drop tokens with mixed digits+letters
// (often IDs/codes), and skip stopwords.
const stripPII = (text) =>
  String(text)
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/gi, ' ')      // emails
    .replace(/https?:\/\/\S+/gi, ' ')                      // URLs
    .replace(/\b\+?\d[\d\s-]{6,}\b/g, ' ')                 // phone-ish
    .replace(/@[\w_]+/g, ' ');                             // @handles

const tokenizeForVocab = (text) => {
  if (typeof text !== 'string' || !text.trim()) return [];
  const cleaned = stripPII(text).toLowerCase();
  const seen = new Set();
  const tokens = [];
  for (const raw of cleaned.split(/[^a-zа-яёѓѕјљњќџ0-9]+/iu)) {
    const w = raw.trim();
    if (!w || w.length < 3 || w.length > 32) continue;
    if (STOPWORDS.has(w)) continue;
    if (/^\d+$/.test(w)) continue;
    // Drop tokens mixing letters + digits (likely IDs / codes / names with year)
    if (/[a-zа-яёѓѕјљњќџ]/iu.test(w) && /\d/.test(w)) continue;
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

  // Per-user plan enforcement (Sprint billing).
  const quota = await checkAiQuota(req);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({
        error: quota.reason || 'Лимитот за AI генерации е достигнат.',
        plan: quota.plan,
        used: quota.used,
        quota: { perDay: quota.quota.aiPerDay, perMonth: quota.quota.aiPerMonth },
        upgrade: '/pricing',
      }),
      {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'X-Plan': quota.plan,
          'X-AI-Quota-Month': String(quota.quota.aiPerMonth),
          'X-AI-Quota-Day': String(quota.quota.aiPerDay),
        },
      }
    );
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const validation = validateGeneratePayload(body);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), { status: validation.status || 400 });
  }

  const {
    prompt,
    type,
    strategy,
    bloom,
    gradeLevel,
    subject,
    hasImage,
    imageBase64,
    imageMime,
  } = validation.data;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI API key not configured' }), { status: 500 });
  }

  const isAdvanced = isAdvancedReasoningStrategy(strategy);
  const modelToUse = isAdvanced
    ? (process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro')
    : (process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash');

  const safeBloom = bloom;
  const safeGrade = gradeLevel;
  const safeSubject = subject;

  const pedagogicalContext = buildPedagogicalContext({
    bloom: safeBloom,
    gradeLevel: safeGrade,
    subject: safeSubject,
  });

  const strategyInstructions = buildReasoningInstructions(strategy);

  const visionInstructions = hasImage
    ? 'ВАЖНО: Корисникот прикачи слика. Прочитај го текстот / содржината на сликата (OCR + анализа) и генерирај прашање што директно се однесува на тоа што е прикажано. Ако има математичка задача, направи квиз со точниот одговор. Ако има текст, направи прашање за разбирање.'
    : '';

  const fewShot = FEWSHOT_BY_TYPE[type] || '';

  // Sprint 8.1.4 — RAG: грамоти го промптот со MK курикулум + слични шаблони.
  let ragContext = '';
  try {
    const rag = await ragRetrieve({ prompt, subject: safeSubject, gradeLevel: safeGrade });
    ragContext = buildRagContext(rag);
  } catch (err) {
    console.error('[generate] RAG retrieve failed (non-fatal):', err?.message);
  }

  const systemInstructions = buildSystemInstructions({
    type,
    prompt,
    pedagogicalContext,
    strategyInstructions,
    visionInstructions,
    ragContext,
    fewShot,
  });

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

  // Bump per-user AI quota counters (fire-and-forget).
  try { if (typeof quota?.bump === 'function') await quota.bump(); } catch { /* ignore */ }

  return new Response(JSON.stringify(parsed), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Plan': quota?.plan || 'free',
      'X-AI-Quota-Month': String(quota?.quota?.aiPerMonth ?? ''),
      'X-AI-Quota-Day': String(quota?.quota?.aiPerDay ?? ''),
      'X-AI-Used-Month': String((quota?.used?.month ?? 0) + 1),
      'X-AI-Used-Day': String((quota?.used?.day ?? 0) + 1),
    },
  });
}
