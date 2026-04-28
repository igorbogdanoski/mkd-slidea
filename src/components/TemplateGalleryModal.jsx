import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles, Plus, BookOpen } from 'lucide-react';
import { STARTER_TEMPLATES, TEMPLATE_SUBJECTS } from '../lib/starterTemplates';

export default function TemplateGalleryModal({ isOpen, onClose, onApply }) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('Сите');

  const filtered = useMemo(() => {
    return STARTER_TEMPLATES.filter((t) => {
      const matchesSubject = subject === 'Сите' || t.subject === subject;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q
        || t.title.toLowerCase().includes(q)
        || t.description.toLowerCase().includes(q)
        || t.subject.toLowerCase().includes(q);
      return matchesSubject && matchesQuery;
    });
  }, [query, subject]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[2rem] shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Шаблон библиотека</h2>
                <p className="text-slate-400 font-bold text-sm">{STARTER_TEMPLATES.length} готови активности — еден клик и почнуваш</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Затвори"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Filters */}
          <div className="px-8 py-4 border-b border-slate-100 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Пребарај шаблон..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 md:pb-0">
              {TEMPLATE_SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`px-4 py-2 rounded-xl font-black text-sm whitespace-nowrap transition-all ${
                    subject === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-8">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold">
                Нема резултати за вашата претрага.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((t) => (
                  <motion.button
                    key={t.id}
                    onClick={() => onApply(t)}
                    whileHover={{ y: -4 }}
                    className="group text-left bg-white border-2 border-slate-100 rounded-3xl overflow-hidden hover:border-indigo-300 hover:shadow-xl transition-all"
                  >
                    <div className={`bg-gradient-to-br ${t.color} p-6 text-white`}>
                      <div className="text-4xl mb-3">{t.icon}</div>
                      <div className="text-xs font-black uppercase tracking-wider opacity-80 mb-1">
                        {t.subject} · {t.grade}
                      </div>
                      <h3 className="text-lg font-black leading-tight">{t.title}</h3>
                    </div>
                    <div className="p-5">
                      <p className="text-slate-500 font-bold text-sm mb-4 line-clamp-2">
                        {t.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400">
                          {t.polls.length} активности
                        </span>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                          Користи
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-slate-500 font-bold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Сакаш AI генериран? Користи „AI ⚡" во главното мени.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-sm transition-colors"
            >
              Затвори
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
