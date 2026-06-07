import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Logic mirrored from src/components/Dashboard/Sidebar.jsx
const DISMISS_KEY = 'mkd_checklist_dismissed_until';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Note: when localStorage key is absent, `null && expr` evaluates to `null` (falsy, not `false`).
// Tests use toBeFalsy/toBeTruthy to match the actual runtime semantics used by the component.
const isDismissed = () => {
  try {
    const until = localStorage.getItem(DISMISS_KEY);
    return until && Date.now() < Number(until);
  } catch { return false; }
};

const dismiss = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + SEVEN_DAYS_MS));
  } catch { /* ignore */ }
};

const clearDismiss = () => localStorage.removeItem(DISMISS_KEY);

describe('onboarding checklist dismiss logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('isDismissed()', () => {
    it('returns falsy when key is absent', () => {
      expect(isDismissed()).toBeFalsy();
    });

    it('returns truthy immediately after dismiss()', () => {
      dismiss();
      expect(isDismissed()).toBeTruthy();
    });

    it('returns falsy when stored timestamp is in the past', () => {
      localStorage.setItem(DISMISS_KEY, String(Date.now() - 1));
      expect(isDismissed()).toBeFalsy();
    });

    it('returns truthy when stored timestamp is well in the future', () => {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 60_000));
      expect(isDismissed()).toBeTruthy();
    });

    it('returns falsy exactly at expiry (Date.now() === until)', () => {
      const now = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(now);
      localStorage.setItem(DISMISS_KEY, String(now)); // not < now
      expect(isDismissed()).toBeFalsy();
    });
  });

  describe('dismiss()', () => {
    it('stores a timestamp 7 days in the future', () => {
      const before = Date.now();
      dismiss();
      const after = Date.now();
      const stored = Number(localStorage.getItem(DISMISS_KEY));
      expect(stored).toBeGreaterThanOrEqual(before + SEVEN_DAYS_MS);
      expect(stored).toBeLessThanOrEqual(after + SEVEN_DAYS_MS);
    });

    it('overwrites an existing dismiss value', () => {
      localStorage.setItem(DISMISS_KEY, '123');
      dismiss();
      const stored = Number(localStorage.getItem(DISMISS_KEY));
      expect(stored).toBeGreaterThan(1000);
    });
  });

  describe('clearDismiss()', () => {
    it('after clearing, isDismissed() returns falsy', () => {
      dismiss();
      expect(isDismissed()).toBeTruthy();
      clearDismiss();
      expect(isDismissed()).toBeFalsy();
    });
  });

  describe('expiry after 7 days', () => {
    it('isDismissed() returns falsy after 7 days have passed', () => {
      vi.useFakeTimers();
      const start = new Date('2026-06-07T10:00:00Z').getTime();
      vi.setSystemTime(start);
      dismiss();
      expect(isDismissed()).toBeTruthy();
      // Advance 7 days + 1ms
      vi.setSystemTime(start + SEVEN_DAYS_MS + 1);
      expect(isDismissed()).toBeFalsy();
    });

    it('isDismissed() returns truthy 1ms before expiry', () => {
      vi.useFakeTimers();
      const start = Date.now();
      dismiss();
      vi.setSystemTime(start + SEVEN_DAYS_MS - 1);
      expect(isDismissed()).toBeTruthy();
    });
  });
});
