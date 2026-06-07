/**
 * Unit tests — observability / analytics helpers
 *
 * Tests recordLoginLatency and getLoginLatencySummary
 * using jsdom's localStorage simulation.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { recordLoginLatency, getLoginLatencySummary } from '../utils/observability.js';

const KEY = 'mkd_login_latency_v1';

beforeEach(() => {
  localStorage.clear();
});

describe('recordLoginLatency', () => {
  it('stores an entry in localStorage', () => {
    recordLoginLatency({ method: 'password', action: 'signIn', durationMs: 450, ok: true });
    const raw = localStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    const entries = JSON.parse(raw);
    expect(entries).toHaveLength(1);
    expect(entries[0].method).toBe('password');
    expect(entries[0].action).toBe('signIn');
    expect(entries[0].durationMs).toBe(450);
    expect(entries[0].ok).toBe(true);
  });

  it('appends multiple entries', () => {
    recordLoginLatency({ method: 'password', action: 'signIn', durationMs: 200, ok: true });
    recordLoginLatency({ method: 'google', action: 'oauth_start', durationMs: 100, ok: true });
    const entries = JSON.parse(localStorage.getItem(KEY));
    expect(entries).toHaveLength(2);
    expect(entries[1].method).toBe('google');
  });

  it('caps at 120 entries (MAX_SAMPLES)', () => {
    for (let i = 0; i < 130; i++) {
      recordLoginLatency({ method: 'password', action: 'signIn', durationMs: i * 10, ok: true });
    }
    const entries = JSON.parse(localStorage.getItem(KEY));
    expect(entries.length).toBeLessThanOrEqual(120);
  });

  it('stores ok: false for failed attempts', () => {
    recordLoginLatency({ method: 'password', action: 'signIn', durationMs: 300, ok: false, reason: 'Invalid credentials' });
    const entries = JSON.parse(localStorage.getItem(KEY));
    expect(entries[0].ok).toBe(false);
    expect(entries[0].reason).toBe('Invalid credentials');
  });

  it('truncates long reason strings to 120 chars', () => {
    const longReason = 'x'.repeat(200);
    recordLoginLatency({ method: 'password', action: 'signIn', durationMs: 100, ok: false, reason: longReason });
    const entries = JSON.parse(localStorage.getItem(KEY));
    expect(entries[0].reason.length).toBeLessThanOrEqual(120);
  });

  it('handles missing durationMs gracefully', () => {
    recordLoginLatency({ method: 'password', action: 'signIn', ok: true });
    const entries = JSON.parse(localStorage.getItem(KEY));
    expect(entries[0].durationMs).toBeNull();
  });

  it('does not throw when localStorage is unavailable', () => {
    const origSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = () => { throw new Error('no storage'); };
    expect(() => {
      recordLoginLatency({ method: 'password', action: 'signIn', durationMs: 100, ok: true });
    }).not.toThrow();
    localStorage.setItem = origSetItem;
  });
});

describe('getLoginLatencySummary', () => {
  it('returns null when no entries', () => {
    expect(getLoginLatencySummary()).toBeNull();
  });

  it('returns correct avgMs for uniform latencies', () => {
    recordLoginLatency({ method: 'password', action: 'signIn', durationMs: 100, ok: true });
    recordLoginLatency({ method: 'password', action: 'signIn', durationMs: 200, ok: true });
    recordLoginLatency({ method: 'password', action: 'signIn', durationMs: 300, ok: true });
    const summary = getLoginLatencySummary();
    expect(summary).not.toBeNull();
    expect(summary.avgMs).toBe(200);
    expect(summary.samples).toBe(3);
  });

  it('ignores entries with null durationMs when computing avg', () => {
    recordLoginLatency({ method: 'password', action: 'signIn', durationMs: 400, ok: true });
    recordLoginLatency({ method: 'magic', action: 'otp', ok: true }); // no durationMs
    const summary = getLoginLatencySummary();
    expect(summary.samples).toBe(1);
    expect(summary.avgMs).toBe(400);
  });

  it('summary.last is the most recent valid entry', () => {
    recordLoginLatency({ method: 'password', action: 'signIn', durationMs: 100, ok: true });
    recordLoginLatency({ method: 'google', action: 'oauth_start', durationMs: 250, ok: true });
    const summary = getLoginLatencySummary();
    expect(summary.last.method).toBe('google');
    expect(summary.last.durationMs).toBe(250);
  });

  it('returns null when only null-duration entries exist', () => {
    recordLoginLatency({ method: 'magic', action: 'otp', ok: true });
    expect(getLoginLatencySummary()).toBeNull();
  });
});
