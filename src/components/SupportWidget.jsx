import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, CheckCircle, Loader2 } from 'lucide-react';
import { getAuthHeader } from '../lib/authHeader';

// Floating in-app support/feedback button — replaces the footer mailto: link
// (which loses all app context) with a form that reaches api/support-message.js,
// storing the submission alongside the current page and (if logged in) user.
const SupportWidget = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setMessage(''); setEmail(''); setSent(false); setError(''); setLoading(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError('');
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch('/api/support-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          message: message.trim(),
          email: user?.email || email.trim() || undefined,
          pageUrl: window.location.href,
        }),
      });
      if (!res.ok) throw new Error('failed');
      setSent(true);
    } catch {
      setError('Не успеа да се испрати. Обиди се повторно.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[190] w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl shadow-indigo-600/30 flex items-center justify-center transition-all active:scale-95"
        aria-label="Прашање или фидбек"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => { setOpen(false); reset(); }}
                className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm"
              />
              <div className="fixed inset-0 z-[201] flex items-center justify-center p-4" onClick={() => { setOpen(false); reset(); }}>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  role="dialog" aria-modal="true" aria-label="Прашање или фидбек"
                  className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-[2.5rem]" />
                  <button
                    onClick={() => { setOpen(false); reset(); }}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {sent ? (
                    <div className="text-center py-6">
                      <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                      <h4 className="text-xl font-black mb-2">Испратено!</h4>
                      <p className="text-slate-400 font-bold text-sm mb-6">Ќе одговориме што побргу можеме.</p>
                      <button onClick={() => { setOpen(false); reset(); }} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95">
                        Затвори
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-black mb-1">Прашање или фидбек?</h3>
                        <p className="text-slate-400 font-bold text-sm">Пиши ни директно — не треба посебен е-маил клиент.</p>
                      </div>

                      {!user && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Е-маил (по желба)</label>
                          <input
                            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Порака</label>
                        <textarea
                          value={message} onChange={(e) => setMessage(e.target.value)}
                          required rows={5} maxLength={4000}
                          placeholder="Опиши го прашањето или проблемот..."
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>

                      {error && (
                        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold text-sm">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit" disabled={loading || !message.trim()}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Се испраќа...</> : 'Испрати'}
                      </button>
                    </form>
                  )}
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default SupportWidget;
