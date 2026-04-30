// Sprint 5.6 — Open API: GET /api/v1/events
//   GET /api/v1/events                  → list authenticated owner's events (max 100)
//   GET /api/v1/events?code=ABC123      → look up a single event by code
import { authenticate, preflight, json } from '../_lib/apiAuth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const ctx = await authenticate(req);
  if (!ctx) return json({ error: 'unauthorized' }, 401);
  if (!ctx.scopes.includes('read:events')) return json({ error: 'forbidden_scope' }, 403);

  const url = new URL(req.url);
  const code = (url.searchParams.get('code') || '').replace(/^#/, '').trim().toUpperCase();
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 100);

  let path;
  if (code) {
    if (!/^[A-Z0-9]{4,8}$/.test(code)) return json({ error: 'invalid_code' }, 400);
    path = `events?select=id,code,title,is_locked,is_public_scoreboard,created_at&code=eq.${encodeURIComponent(code)}&user_id=eq.${ctx.ownerId}&limit=1`;
  } else {
    path = `events?select=id,code,title,is_locked,is_public_scoreboard,created_at&user_id=eq.${ctx.ownerId}&order=created_at.desc&limit=${limit}`;
  }

  const data = await ctx.rest(path);
  if (!data) return json({ error: 'upstream_error' }, 502);

  return json({
    data,
    meta: { count: Array.isArray(data) ? data.length : 0, limit, owner_id: ctx.ownerId },
  });
}
