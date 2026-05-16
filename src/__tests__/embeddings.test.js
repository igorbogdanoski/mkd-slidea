// Native Node test runner (node:test) — стабилно работи со path spaces
// каде vitest 4.x има issue. Run: `npm run test:unit`.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  l2normalize,
  truncateAndRenorm,
  cleanInput,
  toPgVector,
  EMBED_DIM_DEFAULT,
} from '../lib/embeddingsCore.js';

describe('embeddings utilities', () => {
  describe('l2normalize', () => {
    it('returns unit-norm vector', () => {
      const v = l2normalize([3, 4]);
      const norm = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
      assert.ok(Math.abs(norm - 1) < 1e-6);
      assert.ok(Math.abs(v[0] - 0.6) < 1e-6);
      assert.ok(Math.abs(v[1] - 0.8) < 1e-6);
    });

    it('handles zero vector without NaN', () => {
      const v = l2normalize([0, 0, 0]);
      assert.deepEqual(v, [0, 0, 0]);
      assert.ok(!v.some((x) => Number.isNaN(x)));
    });

    it('preserves dimensionality', () => {
      assert.equal(l2normalize([1, 2, 3, 4, 5]).length, 5);
    });
  });

  describe('truncateAndRenorm', () => {
    it('returns null for non-array', () => {
      assert.equal(truncateAndRenorm(null, 768), null);
      assert.equal(truncateAndRenorm('foo', 768), null);
    });

    it('returns null when input shorter than target dim', () => {
      assert.equal(truncateAndRenorm([1, 2], 5), null);
    });

    it('truncates and renormalizes Matryoshka style', () => {
      const v = truncateAndRenorm([3, 4, 100, 200], 2);
      assert.equal(v.length, 2);
      const norm = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
      assert.ok(Math.abs(norm - 1) < 1e-6);
    });

    it('renorms when length already matches dim', () => {
      const v = truncateAndRenorm([3, 4], 2);
      const norm = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
      assert.ok(Math.abs(norm - 1) < 1e-6);
    });
  });

  describe('cleanInput', () => {
    it('returns empty string for non-string', () => {
      assert.equal(cleanInput(null), '');
      assert.equal(cleanInput(undefined), '');
      assert.equal(cleanInput(42), '');
    });

    it('collapses whitespace', () => {
      assert.equal(cleanInput('  hello\n\tworld  '), 'hello world');
    });

    it('truncates to 8000 chars by default', () => {
      assert.equal(cleanInput('a'.repeat(10000)).length, 8000);
    });

    it('respects custom maxLen', () => {
      assert.equal(cleanInput('abcdefg', 3), 'abc');
    });
  });

  describe('toPgVector', () => {
    it('returns null for non-array', () => {
      assert.equal(toPgVector(null), null);
      assert.equal(toPgVector('foo'), null);
    });

    it('formats array as pgvector literal', () => {
      assert.equal(toPgVector([0.5, -1.25]), '[0.500000,-1.250000]');
    });

    it('handles empty array', () => {
      assert.equal(toPgVector([]), '[]');
    });

    it('coerces string numerics', () => {
      assert.equal(toPgVector([1, '2.5']), '[1.000000,2.500000]');
    });
  });

  describe('constants', () => {
    it('EMBED_DIM_DEFAULT is 768 (matches vector(768) SQL)', () => {
      assert.equal(EMBED_DIM_DEFAULT, 768);
    });
  });
});
