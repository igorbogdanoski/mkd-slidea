import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Password reset landing page — reached via the email link Supabase sends.
// Supabase embeds an access_token + type=recovery in the URL hash;
// onAuthStateChange fires PASSWORD_RECOVERY before this component does anything.
const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | invalid
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  // Wait for Supabase to exchange the recovery token from the URL hash.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if session already exists (user navigated back after token exchange)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    // Give Supabase up to 8s to process the hash token
    const timeout = setTimeout(() => {
      setSessionReady((prev) => {
        if (!prev) setStatus('invalid');
        return prev;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const validatePassword = (pw) => {
    if (pw.length < 8) return 'Лозинката мора да биде минимум 8 знаци.';
    if (!/[A-Za-z]/.test(pw)) return 'Лозинката мора да содржи барем една буква.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const pwError = validatePassword(password);
    if (pwError) { setErrorMsg(pwError); setStatus('error'); return; }
    if (password !== confirm) { setErrorMsg('Лозинките не се совпаѓаат.'); setStatus('error'); return; }

    setStatus('loading');
    setErrorMsg('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      const msg = error.message?.includes('same password')
        ? 'Новата лозинка мора да биде различна од старата.'
        : error.message?.includes('Auth session missing')
        ? 'Линкот е истечен. Побарај нов линк за ресетирање.'
        : 'Грешка при ресетирање. Обиди се повторно.';
      setErrorMsg(msg);
      setStatus('error');
      return;
    }

    setStatus('success');
    // Navigate to dashboard after 3 seconds
    setTimeout(() => navigate('/dashboard'), 3000);
  };

  // Token never arrived or expired
  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2">Линкот е невалиден</h1>
          <p className="text-slate-500 font-bold mb-6">
            Линкот за ресетирање е истечен или веќе употребен. Побарај нов.
          </p>
          <button
            onClick={() => navigate('/?login=1')}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95"
          >
            Назад кон најава
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl text-center"
        >
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2">Лозинката е сменета!</h1>
          <p className="text-slate-500 font-bold mb-2">
            Успешно ја смени лозинката.
          </p>
          <p className="text-slate-400 font-bold text-sm">
            Ќе те пренасочиме на контролната табла за 3 секунди...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-violet-600" />

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black mb-2">Нова лозинка</h1>
          <p className="text-slate-400 font-bold">
            Внеси нова лозинка за твојот MKD Slidea профил
          </p>
        </div>

        {!sessionReady && (
          <div className="flex items-center justify-center gap-3 py-6 text-slate-400 font-bold">
            <Loader2 className="w-5 h-5 animate-spin" />
            Се верификува линкот...
          </div>
        )}

        {sessionReady && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold text-sm">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                Нова лозинка
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 знаци"
                  required
                  minLength={8}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 pr-14 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPw ? 'Скриј лозинка' : 'Прикажи лозинка'}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                Потврди лозинка
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Внеси ја повторно"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Strength hints */}
            {password.length > 0 && (
              <ul className="text-xs font-bold px-2 space-y-1">
                <li className={password.length >= 8 ? 'text-emerald-500' : 'text-slate-300'}>
                  ✓ Минимум 8 знаци
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-emerald-500' : 'text-slate-300'}>
                  ✓ Барем едно големо слово
                </li>
                <li className={/[0-9]/.test(password) ? 'text-emerald-500' : 'text-slate-300'}>
                  ✓ Барем еден број
                </li>
              </ul>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Се зачувува...
                </>
              ) : (
                'Зачувај нова лозинка'
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
