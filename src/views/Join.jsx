import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const Join = ({ code, setCode, handleJoin, setView }) => {
  return (
    <motion.div
      key="join"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-lg mx-auto px-6 pt-32 text-center"
    >
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
        
        <h2 className="text-3xl font-black mb-2">Приклучи се</h2>
        <p className="text-slate-500 mb-8">Внеси го кодот за да започнеш со интеракција</p>
        
        <form onSubmit={handleJoin} className="space-y-6">
          <div className="relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-3xl transition-colors group-focus-within:text-indigo-600">#</span>
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full pl-14 pr-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-4xl font-black tracking-[0.4em] focus:border-indigo-600 focus:bg-white focus:outline-none transition-all text-center uppercase placeholder:text-slate-200"
            />
          </div>
          <button
            disabled={code.length !== 6}
            className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-200 active:scale-[0.98]"
          >
            Влези <ArrowRight className="w-6 h-6" />
          </button>
        </form>
      </div>
      
      <button 
        onClick={() => setView('landing')}
        className="mt-8 text-slate-400 font-bold hover:text-indigo-600 transition-colors"
      >
        Откажи и врати се назад
      </button>
    </motion.div>
  );
};

export default Join;
