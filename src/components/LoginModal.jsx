import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle, UserPlus, LogIn } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'magic'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setMagicSent(false);
      setRegistered(false);
      setLoading(false);
      setLoadingMsg('');
      setEmail('');
      setPassword('');
      setName('');
    }
  }, [isOpen]);

  const translateError = (msg) => {
    if (msg?.includes('Invalid login credentials')) return 'Погрешна лозинка или е-маил адреса.';
    if (msg?.includes('Email not confirmed')) return 'Потврдете ја вашата е-маил адреса прво.';
    if (msg?.includes('Too many requests')) return 'Премногу обиди. Обидете се подоцна.';
    if (msg?.includes('User already registered')) return 'Корисникот веќе постои. Обидете се да се најавите.';
    if (msg?.includes('Password should be')) return 'Лозинката мора да биде минимум 6 знаци.';
    if (msg?.includes('over_email_send_rate_limit')) return 'Премногу е-маил обиди. Почекај 60 секунди.';
    return msg || 'Настана грешка. Обидете се повторно.';
  };

  const withSlowWarning = (setMsg) => {
    const t = setTimeout(() => setMsg('Серверот се буди, уште малку...'), 6000);
    return t;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const t = withSlowWarning(setLoadingMsg);
    try {
      await onLogin(email, password, 'password');
      clearTimeout(t);
      onClose();
    } catch (err) {
      clearTimeout(t);
      setError(translateError(err.message));
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Лозинката мора да биде минимум 6 знаци.');
      return;
    }
    setLoading(true);
    setError('');
    const t = withSlowWarning(setLoadingMsg);
    try {
      await onLogin(email, password, 'register', name);
      clearTimeout(t);
      onClose();
    } catch (err) {
      clearTimeout(t);
      setError(translateError(err.message));
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onLogin(email, null, 'magic');
      setMagicSent(true);
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[201] overflow-y-auto py-10" onClick={onClose}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl mx-auto"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-violet-600" />

              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-8">
                <h3 className="text-3xl font-black mb-2">
                  {mode === 'register' ? 'Создај профил' : 'Добредојдовте'}
                </h3>
                <p className="text-slate-400 font-bold">
                  {mode === 'register' ? 'Регистрирај се на MKD Slidea' : 'Најавете се на вашиот MKD Slidea профил'}
                </p>
              </div>

              {/* Tab toggle */}
              <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                    mode === 'login' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
                  }`}
                >
                  <LogIn size={14} /> Најава
                </button>
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                    mode === 'register' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
                  }`}
                >
                  <UserPlus size={14} /> Регистрација
                </button>
                <button
                  onClick={() => { setMode('magic'); setError(''); }}
                  className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                    mode === 'magic' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
                  }`}
                >
                  <Mail size={14} /> Magic
                </button>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold text-sm">
                  {error}
                </div>
              )}

              {/* LOGIN */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Е-маил адреса</label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com" required
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Лозинка</label>
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-4 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (loadingMsg || 'Се најавува...') : 'Најави се'}
                  </button>
                </form>
              )}

              {/* REGISTER */}
              {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Име и презиме</label>
                    <input
                      type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Марко Марковски"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Е-маил адреса</label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com" required
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Лозинка (мин. 6 знаци)</label>
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-4 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (loadingMsg || 'Се регистрира...') : 'Креирај профил'}
                  </button>
                </form>
              )}

              {/* MAGIC LINK */}
              {mode === 'magic' && (
                magicSent ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h4 className="text-xl font-black mb-2">Линкот е испратен!</h4>
                    <p className="text-slate-400 font-bold">
                      Проверете го е-маилот на <span className="text-indigo-600">{email}</span> и кликнете на линкот.
                    </p>
                    <button onClick={onClose} className="mt-6 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors">
                      Затвори
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Е-маил адреса</label>
                      <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com" required
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <p className="text-slate-400 font-bold text-sm px-2">Ќе испратиме линк — без лозинка.</p>
                    <button
                      type="submit" disabled={loading}
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-4 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      <Mail className="w-6 h-6" />
                      {loading ? 'Се испраќа...' : 'Испрати Magic Link'}
                    </button>
                  </form>
                )
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
