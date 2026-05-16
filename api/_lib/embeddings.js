// ============================================================================
// ФАЗА 8.1.2 — Gemini Embeddings helper (gemini-embedding-001)
// ----------------------------------------------------------------------------
// Цел: централизирана embedding функција со cache, retry на 429,
// 768-dim Matryoshka truncation (од native 3072), MK-friendly normalize.
//
// API: https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent
// Cost: 0€ на free tier (1500 RPM).
// ============================================================================

const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
const EMBED_DIM = 768; // мора да се совпаѓа со vector(768) во SQL

// Малечок in-memory LRU. Се ресетира per-edge-instance (cold start), но добро
// за burst-y traffic во ист request lifecycle (RAG retrieval често користи
// иста query текст 2-3 пати).
const _cache = new Map();
const CACHE_MAX = 50;

function _cacheGet(key) {
  if (!_cache.has(key)) return null;
  const v = _cache.get(key);
  _cache.delete(key);
  _cache.set(key, v); // touch (LRU)
  return v;
}
function _cacheSet(key, v) {
  if (_cache.size >= CACHE_MAX) {
    const firstKey = _cache.keys().next().value;
    _cache.delete(firstKey);
  }
  _cache.set(key, v);
}

// Pure helpers од src/lib/embeddingsCore.js (тестабилни без vite/react).
import { l2normalize, truncateAndRenorm, cleanInput } from '../../src/lib/embeddingsCore.js';
export { l2normalize, truncateAndRenorm, cleanInput };

/**
 * Embed еден текст со Gemini Embeddings.
 * @param {string} text
 * @param {object} opts
 * @param {string} [opts.taskType='RETRIEVAL_QUERY']
 *   RETRIEVAL_QUERY | RETRIEVAL_DOCUMENT | SEMANTIC_SIMILARITY |
 *   CLASSIFICATION | CLUSTERING | QUESTION_ANSWERING | FACT_VERIFICATION | CODE_RETRIEVAL_QUERY
 * @param {string} [opts.title] — опционално за RETRIEVAL_DOCUMENT
 * @param {number} [opts.dim=768]
 * @returns {Promise<number[]|null>} 768-dim L2-normalized vector or null on hard fail
 */
export async function embedText(text, opts = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const cleaned = cleanInput(text);
  if (cleaned.length < 2) return null;

  const taskType = opts.taskType || 'RETRIEVAL_QUERY';
  const dim = opts.dim || EMBED_DIM;
  const cacheKey = `${taskType}:${dim}:${cleaned}`;
  const cached = _cacheGet(cacheKey);
  if (cached) return cached;

  const body = {
    model: `models/${EMBED_MODEL}`,
    content: { parts: [{ text: cleaned }] },
    taskType,
  };
  if (opts.title && taskType === 'RETRIEVAL_DOCUMENT') {
    body.title = String(opts.title).slice(0, 200);
  }
  // Gemini поддржува output_dimensionality за Matryoshka truncation server-side.
  if (dim && dim !== 3072) {
    body.outputDimensionality = dim;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${apiKey}`;

  let attempt = 0;
  let lastErr = null;
  while (attempt < 3) {
    attempt += 1;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 429 || res.status === 503) {
        // backoff: 400ms, 1200ms
        await new Promise((r) => setTimeout(r, 400 * attempt * attempt));
        continue;
      }
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        break;
      }
      const data = await res.json();
      const values = data?.embedding?.values;
      if (!Array.isArray(values)) {
        lastErr = 'no_values';
        break;
      }
      // Ако серверот веќе ја направи truncation (outputDimensionality), сепак
      // renorm-ираме за safety; Matryoshka truncation бара renorm.
      const out = truncateAndRenorm(values, dim);
      if (!out) {
        lastErr = 'dim_mismatch';
        break;
      }
      _cacheSet(cacheKey, out);
      return out;
    } catch (err) {
      lastErr = err?.message || 'fetch_error';
    }
  }
  console.error('[embeddings] failed:', lastErr);
  return null;
}

/**
 * Batch embed повеќе текстови. Gemini нема native batch endpoint за embedContent,
 * така што паралелно (со mali concurrency limit) ги испраќаме.
 * @param {string[]} texts
 * @param {object} [opts]
 * @returns {Promise<(number[]|null)[]>}
 */
export async function embedBatch(texts, opts = {}) {
  const concurrency = opts.concurrency || 4;
  const results = new Array(texts.length).fill(null);
  let cursor = 0;

  async function worker() {
    while (cursor < texts.length) {
      const i = cursor++;
      results[i] = await embedText(texts[i], opts);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, texts.length) }, worker);
  await Promise.all(workers);
  return results;
}

/**
 * Конвертирај JS vector array во pgvector text format `[0.1,0.2,...]`.
 * Користи се при директни REST повици кон Supabase RPC.
 */
export function toPgVector(vec) {
  if (!Array.isArray(vec)) return null;
  return `[${vec.map((n) => Number(n).toFixed(6)).join(',')}]`;
}

export const EMBEDDING_DIM = EMBED_DIM;
export const EMBEDDING_MODEL = EMBED_MODEL;
