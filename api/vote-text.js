// POST /api/vote-text  (Edge)
// Body: { pollId: string|number, text: string }
// No auth required — participants are anonymous.
// Uses service role to bypass anon RLS on the options table.
// Upserts atomically via the `upsert_text_option` RPC (INSERT ... ON CONFLICT
// on a (poll_id, lower(text)) unique index) so concurrent submissions of the
// same word merge into one row with an accurate vote count instead of racing.

export const config = { runtime: 'edge' };

import { getClientIp, checkRateLimit } from './_lib/rateLimit.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const ip = getClientIp(req);
  const rate = await checkRateLimit('vote-text', ip, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rate.allowed) {
    return new Response(JSON.stringify({ error: 'Премногу барања. Обидете се повторно за момент.' }), { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { pollId, text } = body;
  if (!pollId || typeof text !== 'string') {
    return new Response(JSON.stringify({ error: 'pollId and text required' }), { status: 400 });
  }

  const clean = String(text).replace(/<[^>]+>/g, '').trim().slice(0, 300);
  if (!clean) return new Response(JSON.stringify({ error: 'empty text' }), { status: 400 });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
  }

  const headers = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const pollRes = await fetch(
      `${SUPABASE_URL}/rest/v1/polls?id=eq.${encodeURIComponent(pollId)}&select=needs_moderation&limit=1`,
      { headers }
    );
    const pollRows = pollRes.ok ? await pollRes.json() : [];
    const isModerated = Array.isArray(pollRows) && pollRows[0]?.needs_moderation === true;

    // Atomic upsert: INSERT ... ON CONFLICT (poll_id, lower(text)) DO UPDATE
    // votes = votes + 1. Concurrent submissions of the same word merge into
    // one row instead of racing into duplicates.
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_text_option`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_poll_id: pollId, p_text: clean, p_is_approved: !isModerated }),
    });
    if (!upsertRes.ok) {
      return new Response(JSON.stringify({ error: 'Не успеа да се зачува гласот. Обиди се повторно.' }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Не успеа да се зачува гласот. Обиди се повторно.' }), { status: 500 });
  }
}
