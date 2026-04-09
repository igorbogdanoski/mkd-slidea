import { useState, useEffect } from 'react';
import { supabase, warmUp, authGetSessionSafe } from '../lib/supabase';

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
  };
};

export const useAuth = ({ enabled = true } = {}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Се поврзуваме...');

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setUser(null);
      return;
    }

    // Max 25s spinner then render anyway (Edge Tracking Prevention / cold start)
    const slowMsg = setTimeout(() => setLoadingMessage('Серверот се буди, момент...'), 5000);
    const timeout = setTimeout(() => setLoading(false), 25000);

    warmUp().catch(() => {});

    authGetSessionSafe().then(async ({ data: { session } }) => {
      clearTimeout(slowMsg);
      clearTimeout(timeout);
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(buildUserProfile(session.user, profile));
      }
      setLoading(false);
    }).catch(() => {
      clearTimeout(slowMsg);
      clearTimeout(timeout);
      setLoading(false);
    });

    // Auth state changes (SIGNED_IN fires after signInWithPassword resolves)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(buildUserProfile(session.user, profile));
        } else {
          setUser(null);
        }
      } catch {
        setUser(session?.user ? buildUserProfile(session.user, null) : null);
      }
    });

    return () => subscription.unsubscribe();
  }, [enabled]);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('name, role, plan')
      .eq('id', userId)
      .single();
    return data;
  };

  // No artificial timeout — let Supabase handle its own (~60s).
  // onAuthStateChange will fire SIGNED_IN when it succeeds.
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email, password, name = '') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || email.split('@')[0] } },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async (redirectPath = '/dashboard') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + redirectPath },
    });
    if (error) throw error;
  };

  const signInWithMagicLink = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('mkd_slidea_user_data');
    try {
      await supabase.auth.signOut();
    } catch {
      // Keep local sign-out state even if remote sign-out races with another tab/request.
    }
  };

  return { user, loading, loadingMessage, signIn, signUp, signInWithGoogle, signInWithMagicLink, signOut };
};
