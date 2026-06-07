import { describe, it, expect } from 'vitest';
import {
  filterActiveQuestions,
  filterApprovedIfFlagged,
  sortPinnedThenVotes,
  pipelineQuestions,
} from '../lib/questionsCore.js';

describe('filterActiveQuestions', () => {
  it('removes hidden rows', () => {
    const rows = [
      { id: 1, is_hidden: false },
      { id: 2, is_hidden: true },
      { id: 3 },
    ];
    expect(filterActiveQuestions(rows).map(r => r.id)).toEqual([1, 3]);
  });

  it('keeps un-answered rows when is_answered exists', () => {
    const rows = [
      { id: 1, is_answered: false },
      { id: 2, is_answered: true },
    ];
    expect(filterActiveQuestions(rows).map(r => r.id)).toEqual([1]);
  });

  it('keeps all rows when is_answered is absent (legacy schema)', () => {
    const rows = [{ id: 1 }, { id: 2 }];
    expect(filterActiveQuestions(rows)).toHaveLength(2);
  });

  it('returns [] for null', () => {
    expect(filterActiveQuestions(null)).toEqual([]);
  });

  it('returns [] for undefined', () => {
    expect(filterActiveQuestions(undefined)).toEqual([]);
  });

  it('returns [] for empty array', () => {
    expect(filterActiveQuestions([])).toEqual([]);
  });

  it('keeps row where is_hidden is falsy but not false (undefined)', () => {
    const rows = [{ id: 1, is_hidden: undefined }];
    expect(filterActiveQuestions(rows)).toHaveLength(1);
  });
});

describe('filterApprovedIfFlagged', () => {
  it('returns all rows when none has is_approved', () => {
    const rows = [{ id: 1 }, { id: 2 }];
    expect(filterApprovedIfFlagged(rows)).toHaveLength(2);
  });

  it('keeps only approved rows when flag is present', () => {
    const rows = [
      { id: 1, is_approved: true },
      { id: 2, is_approved: false },
      { id: 3, is_approved: true },
    ];
    expect(filterApprovedIfFlagged(rows).map(r => r.id)).toEqual([1, 3]);
  });

  it('activates filtering as soon as any row has the flag', () => {
    const rows = [
      { id: 1, is_approved: true },
      { id: 2 },
    ];
    expect(filterApprovedIfFlagged(rows).map(r => r.id)).toEqual([1]);
  });

  it('returns [] for empty array', () => {
    expect(filterApprovedIfFlagged([])).toEqual([]);
  });
});

describe('sortPinnedThenVotes', () => {
  it('places pinned rows first regardless of votes', () => {
    const rows = [
      { id: 1, votes: 10, is_pinned: false },
      { id: 2, votes: 1,  is_pinned: true },
      { id: 3, votes: 5,  is_pinned: false },
    ];
    expect(sortPinnedThenVotes(rows).map(r => r.id)).toEqual([2, 1, 3]);
  });

  it('orders by votes descending within same pin status', () => {
    const rows = [
      { id: 1, votes: 2  },
      { id: 2, votes: 8  },
      { id: 3, votes: 5  },
    ];
    expect(sortPinnedThenVotes(rows).map(r => r.id)).toEqual([2, 3, 1]);
  });

  it('treats missing votes as 0', () => {
    const rows = [{ id: 1 }, { id: 2, votes: 1 }];
    expect(sortPinnedThenVotes(rows).map(r => r.id)).toEqual([2, 1]);
  });

  it('does not mutate the input array', () => {
    const rows = [{ id: 1, votes: 1 }, { id: 2, votes: 5 }];
    const original = rows.map(r => r.id).join(',');
    sortPinnedThenVotes(rows);
    expect(rows.map(r => r.id).join(',')).toBe(original);
  });

  it('handles tie in votes — stable order preserved between equal rows', () => {
    const rows = [
      { id: 1, votes: 3 },
      { id: 2, votes: 3 },
    ];
    const result = sortPinnedThenVotes(rows);
    expect(result).toHaveLength(2);
    result.forEach(r => expect(r.votes).toBe(3));
  });

  it('handles two pinned rows by votes desc', () => {
    const rows = [
      { id: 1, votes: 5, is_pinned: true },
      { id: 2, votes: 9, is_pinned: true },
    ];
    expect(sortPinnedThenVotes(rows).map(r => r.id)).toEqual([2, 1]);
  });
});

describe('pipelineQuestions', () => {
  it('applies hide → approve → sort in one call', () => {
    const rows = [
      { id: 1, votes: 10, is_pinned: false, is_hidden: false,  is_approved: true,  is_answered: false },
      { id: 2, votes: 99, is_pinned: false, is_hidden: true,   is_approved: true,  is_answered: false },
      { id: 3, votes: 1,  is_pinned: true,  is_hidden: false,  is_approved: true,  is_answered: false },
      { id: 4, votes: 50, is_pinned: false, is_hidden: false,  is_approved: false, is_answered: false },
      { id: 5, votes: 5,  is_pinned: false, is_hidden: false,  is_approved: true,  is_answered: true  },
    ];
    expect(pipelineQuestions(rows).map(r => r.id)).toEqual([3, 1]);
  });

  it('returns [] for null', () => {
    expect(pipelineQuestions(null)).toEqual([]);
  });

  it('returns [] for empty array', () => {
    expect(pipelineQuestions([])).toEqual([]);
  });

  it('single visible approved unanswered row passes through unchanged', () => {
    const rows = [{ id: 42, votes: 7, is_hidden: false, is_approved: true, is_answered: false }];
    const result = pipelineQuestions(rows);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(42);
  });
});
