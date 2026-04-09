import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Lightbulb, ListChecks, Loader2, Sparkles, X } from 'lucide-react';

const safePercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return Math.max(0, Math.min(100, Number(value)));
};

const buildPayload = (event, polls) => {
  const totalParticipants = Math.max(
    ...polls.map((poll) => (
      (poll.options || []).filter((option) => option.is_approved !== false)
        .reduce((sum, option) => sum + (option.votes || 0), 0)
    )),
    1
  );

  return {
    eventTitle: event?.title || 'Настан',
    polls: polls.map((poll) => {
      const visibleOptions = (poll.options || []).filter((option) => option.is_approved !== false);
      const totalVotes = visibleOptions.reduce((sum, option) => sum + (option.votes || 0), 0);
      const sortedAnswers = [...visibleOptions]
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
        .slice(0, 4)
        .map((option) => ({ text: option.text, votes: option.votes || 0 }));

      const correctOption = visibleOptions.find((option) => option.is_correct);
      const quizAccuracy = poll.is_quiz
        ? safePercent(correctOption && totalVotes > 0 ? ((correctOption.votes || 0) / totalVotes) * 100 : 0)
        : null;

      return {
        question: poll.question,
        type: poll.type || 'poll',
        totalVotes,
        responseRate: safePercent(totalVotes > 0 ? (totalVotes / totalParticipants) * 100 : 0),
        isQuiz: !!poll.is_quiz,
        quizAccuracy,
        topAnswers: sortedAnswers,
      };
    }),
  };
};

const AIInsightsModal = ({ isOpen, onClose, event, polls }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState(null);

  const payload = useMemo(() => buildPayload(event, polls || []), [event, polls]);

  const generateInsights = async () => {
    if (!payload.polls?.length) {
      setError('Нема активности за анализа.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Грешка при AI анализа');

      setInsights(data);
    } catch (err) {
      setError(err.message || 'Грешка при AI анализа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500" />

            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Sparkles size={12} /> AI Insights
                </div>
                <h3 className="text-2xl font-black text-slate-900">Анализа по час</h3>
                <p className="text-slate-400 font-bold text-sm">AI препораки за следниот час врз база на реални одговори.</p>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-110px)] space-y-6">
              {!insights && (
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white border border-slate-100 rounded-2xl p-4">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Активности за анализа</p>
                      <p className="text-3xl font-black text-slate-900 mt-1">{payload.polls.length}</p>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Квиз прашања</p>
                      <p className="text-3xl font-black text-slate-900 mt-1">{payload.polls.filter((poll) => poll.isQuiz).length}</p>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Вкупно одговори</p>
                      <p className="text-3xl font-black text-slate-900 mt-1">{payload.polls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0)}</p>
                    </div>
                  </div>

                  <button
                    onClick={generateInsights}
                    disabled={loading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Анализирам...</> : <><Brain className="w-5 h-5" /> Генерирај AI Insights</>}
                  </button>
                </div>
              )}

              {error && (
                <div className="px-5 py-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-bold text-sm">
                  {error}
                </div>
              )}

              {insights && (
                <>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6">
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Резиме</p>
                    <p className="text-slate-700 font-bold leading-relaxed">{insights.overview || 'Нема достапно резиме.'}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                        <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Слаби точки</p>
                      </div>
                      <div className="space-y-3">
                        {(insights.weakPoints || []).length === 0 && (
                          <p className="text-amber-700 font-bold text-sm">AI не детектира критични слабости.</p>
                        )}
                        {(insights.weakPoints || []).map((item, index) => (
                          <div key={index} className="bg-white/80 border border-amber-100 rounded-2xl p-4">
                            <p className="font-black text-slate-900">{item.topic}</p>
                            <p className="text-sm font-bold text-slate-600 mt-1">{item.signal}</p>
                            <p className="text-sm font-black text-amber-700 mt-2">→ {item.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <ListChecks className="w-5 h-5 text-emerald-600" />
                        <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">План за следен час</p>
                      </div>
                      <ol className="space-y-2">
                        {(insights.nextLessonPlan || []).map((step, index) => (
                          <li key={index} className="bg-white/80 border border-emerald-100 rounded-2xl p-3 font-bold text-slate-700 text-sm">
                            {index + 1}. {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6">
                    <p className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-3">Брзи акции за утре</p>
                    <ul className="space-y-2">
                      {(insights.quickActions || []).map((item, index) => (
                        <li key={index} className="bg-white/80 border border-indigo-100 rounded-2xl p-3 font-bold text-slate-700 text-sm">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={generateInsights}
                    disabled={loading}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black transition-all disabled:opacity-60"
                  >
                    {loading ? 'Освежувам анализа...' : 'Освежи AI анализа'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AIInsightsModal;
