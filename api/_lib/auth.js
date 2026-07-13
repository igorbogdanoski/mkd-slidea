// Verifies the caller's Supabase JWT and returns the authenticated user.
// Never trust a client-supplied identity header (e.g. x-user-id) for anything
// that affects entitlement — a client can set arbitrary header values.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function getAuthedUser(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.id ? { id: data.id, email: data.email } : null;
  } catch {
    return null;
  }
}
