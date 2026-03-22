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
    // Admin emails always get admin role/plan regardless of DB value
    role: isAdmin ? 'admin' : (profile?.role || 'user'),
    plan: isAdmin ? 'admin' : (profile?.plan || 'free'),
  };
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Се поврзуваме...');

  useEffect(() => {
    // Max 25s spinner then render anyway (Edge Tracking Prevention / cold start)
    const slowMsg = setTimeout(() => setLoadingMessage('Серверот се буди, момент...'), 5000);
    const timeout = setTimeout(() => setLoading(false), 25000);

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

    // Auth state changes (SIGNED_IN fires after signInWithPassword resolves)
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
