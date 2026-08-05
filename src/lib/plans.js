// Plan limits — the single source of truth for what each plan may do.
// To gate a feature: import { canDo } from '../lib/plans'
// canDo(user, 'branding') → true/false
//
// ── Structure (2026-08) ─────────────────────────────────────────────────────
// Three sellable tiers plus a one-off, replacing the previous five-rung
// ladder. The old ladder was inverted: monthly at €5 came to €60 a year for
// 200 participants and 10 polls, while yearly cost €20 for unlimited — paying
// more often cost three times as much and delivered less, which any buyer who
// does the arithmetic reads as a trap.
//
//   free            acquisition; more generous than Mentimeter's free tier
//   teacher_monthly €4/mo   individual
//   teacher_yearly  €36/yr  individual, an honest 25% off the monthly rate
//   event           €80     one webinar, 7 days — for NGOs that run three a
//                           year and do not want a subscription at all
//   school          €390/yr institution: seats, invoice with ЕДБ, support
//
// ── Participant ceilings ────────────────────────────────────────────────────
// Advertised numbers stop at 500 on purpose. Load testing from inside the
// datacenter proved 300 concurrent voters at 100% success and ~1.6s p50; 500
// works but sits at 85–94% under a fully synchronised worst-case burst.
// Nobody has tested beyond that, so no plan claims "unlimited" any more —
// above 500 is a conversation, not a checkbox. The legacy plans below keep
// their original ceilings because those customers already paid for them.
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
  teacher_monthly: {
    label: 'Наставник (месечно)',
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
  teacher_yearly: {
    label: 'Наставник (годишно)',
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
  event: {
    label: 'Еден настан',
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
  school: {
    label: 'Училиште / Организација',
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

  // ── Legacy: no longer sold, still honoured ───────────────────────────────
  // Anyone who bought one of these keeps exactly what they paid for, at the
  // price they paid, for as long as their pro_until runs. Removing these
  // entries would silently downgrade paying customers to `free`.
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

// Every plan that is not `free`, current or legacy. Derived from PLANS rather
// than hand-listed: the previous hardcoded array is exactly the kind of list
// that gets forgotten when a plan is added, and forgetting it here means a
// paying customer is silently treated as free.
export const PAID_PLANS = Object.keys(PLANS).filter((k) => k !== 'free' && k !== 'admin');

export const isPro = (user) => {
  if (user?.role === 'admin') return true;
  if (PAID_PLANS.includes(user?.plan)) {
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
