import { describe, it, expect } from 'vitest';
import { deriveAnswer, voteOpsFor } from '../components/EventWrapper';

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

// The other half of the same claim-before-counting rule. handleVote pushes each
// increment as it lands, so when the claim itself is what failed — a phone with
// no signal — nothing had been pushed and the queued item carried an empty ops
// list. The replay then wrote the audit row while options.votes never moved:
// the answer was recorded and counted nowhere. These pin the pure derivation
// the offline path falls back on.
describe('voteOpsFor', () => {
  const wordcloud = { id: 'wc', type: 'wordcloud', options: [] };
  const open = { id: 'op', type: 'open', options: [] };

  it('counts a chosen option once', () => {
    expect(voteOpsFor(0, poll)).toEqual([{ kind: 'option', optionId: 'a' }]);
  });

  it('gives a ranking its Borda weights, most preferred first', () => {
    expect(voteOpsFor([2, 0, 1], poll)).toEqual([
      { kind: 'weighted', optionId: 'c', weight: 3 },
      { kind: 'weighted', optionId: 'a', weight: 2 },
      { kind: 'weighted', optionId: 'b', weight: 1 },
    ]);
  });

  it('trims a text answer to the limit of its own type, not a shared one', () => {
    // A word cloud wants one word; an open question wants a paragraph. The
    // queued op used to be capped at 300 for both, so an open answer replayed
    // from offline came back a third of the length the same answer sent online.
    expect(voteOpsFor('з'.repeat(120), wordcloud)[0].text).toHaveLength(40);
    expect(voteOpsFor('з'.repeat(1200), open)[0].text).toHaveLength(1200);
  });

  it('queues nothing for fill-in-the-blanks, whose responses are read not counted', () => {
    expect(voteOpsFor({ b1: '∈' }, poll)).toEqual([]);
  });

  it('queues nothing for blank text', () => {
    expect(voteOpsFor('   ', wordcloud)).toEqual([]);
  });

  it('never throws on an index that is not an option', () => {
    // deriveAnswer throws here on purpose — it runs before anything is counted.
    // This runs inside the catch that is already handling a failure, so a throw
    // would replace a recoverable debt with an unhandled one.
    expect(voteOpsFor(9, poll)).toEqual([]);
    expect(voteOpsFor(0, undefined)).toEqual([]);
  });
});
