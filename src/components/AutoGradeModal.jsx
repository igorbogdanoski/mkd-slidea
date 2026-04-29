import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle, Circle, HelpCircle, Download } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const SIGNAL_META = {
  correct:   { label: 'Точно',     cls: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 },
  partial:   { label: 'Делумно',   cls: 'bg-amber-100 text-amber-700',     Icon: AlertCircle },
  incorrect: { label: 'Погрешно',  cls: 'bg-rose-100 text-rose-700',       Icon: Circle },
  offtopic:  { label: 'Вон тема',  cls: 'bg-slate-200 text-slate-600',     Icon: HelpCircle },
};

const buildAnswers = (poll) =>
  (poll?.options || [])
    .filter((o) => o?.text && o.is_approved !== false)
    .map((o) => ({ id: String(o.id), text: o.text, votes: o.votes || 0 }));

const exportCsv = (poll, results) => {
  const map = new Map(results.map((r) => [r.id, r]));
  const rows = [['#', 'Одговор', 'Гласови', 'Оценка', 'Макс', 'Сигнал', 'Фидбек']];
  buildAnswers(poll).forEach((a, idx) => {
    const r = map.get(a.id);
    rows.push([
      String(idx + 1),
      a.text.replace(/"/g, '""'),
      String(a.votes),
      r ? String(r.score) : '',
      r ? String(r.max) : '',
      r ? (SIGNAL_META[r.signal]?.label || r.signal) : '',
      r ? r.feedback.replace(/"/g, '""') : '',
    ]);
  });
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grade-${(poll?.question || 'poll').slice(0, 40)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const AutoGradeModal = ({ isOpen, onClose, poll }) => {
  const [rubric, setRubric] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [summary, setSummary] = useState(null);

  const answers = useMemo(() => buildAnswers(poll), [poll]);
  const trapRef = useFocusTrap(isOpen, { onEscape: onClose });

  useEffect(() => {
    if (!isOpen) {
      setResults(null);
      setSummary(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const run = async () => {
    if (!poll || answers.length === 0) {
      setError('Нема одговори за оценување.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: poll.question || '',
          rubric,
          maxScore: Number(maxScore) || 10,
          answers: answers.map((a) => ({ id: a.id, text: a.text })),
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Грешка при оценување.');
      }
      const data = await res.json();
      setResults(data.results || []);
      setSummary(data.summary || null);
    } catch (e) {
      setError(e.message || 'Неуспешно оценување.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const resultMap = new Map((results || []).map((r) => [r.id, r]));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auto-grade-title"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 max-w-3xl w-full shadow-2xl max-h-[92vh] overflow-y-auto my-auto"
        >
          <button
            onClick={onClose}
            aria-label="Затвори"
            className="sticky top-0 float-right -mt-2 -mr-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl z-10 bg-white"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="bg-violet-600 p-3 rounded-2xl shadow-lg shadow-violet-100">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <div>
              <h3 id="auto-grade-title" className="text-2xl font-black text-slate-900">AI Авто-оценување</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Отворени одговори · Gemini</p>
            </div>
          </div>

          <p className="text-sm font-bold text-slate-500 mt-3 mb-5">
            Прашање: <span className="text-slate-900">„{poll?.question || ''}"</span>
            <span className="ml-2 text-slate-400">· {answers.length} одговори</span>
          </p>

          {!results && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">Рубрика (опционално)</label>
                <textarea
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                  placeholder="Пр: 0-3 поени за релевантност, 4-7 за точност, 8-10 за длабочина и пример..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold focus:border-violet-600 focus:bg-white outline-none transition-all min-h-[90px] resize-none text-sm"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm font-black text-slate-700">Макс. поени</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  className="w-24 bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-2 font-black text-center focus:border-violet-600 focus:bg-white outline-none"
                />
                <p className="text-xs font-bold text-slate-400">по одговор</p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 font-bold text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={run}
                disabled={loading || answers.length === 0}
                className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-violet-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> AI оценува...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Оцени со AI
                  </>
                )}
              </button>
            </div>
          )}

          {results && (
            <div className="space-y-5">
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Просек</p>
                    <p className="text-2xl font-black text-slate-900">
                      {summary.averageScore}<span className="text-slate-400 text-sm">/{summary.maxScore}</span>
                    </p>
                    <p className="text-xs font-bold text-slate-500">{summary.averagePct}%</p>
                  </div>
                  {['correct', 'partial', 'incorrect', 'offtopic'].map((sig) => {
                    const meta = SIGNAL_META[sig];
                    return (
                      <div key={sig} className={`p-3 rounded-2xl ${meta.cls.replace('text-', 'border-').replace('bg-', 'bg-')} border`}>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{meta.label}</p>
                        <p className="text-2xl font-black">{summary.breakdown?.[sig] || 0}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {answers.map((a, idx) => {
                  const r = resultMap.get(a.id);
                  const meta = r ? SIGNAL_META[r.signal] : null;
                  const Icon = meta?.Icon || HelpCircle;
                  return (
                    <div key={a.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40">
                      <div className="flex items-start gap-3">
                        <span className="text-[10px] font-black text-slate-400 mt-1 w-6">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm leading-relaxed">{a.text}</p>
                          {r && r.feedback && (
                            <p className="text-xs font-bold text-slate-500 mt-1.5 leading-relaxed">{r.feedback}</p>
                          )}
                        </div>
                        {r ? (
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="font-black text-slate-900 text-lg tabular-nums">
                              {r.score}<span className="text-slate-400 text-xs">/{r.max}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${meta.cls}`}>
                              <Icon size={11} /> {meta.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Нема</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => exportCsv(poll, results)}
                  className="flex-1 py-3 bg-white border-2 border-slate-100 hover:border-emerald-300 hover:text-emerald-600 text-slate-600 rounded-2xl font-black flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" /> Извези CSV
                </button>
                <button
                  onClick={() => { setResults(null); setSummary(null); }}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-200"
                >
                  <Sparkles className="w-4 h-4" /> Повторно оцени
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AutoGradeModal;
