import { getAuthHeader } from './authHeader';

const PAID_PLANS = ['pro', 'monthly', 'quarterly', 'semester', 'yearly', 'admin'];

// Server-verified plan check for gating paid features (CSV/PDF export, AI
// Insights). Unlike `isPro(user)` in plans.js — which trusts whatever plan
// was last fetched into local React state — this asks the server to resolve
// the effective plan from the caller's JWT + the profiles table right now,
// so the gate can't be defeated by tampering with client-side state.
export async function verifyProPlan() {
  try {
    const res = await fetch('/api/my-quota', { headers: await getAuthHeader() });
    if (!res.ok) return false;
    const data = await res.json();
    return PAID_PLANS.includes(data.plan);
  } catch {
    return false;
  }
}
