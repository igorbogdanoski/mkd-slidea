import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, BarChart2, Cloud, Star, AlignLeft, ListOrdered, Trophy } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '../../lib/supabase';

const PALETTE = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'];

const typeLabel = (poll) => {
  if (poll.is_quiz)              return { icon: '🏆', label: 'Квиз' };
  if (poll.type === 'wordcloud') return { icon: '☁️', label: 'Облак со зборови' };
  if (poll.type === 'rating')    return { icon: '⭐', label: 'Оценување' };
  if (poll.type === 'open')      return { icon: '💬', label: 'Отворен текст' };
  if (poll.type === 'ranking')   return { icon: '🏅', label: 'Рангирање' };
  return { icon: '📊', label: 'Анкета' };
};

// ── Poll result card ──────────────────────────────────────────────────────────
const PollResult = ({ poll }) => {
  const totalVotes = poll.options?.reduce((s, o) => s + (o.votes || 0), 0) || 0;
  const { icon, label } = typeLabel(poll);

  const sorted = [...(poll.options || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  const renderChart = () => {
    if (poll.type === 'rating') {
      const avg = totalVotes > 0
        ? (poll.options.reduce((a, o) => a + parseInt(o.text) * (o.votes || 0), 0) / totalVotes).toFixed(1)
        : 0;
      return (
        <div className="flex items-center gap-6 py-4">
          <span className="text-6xl font-black text-indigo-600">{avg}</span>
          <div>
            <div className="flex gap-1 mb-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={20} className={s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
              ))}
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{totalVotes} гласови</p>
          </div>
        </div>
      );
    }

    if (poll.type === 'wordcloud' || poll.type === 'open') {
      return (
        <div className="flex flex-wrap gap-2 py-2">
          {sorted.filter(o => o.votes > 0).map((o, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-xs font-black text-white"
              style={{ background: PALETTE[i % PALETTE.length], fontSize: Math.max(10, 10 + (o.votes || 0) * 3) }}>
              {o.text} {o.votes > 1 && `(${o.votes})`}
            </span>
          ))}
          {totalVotes === 0 && <p className="text-slate-300 text-sm font-bold">Нема одговори</p>}
        </div>
      );
    }

    if (totalVotes === 0) return <p className="text-slate-300 text-sm font-bold py-4">Нема гласови</p>;

    const chartData = sorted.map((o, i) => ({
      name: o.text.length > 20 ? o.text.slice(0, 18) + '…' : o.text,
      fullName: o.text,
      votes: o.votes || 0,
      pct: Math.round((o.votes || 0) / totalVotes * 100),
      fill: PALETTE[i % PALETTE.length],
    }));

    return (
      <div className="flex gap-6 items-center">
        {/* Bar chart */}
        <div className="flex-1 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 700 }}
                formatter={(v, _, props) => [`${v} гл. (${props.payload.pct}%)`, props.payload.fullName]}
              />
              <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Donut */}
        <div className="w-32 h-32 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="votes" cx="50%" cy="50%" innerRadius="45%" outerRadius="75%" paddingAngle={3}>
                {chartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-black text-slate-500">{totalVotes}<br />гл.</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{icon} {label}</span>
          <h4 className="text-lg font-black text-slate-900 mt-1 leading-snug">{poll.question}</h4>
        </div>
        <span className="text-2xl font-black text-indigo-600 flex-shrink-0">{totalVotes}</span>
      </div>
      {renderChart()}
    </div>
  );
};

// ── CSV export helper ─────────────────────────────────────────────────────────
const exportCSV = (event, polls) => {
  const rows = [['Настан', 'Код', 'Прашање', 'Тип', 'Опција', 'Гласови', '%']];
  for (const poll of polls) {
    const total = poll.options?.reduce((s, o) => s + (o.votes || 0), 0) || 0;
    if (!poll.options?.length) {
      rows.push([event.title, event.code, poll.question, poll.type, '—', 0, '0%']);
    } else {
      for (const opt of poll.options) {
        const pct = total > 0 ? Math.round((opt.votes || 0) / total * 100) : 0;
        rows.push([event.title, event.code, poll.question, poll.type, opt.text, opt.votes || 0, `${pct}%`]);
      }
    }
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mkd-slidea-${event.code}-резултати.csv`;
  a.click();
};

// ── Main modal ────────────────────────────────────────────────────────────────
const EventResultsModal = ({ event, onClose }) => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!event) return;
    const load = async () => {
      const { data } = await supabase
        .from('polls')
        .select('*, options(*)')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true });
      setPolls(data || []);
      setLoading(false);
    };
    load();
  }, [event]);

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  if (!event) return null;

  const totalVotes = polls.reduce((s, p) =>
    s + (p.options?.reduce((ss, o) => ss + (o.votes || 0), 0) || 0), 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-[301] flex items-center justify-center p-6 pointer-events-none">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          className="relative bg-[#F8FAFC] rounded-[3rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl pointer-events-auto overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-10 py-8 bg-white border-b border-slate-100 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{event.title || 'Без наслов'}</h2>
              <p className="text-slate-400 font-bold text-sm">
                Код: <span className="text-indigo-600 font-black">#{event.code}</span>
                {' · '}{polls.length} активности{' · '}{totalVotes} вкупно гласови
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportCSV(event, polls)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                <Download size={16} /> Извези CSV
              </button>
              <button
                onClick={onClose}
                className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-10 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : polls.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-black text-slate-400">Нема активности за овој настан</h3>
              </div>
            ) : (
              polls.map(poll => <PollResult key={poll.id} poll={poll} />)
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventResultsModal;
