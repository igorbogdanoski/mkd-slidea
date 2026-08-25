import { describe, it, expect } from 'vitest';
import { surveyAnswerFor, surveyValuesFor, surveyTally } from '../lib/surveyAnswers';

// Participant.jsx writes `qs.map(q => ({ qId: q.id, value }))` — a list, not a
// map keyed by question id. The obvious wrong assumption is silent: reading
// answers[q.id] returns undefined for every question, so a survey a whole
// class answered is reported as unanswered. Two surfaces made exactly that
// mistake in one afternoon.
const REAL = [
  { answers: [{ qId: 'q1', value: 'Примерите' }, { qId: 'q2', value: 4 }] },
  { answers: [{ qId: 'q1', value: 'Примерите' }, { qId: 'q2', value: 5 }] },
  { answers: [{ qId: 'q1', value: 'Задачите' }] },
];

describe('surveyAnswerFor', () => {
  it('reads the shape the app actually writes', () => {
    expect(surveyAnswerFor(REAL[0].answers, 'q1')).toBe('Примерите');
    expect(surveyAnswerFor(REAL[0].answers, 'q2')).toBe(4);
  });

  it('returns undefined for a question this response skipped', () => {
    expect(surveyAnswerFor(REAL[2].answers, 'q2')).toBeUndefined();
  });

  it('still reads an object keyed by id, for imported or older rows', () => {
    expect(surveyAnswerFor({ q1: 'Примерите' }, 'q1')).toBe('Примерите');
  });

  it('survives junk instead of throwing', () => {
    for (const junk of [null, undefined, 42, 'x']) {
      expect(() => surveyAnswerFor(junk, 'q1')).not.toThrow();
      expect(surveyAnswerFor(junk, 'q1')).toBeUndefined();
    }
  });
});

describe('surveyValuesFor', () => {
  it('collects every answer to one question', () => {
    expect(surveyValuesFor(REAL, 'q1')).toEqual(['Примерите', 'Примерите', 'Задачите']);
  });

  it('drops skipped and blank answers rather than counting them', () => {
    expect(surveyValuesFor(REAL, 'q2')).toEqual([4, 5]);
    expect(surveyValuesFor([{ answers: [{ qId: 'q1', value: '' }] }], 'q1')).toEqual([]);
  });

  it('accepts a bare answers array as well as a row wrapping one', () => {
    expect(surveyValuesFor([REAL[0].answers], 'q1')).toEqual(['Примерите']);
  });

  it('keeps 0 — a zero on a scale is an answer, not a blank', () => {
    expect(surveyValuesFor([{ answers: [{ qId: 'q1', value: 0 }] }], 'q1')).toEqual([0]);
  });
});

describe('surveyTally', () => {
  it('counts and ranks, most common first', () => {
    const { total, ranked } = surveyTally(REAL, 'q1');
    expect(total).toBe(3);
    expect(ranked[0]).toEqual({ answer: 'Примерите', count: 2, pct: 67 });
    expect(ranked[1]).toEqual({ answer: 'Задачите', count: 1, pct: 33 });
  });

  it('reports nothing rather than dividing by zero', () => {
    expect(surveyTally([], 'q1')).toEqual({ total: 0, ranked: [] });
  });
});
