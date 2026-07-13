// Plan limits — architecture ready for Stripe, no enforcement yet
// To gate a feature: import { canDo } from '../lib/plans'
// canDo(user, 'branding') → true/false

export const PLANS = {
  free: {
    label: 'Бесплатен',
    maxActiveEvents: 5,
    maxPollsPerEvent: 10,
    maxParticipants: 200,
    branding: false,
    csvExport: false,
    pdfExport: false,
    cohost: false,
    embed: false,
    advancedAnalytics: false,
    aiGenerate: false,
  },
  monthly: {
    label: 'Месечен',
    maxActiveEvents: Infinity,
    maxPollsPerEvent: 10,
    maxParticipants: 200,
    branding: false,
    csvExport: false,
    pdfExport: false,
    cohost: false,
    embed: false,
    advancedAnalytics: false,
    aiGenerate: true,
  },
  quarterly: {
    label: 'Квартален',
    maxActiveEvents: Infinity,
    maxPollsPerEvent: Infinity,
    maxParticipants: 500,
    branding: true,
    csvExport: true,
    pdfExport: true,
    cohost: true,
    embed: true,
    advancedAnalytics: true,
    aiGenerate: true,
  },
  semester: {
    label: 'Семестрален',
    maxActiveEvents: Infinity,
    maxPollsPerEvent: Infinity,
    maxParticipants: 1000,
    branding: true,
    csvExport: true,
    pdfExport: true,
    cohost: true,
    embed: true,
    advancedAnalytics: true,
    aiGenerate: true,
  },
  yearly: {
    label: 'Годишен',
    maxActiveEvents: Infinity,
    maxPollsPerEvent: Infinity,
    maxParticipants: Infinity,
    branding: true,
    csvExport: true,
    pdfExport: true,
    cohost: true,
    embed: true,
    advancedAnalytics: true,
    aiGenerate: true,
  },
  // Legacy alias
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
    aiGenerate: true,
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
    aiGenerate: true,
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
  if (user?.role === 'admin') return true;
  const paidPlans = ['pro', 'monthly', 'quarterly', 'semester', 'yearly'];
  if (paidPlans.includes(user?.plan)) {
    // pro_until, when set, is the authoritative expiration for a paid plan
    // (confirm_manual_order sets both together) — an expired subscription
    // must not keep showing as Pro forever just because `plan` itself was
    // never reset. No pro_until at all means a legacy/permanent grant.
    if (user?.pro_until) {
      const t = Date.parse(user.pro_until);
      return !Number.isNaN(t) && t > Date.now();
    }
    return true;
  }
  // Sprint 5.4 — referral-earned Pro window (plan stays 'free', pro_until grants a temporary window).
  if (user?.pro_until) {
    const t = Date.parse(user.pro_until);
    if (!Number.isNaN(t) && t > Date.now()) return true;
  }
  return false;
};
