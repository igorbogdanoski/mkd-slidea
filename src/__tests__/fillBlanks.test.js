import { describe, it, expect } from 'vitest';
import {
  parsePrompt, blankIds, normalise, checkBlank, gradeResponse, validateFillBlanks,
} from '../lib/fillBlanks';

const PROMPT = 'Симболот {{b1}} означува дека елементот {{b2}} на множеството.';
const BLANKS = [
  { id: 'b1', accept: ['∈', '\\in'] },
  { id: 'b2', accept: ['припаѓа'] },
];

describe('parsePrompt', () => {
  it('keeps text and gaps in order', () => {
    expect(parsePrompt('пред {{x}} потоа')).toEqual([
      { type: 'text', value: 'пред ' },
      { type: 'blank', id: 'x' },
      { type: 'text', value: ' потоа' },
    ]);
  });

  it('handles a gap at the very start and end', () => {
    expect(parsePrompt('{{a}} среде {{b}}')).toEqual([
      { type: 'blank', id: 'a' },
      { type: 'text', value: ' среде ' },
      { type: 'blank', id: 'b' },
    ]);
  });

  it('returns plain text unchanged when there are no gaps', () => {
    expect(parsePrompt('нема празнини')).toEqual([{ type: 'text', value: 'нема празнини' }]);
  });
});

describe('blankIds', () => {
  it('lists gaps in order without duplicates', () => {
    expect(blankIds('{{b1}} и {{b2}} и пак {{b1}}')).toEqual(['b1', 'b2']);
  });
});

describe('normalise', () => {
  it('ignores case, surrounding space and trailing punctuation', () => {
    expect(normalise('  Множество. ')).toBe('множество');
    expect(normalise('ПРИПАЃА!')).toBe('припаѓа');
    expect(normalise('два  збора')).toBe('два збора');
  });

  // The deliberate limit. A stemmer that unified these would also unify words
  // that are genuinely different answers, so the inflected form is left to the
  // teacher rather than guessed at.
  it('does not attempt to unify Macedonian inflections', () => {
    expect(normalise('множеството')).not.toBe(normalise('множество'));
  });
});

describe('checkBlank', () => {
  it('accepts any of the listed answers', () => {
    expect(checkBlank(BLANKS[0], '∈')).toBe('correct');
    expect(checkBlank(BLANKS[0], '\\in')).toBe('correct');
  });

  it('accepts a differently-cased or spaced answer', () => {
    expect(checkBlank({ id: 'x', accept: ['Питагора'] }, '  питагора ')).toBe('correct');
  });

  it('marks a wrong answer incorrect', () => {
    expect(checkBlank(BLANKS[1], 'не припаѓа')).toBe('incorrect');
  });

  it('treats a missing response as empty rather than wrong', () => {
    expect(checkBlank(BLANKS[0], '')).toBe('empty');
    expect(checkBlank(BLANKS[0], '   ')).toBe('empty');
    expect(checkBlank(BLANKS[0], undefined)).toBe('empty');
  });

  it('does not claim a verdict when there is no answer key', () => {
    expect(checkBlank({ id: 'x', accept: [] }, 'нешто')).toBe('empty');
  });
});

describe('gradeResponse', () => {
  it('grades every blank and counts the correct ones', () => {
    const g = gradeResponse(BLANKS, { b1: '∈', b2: 'припаѓа' });
    expect(g.correct).toBe(2);
    expect(g.total).toBe(2);
    expect(g.allCorrect).toBe(true);
  });

  it('keeps what the student actually typed, for the teacher to see', () => {
    // The whole point: a child who wrote the inflected form understood the
    // question, and only a person can decide that. The raw response has to
    // survive grading.
    const g = gradeResponse(BLANKS, { b1: '∈', b2: 'припаѓаат' });
    expect(g.allCorrect).toBe(false);
    expect(g.results[1]).toEqual({ id: 'b2', given: 'припаѓаат', verdict: 'incorrect' });
  });

  it('handles a blank response', () => {
    const g = gradeResponse(BLANKS, {});
    expect(g.correct).toBe(0);
    expect(g.allCorrect).toBe(false);
    expect(g.results.every((r) => r.verdict === 'empty')).toBe(true);
  });

  it('is not "all correct" when there are no blanks at all', () => {
    expect(gradeResponse([], {}).allCorrect).toBe(false);
  });
});

// Catch a broken question while it is being written, not when a class is
// looking at it.
describe('validateFillBlanks', () => {
  it('passes a well-formed question', () => {
    expect(validateFillBlanks(PROMPT, BLANKS)).toEqual([]);
  });

  it('complains when the prompt has no gaps', () => {
    expect(validateFillBlanks('Обично прашање', BLANKS)[0]).toMatch(/нема ниту една празнина/);
  });

  it('complains about a gap with no answer defined', () => {
    expect(validateFillBlanks('Текст {{b9}}', BLANKS).some((p) => p.includes('b9'))).toBe(true);
  });

  it('complains about an answer whose gap is not in the text', () => {
    const problems = validateFillBlanks('Само {{b1}}', BLANKS);
    expect(problems.some((p) => p.includes('b2'))).toBe(true);
  });

  it('complains about a gap with an empty answer list', () => {
    const problems = validateFillBlanks('Текст {{b1}}', [{ id: 'b1', accept: ['  '] }]);
    expect(problems.some((p) => p.includes('прифатен одговор'))).toBe(true);
  });
});
