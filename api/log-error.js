// POST /api/log-error — receives client-side errors (from App.jsx's global
// error handlers) and writes them to public.error_log via service role, so
// browser errors are visible to the founder instead of only sitting in a
// user's own devtools console.
export const config = { runtime: 'edge' };

import { getClientIp, checkRateLimit } from './_lib/rateLimit.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return new Response(null, { status: 204 });

  const rate = await checkRateLimit('log-error', getClientIp(req), RATE_LIMIT, RATE_WINDOW_MS);
  if (!rate.allowed) return new Response(null, { status: 204 });

  let body;
  try { body = await req.json(); } catch { return new Response(null, { status: 204 }); }

  const message = String(body?.message || '').slice(0, 2000);
  if (!message) return new Response(null, { status: 204 });

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/error_log`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        source: 'client',
        message,
        stack: String(body?.stack || '').slice(0, 4000) || null,
        url: String(body?.url || '').slice(0, 500) || null,
        context: { userAgent: req.headers.get('user-agent') || null },
      }),
    });
  } catch { /* best-effort */ }

  return new Response(null, { status: 204 });
}
