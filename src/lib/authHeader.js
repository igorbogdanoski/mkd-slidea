import { supabase } from './supabase';

// Returns an Authorization header carrying the current Supabase session's
// JWT, so API routes can verify identity server-side instead of trusting
// client-supplied headers (e.g. x-user-id).
export async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}
