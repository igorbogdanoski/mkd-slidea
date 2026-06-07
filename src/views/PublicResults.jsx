import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
  PieChart, Pie,
} from 'recharts';
import { Share2, Copy, CheckCheck, ExternalLink, BarChart2, Trophy, Cloud, Star, AlignLeft, ListOrdered, Scale, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';

// ── Constants ──────────────────────────────────────────────────────────────

const PALETTE = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' });
};

const typeInfo = (poll) => {
  if (poll.is_quiz)               return { icon: <Trophy size={13} />, label: 'Квиз',              color: 'text-amber-600 bg-amber-50 border-amber-100' };
  if (poll.type === 'wordcloud')  return { icon: <Cloud size={13} />,  label: 'Облак',              color: 'text-sky-600 bg-sky-50 border-sky-100' };
  if (poll.type === 'rating')     return { icon: <Star size={13} />,   label: 'Оценување',          color: 'text-orange-600 bg-orange-50 border-orange-100' };
  if (poll.type === 'scale')      return { icon: <Scale size={13} />,  label: 'Скала',              color: 'text-teal-600 bg-teal-50 border-teal-100' };
  if (poll.type === 'open')       return { icon: <AlignLeft size={13} />, label: 'Отворен',         color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
  if (poll.type === 'ranking')    return { icon: <ListOrdered size={13} />, label: 'Рангирање',     color: 'text-violet-600 bg-violet-50 border-violet-100' };
  return                                { icon: <BarChart2 size={13} />, label: 'Анкета',            color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
};

// ── Poll result card ───────────────────────────────────────────────────────

const PollCard = ({ poll, index }) => {
  const totalVotes = poll.options?.reduce((s, o) => s + (o.votes || 0), 0) || 0;
  const { icon, label, color } = typeInfo(poll);
  const sorted = [...(poll.options || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  const isWordCloud = poll.type === 'wordcloud';
  const isOpen      = poll.type === 'open';
  const isRating    = poll.type === 'rating' || poll.type === 'scale';
  const isRanking   = poll.type === 'ranking';

  const avgRating = isRating && totalVotes > 0 && poll.options?.length
    ? (poll.options.reduce((a, o) => a + parseInt(o.text || 0) * (o.votes || 0), 0) / totalVotes).toFixed(1)
    : null;

  const chartData = poll.options?.map((o) => ({
    name: o.text?.slice(0, 28) || '—',
    votes: o.votes || 0,
    pct: totalVotes > 0 ? Math.round((o.votes || 0) / totalVotes * 100) : 0,
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/80 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      {/* Card header */}
      <div className="px-8 pt-8 pb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${color}`}>
            {icon} {label}
          </div>
          {totalVotes > 0 && (
            <span className="text-[11px] font-black text-slate-400 tabular-nums whitespace-nowrap">
              {totalVotes} {totalVotes === 1 ? 'глас' : 'гласови'}
            </span>
          )}
        </div>
        <h3 className="font-black text-slate-900 text-lg leading-snug">{poll.question}</h3>
      </div>

      {/* Body */}
      <div className="px-8 pb-8">
        {totalVotes === 0 ? (
          <p className="text-sm text-slate-300 font-bold text-center py-6">Нема гласови</p>

        ) : isWordCloud ? (
          <div className="flex flex-wrap gap-2 py-2">
            {sorted.filter(o => o.votes > 0).map((o, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full font-black text-white"
                style={{
                  background: PALETTE[i % PALETTE.length],
                  fontSize: `${Math.min(1.5, 0.75 + (o.votes || 0) * 0.15)}rem`,
                  opacity: 0.85 + Math.min(0.15, (o.votes || 0) * 0.03),
                }}
              >
                {o.text}
              </span>
            ))}
          </div>

        ) : isOpen ? (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {sorted.filter(o => o.text?.trim()).slice(0, 12).map((o, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                <span className="text-slate-300 font-black text-xs tabular-nums pt-0.5 shrink-0">{i + 1}.</span>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">{o.text}</p>
              </div>
            ))}
          </div>

        ) : isRating || isRanking ? (
          <div className="space-y-2.5">
            {avgRating && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl font-black text-slate-900">{avgRating}</span>
                <div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star
                        key={s}
                        size={16}
                        className={parseFloat(avgRating) >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">просечна оценка</p>
                </div>
              </div>
            )}
            {sorted.map((o, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 w-16 shrink-0 truncate">{o.text}</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalVotes > 0 ? Math.round((o.votes||0)/totalVotes*100) : 0}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                  />
                </div>
                <span className="text-xs font-black text-slate-500 w-8 text-right tabular-nums shrink-0">
                  {totalVotes > 0 ? Math.round((o.votes||0)/totalVotes*100) : 0}%
                </span>
              </div>
            ))}
          </div>

        ) : chartData.length <= 5 ? (
          /* Bar chart — vertical for few options */
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 11, fontWeight: 700 }}
                formatter={(v) => [`${v} гласови`, '']}
              />
              <Bar dataKey="votes" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {chartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          /* Horizontal bars for many options */
          <div className="space-y-2.5">
            {sorted.map((o, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-500 w-28 shrink-0 truncate">{o.text}</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${o.pct || 0}%` }}
                    transition={{ delay: 0.3 + i * 0.04, duration: 0.55, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                  />
                </div>
                <span className="text-xs font-black text-slate-500 w-10 text-right tabular-nums shrink-0">
                  {o.pct || 0}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Share button ───────────────────────────────────────────────────────────

const ShareButton = ({ url, title }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  };

  return (
    <motion.button
      onClick={handleShare}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl font-black text-sm
        bg-white/20 backdrop-blur-md border border-white/30 text-white
        hover:bg-white/30 transition-all shadow-lg"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
            <CheckCheck size={16} /> Копирано!
          </motion.span>
        ) : (
          <motion.span key="share" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
            <Share2 size={16} /> Сподели
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ── Stat pill ─────────────────────────────────────────────────────────────

const StatPill = ({ value, label }) => (
  <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4">
    <span className="text-3xl font-black text-white tabular-nums">{value}</span>
    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest mt-1">{label}</span>
  </div>
);

// ── Main view ──────────────────────────────────────────────────────────────

const PublicResults = () => {
  const { code } = useParams();
  const [event, setEvent] = useState(null);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) { setNotFound(true); setLoading(false); return; }
    const load = async () => {
      const { data: ev } = await supabase
        .from('events')
        .select('id, title, code, created_at, cover_image')
        .eq('code', code.toUpperCase())
        .maybeSingle();

      if (!ev) { setNotFound(true); setLoading(false); return; }
      setEvent(ev);

      const { data: ps } = await supabase
        .from('polls')
        .select('*, options(*)')
        .eq('event_id', ev.id)
        .order('created_at', { ascending: true });

      setPolls(ps || []);
      setLoading(false);
    };
    load();
  }, [code]);

  const totalVotes = polls.reduce((s, p) =>
    s + (p.options?.reduce((ss, o) => ss + (o.votes || 0), 0) || 0), 0);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/results/${code}`
    : '';

  useSEO({
    title: event ? `${event.title} — Резултати | MKD Slidea` : 'MKD Slidea — Јавни резултати',
    description: event
      ? `Интерактивен час со ${polls.length} прашање${polls.length !== 1 ? 'а' : ''} и ${totalVotes} гласови — создаден со MKD Slidea.`
      : 'Јавни резултати на интерактивен час.',
    image: event?.cover_image || 'https://slidea.mismath.net/og-default.png',
  });

  // ── Loading skeleton ──

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-3xl bg-white/10 animate-pulse" />
        <div className="h-4 w-48 bg-white/10 rounded-full animate-pulse" />
        <div className="h-3 w-32 bg-white/10 rounded-full animate-pulse" />
      </div>
    </div>
  );

  // ── 404 ──

  if (notFound) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl mb-8">🔍</div>
        <h1 className="text-3xl font-black text-white mb-4">Настанот не е пронајден</h1>
        <p className="text-slate-400 font-bold mb-10">Кодот <code className="text-indigo-400 bg-white/5 px-2 py-0.5 rounded-lg">{code}</code> не одговара на ниту еден настан.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/30"
        >
          <ExternalLink size={16} /> Назад кон почетна
        </Link>
      </motion.div>
    </div>
  );

  // ── Results page ──

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-400/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-20">
          {/* Code chip */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl mb-8"
          >
            <Hash size={14} className="text-white/70" />
            <span className="text-white font-black text-sm tracking-widest">{event.code}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="text-4xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tight"
          >
            {event.title || 'Без наслов'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="text-white/60 font-bold mb-10 text-sm"
          >
            {formatDate(event.created_at)}
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="flex flex-wrap gap-3 mb-10"
          >
            <StatPill value={polls.length} label={polls.length === 1 ? 'Прашање' : 'Прашања'} />
            <StatPill value={totalVotes.toLocaleString('mk-MK')} label="Гласови" />
            {polls.filter(p => p.is_quiz).length > 0 && (
              <StatPill value={polls.filter(p => p.is_quiz).length} label="Квиз прашања" />
            )}
          </motion.div>

          {/* Share */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}>
            <ShareButton url={shareUrl} title={`Резултати — ${event.title}`} />
          </motion.div>
        </div>
      </div>

      {/* ── Poll cards ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        {polls.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-6">📭</div>
            <h2 className="text-2xl font-black text-slate-300 mb-2">Нема прашања</h2>
            <p className="text-slate-400 font-bold">Овој настан сè уште нема додадени активности.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {polls.map((poll, i) => (
              <PollCard key={poll.id} poll={poll} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer CTA ─────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <BarChart2 size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">Создадено со MKD Slidea</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Интерактивни часови за македонски наставници</p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Пробај бесплатно <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicResults;
