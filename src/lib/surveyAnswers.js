// A survey response stores its answers as a list, not a map:
//
//   [{ qId: '…', value: 'Примерите на табла' }, …]
//
// Participant.jsx writes it that way (`qs.map(q => ({ qId: q.id, value: … }))`)
// and that is the shape in the database. It is easy to assume the obvious
// alternative — an object keyed by question id — and two surfaces written in
// one afternoon assumed exactly that, reading `answers[q.id]` and getting
// `undefined` for every question. Nothing failed; the CSV and the public
// results page simply reported that nobody had answered.
//
// One reader, so the shape is stated once.

/** The value this response gave for one question, or undefined. */
export function surveyAnswerFor(answers, questionId) {
  if (!Array.isArray(answers)) {
    // Tolerated, not encouraged: an object keyed by question id, which is what
    // an importer or an older row might carry.
    return answers && typeof answers === 'object' ? answers[questionId] : undefined;
  }
  return answers.find((a) => a?.qId === questionId)?.value;
}

/** Every answer given to one question across a set of responses, blanks dropped. */
export function surveyValuesFor(responses, questionId) {
  return (responses || [])
    .map((r) => surveyAnswerFor(r?.answers ?? r, questionId))
    .filter((v) => v !== undefined && v !== null && v !== '');
}

/** How often each distinct answer appears, most common first. */
export function surveyTally(responses, questionId) {
  const values = surveyValuesFor(responses, questionId);
  const counts = new Map();
  for (const v of values) counts.set(String(v), (counts.get(String(v)) || 0) + 1);
  return {
    total: values.length,
    ranked: [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([answer, count]) => ({ answer, count, pct: values.length ? Math.round((count / values.length) * 100) : 0 })),
  };
}
