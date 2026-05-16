// Run: node --test src/__tests__/questionsCore.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterActiveQuestions,
  filterApprovedIfFlagged,
  sortPinnedThenVotes,
  pipelineQuestions,
} from '../lib/questionsCore.js';

describe('questionsCore', () => {
  describe('filterActiveQuestions', () => {
    it('removes hidden rows', () => {
      const rows = [
        { id: 1, is_hidden: false },
        { id: 2, is_hidden: true },
        { id: 3 },
      ];
      assert.deepEqual(filterActiveQuestions(rows).map(r => r.id), [1, 3]);
    });

    it('keeps un-answered when is_answered exists', () => {
      const rows = [
        { id: 1, is_answered: false },
        { id: 2, is_answered: true },
      ];
      assert.deepEqual(filterActiveQuestions(rows).map(r => r.id), [1]);
    });

    it('keeps all when is_answered absent (legacy schema)', () => {
      const rows = [{ id: 1 }, { id: 2 }];
      assert.equal(filterActiveQuestions(rows).length, 2);
    });

    it('returns [] for non-array', () => {
      assert.deepEqual(filterActiveQuestions(null), []);
      assert.deepEqual(filterActiveQuestions(undefined), []);
    });
  });

  describe('filterApprovedIfFlagged', () => {
    it('returns all when no row has is_approved', () => {
      const rows = [{ id: 1 }, { id: 2 }];
      assert.equal(filterApprovedIfFlagged(rows).length, 2);
    });

    it('keeps only approved when flag is present', () => {
      const rows = [
        { id: 1, is_approved: true },
        { id: 2, is_approved: false },
        { id: 3, is_approved: true },
      ];
      assert.deepEqual(filterApprovedIfFlagged(rows).map(r => r.id), [1, 3]);
    });

    it('drops un-approved rows even when others lack the flag', () => {
      const rows = [
        { id: 1, is_approved: true },
        { id: 2 },
      ];
      assert.deepEqual(filterApprovedIfFlagged(rows).map(r => r.id), [1]);
    });
  });

  describe('sortPinnedThenVotes', () => {
    it('puts pinned first regardless of votes', () => {
      const rows = [
        { id: 1, votes: 10, is_pinned: false },
        { id: 2, votes: 1, is_pinned: true },
        { id: 3, votes: 5, is_pinned: false },
      ];
      assert.deepEqual(sortPinnedThenVotes(rows).map(r => r.id), [2, 1, 3]);
    });

    it('orders by votes desc within same pin status', () => {
      const rows = [
        { id: 1, votes: 2, is_pinned: false },
        { id: 2, votes: 8, is_pinned: false },
        { id: 3, votes: 5, is_pinned: false },
      ];
      assert.deepEqual(sortPinnedThenVotes(rows).map(r => r.id), [2, 3, 1]);
    });

    it('treats missing votes as 0', () => {
      const rows = [{ id: 1 }, { id: 2, votes: 1 }];
      assert.deepEqual(sortPinnedThenVotes(rows).map(r => r.id), [2, 1]);
    });

    it('does not mutate input', () => {
      const rows = [
        { id: 1, votes: 1 },
        { id: 2, votes: 5 },
      ];
      const snapshot = rows.map(r => r.id).join(',');
      sortPinnedThenVotes(rows);
      assert.equal(rows.map(r => r.id).join(','), snapshot);
    });
  });

  describe('pipelineQuestions', () => {
    it('hides + filters + sorts in one call (Sprint 8.3.1 behavior)', () => {
      const rows = [
        { id: 1, votes: 10, is_pinned: false, is_hidden: false, is_approved: true, is_answered: false },
        { id: 2, votes: 99, is_pinned: false, is_hidden: true,  is_approved: true, is_answered: false }, // hidden
        { id: 3, votes: 1,  is_pinned: true,  is_hidden: false, is_approved: true, is_answered: false }, // pinned
        { id: 4, votes: 50, is_pinned: false, is_hidden: false, is_approved: false, is_answered: false }, // unapproved
        { id: 5, votes: 5,  is_pinned: false, is_hidden: false, is_approved: true, is_answered: true },  // answered
      ];
      assert.deepEqual(pipelineQuestions(rows).map(r => r.id), [3, 1]);
    });

    it('returns [] for null', () => {
      assert.deepEqual(pipelineQuestions(null), []);
    });
  });
});
