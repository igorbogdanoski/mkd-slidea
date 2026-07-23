import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── Join-code entry: PIN input with live validation ──────────────────────────
const JoinCodeEntry = ({ code, setCode, setView }) => {
  const [codeStatus, setCodeStatus] = useState('idle'); // idle | checking | valid | locked | invalid
  const validationTimer = useRef(null);

  const handleCodeChange = (val) => {
    const cleaned = val.replace(/^#/, '').toUpperCase().trim();
    setCode(cleaned);
    setCodeStatus('idle');
    clearTimeout(validationTimer.current);
    if (cleaned.length >= 5) {
      setCodeStatus('checking');
      validationTimer.current = setTimeout(async () => {
        const { data } = await supabase
          .from('events')
          .select('id, is_locked')
          .ilike('code', cleaned)
          .limit(1);
        if (data?.length > 0) {
          setCodeStatus(data[0].is_locked ? 'locked' : 'valid');
        } else {
          setCodeStatus('invalid');
        }
      }, 500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-indigo-600 to-violet-600 p-5 rounded-[2rem] shadow-2xl shadow-indigo-200"
    >
      <p className="text-white/70 font-black text-xs uppercase tracking-widest mb-3 pl-1">
        Имаш код за настан? Приклучи се веднаш →
      </p>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            maxLength={7}
            placeholder="Внеси код..."
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && codeStatus === 'valid' && setView('join')}
            className="w-full bg-white/15 backdrop-blur-md border-2 border-white/20 rounded-xl px-5 py-4 text-white font-black text-lg placeholder:text-white/40 focus:bg-white/25 focus:border-white/40 outline-none transition-all tracking-widest"
            autoComplete="off"
          />
          {/* Validation indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {codeStatus === 'checking' && (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {codeStatus === 'valid' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            )}
            {codeStatus === 'invalid' && (
              <X className="w-5 h-5 text-red-300" />
            )}
            {codeStatus === 'locked' && (
              <span className="text-amber-300 text-xs font-black">ПАУЗИРАН</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setView('join')}
          disabled={code.length < 3}
          className={`px-7 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${
            codeStatus === 'valid'
              ? 'bg-emerald-400 text-emerald-900 shadow-lg shadow-emerald-500/30 scale-105'
              : 'bg-white text-indigo-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          Влези
        </button>
      </div>
      {codeStatus === 'valid' && (
        <p className="text-emerald-300 font-black text-xs mt-2 pl-1">✓ Сесијата е активна — притисни Влези или Enter</p>
      )}
      {codeStatus === 'invalid' && code.length >= 5 && (
        <p className="text-red-300 font-black text-xs mt-2 pl-1">Кодот не постои. Провери го со презентерот.</p>
      )}
      {codeStatus === 'locked' && (
        <p className="text-amber-300 font-black text-xs mt-2 pl-1">Сесијата е паузирана. Почекај инструкции.</p>
      )}
    </motion.div>
  );
};

export default JoinCodeEntry;
