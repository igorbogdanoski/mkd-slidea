// Sprint 5.6 — Open API helpers.
// Validates Bearer API key against Supabase, returns owner context.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders,
      ...extra,
    },
  });

async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const bytes = Array.from(new Uint8Array(hash));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Service-role REST helper.
async function rpc(supabaseUrl, serviceKey, fn, params) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params || {}),
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

async function rest(supabaseUrl, serviceKey, path) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

// Returns { ownerId, keyId, scopes } or null.
export async function authenticate(req) {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(mks_[A-Za-z0-9]{20,})$/);
  if (!m) return null;
  const plain = m[1];
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  const hash = await sha256Hex(plain);
  const rows = await rpc(supabaseUrl, serviceKey, 'resolve_api_key', { p_hash: hash });
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null;
  const row = rows[0];
  // Best-effort audit (don't await).
  rpc(supabaseUrl, serviceKey, 'touch_api_key', { p_id: row.key_id }).catch(() => {});
  return {
    ownerId: row.owner_id,
    keyId: row.key_id,
    scopes: Array.isArray(row.scopes) ? row.scopes : [],
    supabaseUrl,
    serviceKey,
    rest: (path) => rest(supabaseUrl, serviceKey, path),
  };
}

export function preflight(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return null;
}

export { json, corsHeaders };
