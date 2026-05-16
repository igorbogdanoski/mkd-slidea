// ============================================================================
// ФАЗА 8.1.3 — Embedding backfill batch (cron-secured Edge function)
// ----------------------------------------------------------------------------
// Цел: повремено embed-ира `community_templates` и `polls` без `embedding`
//       (по batch од 20). Curriculum chunks се seed-ираат еднаш ad-hoc.
//
// Trigger: Vercel Cron (vercel.json) или manual:
//   curl -H "Authorization: Bearer $EMBED_BATCH_SECRET" https://app/api/embed-batch
//
// Cost: 0€ (free embedding tier; 1500 RPM).
// ============================================================================

import { embedBatch, toPgVector, EMBEDDING_DIM } from './_lib/embeddings.js';

export const config = { runtime: 'edge' };

const BATCH_SIZE = 20;

function authorized(req) {
  const expected = process.env.EMBED_BATCH_SECRET;
  if (!expected) return true; // ако не е поставен, дозволи (dev)
  const auth = req.headers.get('authorization') || '';
  return auth === `Bearer ${expected}`;
}

async function supabaseQuery(path, init = {}) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env not configured');
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─────────────────────────────────────────────────────────────────
// Source readers
// ─────────────────────────────────────────────────────────────────

async function fetchPendingTemplates(limit) {
  // Select only guaranteed columns; subject/grade/curriculum_tags may not exist yet
  const select = 'id,title,description';
  const data = await supabaseQuery(
    `/rest/v1/community_templates?select=${encodeURIComponent(select)}&embedding=is.null&limit=${limit}`
  );
  return Array.isArray(data) ? data : [];
}

async function fetchPendingPolls(limit) {
  const select = 'id,question,type,curriculum_tags';
  const data = await supabaseQuery(
    `/rest/v1/polls?select=${encodeURIComponent(select)}&embedding=is.null&limit=${limit}`
  );
  return Array.isArray(data) ? data : [];
}

async function fetchPendingCurriculum(limit) {
  const select = 'id,track,grade,subject,topic,subtopic,text,tags';
  const data = await supabaseQuery(
    `/rest/v1/curriculum_chunks?select=${encodeURIComponent(select)}&embedding=is.null&limit=${limit}`
  );
  return Array.isArray(data) ? data : [];
}

// ─────────────────────────────────────────────────────────────────
// Text builders (што точно се embed-ира)
// ─────────────────────────────────────────────────────────────────

function templateText(t) {
  return [
    t.title,
    t.description,
    t.subject ? `Предмет: ${t.subject}` : '',
    t.grade ? `Одделение: ${t.grade}` : '',
    Array.isArray(t.curriculum_tags) && t.curriculum_tags.length
      ? `Тагови: ${t.curriculum_tags.join(', ')}`
      : '',
  ].filter(Boolean).join('. ');
}

function pollText(p) {
  return [
    p.question,
    p.type ? `Тип: ${p.type}` : '',
    Array.isArray(p.curriculum_tags) && p.curriculum_tags.length
      ? `Тагови: ${p.curriculum_tags.join(', ')}`
      : '',
  ].filter(Boolean).join('. ');
}

function curriculumText(c) {
  return [
    c.subject,
    c.grade,
    c.topic,
    c.subtopic,
    c.text,
    Array.isArray(c.tags) && c.tags.length ? c.tags.join(', ') : '',
  ].filter(Boolean).join(' · ');
}

// ─────────────────────────────────────────────────────────────────
// Update writer (PATCH со pgvector text)
// ─────────────────────────────────────────────────────────────────

async function patchEmbedding(table, id, vec) {
  const pgvec = toPgVector(vec);
  if (!pgvec) return false;
  await supabaseQuery(
    `/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ embedding: pgvec }),
    }
  );
  return true;
}

async function processBatch(rows, table, textBuilder, taskType) {
  if (!rows.length) return { processed: 0, failed: 0 };
  const texts = rows.map(textBuilder);
  const vecs = await embedBatch(texts, { taskType, concurrency: 4 });
  let processed = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i++) {
    if (!vecs[i]) { failed++; continue; }
    try {
      await patchEmbedding(table, rows[i].id, vecs[i]);
      processed++;
    } catch (err) {
      console.error(`[embed-batch] PATCH ${table} ${rows[i].id} failed:`, err?.message);
      failed++;
    }
  }
  return { processed, failed };
}

// ─────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────

export default async function handler(req) {
  if (!authorized(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const startedAt = Date.now();
  const summary = { dim: EMBEDDING_DIM, templates: null, polls: null, curriculum: null };

  try {
    const [templates, polls, curriculum] = await Promise.all([
      fetchPendingTemplates(BATCH_SIZE),
      fetchPendingPolls(BATCH_SIZE),
      fetchPendingCurriculum(BATCH_SIZE),
    ]);

    summary.templates = await processBatch(
      templates, 'community_templates', templateText, 'RETRIEVAL_DOCUMENT'
    );
    summary.polls = await processBatch(
      polls, 'polls', pollText, 'RETRIEVAL_DOCUMENT'
    );
    summary.curriculum = await processBatch(
      curriculum, 'curriculum_chunks', curriculumText, 'RETRIEVAL_DOCUMENT'
    );

    summary.elapsedMs = Date.now() - startedAt;
    return new Response(JSON.stringify({ ok: true, ...summary }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[embed-batch] fatal:', err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || 'unknown', summary }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
