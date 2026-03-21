import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('password'); // 'password' | 'magic'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicSent, setMagicSent] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setMagicSent(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await onLogin(email, password);
      onClose();
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email) return;
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

  const translateError = (msg) => {
    if (msg?.includes('Invalid login credentials')) return 'Погрешна лозинка или е-маил адреса.';
    if (msg?.includes('Email not confirmed')) return 'Потврдете ја вашата е-маил адреса прво.';
    if (msg?.includes('Too many requests')) return 'Премногу обиди. Обидете се подоцна.';
    return 'Настана грешка. Обидете се повторно.';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl overflow-hidden my-auto"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-violet-600" />

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <h3 className="text-3xl font-black mb-2">Добредојдовте</h3>
              <p className="text-slate-400 font-bold">Најавете се на вашиот MKD Slidea профил</p>
            </div>

            {magicSent ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h4 className="text-xl font-black mb-2">Линкот е испратен!</h4>
                <p className="text-slate-400 font-bold">
                  Проверете го вашиот е-маил на{' '}
                  <span className="text-indigo-600">{email}</span>{' '}
                  и кликнете на линкот за најава.
                </p>
                <button
                  onClick={onClose}
                  className="mt-8 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Затвори
                </button>
              </div>
            ) : (
              <>
                {/* Mode toggle */}
                <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
                  <button
                    onClick={() => setMode('password')}
                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                      mode === 'password' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    Лозинка
                  </button>
                  <button
                    onClick={() => setMode('magic')}
                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                      mode === 'magic' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    Magic Link
                  </button>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold text-sm">
                    {error}
                  </div>
                )}

                {mode === 'password' ? (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                        Е-маил адреса
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                        Лозинка
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-4 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Се најавува...' : 'Најави се'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                        Е-маил адреса
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <p className="text-slate-400 font-bold text-sm px-2">
                      Ќе испратиме линк на вашата е-маил адреса. Нема потреба од лозинка.
                    </p>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-4 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      <Mail className="w-6 h-6" />
                      {loading ? 'Се испраќа...' : 'Испрати Magic Link'}
                    </button>
                  </form>
                )}

                <p className="mt-8 text-center text-sm font-bold text-slate-400">
                  Немате профил?{' '}
                  <button
                    onClick={() => setMode('magic')}
                    className="text-indigo-600 hover:underline"
                  >
                    Регистрирај се со Magic Link
                  </button>
                </p>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
