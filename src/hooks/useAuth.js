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

  useEffect(() => {
    // Load initial session with timeout fallback (handles Tracking Prevention blocking storage)
    const timeout = setTimeout(() => setLoading(false), 3000);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(buildUserProfile(session.user, profile));
      }
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
    const signInPromise = supabase.auth.signInWithPassword({ email, password });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Врската е бавна. Обидете се повторно.')), 8000)
    );
    const { error } = await Promise.race([signInPromise, timeoutPromise]);
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
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('mkd_slidea_user_data');
  };

  return { user, loading, signIn, signInWithMagicLink, signOut };
};
