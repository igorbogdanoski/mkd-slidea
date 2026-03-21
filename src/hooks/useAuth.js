import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_EMAILS = [
  'igor@slidea.mk',
  'admin@slidea.mk',
  'igorbogdanoski@gmail.com',
  'bogdanoskiigor@gmail.com',
  'igor@mismath.net',
];

const buildUserProfile = (supabaseUser, profile = null) => {
  if (!supabaseUser) return null;
  const email = supabaseUser.email?.toLowerCase() || '';
  const isAdmin = ADMIN_EMAILS.includes(email);
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: profile?.name || supabaseUser.user_metadata?.name || (isAdmin ? 'Игор Богданоски' : 'Корисник'),
    role: profile?.role || (isAdmin ? 'admin' : 'user'),
    plan: profile?.plan || (isAdmin ? 'pro' : 'basic'),
  };
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Се поврзуваме...');

  useEffect(() => {
    // Load initial session — no aggressive timeout so auth service can warm up
    // Edge Tracking Prevention case: promise may never resolve, so we use 25s max
    const slowMsg = setTimeout(() => setLoadingMessage('Серверот се буди, момент...'), 5000);
    const timeout = setTimeout(() => { setLoading(false); }, 25000);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(buildUserProfile(session.user, profile));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('name, role, plan')
      .eq('id', userId)
      .single();
    return data;
  };

  const signIn = async (email, password) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), 12000);
    });
    try {
      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeoutPromise,
      ]);
      clearTimeout(timeoutId);
      if (result?.error) throw result.error;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  const signUp = async (email, password, name = '') => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), 12000);
    });
    try {
      const result = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name || email.split('@')[0] } },
        }),
        timeoutPromise,
      ]);
      clearTimeout(timeoutId);
      if (result?.error) throw result.error;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  const signInWithMagicLink = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('mkd_slidea_user_data');
    supabase.auth.signOut(); // fire and forget
  };

  return { user, loading, loadingMessage, signIn, signUp, signInWithMagicLink, signOut };
};
