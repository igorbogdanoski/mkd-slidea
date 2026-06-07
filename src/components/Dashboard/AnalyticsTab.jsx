import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, Zap, Award,
  BarChart2, PieChart as PieIcon, Calendar, Activity, GitCompare
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
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

  // Drill-down: votes over time per poll
  const [allEventsData, setAllEventsData] = useState([]);
  const [allPollsData, setAllPollsData] = useState([]);
  const [drillEventId, setDrillEventId] = useState('');
  const [drillPollId, setDrillPollId] = useState('');
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillChartData, setDrillChartData] = useState(null);

  // Session comparison
  const [cmpA, setCmpA] = useState('');
  const [cmpB, setCmpB] = useState('');
  const [cmpData, setCmpData] = useState(null);
  const [cmpLoading, setCmpLoading] = useState(false);

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
      .select('id, type, event_id, question')
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
    setAllEventsData(events);
    setAllPollsData(polls || []);

    setLoading(false);
  };

  // Fetch votes for selected poll and build time-series
  const loadDrill = async (pollId) => {
    setDrillLoading(true);
    setDrillChartData(null);
    const { data: votes } = await supabase
      .from('votes')
      .select('created_at, session_id')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: true });
    if (!votes?.length) { setDrillLoading(false); setDrillChartData([]); return; }

    // Bucket into 1-minute intervals
    const first = new Date(votes[0].created_at);
    const last = new Date(votes[votes.length - 1].created_at);
    const buckets = {};
    const diffMin = Math.ceil((last - first) / 60000) + 1;
    const interval = diffMin <= 30 ? 1 : diffMin <= 120 ? 5 : 15;
    for (let i = 0; i <= diffMin; i += interval) {
      const t = new Date(first.getTime() + i * 60000);
      const key = `${String(t.getHours()).padStart(2, '0')}:${String(Math.floor(t.getMinutes() / interval) * interval).padStart(2, '0')}`;
      buckets[key] = { time: key, гласови: 0, учесници: new Set() };
    }
    votes.forEach(v => {
      const t = new Date(v.created_at);
      const minFromStart = Math.floor((t - first) / 60000 / interval) * interval;
      const ref = new Date(first.getTime() + minFromStart * 60000);
      const key = `${String(ref.getHours()).padStart(2, '0')}:${String(Math.floor(ref.getMinutes() / interval) * interval).padStart(2, '0')}`;
      if (buckets[key]) {
        buckets[key].гласови += 1;
        buckets[key].учесници.add(v.session_id);
      }
    });
    const chart = Object.values(buckets).map(b => ({ time: b.time, гласови: b.гласови, учесници: b.учесници.size }));
    setDrillChartData(chart);
    setDrillLoading(false);
  };

  useEffect(() => {
    if (drillPollId) loadDrill(drillPollId);
    else setDrillChartData(null);
  }, [drillPollId]);

  const loadComparison = async (idA, idB) => {
    if (!idA || !idB) { setCmpData(null); return; }
    setCmpLoading(true);
    const fetchEventStats = async (eventId) => {
      const ev = allEventsData.find(e => e.id === eventId);
      const polls = allPollsData.filter(p => p.event_id === eventId);
      const pollIds = polls.map(p => p.id);
      if (!pollIds.length) return { event: ev, polls: 0, votes: 0, participants: 0 };
      const { data: votes } = await supabase.from('votes').select('session_id').in('poll_id', pollIds);
      return {
        event: ev,
        polls: polls.length,
        votes: votes?.length || 0,
        participants: new Set(votes?.map(v => v.session_id) || []).size,
      };
    };
    const [a, b] = await Promise.all([fetchEventStats(idA), fetchEventStats(idB)]);
    setCmpData({ a, b });
    setCmpLoading(false);
  };

  useEffect(() => { loadComparison(cmpA, cmpB); }, [cmpA, cmpB]);

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
      {/* Session comparison */}
      {allEventsData.length >= 2 && (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-3">
            <GitCompare size={22} className="text-indigo-500" />
            <div>
              <h3 className="text-xl font-black">Споредба на 2 сесии</h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Избери два настани за да ги споредиш нивните метрики</p>
            </div>
          </div>
          <div className="p-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {[{ val: cmpA, set: setCmpA, label: 'Настан А', color: 'indigo' }, { val: cmpB, set: setCmpB, label: 'Настан Б', color: 'violet' }].map(({ val, set, label, color }) => (
                <select
                  key={label}
                  value={val}
                  onChange={e => set(e.target.value)}
                  className={`flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 focus:border-${color}-400 focus:bg-white outline-none transition-all text-sm`}
                >
                  <option value="">— {label} —</option>
                  {allEventsData.filter(e => e.id !== (label === 'Настан А' ? cmpB : cmpA)).map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title} #{ev.code}</option>
                  ))}
                </select>
              ))}
            </div>

            {cmpLoading && (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!cmpLoading && cmpData && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Настани', keyA: 'event.title', render: (s) => s.event?.title || '—' },
                  { label: 'Анкети',  render: (s) => s.polls },
                  { label: 'Гласови', render: (s) => s.votes },
                  { label: 'Учесници', render: (s) => s.participants },
                  { label: 'Гласови / анкета', render: (s) => s.polls > 0 ? (s.votes / s.polls).toFixed(1) : '—' },
                  { label: 'Ангажираност', render: (s) => s.participants > 0 && s.polls > 0 ? Math.min(100, Math.round(s.votes / (s.participants * s.polls) * 100)) + '%' : '—' },
                ].map(({ label, render }) => {
                  const va = render(cmpData.a);
                  const vb = render(cmpData.b);
                  const numA = parseFloat(String(va));
                  const numB = parseFloat(String(vb));
                  const aWins = !isNaN(numA) && !isNaN(numB) && numA > numB;
                  const bWins = !isNaN(numA) && !isNaN(numB) && numB > numA;
                  return (
                    <div key={label} className="bg-slate-50 rounded-3xl p-5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
                      <div className="flex items-end justify-between gap-2">
                        <div className={`flex-1 text-center px-3 py-3 rounded-2xl font-black text-lg ${aWins ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900'}`}>
                          {va}
                        </div>
                        <span className="text-xs font-black text-slate-300 pb-2">vs</span>
                        <div className={`flex-1 text-center px-3 py-3 rounded-2xl font-black text-lg ${bWins ? 'bg-violet-600 text-white' : 'bg-white text-slate-900'}`}>
                          {vb}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!cmpLoading && !cmpData && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-300 gap-2">
                <GitCompare size={36} className="opacity-30" />
                <p className="font-black text-sm">Избери два настани за да ги споредиш</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Votes over time — per poll drill-down */}
      {allEventsData.length > 0 && (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-3">
            <Activity size={22} className="text-violet-500" />
            <div>
              <h3 className="text-xl font-black">Гласови во реално време — по анкета</h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Изберете настан и анкета за да видите кога дошле гласовите</p>
            </div>
          </div>
          <div className="p-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <select
                value={drillEventId}
                onChange={(e) => { setDrillEventId(e.target.value); setDrillPollId(''); }}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 focus:border-indigo-400 focus:bg-white outline-none transition-all text-sm"
              >
                <option value="">— Избери настан —</option>
                {allEventsData.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title} #{ev.code}</option>
                ))}
              </select>
              <select
                value={drillPollId}
                onChange={(e) => setDrillPollId(e.target.value)}
                disabled={!drillEventId}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 focus:border-indigo-400 focus:bg-white outline-none transition-all text-sm disabled:opacity-40"
              >
                <option value="">— Избери анкета —</option>
                {allPollsData.filter(p => p.event_id === drillEventId).map(p => (
                  <option key={p.id} value={p.id}>{p.question || `Анкета (${p.type})`}</option>
                ))}
              </select>
            </div>

            {drillLoading && (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!drillLoading && drillChartData === null && !drillPollId && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-3">
                <Activity size={40} className="opacity-30" />
                <p className="font-black text-sm">Избери настан и анкета за да видиш тајмлајн на гласови</p>
              </div>
            )}

            {!drillLoading && drillChartData !== null && drillChartData.length === 0 && (
              <div className="flex items-center justify-center h-48 text-slate-400 font-bold text-sm">
                Нема гласови за оваа анкета уште
              </div>
            )}

            {!drillLoading && drillChartData?.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={drillChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.08)', padding: '1rem' }}
                      itemStyle={{ fontWeight: 900 }}
                    />
                    <Line type="monotone" dataKey="гласови" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
                    <Line type="monotone" dataKey="учесници" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10b981' }} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex gap-6 justify-center mt-4">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded-full" /><span className="text-xs font-bold text-slate-400">Гласови</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-400 rounded-full opacity-70" /><span className="text-xs font-bold text-slate-400">Уникатни учесници</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AnalyticsTab;
