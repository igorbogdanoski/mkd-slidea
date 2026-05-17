import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Medal, RefreshCw, Hash, ArrowLeft, Users, CheckCircle2, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';

const REFRESH_MS = 6000;

const medal = (rank) => {
  if (rank === 1) return { bg: 'bg-amber-400', text: 'text-amber-900', icon: <Crown className="w-5 h-5" />, ring: 'ring-amber-300' };
  if (rank === 2) return { bg: 'bg-slate-300', text: 'text-slate-700', icon: <Medal className="w-5 h-5" />, ring: 'ring-slate-200' };
  if (rank === 3) return { bg: 'bg-amber-700', text: 'text-white',     icon: <Medal className="w-5 h-5" />, ring: 'ring-amber-600' };
  return null;
};

const pct = (correct, total) =>
  total > 0 ? Math.round((correct / total) * 100) : 0;

export default function EventScoreboard() {
  const { id } = useParams();
  const code = (id || '').replace(/^#/, '').trim().toUpperCase();

  const [event,   setEvent]   = useState(null);
  const [rows,    setRows]    = useState([]);
  const [quizQs,  setQuizQs]  = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  useSEO({
    title: event ? `Скорборд — ${event.title} | MKD Slidea` : 'Скорборд | MKD Slidea',
    noindex: true,
  });

  const load = useCallback(async () => {
    if (!code) return;

    // 1. Fetch event
    const { data: evArr } = await supabase
      .from('events')
      .select('id, title, code')
      .ilike('code', code)
      .order('created_at', { ascending: false })
      .limit(1);
    const ev = evArr?.[0];
    if (!ev) { setLoading(false); return; }
    setEvent(ev);

    // 2. Fetch quiz poll IDs for this event
    const { data: polls } = await supabase
      .from('polls')
      .select('id')
      .eq('event_id', ev.id)
      .eq('is_quiz', true);
    const pollIds = (polls || []).map(p => p.id);
    setQuizQs(pollIds.length);
    if (!pollIds.length) { setRows([]); setLoading(false); return; }

    // 3. Fetch all votes for those quiz polls
    const { data: votes } = await supabase
      .from('votes')
      .select('session_id, username, is_correct, created_at')
      .in('poll_id', pollIds);

    // 4. Aggregate client-side: group by session_id
    const map = new Map();
    for (const v of votes || []) {
      const sid = v.session_id || v.username || 'anon';
      if (!map.has(sid)) {
        map.set(sid, {
          username: v.username || 'Анонимен',
          correct: 0,
          total: 0,
          firstAt: v.created_at,
        });
      }
      const entry = map.get(sid);
      entry.total++;
      if (v.is_correct) entry.correct++;
      if (v.created_at < entry.firstAt) entry.firstAt = v.created_at;
    }

    const sorted = [...map.values()]
      .sort((a, b) => b.correct - a.correct || a.firstAt.localeCompare(b.firstAt));

    setRows(sorted);
    setLoading(false);
    setLastRefresh(new Date());
  }, [code]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh during live sessions
  useEffect(() => {
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const top3 = rows.slice(0, 3);
  const rest  = rows.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Back link */}
        <Link
          to={`/event/${code}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад кон сесијата
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-amber-400/20">
            <Trophy className="w-10 h-10 text-amber-900" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Скорборд</h1>
          {event && (
            <div className="flex items-center justify-center gap-2 text-slate-400 font-bold">
              <Hash className="w-4 h-4" />
              <span>{code}</span>
              <span className="text-slate-600">·</span>
              <span>{event.title}</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: <Users className="w-5 h-5" />, label: 'Учесници', value: rows.length },
              { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Квиз прашања', value: quizQs },
              { icon: <Target className="w-5 h-5" />, label: 'Топ резултат', value: `${top3[0]?.correct ?? 0}/${quizQs}` },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                <div className="text-indigo-400 flex justify-center mb-1">{icon}</div>
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-bold">Се вчитува...</p>
          </div>
        )}

        {/* No quiz data */}
        {!loading && quizQs === 0 && (
          <div className="bg-white/5 rounded-3xl p-10 text-center border border-white/10">
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-white font-black text-xl mb-2">Нема квиз прашања</p>
            <p className="text-slate-400 font-bold text-sm">Скорбордот се пополнува само за прашања со тип „Квиз".</p>
          </div>
        )}

        {/* No participants yet */}
        {!loading && quizQs > 0 && rows.length === 0 && (
          <div className="bg-white/5 rounded-3xl p-10 text-center border border-white/10">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-white font-black text-xl mb-2">Чекаме учесници...</p>
            <p className="text-slate-400 font-bold text-sm">Скорбордот ќе се ажурира автоматски секои {REFRESH_MS / 1000}s.</p>
          </div>
        )}

        {/* Top 3 podium */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-4 mb-6">
            {/* 2nd place */}
            {top3[1] && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 text-center"
              >
                <div className="w-14 h-14 bg-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-2 ring-4 ring-slate-200/30">
                  <Medal className="w-7 h-7 text-slate-700" />
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 h-28 flex flex-col justify-center">
                  <p className="text-white font-black text-sm truncate">{top3[1].username}</p>
                  <p className="text-slate-300 font-black text-2xl">{top3[1].correct}</p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{pct(top3[1].correct, quizQs)}%</p>
                </div>
              </motion.div>
            )}

            {/* 1st place */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="flex-1 text-center"
            >
              <div className="w-18 h-18 bg-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-2 ring-4 ring-amber-300/40 shadow-xl shadow-amber-400/20" style={{ width: 72, height: 72 }}>
                <Crown className="w-9 h-9 text-amber-900" />
              </div>
              <div className="bg-amber-400/10 rounded-2xl p-4 border border-amber-400/30 h-36 flex flex-col justify-center">
                <p className="text-white font-black truncate">{top3[0].username}</p>
                <p className="text-amber-300 font-black text-3xl">{top3[0].correct}</p>
                <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">{pct(top3[0].correct, quizQs)}%</p>
              </div>
            </motion.div>

            {/* 3rd place */}
            {top3[2] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 text-center"
              >
                <div className="w-14 h-14 bg-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-2 ring-4 ring-amber-700/30">
                  <Medal className="w-7 h-7 text-amber-100" />
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 h-24 flex flex-col justify-center">
                  <p className="text-white font-black text-sm truncate">{top3[2].username}</p>
                  <p className="text-slate-300 font-black text-2xl">{top3[2].correct}</p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{pct(top3[2].correct, quizQs)}%</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Rest of list */}
        {rest.length > 0 && (
          <div className="space-y-2 mb-8">
            <AnimatePresence>
              {rest.map((row, i) => {
                const rank = i + 4;
                const accuracy = pct(row.correct, quizQs);
                return (
                  <motion.div
                    key={row.username + i}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 bg-white/5 rounded-2xl px-5 py-4 border border-white/10"
                  >
                    <span className="w-8 text-center font-black text-slate-500 text-sm">{rank}</span>
                    <span className="flex-1 font-bold text-white truncate">{row.username}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full transition-all"
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <span className="text-slate-300 font-black w-8 text-right">{row.correct}</span>
                      <span className="text-slate-600 font-bold text-xs w-10 text-right">{accuracy}%</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Live refresh indicator */}
        {!loading && rows.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-slate-600 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Живо ажурирање на секои {REFRESH_MS / 1000}s
            {lastRefresh && (
              <span>· {lastRefresh.toLocaleTimeString('mk-MK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
