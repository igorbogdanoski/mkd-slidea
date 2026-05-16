// ============================================================================
// Sprint 8.1.5 — Semantic search (RAG) endpoint
// ----------------------------------------------------------------------------
// POST /api/semantic-search { query, subject?, grade?, scopes? }
//   scopes: ['templates','curriculum','my_polls'] (default all 3)
// Се повикува од Dashboard SemanticSearchTab.
//
// Auth: за `my_polls` scope, прима Authorization: Bearer <supabase_jwt>
// и го форвардира до Supabase REST за да match_my_polls() го резолвира auth.uid().
// ============================================================================

import { embedText, toPgVector } from './_lib/embeddings.js';

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function callRpc(fn, body, opts = {}) {
  const useUserToken = !!opts.userJwt;
  const headers = {
    'Content-Type': 'application/json',
    apikey: useUserToken ? ANON_KEY : (SERVICE_KEY || ANON_KEY),
    Authorization: useUserToken ? `Bearer ${opts.userJwt}` : `Bearer ${SERVICE_KEY || ANON_KEY}`,
  };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    if (!res.ok) return { error: `HTTP ${res.status}`, data: [] };
    return { data: await res.json(), error: null };
  } catch (err) {
    return { error: err?.message || 'fetch_error', data: [] };
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  if (!SUPABASE_URL || !ANON_KEY) {
    return new Response(JSON.stringify({ error: 'Supabase env not configured' }), { status: 500 });
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { query, subject, grade, scopes } = body || {};
  if (typeof query !== 'string' || query.trim().length < 2 || query.length > 500) {
    return new Response(JSON.stringify({ error: 'query 2..500 знаци.' }), { status: 400 });
  }

  const wantedScopes = Array.isArray(scopes) && scopes.length
    ? scopes
    : ['templates', 'curriculum', 'my_polls'];

  const vec = await embedText(query, { taskType: 'RETRIEVAL_QUERY' });
  if (!vec) {
    return new Response(JSON.stringify({ error: 'Embedding failed.' }), { status: 502 });
  }
  const pgvec = toPgVector(vec);

  const tasks = [];
  if (wantedScopes.includes('curriculum')) {
    tasks.push(
      callRpc('match_curriculum', {
        query_embedding: pgvec, match_count: 6,
        p_grade: grade || null, p_subject: subject || null,
      }).then((r) => ['curriculum', r])
    );
  }
  if (wantedScopes.includes('templates')) {
    tasks.push(
      callRpc('match_templates', {
        query_embedding: pgvec, match_count: 8,
        p_subject: subject || null, p_grade: grade || null,
      }).then((r) => ['templates', r])
    );
  }
  if (wantedScopes.includes('my_polls')) {
    const auth = req.headers.get('authorization') || '';
    const userJwt = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (userJwt) {
      tasks.push(
        callRpc('match_my_polls', {
          query_embedding: pgvec, match_count: 8,
        }, { userJwt }).then((r) => ['my_polls', r])
      );
    }
  }

  const settled = await Promise.all(tasks);
  const out = { query, embedding_dim: vec.length };
  for (const [scope, r] of settled) {
    out[scope] = r.error ? [] : r.data;
  }

  return new Response(JSON.stringify(out), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
