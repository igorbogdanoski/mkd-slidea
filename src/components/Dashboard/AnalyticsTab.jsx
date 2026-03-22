import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, Zap, Award,
  BarChart2, PieChart as PieIcon, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '../../lib/supabase';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

const TYPE_LABELS = {
  poll: 'Анкети', quiz: 'Квизови',
  wordcloud: 'Word Cloud', open: 'Отворени', survey: 'Анкети',
};

const DAY_NAMES = ['Нед', 'Пон', 'Вто', 'Сре', 'Чет', 'Пет', 'Саб'];

const AnalyticsTab = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ events: 0, votes: 0, participants: 0, topEvent: '—' });
  const [areaData, setAreaData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [topEvents, setTopEvents] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    load();
  }, [user]);

  const load = async () => {
    setLoading(true);

    // 1. Get user's events
    const { data: events } = await supabase
      .from('events')
      .select('id, title, created_at, code')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!events?.length) { setLoading(false); return; }
    const eventIds = events.map(e => e.id);

    // 2. Get polls for those events
    const { data: polls } = await supabase
      .from('polls')
      .select('id, type, event_id')
      .in('event_id', eventIds);

    const pollIds = polls?.map(p => p.id) || [];

    // 3. Get all votes
    const { data: votes } = pollIds.length ? await supabase
      .from('votes')
      .select('id, poll_id, session_id, created_at')
      .in('poll_id', pollIds) : { data: [] };

    const allVotes = votes || [];

    // ── Compute stats ──────────────────────────────────────────
    const uniqueParticipants = new Set(allVotes.map(v => v.session_id)).size;

    // Top event by votes
    const votesByEvent = {};
    allVotes.forEach(v => {
      const poll = polls?.find(p => p.id === v.poll_id);
      if (poll) votesByEvent[poll.event_id] = (votesByEvent[poll.event_id] || 0) + 1;
    });
    const topEventId = Object.entries(votesByEvent).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topEventTitle = events.find(e => e.id === topEventId)?.title || '—';

    setStats({
      events: events.length,
      votes: allVotes.length,
      participants: uniqueParticipants,
      topEvent: topEventTitle.length > 20 ? topEventTitle.slice(0, 18) + '…' : topEventTitle,
    });

    // ── Area chart: last 7 days ────────────────────────────────
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });
    const area = days.map(day => {
      const next = new Date(day); next.setDate(next.getDate() + 1);
      const dayVotes = allVotes.filter(v => {
        const t = new Date(v.created_at);
        return t >= day && t < next;
      });
      return {
        name: DAY_NAMES[day.getDay()],
        гласови: dayVotes.length,
        учесници: new Set(dayVotes.map(v => v.session_id)).size,
      };
    });
    setAreaData(area);

    // ── Pie chart: poll types ──────────────────────────────────
    const typeCounts = {};
    polls?.forEach(p => {
      const label = TYPE_LABELS[p.type] || p.type;
      typeCounts[label] = (typeCounts[label] || 0) + 1;
    });
    setPieData(Object.entries(typeCounts).map(([name, value]) => ({ name, value })));

    // ── Top 5 events table ─────────────────────────────────────
    const enriched = events.slice(0, 5).map(ev => {
      const evPolls = polls?.filter(p => p.event_id === ev.id) || [];
      const evVotes = allVotes.filter(v => evPolls.some(p => p.id === v.poll_id));
      const evParticipants = new Set(evVotes.map(v => v.session_id)).size;
      const engPct = evParticipants > 0 && evVotes.length > 0
        ? Math.min(100, Math.round((evVotes.length / Math.max(evParticipants * evPolls.length, 1)) * 100))
        : 0;
      return {
        title: ev.title,
        code: ev.code,
        participants: evParticipants,
        votes: evVotes.length,
        polls: evPolls.length,
        eng: engPct,
        date: ev.created_at,
      };
    }).sort((a, b) => b.votes - a.votes);
    setTopEvents(enriched);

    setLoading(false);
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('mk-MK', { day: 'numeric', month: 'short' });
  };

  const statCards = [
    { label: 'Вкупно настани', value: stats.events, icon: <Calendar size={22} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Вкупно гласови', value: stats.votes.toLocaleString(), icon: <Zap size={22} />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Уникатни учесници', value: stats.participants.toLocaleString(), icon: <Users size={22} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Топ настан', value: stats.topEvent, icon: <Award size={22} />, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!stats.events) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-slate-400">
      <BarChart2 size={48} className="opacity-20" />
      <p className="font-black text-lg">Нема доволно податоци уште</p>
      <p className="font-bold text-sm">Создади настан и собери одговори — аналитиката ќе се пополни автоматски.</p>
    </div>
  );

  const totalPieVotes = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-12 max-w-7xl mx-auto space-y-12"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Детална аналитика</h2>
          <p className="text-slate-400 font-bold flex items-center gap-2 uppercase tracking-widest text-[10px]">
            <Calendar size={14} /> Реални податоци од твоите настани
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all"
          >
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
              {stat.icon}
            </div>
            <p className="text-sm font-bold text-slate-400 mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 truncate">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Area chart */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm h-[420px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black flex items-center gap-2">
              <BarChart2 size={24} className="text-indigo-600" /> Активност — последни 7 дена
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded-full" /><span className="text-xs font-bold text-slate-400">Гласови</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-400 rounded-full" /><span className="text-xs font-bold text-slate-400">Учесници</span></div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gVotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '1rem' }} itemStyle={{ fontWeight: 900 }} />
                <Area type="monotone" dataKey="гласови" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#gVotes)" />
                <Area type="monotone" dataKey="учесници" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gPart)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-xl font-black mb-8 flex items-center gap-2">
            <PieIcon size={24} className="text-emerald-500" /> Типови активности
          </h3>
          {pieData.length > 0 ? (
            <>
              <div className="flex-1 relative min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={6} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Анкети</p>
                  <h4 className="text-3xl font-black text-slate-900">{totalPieVotes}</h4>
                </div>
              </div>
              <div className="space-y-3 pt-6 border-t border-slate-50">
                {pieData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{entry.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-300 font-bold text-sm">Нема анкети уште</div>
          )}
        </div>
      </div>

      {/* Top Events Table */}
      {topEvents.length > 0 && (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h3 className="text-xl font-black">Топ настани по активност</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Настан</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Учесници</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Гласови</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Анкети</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Датум</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topEvents.map((ev, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div>
                        <p className="font-black text-slate-800">{ev.title}</p>
                        <p className="text-xs font-bold text-slate-300">#{ev.code}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-500">{ev.participants}</td>
                    <td className="px-8 py-5 font-black text-slate-900">{ev.votes}</td>
                    <td className="px-8 py-5 font-bold text-slate-500">{ev.polls}</td>
                    <td className="px-8 py-5 font-bold text-slate-400 text-sm">{formatDate(ev.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AnalyticsTab;
