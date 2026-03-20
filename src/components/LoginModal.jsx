import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Github, Chrome, Zap } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
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
            className="relative bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-10">
              <h3 className="text-3xl font-black mb-2">Добредојдовте</h3>
              <p className="text-slate-400 font-bold">Најавете се на вашиот MKD Slidea профил</p>
              <div className="mt-2 text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] italic">
                Професионален систем за интеракција © 2026
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <button className="w-full flex items-center justify-center gap-3 py-4 border-2 border-slate-100 rounded-2xl font-black hover:bg-slate-50 transition-all active:scale-95">
                <Chrome className="w-5 h-5 text-indigo-600" /> Најави се со Google
              </button>
              <div className="relative flex items-center justify-center py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <span className="relative px-4 bg-white text-[10px] font-black text-slate-300 uppercase tracking-widest">Или со емаил</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Емаил адреса</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Лозинка</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-4 active:scale-95"
              >
                Најави се
              </button>
              
              <div className="pt-4 border-t border-slate-100 mt-6">
                <button 
                  type="button"
                  onClick={() => { setEmail('igor@slidea.mk'); setPassword('admin123'); }}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={14} className="fill-indigo-400 text-indigo-400" /> Админ Најава (Игор)
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm font-bold text-slate-400">
              Немате профил? <button className="text-indigo-600 hover:underline">Креирај профил</button>
            </p>
            <button 
              onClick={onClose}
              className="mt-6 w-full text-center text-[10px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-all"
            >
              Откажи и затвори
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
