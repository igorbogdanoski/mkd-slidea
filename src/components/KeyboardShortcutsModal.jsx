import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const SHORTCUTS = [
  { keys: ['?'], desc: 'Прикажи / сокриј помош за кратенки' },
  { keys: ['→'], desc: 'Следна активност (Presenter)' },
  { keys: ['←'], desc: 'Претходна активност (Presenter)' },
  { keys: ['Space'], desc: 'Следна активност (алтернатива)' },
  { keys: ['F'], desc: 'Fullscreen режим (Presenter)' },
  { keys: ['Esc'], desc: 'Излез од fullscreen / затвори modal' },
  { keys: ['T'], desc: 'Отвори Шаблон библиотека (Host)' },
  { keys: ['A'], desc: 'AI генерација на активност (Host)' },
  { keys: ['Q'], desc: 'Креирај нов квиз (Host)' },
  { keys: ['P'], desc: 'Креирај нова анкета (Host)' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  const trapRef = useFocusTrap(isOpen, { onEscape: onClose });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 id="shortcuts-title" className="text-xl font-black text-slate-900">Кратенки</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl" aria-label="Затвори">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-2 max-h-[70vh] overflow-y-auto">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0">
                  <span className="text-slate-600 font-bold text-sm">{s.desc}</span>
                  <div className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg font-black text-xs text-slate-700 min-w-[2rem] text-center"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
