// POST /api/vote-text  (Edge)
// Body: { pollId: string|number, text: string }
// No auth required — participants are anonymous.
// Uses service role to bypass anon RLS on the options table.
// Checks if an option with the same text (case-insensitive) already exists:
//   - yes → increment its vote count via RPC
//   - no  → insert a new option (respecting poll's needs_moderation flag)

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

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
    // Case-insensitive check for existing option with same text
    const checkUrl = `${SUPABASE_URL}/rest/v1/options?poll_id=eq.${encodeURIComponent(pollId)}&text=ilike.${encodeURIComponent(clean)}&select=id&limit=1`;
    const checkRes = await fetch(checkUrl, { headers });
    if (!checkRes.ok) {
      const err = await checkRes.text();
      return new Response(JSON.stringify({ error: `DB check failed: ${err}` }), { status: 500 });
    }

    const existing = await checkRes.json();

    if (Array.isArray(existing) && existing.length > 0) {
      // Existing option — increment its vote count via security-definer RPC
      const incrRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_vote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ option_id: existing[0].id }),
      });
      if (!incrRes.ok) {
        const err = await incrRes.text();
        return new Response(JSON.stringify({ error: `Increment failed: ${err}` }), { status: 500 });
      }
    } else {
      // New option — check poll's moderation setting before inserting
      const pollRes = await fetch(
        `${SUPABASE_URL}/rest/v1/polls?id=eq.${encodeURIComponent(pollId)}&select=needs_moderation&limit=1`,
        { headers }
      );
      const pollRows = pollRes.ok ? await pollRes.json() : [];
      const isModerated = Array.isArray(pollRows) && pollRows[0]?.needs_moderation === true;

      const insRes = await fetch(`${SUPABASE_URL}/rest/v1/options`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          poll_id: pollId,
          text: clean,
          votes: 1,
          is_approved: !isModerated,
        }),
      });
      if (!insRes.ok) {
        const err = await insRes.text();
        return new Response(JSON.stringify({ error: `Insert failed: ${err}` }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
