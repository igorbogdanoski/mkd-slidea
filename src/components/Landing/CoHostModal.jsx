import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// ─── Co-host modal: access-code login via SECURITY DEFINER RPC ────────────────
const CoHostModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [coHostCode, setCoHostCode] = useState('');
  const [coHostError, setCoHostError] = useState('');
  const [coHostLoading, setCoHostLoading] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" onClick={onClose}>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl z-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-[2rem]" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-3 rounded-2xl">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Ко-домаќин</h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">Внесете го кодот за пристап</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setCoHostError('');
                setCoHostLoading(true);
                // SECURITY: cohost_code column is no longer readable by anon.
                // Use SECURITY DEFINER RPC that returns only the matched event.
                const { data, error } = await supabase
                  .rpc('find_event_by_cohost_code', { p_code: coHostCode.trim().toUpperCase() });
                setCoHostLoading(false);
                const match = Array.isArray(data) && data.length > 0 ? data[0] : null;
                if (error || !match) {
                  setCoHostError('Погрешен код. Проверете го кодот кај домаќинот.');
                  return;
                }
                localStorage.setItem('active_event_code', match.code);
                navigate('/host');
              }}
              className="space-y-4"
            >
              <input
                autoFocus
                type="text"
                value={coHostCode}
                onChange={e => { setCoHostCode(e.target.value.toUpperCase()); setCoHostError(''); }}
                placeholder="Ко-домаќин код..."
                maxLength={10}
                className={`w-full border-2 rounded-2xl px-5 py-4 font-black text-slate-900 text-lg tracking-widest outline-none transition-all ${coHostError ? 'border-red-400 bg-red-50' : 'border-slate-100 focus:border-indigo-500'}`}
              />
              {coHostError && (
                <p className="text-red-500 font-black text-sm">{coHostError}</p>
              )}
              <button
                type="submit"
                disabled={coHostLoading || coHostCode.length < 6}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg shadow-indigo-100 disabled:shadow-none"
              >
                {coHostLoading ? 'Се проверува...' : 'Влези како Ко-домаќин'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CoHostModal;
