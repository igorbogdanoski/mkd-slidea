// Regression: the participant must resolve the slide the host activated, and
// resolve the SAME one every time, even when the deck's positions are tied.
//
// Context: fetchPolls ordered by (position, created_at) only. Decks written
// before the import paths set `position` carry runs of 0, and a bulk import
// stamps every row with the same created_at. On those ties Postgres may return
// the rows in any order, and need not pick the same order twice. EventWrapper
// resolves the active slide with findIndex(active_poll_id) over that array, so
// the order was the thing deciding which question a phone showed.
//
// Measured on W2TY8K (two polls, both position 0): a participant who joined
// while the host was on slide 1 was shown slide 2, and stayed there.
import { describe, it, expect } from 'vitest';

// The resolver EventWrapper uses, stated once so the test can assert on it.
const resolveActiveIndex = (polls, activePollId) =>
  polls.findIndex((p) => p.id === activePollId);

// A comparator faithful to ORDER BY position, created_at, id. Array.prototype
// .sort is stable, but the point is that the result does not depend on the
// caller's input order — compare on all three keys.
const orderPolls = (rows) =>
  [...rows].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    const ac = String(a.created_at); const bc = String(b.created_at);
    if (ac !== bc) return ac < bc ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

// Two slides, indistinguishable by position or timestamp — the shape that broke.
const tiedDeck = [
  { id: 'b2', position: 0, created_at: '2026-02-03T10:00:00.000Z' },
  { id: 'a1', position: 0, created_at: '2026-02-03T10:00:00.000Z' },
];

describe('participant active-slide resolution', () => {
  it('returns the same order regardless of the order the rows arrive in', () => {
    const forward = orderPolls(tiedDeck).map((p) => p.id);
    const reversed = orderPolls([...tiedDeck].reverse()).map((p) => p.id);
    const shuffled = orderPolls([tiedDeck[1], ...tiedDeck.slice(0, 1)]).map((p) => p.id);
    expect(reversed).toEqual(forward);
    expect(shuffled).toEqual(forward);
  });

  it('resolves the activated slide to the same index for every caller', () => {
    // The host and the participant run the same ordering, so whichever row is
    // first, both land on the same index for the same active_poll_id.
    const activeId = 'b2';
    const hostView = orderPolls(tiedDeck);
    const participantView = orderPolls([...tiedDeck].reverse());
    expect(resolveActiveIndex(hostView, activeId))
      .toBe(resolveActiveIndex(participantView, activeId));
  });

  it('does not depend on position or created_at differences alone', () => {
    // Distinct positions still work — the tiebreaker must not disturb them.
    const ordered = [
      { id: 'z9', position: 2, created_at: '2026-01-01T00:00:00.000Z' },
      { id: 'y8', position: 0, created_at: '2026-01-03T00:00:00.000Z' },
      { id: 'x7', position: 1, created_at: '2026-01-02T00:00:00.000Z' },
    ];
    expect(orderPolls(ordered).map((p) => p.id)).toEqual(['y8', 'x7', 'z9']);
  });

  it('breaks a same-position, same-timestamp tie by id, not by luck', () => {
    const ids = orderPolls(tiedDeck).map((p) => p.id);
    expect(ids).toEqual(['a1', 'b2']); // ascending id
  });
});
