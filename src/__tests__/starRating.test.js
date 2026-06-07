import { describe, it, expect } from 'vitest';

// Pure function mirrored from src/views/PublicTemplates.jsx line 15
const starRating = (pollCount) => Math.min(5, Math.max(3, Math.ceil(pollCount / 2)));

describe('starRating', () => {
  describe('minimum boundary — always at least 3 stars', () => {
    it('returns 3 for 0 polls', () => expect(starRating(0)).toBe(3));
    it('returns 3 for 1 poll', () => expect(starRating(1)).toBe(3));
    it('returns 3 for 2 polls', () => expect(starRating(2)).toBe(3));
    it('returns 3 for 3 polls', () => expect(starRating(3)).toBe(3));
    it('returns 3 for 4 polls', () => expect(starRating(4)).toBe(3));
    it('returns 3 for 5 polls', () => expect(starRating(5)).toBe(3));
    it('returns 3 for 6 polls', () => expect(starRating(6)).toBe(3));
  });

  describe('middle range — 4 stars', () => {
    it('returns 4 for 7 polls', () => expect(starRating(7)).toBe(4));
    it('returns 4 for 8 polls', () => expect(starRating(8)).toBe(4));
  });

  describe('maximum boundary — capped at 5 stars', () => {
    it('returns 5 for 9 polls', () => expect(starRating(9)).toBe(5));
    it('returns 5 for 10 polls', () => expect(starRating(10)).toBe(5));
    it('returns 5 for 20 polls', () => expect(starRating(20)).toBe(5));
    it('returns 5 for 100 polls', () => expect(starRating(100)).toBe(5));
  });

  describe('edge cases', () => {
    it('never returns below 3', () => {
      for (let i = 0; i <= 20; i++) {
        expect(starRating(i)).toBeGreaterThanOrEqual(3);
      }
    });

    it('never returns above 5', () => {
      for (let i = 0; i <= 200; i++) {
        expect(starRating(i)).toBeLessThanOrEqual(5);
      }
    });

    it('is monotonically non-decreasing', () => {
      let prev = starRating(0);
      for (let i = 1; i <= 50; i++) {
        const curr = starRating(i);
        expect(curr).toBeGreaterThanOrEqual(prev);
        prev = curr;
      }
    });
  });
});
