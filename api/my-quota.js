// GET /api/my-quota — returns AI usage for the authenticated user
// Called from the Dashboard "Мој план" tab to show quota progress.
export const config = { runtime: 'edge' };

import { kv } from '@vercel/kv';
import { getAuthedUser } from './_lib/auth.js';
import { effectivePlan } from './_lib/planEnforcement.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchProfile(userId) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=plan,role,pro_until`, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, Accept: 'application/json' },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) ? rows[0] : null;
  } catch {
    return null;
  }
}

const PLAN_QUOTAS = {
  free:      { aiPerMonth: 5,         aiPerDay: 2 },
  basic:     { aiPerMonth: 5,         aiPerDay: 2 },
  monthly:   { aiPerMonth: 100,       aiPerDay: 20 },
  quarterly: { aiPerMonth: 300,       aiPerDay: 50 },
  semester:  { aiPerMonth: 600,       aiPerDay: 80 },
  yearly:    { aiPerMonth: 2000,      aiPerDay: 200 },
  pro:       { aiPerMonth: 2000,      aiPerDay: 200 },
  admin:     { aiPerMonth: Infinity,  aiPerDay: Infinity },
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization' } });

  const authedUser = await getAuthedUser(req);
  if (!authedUser?.id) return json({ error: 'unauthorized' }, 401);
  const userId = authedUser.id;
  const profile = await fetchProfile(userId);
  const plan = effectivePlan(profile);

  const quota  = PLAN_QUOTAS[plan] || PLAN_QUOTAS.free;
  const today  = new Date().toISOString().slice(0, 10);
  const month  = today.slice(0, 7);
  const subject = userId || `anon:${req.headers.get('x-forwarded-for') || 'unknown'}`;

  let dayCount = 0;
  let monthCount = 0;

  if (quota.aiPerMonth !== Infinity) {
    try {
      [dayCount, monthCount] = await Promise.all([
        kv.get(`ai:u:${subject}:d:${today}`).then(v => Number(v) || 0),
        kv.get(`ai:u:${subject}:m:${month}`).then(v => Number(v) || 0),
      ]);
    } catch { /* KV unavailable — return 0 */ }
  }

  return json({
    plan,
    quota: {
      aiPerDay:   quota.aiPerMonth === Infinity ? null : quota.aiPerDay,
      aiPerMonth: quota.aiPerMonth === Infinity ? null : quota.aiPerMonth,
    },
    used: { day: dayCount, month: monthCount },
    resetAt: {
      day:   `${today}T23:59:59Z`,
      month: `${month}-${new Date(new Date(month + '-01').setMonth(new Date(month + '-01').getMonth() + 1) - 1).getDate()}T23:59:59Z`,
    },
  });
}
