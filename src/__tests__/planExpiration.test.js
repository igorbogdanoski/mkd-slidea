import { describe, it, expect, vi } from 'vitest';
import { isPro } from '../lib/plans';
import { effectivePlan } from '../../api/_lib/planEnforcement.js';

// Regression coverage for the critical revenue-leak fix from the SaaS-readiness
// review: an expired pro_until must always force 'free', even though `plan`
// itself is never reset by confirm_manual_order(). Covers both the client-side
// gate (isPro, used for UI badges/redirects) and the server-side gate
// (effectivePlan, used for AI quota + Pro feature enforcement) so a future
// change to either can't silently reintroduce the leak.

describe('isPro() — client-side Pro gate (src/lib/plans.js)', () => {
  it('admin role is always Pro regardless of plan/pro_until', () => {
    expect(isPro({ role: 'admin', plan: 'free', pro_until: null })).toBe(true);
  });

  it('paid plan with no pro_until is treated as a permanent legacy grant', () => {
    expect(isPro({ plan: 'yearly', pro_until: null })).toBe(true);
  });

  it('paid plan with a future pro_until is Pro', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isPro({ plan: 'monthly', pro_until: future })).toBe(true);
  });

  it('paid plan with an EXPIRED pro_until is downgraded to free (the leak this fix closes)', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isPro({ plan: 'yearly', pro_until: past })).toBe(false);
  });

  it('free plan with a temporary referral-earned pro_until window is Pro until it expires', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isPro({ plan: 'free', pro_until: future })).toBe(true);
    expect(isPro({ plan: 'free', pro_until: past })).toBe(false);
  });

  it('plain free plan with no pro_until is never Pro', () => {
    expect(isPro({ plan: 'free', pro_until: null })).toBe(false);
    expect(isPro(null)).toBe(false);
  });
});

describe('effectivePlan() — server-side Pro gate (api/_lib/planEnforcement.js)', () => {
  it('missing profile defaults to free', () => {
    expect(effectivePlan(null)).toBe('free');
  });

  it('admin role always resolves to admin', () => {
    expect(effectivePlan({ role: 'admin', plan: 'free', pro_until: null })).toBe('admin');
  });

  it('paid plan with a future pro_until resolves to that plan', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(effectivePlan({ plan: 'quarterly', pro_until: future })).toBe('quarterly');
  });

  it('paid plan with an EXPIRED pro_until resolves to free, not the stale plan string', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(effectivePlan({ plan: 'quarterly', pro_until: past })).toBe('free');
  });

  it('expired pro_until forces free even for the highest tier plan', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(effectivePlan({ plan: 'yearly', pro_until: past })).toBe('free');
  });

  it('no pro_until at all falls through to the bare plan string (legacy grant)', () => {
    expect(effectivePlan({ plan: 'yearly', pro_until: null })).toBe('yearly');
  });

  it('malformed pro_until date does not crash and falls through to plan string', () => {
    expect(effectivePlan({ plan: 'monthly', pro_until: 'not-a-date' })).toBe('monthly');
  });
});
