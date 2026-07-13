import { useState, useEffect, useRef } from 'react';
import { track } from '@vercel/analytics';
import { supabase, warmUp, authGetSessionSafe } from '../lib/supabase';
import { debugWarn, recordLoginLatency } from '../utils/observability';

// SECURITY: Admin role comes exclusively from the DB profiles table.
// To grant admin: UPDATE profiles SET role='admin', plan='admin' WHERE email='your@email.com';
// Never put admin emails in client-side code — visible in browser DevTools.

const buildUserProfile = (supabaseUser, profile = null) => {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: profile?.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Корисник',
    role: profile?.role || 'user',
    plan: profile?.plan || 'free',
    pro_until: profile?.pro_until || null,
  };
};

const claimPendingReferral = async (currentUserId) => {
  if (!currentUserId) return;
  let referrer = null;
  try { referrer = localStorage.getItem('mkd_referrer'); } catch { /* ignore */ }
  if (!referrer || referrer === currentUserId) return;
  try {
    const { error } = await supabase.rpc('claim_referral', { p_referrer: referrer });
    if (!error) {
      try {
        localStorage.removeItem('mkd_referrer');
        localStorage.removeItem('mkd_referrer_ts');
      } catch { /* ignore */ }
    }
  } catch { /* non-blocking */ }
};

export const useAuth = ({ enabled = true } = {}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Се поврзуваме...');
  // Monotonic request counter so an out-of-order (slow) profile fetch from an
  // earlier auth event can't clobber state set by a later, faster one.
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setUser(null);
      return;
    }

    // Max 25s spinner then render anyway (Edge Tracking Prevention / cold start)
    const slowMsg = setTimeout(() => setLoadingMessage('Серверот се буди, момент...'), 9000);
    const timeout = setTimeout(() => setLoading(false), 25000);

    warmUp().catch(() => {});
    // Fire-and-forget: triggers token refresh if needed, but does NOT control loading state.
    // INITIAL_SESSION below is the authoritative source — it reads localStorage directly
    // without Web Locks, so it's reliable even under lock contention.
    authGetSessionSafe().catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const myRequestId = ++requestIdRef.current;
      const isCurrent = () => myRequestId === requestIdRef.current;
      try {
        if (event === 'INITIAL_SESSION') {
          // Supabase always fires this once on startup — the definitive session answer.
          clearTimeout(slowMsg);
          clearTimeout(timeout);
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            if (isCurrent()) setUser(buildUserProfile(session.user, profile));
          }
          setLoading(false);
          return;
        }

        if (session?.user) {
          if (event === 'SIGNED_IN') {
            // Best-effort referral claim — needs auth.uid() so must run after sign-in.
            claimPendingReferral(session.user.id);
          }
          const profile = await fetchProfile(session.user.id);
          if (isCurrent()) setUser(buildUserProfile(session.user, profile));
        } else if (isCurrent()) {
          setUser(null);
        }
      } catch {
        if (isCurrent()) setUser(session?.user ? buildUserProfile(session.user, null) : null);
        if (event === 'INITIAL_SESSION') {
          clearTimeout(slowMsg);
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    });

    return () => {
      clearTimeout(slowMsg);
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [enabled]);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('name, role, plan, pro_until')
      .eq('id', userId)
      .single();
    return data;
  };

  // No artificial timeout — let Supabase handle its own (~60s).
  // onAuthStateChange will fire SIGNED_IN when it succeeds.
  const signIn = async (email, password) => {
    const startedAt = performance.now();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      recordLoginLatency({ method: 'password', action: 'signIn', durationMs: performance.now() - startedAt, ok: false, reason: error.message });
      throw error;
    }
    recordLoginLatency({ method: 'password', action: 'signIn', durationMs: performance.now() - startedAt, ok: true });
  };

  const signUp = async (email, password, name = '') => {
    const startedAt = performance.now();
    const finalName = name || email.split('@')[0];
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: finalName } },
    });
    if (error) {
      recordLoginLatency({ method: 'password', action: 'signUp', durationMs: performance.now() - startedAt, ok: false, reason: error.message });
      throw error;
    }
    recordLoginLatency({ method: 'password', action: 'signUp', durationMs: performance.now() - startedAt, ok: true });
    track('signup', { method: 'password' });
    // Sprint 1.5 — fire-and-forget welcome email (graceful degrade if not configured).
    try {
      fetch('/api/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: finalName }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* non-blocking */ }
    // Returns true if Supabase auto-confirmed (no email verification required).
    // Returns false if email confirmation email was sent — caller should NOT navigate.
    return !!data?.session;
  };

  const signInWithGoogle = async (redirectPath = '/dashboard') => {
    const startedAt = performance.now();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + redirectPath },
    });
    if (error) {
      recordLoginLatency({ method: 'google', action: 'oauth_start', durationMs: performance.now() - startedAt, ok: false, reason: error.message });
      throw error;
    }
    recordLoginLatency({ method: 'google', action: 'oauth_start', durationMs: performance.now() - startedAt, ok: true });
  };

  const signInWithMagicLink = async (email) => {
    const startedAt = performance.now();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      recordLoginLatency({ method: 'magic', action: 'otp', durationMs: performance.now() - startedAt, ok: false, reason: error.message });
      throw error;
    }
    recordLoginLatency({ method: 'magic', action: 'otp', durationMs: performance.now() - startedAt, ok: true });
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('mkd_slidea_user_data');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      debugWarn('signOut failed (non-blocking)', err?.message || err);
      // Keep local sign-out state even if remote sign-out races with another tab/request.
    }
  };

  // Sends a password-reset email. redirectTo must be the /reset-password page URL.
  const requestPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  // Called on the /reset-password page after the user clicks the email link.
  // Supabase sets the session automatically from the URL hash; this just updates the password.
  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  return { user, loading, loadingMessage, signIn, signUp, signInWithGoogle, signInWithMagicLink, signOut, requestPasswordReset, updatePassword };
};
