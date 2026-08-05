import { describe, it, expect, beforeEach } from 'vitest';
import { isOnboardingDone, markOnboardingDone, shouldSeeWizard, ONBOARDING_KEYS } from '../lib/onboarding';

// States taken straight from ONBOARDING_MAP.md. Four systems used to decide
// this question independently, with four keys and four conditions; these tests
// pin the single answer they are being collapsed into.

const { LEGACY_GLOBAL_KEY, perUserKey } = ONBOARDING_KEYS;
const USER = 'user-aaa';
const OTHER = 'user-bbb';

describe('onboarding state', () => {
  beforeEach(() => localStorage.clear());

  it('a brand-new user has not been onboarded', () => {
    expect(isOnboardingDone(USER)).toBe(false);
    expect(shouldSeeWizard(USER, 0)).toBe(true);
  });

  it('a user who already made an event is left alone', () => {
    // Creating an event is proof enough of finding your way around; the wizard
    // would be an interruption, not help.
    expect(shouldSeeWizard(USER, 1)).toBe(false);
    expect(shouldSeeWizard(USER, 12)).toBe(false);
  });

  it('completing or skipping records it, and it sticks', () => {
    markOnboardingDone(USER);
    expect(isOnboardingDone(USER)).toBe(true);
    expect(shouldSeeWizard(USER, 0)).toBe(false);
  });

  // The trap this whole change exists to remove: the completion flag was set
  // on the line before navigating away, so abandoning the wizard recorded
  // nothing and the next dashboard visit dropped you straight back in.
  it('skipping the wizard is not the same as never having seen it', () => {
    expect(shouldSeeWizard(USER, 0)).toBe(true);
    markOnboardingDone(USER); // what the new "Прескокни" button does
    expect(shouldSeeWizard(USER, 0)).toBe(false);
  });

  describe('migration from the browser-wide key', () => {
    it('someone who finished onboarding before this change is not asked again', () => {
      localStorage.setItem(LEGACY_GLOBAL_KEY, 'true');
      expect(isOnboardingDone(USER)).toBe(true);
      expect(shouldSeeWizard(USER, 0)).toBe(false);
    });

    it('new completions are written per user, leaving the legacy key frozen', () => {
      markOnboardingDone(USER);
      expect(localStorage.getItem(perUserKey(USER))).toBeTruthy();
      expect(localStorage.getItem(LEGACY_GLOBAL_KEY)).toBeNull();
    });
  });

  describe('shared computer — the staffroom case', () => {
    it('one teacher finishing does not silently onboard the next', () => {
      markOnboardingDone(USER);
      expect(isOnboardingDone(USER)).toBe(true);
      expect(shouldSeeWizard(OTHER, 0), 'second teacher inherited the first one\'s state').toBe(true);
    });

    // Known and accepted limit of the migration: the legacy key is browser-wide
    // and cannot be attributed to anyone, so on a machine where it is already
    // set nobody gets welcomed. It is never written again, so this fades out
    // rather than spreading.
    it('the legacy key still suppresses for everyone, by design', () => {
      localStorage.setItem(LEGACY_GLOBAL_KEY, 'true');
      expect(isOnboardingDone(OTHER)).toBe(true);
    });
  });

  describe('degraded environments', () => {
    it('no user id means nobody to welcome', () => {
      expect(isOnboardingDone(undefined)).toBe(true);
      expect(shouldSeeWizard(undefined, 0)).toBe(false);
      expect(() => markOnboardingDone(undefined)).not.toThrow();
    });

    it('an unknown event count does not trigger the wizard', () => {
      // A failed count query returns null; treating that as "zero events"
      // would throw a wizard at an existing user whose query merely failed.
      expect(shouldSeeWizard(USER, null)).toBe(false);
      expect(shouldSeeWizard(USER, undefined)).toBe(false);
    });
  });
});
