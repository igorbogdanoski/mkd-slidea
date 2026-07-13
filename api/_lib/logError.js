// Shared server-side error logger — writes to public.error_log via service
// role. Best-effort only: a logging failure must never break the caller's
// actual request, so every call is wrapped and swallows its own errors.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function logServerError(source, error, context = {}) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
    await fetch(`${SUPABASE_URL}/rest/v1/error_log`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        source: 'server',
        message: String(error?.message || error || 'Unknown error').slice(0, 2000),
        stack: String(error?.stack || '').slice(0, 4000) || null,
        url: context.route || source,
        context,
      }),
    });
  } catch {
    // never let logging failures affect the caller
  }
}
