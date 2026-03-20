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

  const renderTeam = () => (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      <div className="bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="relative z-10">
          <h2 className="text-4xl font-black mb-4">Креирај Тимски Простор</h2>
          <p className="text-indigo-100 font-bold text-lg mb-8 max-w-lg">
            Споделувајте презентации, соработувајте на шаблони и анализирајте ги резултатите заедно со вашиот тим.
          </p>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
              Креирај нов тим
            </button>
            <button className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest border border-indigo-400">
              Покани колеги
            </button>
          </div>
        </div>
        <Users size={200} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-xl font-black mb-2">Администраторски контроли</h3>
          <p className="text-slate-500 font-bold text-sm leading-relaxed">
            Целосна контрола врз дозволите и пристапот на секој член на тимот.
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
            <Share2 size={24} />
          </div>
          <h3 className="text-xl font-black mb-2">Заедничка библиотека</h3>
          <p className="text-slate-500 font-bold text-sm leading-relaxed">
            Сите ваши тимски шаблони и презентации на едно безбедно место.
          </p>
        </div>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Шаблони за решенија</h2>
          <p className="text-slate-400 font-bold">Спремни за користење за секој бизнис и едукативен модел.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { 
            title: "Бизнис Состанок", 
            img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600", 
            cat: "Corporate",
            desc: "Рангирајте ги приоритетите на вашиот следен бизнис состанок.",
            tags: ["Ranking", "Poll"]
          },
          { 
            title: "Хибридна Работилница", 
            img: "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=600", 
            cat: "Hybrid Work",
            desc: "Поврзете ги вработените во канцеларија и дома низ заеднички Q&A.",
            tags: ["Q&A", "Reactions"]
          },
          { 
            title: "Обука за вработени", 
            img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600", 
            cat: "Training",
            desc: "Тестирајте го знаењето по секоја одржана професионална обука.",
            tags: ["Quiz", "Leaderboard"]
          },
          { 
            title: "Интерактивно Предавање", 
            img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600", 
            cat: "Education",
            desc: "Задржете го вниманието на учениците со брзи анкети и word cloud.",
            tags: ["Word Cloud", "Poll"]
          },
          { 
            title: "Live Вебинар", 
            img: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=600", 
            cat: "Webinar",
            desc: "Добијте фидбек веднаш од стотици онлајн учесници.",
            tags: ["Rating", "Open Text"]
          },
          { 
            title: "Училница на иднината", 
            img: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=600", 
            cat: "Education",
            desc: "Дигитализирајте го наставниот процес со игри и натпревари.",
            tags: ["Quiz", "Ranking"]
          }
        ].map((t, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -8 }}
            className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="h-52 relative overflow-hidden">
              <img src={t.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
              <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">
                Користи шаблон
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderPlan = () => (
    <div className="max-w-6xl mx-auto space-y-16 py-12 px-6">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-900 leading-tight">Изберете го вашиот план</h2>
        <p className="text-slate-400 font-bold text-xl max-w-2xl mx-auto leading-relaxed">
          Игор, како автор на платформата имате <span className="text-indigo-600">Целосен Пристап</span>. 
          Понудете им на вашите корисници флексибилност.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Бесплатен План */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all relative">
          <div className="bg-slate-100 text-slate-500 text-[10px] font-black px-4 py-1 rounded-full absolute top-8 right-8 uppercase tracking-widest">Basic</div>
          <h3 className="text-2xl font-black mb-1">Бесплатен</h3>
          <p className="text-slate-400 font-bold text-xs mb-6 uppercase tracking-widest">За наставници</p>
          <div className="text-4xl font-black mb-8">€0<span className="text-lg text-slate-300">/засекогаш</span></div>
          <ul className="text-left space-y-4 font-bold text-slate-500 mb-10 flex-1">
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-emerald-500 shrink-0" size={18} /> До 50 учесници (една училница)</li>
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-emerald-500 shrink-0" size={18} /> 3 анкети по настан</li>
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-emerald-500 shrink-0" size={18} /> До 5 настани месечно</li>
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-emerald-500 shrink-0" size={18} /> Основни извештаи</li>
          </ul>
          <button className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs">Вашиот план</button>
        </div>

        {/* Месечен План */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all relative">
          <h3 className="text-2xl font-black mb-1">Месечен</h3>
          <p className="text-slate-400 font-bold text-xs mb-6 uppercase tracking-widest">Флексибилен</p>
          <div className="text-4xl font-black mb-8">€5<span className="text-lg text-slate-300">/мес</span></div>
          <ul className="text-left space-y-4 font-bold text-slate-500 mb-10 flex-1">
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-indigo-500 shrink-0" size={18} /> До 200 учесници</li>
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-indigo-500 shrink-0" size={18} /> 10 анкети по настан</li>
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-indigo-500 shrink-0" size={18} /> Неограничени настани</li>
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-indigo-500 shrink-0" size={18} /> Приоритетна поддршка</li>
          </ul>
          <button className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 hover:text-white transition-all">Избери</button>
        </div>

        {/* Квартален/Полугодишен План */}
        <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-xl shadow-indigo-50 flex flex-col hover:shadow-2xl transition-all relative">
          <div className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-full absolute -top-3 left-1/2 -translate-x-1/2 uppercase tracking-widest">Најпопуларно</div>
          <h3 className="text-2xl font-black mb-1">Семестрален</h3>
          <p className="text-slate-400 font-bold text-xs mb-6 uppercase tracking-widest">3 или 6 месеци</p>
          <div className="text-3xl font-black mb-2 text-indigo-600">€10 / €15</div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-8">За целиот период</p>
          <ul className="text-left space-y-4 font-bold text-slate-500 mb-10 flex-1">
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-indigo-500 shrink-0" size={18} /> До 500 учесници</li>
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-indigo-500 shrink-0" size={18} /> Неограничени активности</li>
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-indigo-500 shrink-0" size={18} /> AI Генерирање прашања</li>
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-indigo-500 shrink-0" size={18} /> Напредна аналитика</li>
          </ul>
          <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100">Надгради</button>
        </div>

        {/* Годишен План */}
        <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl flex flex-col hover:scale-105 transition-all relative text-white">
          <div className="bg-emerald-500 text-white text-[10px] font-black px-4 py-1 rounded-full absolute top-8 right-8 uppercase tracking-widest">Best Value</div>
          <h3 className="text-2xl font-black mb-1">Годишен</h3>
          <p className="text-slate-400 font-bold text-xs mb-6 uppercase tracking-widest">Професионален</p>
          <div className="text-4xl font-black mb-8 text-emerald-400">€20<span className="text-lg text-slate-500">/год</span></div>
          <ul className="text-left space-y-4 font-bold text-slate-300 mb-10 flex-1">
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-emerald-400 shrink-0" size={18} /> Неограничени учесници</li>
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-emerald-400 shrink-0" size={18} /> Целосен AI асистент</li>
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-emerald-400 shrink-0" size={18} /> Сопствено брендирање</li>
            <li className="flex items-start gap-2 leading-tight"><ShieldCheck className="text-emerald-400 shrink-0" size={18} /> Експорт на податоци</li>
          </ul>
          <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20">Активирај</button>
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
          {activeTab === 'team' && renderTeam()}
          {activeTab === 'plan' && renderPlan()}
          {activeTab === 'integrations' && renderIntegrations()}
          {['trash'].includes(activeTab) && (
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
