// Server-side plan checks for AI/feature endpoints.
// Lightweight: чита profile.plan + pro_until од Supabase по user_id.
// Cache 5 мин во KV (ако е достапно) за намалување на REST повици.

import { kv } from '@vercel/kv';

const PLAN_QUOTAS = {
  free:      { aiPerMonth: 5,    aiPerDay: 2 },
  basic:     { aiPerMonth: 5,    aiPerDay: 2 },
  monthly:   { aiPerMonth: 100,  aiPerDay: 20 },
  quarterly: { aiPerMonth: 300,  aiPerDay: 50 },
  semester:  { aiPerMonth: 600,  aiPerDay: 80 },
  yearly:    { aiPerMonth: 2000, aiPerDay: 200 },
  pro:       { aiPerMonth: 2000, aiPerDay: 200 },
  admin:     { aiPerMonth: Infinity, aiPerDay: Infinity },
};

function effectivePlan(profile) {
  if (!profile) return 'free';
  const now = Date.now();
  if (profile.role === 'admin') return 'admin';
  if (profile.pro_until) {
    const t = Date.parse(profile.pro_until);
    if (!Number.isNaN(t) && t > now) return profile.plan || 'pro';
  }
  return profile.plan || 'free';
}

async function fetchProfile(userId) {
  if (!userId) return null;
  const cacheKey = `profile:${userId}`;
  try {
    const cached = await kv.get(cacheKey);
    if (cached) return cached;
  } catch { /* ignore */ }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  try {
    const r = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,plan,role,pro_until`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    const p = Array.isArray(rows) ? rows[0] : null;
    if (p) {
      try { await kv.set(cacheKey, p, { ex: 300 }); } catch { /* ignore */ }
    }
    return p;
  } catch {
    return null;
  }
}

export async function checkAiQuota(req) {
  const userId = req.headers.get('x-user-id') || '';
  const profile = await fetchProfile(userId);
  const plan = effectivePlan(profile);
  const quota = PLAN_QUOTAS[plan] || PLAN_QUOTAS.free;

  if (quota.aiPerMonth === Infinity) {
    return { allowed: true, plan, profile, used: { month: 0, day: 0 }, quota };
  }

  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const subject = userId || `anon:${req.headers.get('x-forwarded-for') || 'unknown'}`;
  const dayKey = `ai:u:${subject}:d:${today}`;
  const monthKey = `ai:u:${subject}:m:${month}`;

  let dayCount = 0;
  let monthCount = 0;
  try {
    dayCount = (await kv.get(dayKey)) || 0;
    monthCount = (await kv.get(monthKey)) || 0;
  } catch { /* ignore */ }

  if (monthCount >= quota.aiPerMonth) {
    return {
      allowed: false,
      reason: `Месечниот лимит од ${quota.aiPerMonth} AI генерации за планот „${plan}" е достигнат. Надгради го планот за повеќе.`,
      plan, profile, used: { month: monthCount, day: dayCount }, quota,
    };
  }
  if (dayCount >= quota.aiPerDay) {
    return {
      allowed: false,
      reason: `Дневниот лимит од ${quota.aiPerDay} AI генерации за планот „${plan}" е достигнат. Обиди се утре или надгради.`,
      plan, profile, used: { month: monthCount, day: dayCount }, quota,
    };
  }

  return {
    allowed: true,
    plan, profile, used: { month: monthCount, day: dayCount }, quota,
    bump: async () => {
      try {
        const d = await kv.incr(dayKey); if (d === 1) await kv.expire(dayKey, 60 * 60 * 26);
        const m = await kv.incr(monthKey); if (m === 1) await kv.expire(monthKey, 60 * 60 * 24 * 32);
      } catch { /* ignore */ }
    },
  };
}

export { PLAN_QUOTAS, effectivePlan };
