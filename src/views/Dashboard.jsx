import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, Presentation, LayoutGrid, Users, 
  CreditCard, Share2, Trash2, Plus, 
  Sparkles, Search, MoreVertical, Clock,
  ChevronRight, Bell, Zap, Globe, MessageSquare, 
  BarChart2, Monitor, Download, ShieldCheck
} from 'lucide-react';

const Dashboard = ({ setView }) => {
  const [activeTab, setActiveTab] = useState('home');

  const menuItems = [
    { id: 'home', label: 'Почетна', icon: <Home size={20} /> },
    { id: 'presentations', label: 'Мои презентации', icon: <Presentation size={20} /> },
    { id: 'templates', label: 'Сите шаблони', icon: <LayoutGrid size={20} /> },
    { id: 'team', label: 'Креирај тим', icon: <Users size={20} /> },
    { id: 'plan', label: 'Мој план', icon: <CreditCard size={20} /> },
    { id: 'integrations', label: 'Интеграции', icon: <Share2 size={20} /> },
    { id: 'trash', label: 'Корпа', icon: <Trash2 size={20} /> },
  ];

  const recentPresentations = [
    { id: 1, title: 'AI Navigator & Gemini Mastery', date: 'Edited Mar 13, 2026', slides: 5, color: 'bg-indigo-600' },
    { id: 2, title: 'Дигитална трансформација на часот', date: 'Edited Feb 21, 2026', slides: 7, color: 'bg-emerald-600' },
  ];

  const popularTemplates = [
    { title: 'Technology In The Classroom', category: 'Classroom Activity', color: 'bg-blue-500', img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&h=250&auto=format&fit=crop' },
    { title: 'Visual Communication', category: 'Presentation Ideas', color: 'bg-pink-500', img: 'https://images.unsplash.com/photo-1558403194-611308249627?q=80&w=400&h=250&auto=format&fit=crop' },
    { title: 'Situational Leadership', category: 'Interactive Ideas', color: 'bg-amber-500', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400&h=250&auto=format&fit=crop' },
  ];

  const renderHome = () => (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Добредојде, Игор Богданоски</h1>
          <p className="text-slate-400 font-bold">Управувај со твоите интерактивни презентации © 2026.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
            <Bell size={20} />
          </button>
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center font-black text-indigo-600 border border-indigo-200">
            ИБ
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-16">
        <button 
          onClick={() => setView('host')}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          <Plus size={24} /> Нова презентација
        </button>
        <button className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black text-lg hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm">
          <Sparkles size={24} className="text-indigo-600" /> Креирај со AI
        </button>
      </div>

      {/* Recent Presentations */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Clock size={20} className="text-indigo-600" /> Последни презентации
          </h2>
          <button onClick={() => setActiveTab('presentations')} className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">
            Види ги сите <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPresentations.map((pres) => (
            <div key={pres.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-indigo-50 transition-all">
              <div className={`h-40 ${pres.color} p-6 flex items-end relative`}>
                 <div className="absolute top-4 right-4 text-white/50">
                    <MoreVertical size={20} />
                 </div>
                 <Presentation size={48} className="text-white/20 absolute bottom-4 right-4" />
              </div>
              <div className="p-6">
                <h3 className="font-black text-lg text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{pres.title}</h3>
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <span>{pres.slides} слајдови</span>
                  <span>{pres.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Templates */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black flex items-center gap-2">
            <LayoutGrid size={20} className="text-indigo-600" /> Популарни шаблони
          </h2>
          <button onClick={() => setActiveTab('templates')} className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">
            Види ги сите <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {popularTemplates.map((temp, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex items-center gap-4 group cursor-pointer">
              <div className={`w-16 h-16 ${temp.color} rounded-2xl flex items-center justify-center text-white overflow-hidden`}>
                 <img src={temp.img} className="w-full h-full object-cover opacity-50" />
                 <LayoutGrid size={24} className="absolute" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{temp.title}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{temp.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const renderPresentations = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Мои презентации</h2>
          <p className="text-slate-400 font-bold">Листа на сите ваши активни и минати настани.</p>
        </div>
        <button onClick={() => setView('host')} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all">
          <Plus size={20} /> Нова
        </button>
      </div>
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Наслов</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Код</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Статус</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Датум</th>
              <th className="px-8 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-bold">
            <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
              <td className="px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <Presentation size={20} />
                  </div>
                  <span className="group-hover:text-indigo-600 transition-colors">AI Navigator & Gemini Mastery</span>
                </div>
              </td>
              <td className="px-8 py-6 font-mono text-slate-400">#639527</td>
              <td className="px-8 py-6">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black tracking-widest uppercase">Активна</span>
              </td>
              <td className="px-8 py-6 text-slate-400">Mar 20, 2026</td>
              <td className="px-8 py-6 text-right">
                <button className="text-slate-300 hover:text-slate-600 transition-colors"><MoreVertical size={20} /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Шаблони за презентација</h2>
          <p className="text-slate-400 font-bold">Изберете од стотиците веќе подготвени интерактивни активности.</p>
        </div>
        <div className="flex bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
          {['Сите', 'Едукација', 'Бизнис', 'Настани'].map((cat) => (
            <button key={cat} className="px-6 py-2 rounded-xl text-sm font-black hover:bg-slate-50 transition-all text-slate-500 hover:text-indigo-600">
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { 
            title: "Квиз за крај на часот", 
            img: "https://images.unsplash.com/photo-1510070112810-d4e9a46d9e91?q=80&w=600", 
            cat: "Education",
            desc: "Брза проверка на знаењето по математика или природни науки.",
            tags: ["Quiz", "Leaderboard"]
          },
          { 
            title: "Тимски Брејнсторминг", 
            img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600", 
            cat: "Corporate",
            desc: "Генерирајте идеи за следниот голем проект со облак со зборови.",
            tags: ["Word Cloud", "Open Text"]
          },
          { 
            title: "Ледоломка за работилница", 
            img: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=600", 
            cat: "Events",
            desc: "Запознајте ја вашата публика низ забавни прашања.",
            tags: ["Poll", "Reactions"]
          },
          { 
            title: "Годишна ретроспектива", 
            img: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=600", 
            cat: "Corporate",
            desc: "Оценете ги постигнувањата на тимот во изминатата година.",
            tags: ["Rating", "Ranking"]
          },
          { 
            title: "Дигитална трансформација", 
            img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600", 
            cat: "Education",
            desc: "Шаблон за предавања за технологија во училницата.",
            tags: ["Quiz", "Poll"]
          },
          { 
            title: "Гласање за проект", 
            img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600", 
            cat: "Events",
            desc: "Овозможете им на сите да гласаат за најдобрата идеја.",
            tags: ["Ranking", "Analytics"]
          }
        ].map((t, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -8 }}
            className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="h-52 relative overflow-hidden">
              <img src={t.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">
                  Користи овој шаблон
                </button>
              </div>
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">
                {t.cat}
              </div>
            </div>
            <div className="p-8 flex flex-col flex-1">
              <div className="flex gap-2 mb-4">
                {t.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 uppercase tracking-tighter">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-xl font-black mb-3 group-hover:text-indigo-600 transition-colors leading-tight">{t.title}</h3>
              <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8 flex-1">
                {t.desc}
              </p>
              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Бесплатен пристап</span>
                <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderPlan = () => (
    <div className="max-w-4xl mx-auto space-y-12 text-center py-12">
      <div>
        <h2 className="text-4xl font-black text-slate-900 mb-4">Изберете го вашиот план</h2>
        <p className="text-slate-400 font-bold text-lg italic">Игор, моментално сте на <span className="text-indigo-600 not-italic">Professional Plan</span> за 2026.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="bg-slate-100 text-slate-500 text-[10px] font-black px-4 py-1 rounded-full absolute top-6 right-6">FREE</div>
          <h3 className="text-2xl font-black mb-2">Бесплатен</h3>
          <div className="text-4xl font-black mb-8">€0<span className="text-lg text-slate-300">/мес</span></div>
          <ul className="text-left space-y-4 font-bold text-slate-500 mb-10">
            <li className="flex items-center gap-2"><ShieldCheck className="text-emerald-500" size={18} /> До 100 учесници</li>
            <li className="flex items-center gap-2"><ShieldCheck className="text-emerald-500" size={18} /> 3 анкети по настан</li>
            <li className="flex items-center gap-2"><ShieldCheck className="text-emerald-500" size={18} /> Основни извештаи</li>
          </ul>
          <button className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest">Ваш план</button>
        </div>
        <div className="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl shadow-indigo-100 relative text-white">
          <div className="bg-indigo-500 text-white text-[10px] font-black px-4 py-1 rounded-full absolute top-6 right-6">POPULAR</div>
          <h3 className="text-2xl font-black mb-2">Професионален</h3>
          <div className="text-4xl font-black mb-8">€12<span className="text-lg text-indigo-300">/мес</span></div>
          <ul className="text-left space-y-4 font-bold text-indigo-100 mb-10">
            <li className="flex items-center gap-2"><ShieldCheck className="text-indigo-300" size={18} /> Неограничени учесници</li>
            <li className="flex items-center gap-2"><ShieldCheck className="text-indigo-300" size={18} /> Неограничени активности</li>
            <li className="flex items-center gap-2"><ShieldCheck className="text-indigo-300" size={18} /> AI асистент за прашања</li>
            <li className="flex items-center gap-2"><ShieldCheck className="text-indigo-300" size={18} /> Брендирање по желба</li>
          </ul>
          <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-xl">Надгради</button>
        </div>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Интеграции</h2>
        <p className="text-slate-400 font-bold">Поврзете го Slidea со вашите омилени алатки за работа.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: "Microsoft PowerPoint", desc: "Користете Slidea директно во вашите слајдови.", icon: <Monitor size={32} />, color: "text-orange-600", bg: "bg-orange-50" },
          { name: "Google Slides", desc: "Додадете интеракција во Google презентациите.", icon: <Globe size={32} />, color: "text-amber-600", bg: "bg-amber-50" },
          { name: "Zoom Meetings", desc: "Направете ги видео повиците интерактивни.", icon: <Monitor size={32} />, color: "text-blue-600", bg: "bg-blue-50" },
          { name: "Microsoft Teams", desc: "Интегрирајте го Slidea во Teams каналите.", icon: <Users size={32} />, color: "text-indigo-600", bg: "bg-indigo-50" },
          { name: "Canvas / Moodle", desc: "Поврзете со вашиот систем за учење.", icon: <School size={32} />, color: "text-red-600", bg: "bg-red-50" },
        ].map((int, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className={`w-16 h-16 ${int.bg} ${int.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              {int.icon}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{int.name}</h3>
            <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8">{int.desc}</p>
            <button className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-transform">
              Инсталирај <ChevronRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col pt-24 px-4 pb-8 fixed h-full z-40">
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 pt-24 px-10 pb-20">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'home' && renderHome()}
          {activeTab === 'presentations' && renderPresentations()}
          {activeTab === 'templates' && renderTemplates()}
          {activeTab === 'plan' && renderPlan()}
          {activeTab === 'integrations' && renderIntegrations()}
          {['team', 'trash'].includes(activeTab) && (
            <div className="pt-20 text-center">
              <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap size={40} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Наскоро</h3>
              <p className="text-slate-300 font-bold mt-2">Оваа опција ќе биде достапна во следната верзија.</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
