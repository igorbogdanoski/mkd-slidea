// Plan limits — architecture ready for Stripe, no enforcement yet
// To gate a feature: import { canDo } from '../lib/plans'
// canDo(user, 'branding') → true/false

export const PLANS = {
  free: {
    label: 'Free',
    maxActiveEvents: 3,
    maxPollsPerEvent: 10,
    maxParticipants: 50,
    branding: false,
    csvExport: false,
    pdfExport: false,
    cohost: false,
    embed: false,
    advancedAnalytics: false,
  },
  pro: {
    label: 'Pro',
    maxActiveEvents: Infinity,
    maxPollsPerEvent: Infinity,
    maxParticipants: Infinity,
    branding: true,
    csvExport: true,
    pdfExport: true,
    cohost: true,
    embed: true,
    advancedAnalytics: true,
  },
  admin: {
    label: 'Admin',
    maxActiveEvents: Infinity,
    maxPollsPerEvent: Infinity,
    maxParticipants: Infinity,
    branding: true,
    csvExport: true,
    pdfExport: true,
    cohost: true,
    embed: true,
    advancedAnalytics: true,
  },
};

// Returns true if user's plan allows the feature
// NOTE: currently not enforced — shows UI badges only
export const canDo = (user, feature) => {
  const plan = PLANS[user?.plan || 'free'] || PLANS.free;
  const val = plan[feature];
  if (val === true || val === Infinity) return true;
  if (val === false || val === 0) return false;
  return true;
};

export const planLimit = (user, key) => {
  const plan = PLANS[user?.plan || 'free'] || PLANS.free;
  return plan[key] ?? 0;
};

export const isPro = (user) => {
  return user?.plan === 'pro' || user?.plan === 'admin' || user?.role === 'admin';
};
