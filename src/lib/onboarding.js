// One place that owns whether a user has been through onboarding.
//
// The decision used to live in four systems with four independent localStorage
// keys and four different trigger conditions, none aware of the others — see
// ONBOARDING_MAP.md. This module is the first step of collapsing them: the
// keys and the "has this person already been welcomed?" question live here,
// so a caller cannot answer it slightly differently from another caller.

// Legacy, browser-wide. Written only by the /onboarding wizard completing.
// Still read, never written, so a user who finished onboarding before this
// change is not welcomed all over again.
const LEGACY_GLOBAL_KEY = 'onboarding_v1_done';

// Current, per user. The legacy key was shared by everyone using the browser,
// which on a staffroom machine — the normal case in a school — meant the
// second teacher inherited the first teacher's onboarding state and never saw
// the introduction at all.
const perUserKey = (userId) => `mkd_onboarding_done_${userId}`;

const read = (key) => {
  try { return !!localStorage.getItem(key); } catch { return false; }
};

const write = (key) => {
  try { localStorage.setItem(key, '1'); } catch { /* private mode / quota */ }
};

/** Has this user already been through onboarding, in any of its versions? */
export function isOnboardingDone(userId) {
  if (!userId) return true; // no user yet — never welcome nobody
  return read(perUserKey(userId)) || read(LEGACY_GLOBAL_KEY);
}

/** Record completion. Writes only the per-user key; the legacy one is frozen. */
export function markOnboardingDone(userId) {
  if (!userId) return;
  write(perUserKey(userId));
}

/**
 * Should this user be sent to the welcome wizard?
 *
 * `eventCount` is what makes it meaningful: someone who already created an
 * event has demonstrably found their way around and does not need a tour.
 */
export function shouldSeeWizard(userId, eventCount) {
  if (!userId) return false;
  if (isOnboardingDone(userId)) return false;
  return eventCount === 0;
}

export const ONBOARDING_KEYS = { LEGACY_GLOBAL_KEY, perUserKey };
