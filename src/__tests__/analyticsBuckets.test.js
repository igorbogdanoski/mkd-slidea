import { describe, it, expect } from 'vitest';

// Logic mirrored from src/components/Dashboard/AnalyticsTab.jsx — loadDrill()

/** Selects the bucket interval in minutes based on total session duration */
const pickInterval = (diffMin) => diffMin <= 30 ? 1 : diffMin <= 120 ? 5 : 15;

/**
 * Generates the bucket key for a timestamp given the first vote time and interval.
 * Mirrors the bucketing logic in AnalyticsTab.jsx loadDrill().
 * Uses local time (getHours/getMinutes) as the production code does.
 */
const bucketKey = (ts, first, interval) => {
  const ref = new Date(first);
  const minFromStart = Math.floor((ts - first) / 60000 / interval) * interval;
  ref.setMinutes(ref.getMinutes() + minFromStart);
  return `${String(ref.getHours()).padStart(2, '0')}:${String(Math.floor(ref.getMinutes() / interval) * interval).padStart(2, '00')}`;
};

/**
 * Builds a complete bucket list from first to last vote, spaced by interval.
 * Returns keys in chronological order (mirrors the for-loop in loadDrill).
 */
const buildBuckets = (firstMs, lastMs, interval) => {
  const diffMin = Math.ceil((lastMs - firstMs) / 60000);
  const keys = [];
  for (let i = 0; i <= diffMin; i += interval) {
    const t = new Date(firstMs + i * 60000);
    keys.push(`${String(t.getHours()).padStart(2, '0')}:${String(Math.floor(t.getMinutes() / interval) * interval).padStart(2, '00')}`);
  }
  return [...new Set(keys)];
};

/** Compute the expected bucket key for a given Date using local time */
const expectedKey = (date, interval) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(Math.floor(date.getMinutes() / interval) * interval).padStart(2, '00')}`;

describe('pickInterval', () => {
  describe('1-minute buckets for sessions ≤ 30 min', () => {
    it('0 min  → 1', () => expect(pickInterval(0)).toBe(1));
    it('1 min  → 1', () => expect(pickInterval(1)).toBe(1));
    it('15 min → 1', () => expect(pickInterval(15)).toBe(1));
    it('30 min → 1', () => expect(pickInterval(30)).toBe(1));
  });

  describe('5-minute buckets for 31–120 min', () => {
    it('31 min  → 5', () => expect(pickInterval(31)).toBe(5));
    it('60 min  → 5', () => expect(pickInterval(60)).toBe(5));
    it('120 min → 5', () => expect(pickInterval(120)).toBe(5));
  });

  describe('15-minute buckets for sessions > 120 min', () => {
    it('121 min → 15', () => expect(pickInterval(121)).toBe(15));
    it('180 min → 15', () => expect(pickInterval(180)).toBe(15));
    it('480 min → 15', () => expect(pickInterval(480)).toBe(15));
  });

  it('boundary 30 stays at 1, 31 jumps to 5', () => {
    expect(pickInterval(30)).toBe(1);
    expect(pickInterval(31)).toBe(5);
  });

  it('boundary 120 stays at 5, 121 jumps to 15', () => {
    expect(pickInterval(120)).toBe(5);
    expect(pickInterval(121)).toBe(15);
  });
});

describe('bucketKey', () => {
  it('assigns the first vote to the first bucket key (interval=1)', () => {
    const first = new Date();
    first.setSeconds(0, 0);
    const ts = first.getTime();
    expect(bucketKey(ts, ts, 1)).toBe(expectedKey(first, 1));
  });

  it('assigns a vote 30s after first to the same 1-min bucket', () => {
    const first = new Date();
    first.setSeconds(0, 0);
    const ts = first.getTime() + 30_000;
    expect(bucketKey(ts, first.getTime(), 1)).toBe(expectedKey(first, 1));
  });

  it('assigns a vote 61s after first to the next 1-min bucket', () => {
    const first = new Date();
    first.setSeconds(0, 0);
    const firstMs = first.getTime();
    const ts = firstMs + 61_000;
    const result = bucketKey(ts, firstMs, 1);
    const expected = expectedKey(new Date(firstMs + 60_000), 1);
    expect(result).toBe(expected);
  });

  it('assigns a vote 5m 1s after first to the second 5-min bucket', () => {
    const first = new Date();
    first.setMinutes(Math.floor(first.getMinutes() / 5) * 5, 0, 0);
    const firstMs = first.getTime();
    const ts = firstMs + (5 * 60 + 1) * 1000;
    const result = bucketKey(ts, firstMs, 5);
    const expected = expectedKey(new Date(firstMs + 5 * 60_000), 5);
    expect(result).toBe(expected);
  });

  it('result key matches HH:MM format', () => {
    const first = new Date().getTime();
    const key = bucketKey(first, first, 1);
    expect(key).toMatch(/^\d{2}:\d{2}$/);
  });

  it('hours and minutes are zero-padded', () => {
    // Test early morning — use a fixed local midnight-ish time
    const base = new Date();
    base.setHours(0, 0, 0, 0); // local midnight
    const key = bucketKey(base.getTime(), base.getTime(), 1);
    expect(key).toBe('00:00');
  });
});

describe('buildBuckets', () => {
  it('creates 1 bucket for a 0-second session', () => {
    const t = new Date().getTime();
    const keys = buildBuckets(t, t, 1);
    expect(keys.length).toBeGreaterThanOrEqual(1);
  });

  it('creates correct number of buckets for a 10-minute session', () => {
    const first = new Date();
    first.setSeconds(0, 0);
    const firstMs = first.getTime();
    const lastMs = firstMs + 10 * 60_000;
    const keys = buildBuckets(firstMs, lastMs, 1);
    expect(keys.length).toBe(11); // 0..10 minutes inclusive
  });

  it('bucket keys are sorted chronologically', () => {
    const first = new Date();
    first.setSeconds(0, 0);
    const firstMs = first.getTime();
    const keys = buildBuckets(firstMs, firstMs + 5 * 60_000, 1);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });

  it('keys match HH:MM format', () => {
    const first = new Date().getTime();
    const keys = buildBuckets(first, first + 3 * 60_000, 1);
    keys.forEach(k => expect(k).toMatch(/^\d{2}:\d{2}$/));
  });
});
