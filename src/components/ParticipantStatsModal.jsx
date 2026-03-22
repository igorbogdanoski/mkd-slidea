import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Trophy, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ParticipantStatsModal = ({ isOpen, onClose, event, polls }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('points'); // 'points' | 'answers' | 'time'

  useEffect(() => {
    if (!isOpen || !event?.id || polls.length === 0) return;

    const fetchStats = async () => {
      setLoading(true);
      const pollIds = polls.map(p => p.id);

      const { data: votes } = await supabase
        .from('votes')
        .select('session_id, username, poll_id, is_correct, answer_text, created_at')
        .in('poll_id', pollIds);

      if (!votes || votes.length === 0) {
        setStats([]);
        setLoading(false);
        return;
      }

      // Group by session_id
      const grouped = {};
      for (const v of votes) {
        if (!grouped[v.session_id]) {
          grouped[v.session_id] = {
            session_id: v.session_id,
            username: v.username || 'Анонимен',
            answers: 0,
            correct: 0,
            lastAt: v.created_at,
          };
        }
        const g = grouped[v.session_id];
        g.answers += 1;
        if (v.is_correct === true) g.correct += 1;
        // Keep most recent username (in case they changed it)
        if (v.username && v.created_at > g.lastAt) {
          g.username = v.username;
          g.lastAt = v.created_at;
        }
      }

      const quizPollsCount = polls.filter(p => p.is_quiz).length;

      const result = Object.values(grouped).map(g => ({
        ...g,
        points: g.correct * 100,
        completionPct: polls.length > 0 ? Math.min(100, Math.round((g.answers / polls.length) * 100)) : 0,
        quizPollsCount,
      }));

      setStats(result);
      setLoading(false);
    };

    fetchStats();
  }, [isOpen, event?.id, polls]);

  if (!isOpen) return null;

  const sorted = [...stats].sort((a, b) => {
    if (sortBy === 'points') return b.points - a.points || b.correct - a.correct;
    if (sortBy === 'answers') return b.answers - a.answers;
    if (sortBy === 'time') return new Date(b.lastAt) - new Date(a.lastAt);
    return 0;
  });

  const totalParticipants = stats.length;
  const totalAnswers = stats.reduce((s, g) => s + g.answers, 0);
  const avgCompletion = totalParticipants > 0
    ? Math.round(stats.reduce((s, g) => s + g.completionPct, 0) / totalParticipants)
    : 0;

  const SortBtn = ({ id, label }) => (
    <button
      onClick={() => setSortBy(id)}
      className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
        sortBy === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white rounded-[2rem] shadow-2xl z-10 w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-[2rem]" />

        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-3 rounded-2xl">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Статистики по учесник</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{event?.title} · #{event?.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 px-8 pb-5 flex-shrink-0">
          <div className="bg-indigo-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-indigo-600">{totalParticipants}</p>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Учесници</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-emerald-600">{totalAnswers}</p>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">Одговори</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-amber-600">{avgCompletion}%</p>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-1">Просечно</p>
          </div>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 px-8 pb-4 flex-shrink-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Сортирај:</span>
          <SortBtn id="points" label="Поени" />
          <SortBtn id="answers" label="Одговори" />
          <SortBtn id="time" label="Последен" />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-300 font-black text-lg">Сè уште нема одговори</p>
              <p className="text-slate-200 font-bold text-sm mt-2">Учесниците ќе се прикажат штом ќе гласаат</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((p, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                const lastDate = p.lastAt
                  ? new Date(p.lastAt).toLocaleTimeString('mk-MK', { hour: '2-digit', minute: '2-digit' })
                  : '—';
                return (
                  <motion.div
                    key={p.session_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                      i === 0 ? 'bg-amber-50 border-amber-200' :
                      i === 1 ? 'bg-slate-50 border-slate-200' :
                      i === 2 ? 'bg-orange-50 border-orange-200' :
                      'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-8 text-center">{medal || `#${i + 1}`}</span>
                      <div>
                        <p className="font-black text-slate-800">{p.username}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {p.answers}/{polls.length} одговори
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {p.quizPollsCount > 0 && (
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="font-black text-sm">{p.correct}</span>
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Точни</p>
                        </div>
                      )}
                      {p.quizPollsCount > 0 && (
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-indigo-600">
                            <Trophy className="w-3.5 h-3.5" />
                            <span className="font-black text-sm">{p.points}</span>
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Поени</p>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-black text-sm">{lastDate}</span>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Последен</p>
                      </div>
                      <div className="w-16">
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${p.completionPct}%` }}
                          />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 text-right mt-0.5">{p.completionPct}%</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ParticipantStatsModal;
