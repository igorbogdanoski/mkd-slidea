import { describe, it, expect } from 'vitest';
import { deriveAnswer } from '../components/EventWrapper';

// The votes row is now claimed before anything is counted, so what it records
// has to be derivable without making the call that does the counting. These
// hold that derivation in step with the branches in handleVote.
const poll = {
  options: [
    { id: 'a', text: '3/4', is_correct: true },
    { id: 'b', text: '2/6', is_correct: false },
    { id: 'c', text: '1/6' },
  ],
};

describe('deriveAnswer', () => {
  it('records the chosen option and whether it was right', () => {
    expect(deriveAnswer(0, poll)).toEqual({ answerText: '3/4', isCorrect: true });
    expect(deriveAnswer(1, poll)).toEqual({ answerText: '2/6', isCorrect: false });
  });

  it('reports an unmarked option as unknown, not as wrong', () => {
    // `is_correct` absent means the poll has no answer key, which is not the
    // same as the participant being wrong.
    expect(deriveAnswer(2, poll).isCorrect).toBe(null);
  });

  it('keeps the whole ordering for a ranking', () => {
    expect(deriveAnswer([2, 0, 1], poll).answerText).toBe('1/6 > 3/4 > 2/6');
  });

  it('serialises fill-in-the-blanks rather than reading it as an index', () => {
    // The object branch must be matched before the numeric one, or the answer
    // is silently lost.
    const { answerText } = deriveAnswer({ b1: '∈', b2: 'множество' }, poll);
    expect(JSON.parse(answerText)).toEqual({ b1: '∈', b2: 'множество' });
  });

  it('passes free text through', () => {
    expect(deriveAnswer('Прилеп', poll)).toEqual({ answerText: 'Прилеп', isCorrect: null });
  });

  it('throws on an index that is not an option, before anything is counted', () => {
    // Failing here costs nothing; failing after the tally moved would leave a
    // counted vote with no record of who cast it.
    expect(() => deriveAnswer(9, poll)).toThrow(/Invalid option/);
  });

  it('caps a long blanks payload so the column cannot overflow', () => {
    const big = Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`b${i}`, 'x'.repeat(50)]));
    expect(deriveAnswer(big, poll).answerText.length).toBeLessThanOrEqual(2000);
  });
});
