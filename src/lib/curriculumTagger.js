import MK_MATH_CURRICULUM from '../data/mkMathCurriculum';

// Sprint 6.1 — Heuristic curriculum tagger.
// Given a question text (and optional grade/subject hints) returns top-N
// candidate curriculum tags ranked by keyword overlap. Pure-JS, zero deps.

const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    // Keep cyrillic + latin + digits + math symbols
    .replace(/[^a-zа-яёѓѕјљњќџ0-9²³½¼¾π+\-*/=().,\s%²]/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const scoreEntry = (text, entry) => {
  const t = normalize(text);
  if (!t) return 0;
  let score = 0;
  for (const kw of entry.keywords) {
    const k = normalize(kw);
    if (!k) continue;
    if (t.includes(k)) {
      // Longer keyword = stronger signal
      score += Math.max(1, Math.ceil(k.length / 4));
    }
  }
  // Bonus if subtopic literal appears
  if (t.includes(normalize(entry.subtopic))) score += 3;
  if (t.includes(normalize(entry.topic))) score += 1;
  return score;
};

export function suggestTags(text, { grade = null, subject = 'math', track = null, limit = 3 } = {}) {
  if (!text || text.trim().length < 3) return [];
  const pool = MK_MATH_CURRICULUM.filter(
    (e) => (!subject || e.subject === subject)
        && (!grade || e.grade === grade)
        && (!track || e.track === track)
  );
  const ranked = pool
    .map((entry) => ({ entry, score: scoreEntry(text, entry) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.entry);
  return ranked;
}

export function tagsToIds(tags) {
  return (tags || []).map((t) => (typeof t === 'string' ? t : t.id)).filter(Boolean);
}
