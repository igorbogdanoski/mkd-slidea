// ============================================================================
// Pure helpers за Q&A филтрирање и сортирање.
// Се користи во src/hooks/useEvent.js (fetchQuestions) и тестабилни без supabase.
// ============================================================================

/**
 * Филтрира скриени и (ако постои) одговорени прашања.
 * - is_hidden === true → скриј
 * - ако row има is_answered поле → задржи само is_answered === false
 *   (legacy support: пред-Sprint 8.3.1 шеми не го имаа answered_at)
 */
export function filterActiveQuestions(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((q) => {
    if (q && q.is_hidden === true) return false;
    if (q && Object.prototype.hasOwnProperty.call(q, 'is_answered')) {
      return q.is_answered === false;
    }
    return true;
  });
}

/**
 * Ако ниедна од редовите нема is_approved флаг — врати ги сите.
 * Ако барем еден има — задржи само is_approved === true.
 * (Поддршка за event-и со moderation вклучен / исклучен.)
 */
export function filterApprovedIfFlagged(rows) {
  if (!Array.isArray(rows)) return [];
  const hasApprovalFlag = rows.some((q) => Object.prototype.hasOwnProperty.call(q, 'is_approved'));
  return hasApprovalFlag ? rows.filter((q) => q.is_approved === true) : rows;
}

/**
 * Сортира: pinned прво, потоа votes desc.
 * Враќа нов array (no in-place mutation).
 */
export function sortPinnedThenVotes(rows) {
  if (!Array.isArray(rows)) return [];
  return [...rows].sort((a, b) => {
    const ap = a?.is_pinned ? 1 : 0;
    const bp = b?.is_pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return (b?.votes || 0) - (a?.votes || 0);
  });
}

/** Композитен pipeline (исто како во useEvent.fetchQuestions). */
export function pipelineQuestions(rows) {
  return sortPinnedThenVotes(filterApprovedIfFlagged(filterActiveQuestions(rows)));
}
