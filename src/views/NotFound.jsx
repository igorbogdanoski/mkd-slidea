import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  useSEO({
    title: '404 — Страницата не е пронајдена | MKD Slidea',
    description: 'Страницата што ја барате не постои.',
    noindex: true,
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="text-8xl mb-6"
        >
          🔍
        </motion.div>

        <h1 className="text-7xl font-black text-slate-900 mb-2">404</h1>
        <h2 className="text-2xl font-black text-slate-700 mb-4">Страницата не е пронајдена</h2>
        <p className="text-slate-400 font-bold mb-10 leading-relaxed">
          Линкот кој го следевте можеби е стар, избришан или никогаш не постоел.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black hover:border-indigo-400 hover:text-indigo-600 transition-all"
          >
            <ArrowLeft size={18} /> Назад
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Home size={18} /> Почетна
          </button>
        </div>

        <div className="mt-12 bg-white rounded-[2rem] border border-slate-100 p-6">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Можеби барате...</p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Приклучи се на настан', path: '/join' },
              { label: 'Создај презентација', path: '/host' },
              { label: 'Ценовник', path: '/pricing' },
              { label: 'Шаблони', path: '/templates' },
            ].map((l) => (
              <button
                key={l.path}
                onClick={() => navigate(l.path)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-indigo-50 text-indigo-600 font-bold text-sm transition-colors text-left"
              >
                <Search size={14} /> {l.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
