// Fill-in-the-blanks: parsing the prompt and checking answers.
//
// A prompt marks its gaps inline — "Симболот {{b1}} означува дека елементот
// {{b2}} на множеството" — so the text and the gaps travel together. Keeping
// gaps in a separate ordered list would let a reorder silently detach a gap
// from its answer, and nobody would notice until a class sat the question.

const BLANK = /\{\{([a-zA-Z0-9_]+)\}\}/g;

/** Splits a prompt into text and blank segments, in order. */
export function parsePrompt(prompt) {
  const input = String(prompt ?? '');
  const parts = [];
  let last = 0;
  BLANK.lastIndex = 0;
  let m;
  while ((m = BLANK.exec(input)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: input.slice(last, m.index) });
    parts.push({ type: 'blank', id: m[1] });
    last = m.index + m[0].length;
  }
  if (last < input.length) parts.push({ type: 'text', value: input.slice(last) });
  return parts;
}

/** Ids of every gap the prompt actually contains, in order, deduplicated. */
export function blankIds(prompt) {
  return [...new Set(parsePrompt(prompt).filter((p) => p.type === 'blank').map((p) => p.id))];
}

/**
 * Normalisation applied before comparing. Deliberately shallow: case,
 * surrounding space, and trailing punctuation only.
 *
 * It stops short of stemming on purpose. Macedonian inflects — "множество",
 * "множеството", "множества" — and a stemmer aggressive enough to unify those
 * also unifies words that are genuinely different answers. Being wrong in the
 * generous direction is recoverable (the teacher sees it); being wrong in the
 * strict direction marks a correct child wrong in front of the class.
 */
export function normalise(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?"'`]+$/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Checks one response against a blank's accepted answers.
 * Returns 'correct' | 'incorrect' | 'empty'.
 */
export function checkBlank(blank, response) {
  const given = normalise(response);
  if (!given) return 'empty';
  const accepted = (blank?.accept || []).map(normalise).filter(Boolean);
  if (!accepted.length) return 'empty'; // nothing to check against
  return accepted.includes(given) ? 'correct' : 'incorrect';
}

/**
 * Grades a whole response.
 *
 * `verdict` is advisory. The presenter shows every raw response next to it so
 * a teacher can see the near misses — a child who wrote "множеството" where
 * the key says "множество" has understood the question, and only a person can
 * decide that.
 */
export function gradeResponse(blanks, responses) {
  const list = Array.isArray(blanks) ? blanks : [];
  const results = list.map((b) => ({
    id: b.id,
    given: responses?.[b.id] ?? '',
    verdict: checkBlank(b, responses?.[b.id]),
  }));
  const correct = results.filter((r) => r.verdict === 'correct').length;
  return {
    results,
    correct,
    total: list.length,
    allCorrect: list.length > 0 && correct === list.length,
  };
}

/**
 * Warnings for the authoring screen, so a broken question is caught while it
 * is being written rather than when a class is looking at it.
 */
export function validateFillBlanks(prompt, blanks) {
  const problems = [];
  const inPrompt = blankIds(prompt);
  const defined = (blanks || []).map((b) => b.id);

  if (!inPrompt.length) problems.push('Прашањето нема ниту една празнина — додај {{b1}} каде треба да се пополни.');

  for (const id of inPrompt) {
    if (!defined.includes(id)) problems.push(`Празнината {{${id}}} нема дефиниран одговор.`);
  }
  for (const b of blanks || []) {
    if (!inPrompt.includes(b.id)) problems.push(`Одговорот за „${b.id}" не се појавува во текстот на прашањето.`);
    if (!(b.accept || []).filter((a) => String(a).trim()).length) {
      problems.push(`Празнината {{${b.id}}} нема ниту еден прифатен одговор.`);
    }
  }
  return problems;
}
