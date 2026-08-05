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

/**
 * The single first-run path.
 *
 * Four systems used to compete for a new user's attention: the /onboarding
 * redirect, a spotlight tour, a "Брз водич" modal on the dashboard home, and
 * FirstSuccessWizard. All four fired for a new user with an empty browser, in
 * an order decided by how fast a count query returned — so the same person on
 * a slower connection got a different first experience.
 *
 * FirstSuccessWizard survives because it is the only one that ends in a
 * finished lesson rather than an explanation: subject → ready-made class →
 * Host, in three clicks. The other two are switched off here rather than
 * deleted, so if the live product turns out to need one of them back it is a
 * one-line change and not an archaeology exercise.
 */
export const LEGACY_TOURS_ENABLED = false;

// ── Checklist: "Сподели со учесници" ────────────────────────────────────────
// The sidebar checklist reads this key to decide whether the sharing step is
// done. Nothing ever wrote it. The step could therefore never be completed,
// the checklist could never reach 4/4, and the "🎉 Подготвен!" state it builds
// towards was unreachable for every user who ever had it — a progress bar that
// by construction stops at three quarters.
const SHARED_KEY = 'mkd_shared_session';

/** Record that the user actually shared a join link or QR code. */
export function markSessionShared() {
  write(SHARED_KEY);
}

export function hasSharedSession() {
  return read(SHARED_KEY);
}
