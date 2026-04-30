// Sprint 5.6 — Open API: GET /api/v1/results?code=ABC123
//   Returns event meta + polls (with options & vote counts) + leaderboard.
import { authenticate, preflight, json } from '../_lib/apiAuth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const ctx = await authenticate(req);
  if (!ctx) return json({ error: 'unauthorized' }, 401);
  if (!ctx.scopes.includes('read:results')) return json({ error: 'forbidden_scope' }, 403);

  const url = new URL(req.url);
  const code = (url.searchParams.get('code') || '').replace(/^#/, '').trim().toUpperCase();
  if (!/^[A-Z0-9]{4,8}$/.test(code)) return json({ error: 'invalid_code' }, 400);

  const events = await ctx.rest(
    `events?select=id,code,title,is_locked,is_public_scoreboard,created_at&code=eq.${encodeURIComponent(code)}&user_id=eq.${ctx.ownerId}&limit=1`
  );
  if (!events) return json({ error: 'upstream_error' }, 502);
  if (!Array.isArray(events) || events.length === 0) return json({ error: 'not_found' }, 404);

  const event = events[0];

  const [polls, leaderboard] = await Promise.all([
    ctx.rest(`polls?select=id,question,type,is_quiz,position,created_at,options(id,text,votes,is_correct)&event_id=eq.${event.id}&order=position.asc,created_at.asc`),
    ctx.rest(`leaderboard?select=username,points,last_updated&event_id=eq.${event.id}&order=points.desc,last_updated.asc&limit=100`),
  ]);

  return json({
    data: {
      event,
      polls: Array.isArray(polls) ? polls : [],
      leaderboard: Array.isArray(leaderboard) ? leaderboard : [],
    },
    meta: {
      polls_count: Array.isArray(polls) ? polls.length : 0,
      leaderboard_count: Array.isArray(leaderboard) ? leaderboard.length : 0,
    },
  });
}
