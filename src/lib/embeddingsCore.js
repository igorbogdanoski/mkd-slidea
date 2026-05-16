// ============================================================================
// Pure embedding utilities (testable, framework-free).
// Re-exported from api/_lib/embeddings.js за server runtime.
// ============================================================================

export const EMBED_DIM_DEFAULT = 768;

export function l2normalize(vec) {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) sum += vec[i] * vec[i];
  const norm = Math.sqrt(sum) || 1;
  const out = new Array(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / norm;
  return out;
}

export function truncateAndRenorm(vec, dim) {
  if (!Array.isArray(vec)) return null;
  if (vec.length === dim) return l2normalize(vec);
  if (vec.length < dim) return null;
  return l2normalize(vec.slice(0, dim));
}

export function cleanInput(text, maxLen = 8000) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function toPgVector(vec) {
  if (!Array.isArray(vec)) return null;
  return `[${vec.map((n) => Number(n).toFixed(6)).join(',')}]`;
}
