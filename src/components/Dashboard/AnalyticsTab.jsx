import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Clock, Award, 
  BarChart2, PieChart as PieIcon, Download, 
  ChevronRight, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, 
  PieChart, Pie, Cell 
} from 'recharts';

const AnalyticsTab = () => {
  const data = [
    { name: 'Пон', participants: 400, interactions: 2400 },
    { name: 'Вто', participants: 300, interactions: 1398 },
    { name: 'Сре', participants: 200, interactions: 9800 },
    { name: 'Чет', participants: 278, interactions: 3908 },
    { name: 'Пет', participants: 189, interactions: 4800 },
    { name: 'Саб', participants: 239, interactions: 3800 },
    { name: 'Нед', participants: 349, interactions: 4300 },
  ];

  const pieData = [
    { name: 'Анкети', value: 400 },
    { name: 'Квизови', value: 300 },
    { name: 'Q&A', value: 300 },
    { name: 'Word Cloud', value: 200 },
  ];

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  const stats = [
    { label: 'Вкупно учесници', value: '12,450', change: '+12%', icon: <Users size={24} />, positive: true },
    { label: 'Стапка на ангажман', value: '84%', change: '+5%', icon: <TrendingUp size={24} />, positive: true },
    { label: 'Просечно време', value: '42 мин', change: '-2%', icon: <Clock size={24} />, positive: false },
    { label: 'Топ настан', value: 'IT Conf 26', change: 'New', icon: <Award size={24} />, positive: true },
  ];

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
            <Calendar size={14} /> Извештај за последните 30 дена
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 text-slate-900 rounded-xl font-black text-sm hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm">
          <Download size={18} /> Извези PDF/Excel
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-black ${stat.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Engagement Chart */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black flex items-center gap-2">
              <BarChart2 size={24} className="text-indigo-600" /> Активност во живо
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-600 rounded-full" />
                <span className="text-xs font-bold text-slate-400">Интеракции</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-200 rounded-full" />
                <span className="text-xs font-bold text-slate-400">Учесници</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '1rem' }}
                  itemStyle={{ fontWeight: 900 }}
                />
                <Area type="monotone" dataKey="interactions" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorInt)" />
                <Area type="monotone" dataKey="participants" stroke="#e2e8f0" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Distribution */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center">
          <h3 className="text-xl font-black mb-8 w-full text-left flex items-center gap-2">
            <PieIcon size={24} className="text-emerald-500" /> Типови на содржина
          </h3>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Вкупно</p>
              <h4 className="text-4xl font-black text-slate-900">1.2k</h4>
            </div>
          </div>
          <div className="w-full space-y-4 pt-8 border-t border-slate-50">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{entry.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Events Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-xl font-black">Топ 5 најуспешни настани</h3>
           <button className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline flex items-center gap-1">
              Целосна листа <ChevronRight size={16} />
           </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Настан</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Учесници</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ангажман</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { name: 'Годишна Конференција 2026', users: '1,240', eng: '92%', status: 'Завршено' },
                { name: 'Обука: AI во Едукација', users: '450', eng: '88%', status: 'Активен' },
                { name: 'Тимски состанок: МКД Слидеа', users: '12', eng: '100%', status: 'Завршено' },
                { name: 'Вебинар: Дигитални Алатки', users: '890', eng: '76%', status: 'Завршено' },
                { name: 'Квиз: Скопје низ историјата', users: '230', eng: '95%', status: 'Активен' },
              ].map((ev, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-700">{ev.name}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-bold text-slate-400">{ev.users}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-24">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: ev.eng }} />
                       </div>
                       <span className="font-black text-xs text-slate-900">{ev.eng}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${ev.status === 'Активен' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {ev.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsTab;
