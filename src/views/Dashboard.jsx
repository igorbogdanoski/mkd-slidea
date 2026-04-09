import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Dashboard/Sidebar';
import HomeTab from '../components/Dashboard/HomeTab';
import AnalyticsTab from '../components/Dashboard/AnalyticsTab';
import EventResultsModal from '../components/Dashboard/EventResultsModal';
import AdminTab from '../components/Dashboard/AdminTab';
import { templates } from '../data/templates';
import { supabase } from '../lib/supabase';

const cardColors = ['bg-indigo-600','bg-violet-600','bg-emerald-600','bg-amber-500','bg-rose-600','bg-cyan-600'];

const formatDate = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Пред момент';
  if (m < 60) return `Пред ${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Пред ${h} ${h === 1 ? 'час' : 'часа'}`;
  const d = Math.floor(h / 24);
  return `Пред ${d} ${d === 1 ? 'ден' : 'дена'}`;
};

const Dashboard = ({ setView, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [communityTemplates, setCommunityTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'presentations') return;
    setEventsLoading(true);
    supabase
      .from('events')
      .select('id, code, title, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setAllEvents(data || []); setEventsLoading(false); });
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'templates') return;
    let cancelled = false;
    setTemplatesLoading(true);
    supabase
      .from('community_templates')
      .select('id, title, category, description, image_url, polls, usage_count, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(80)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error loading community templates:', error);
          setCommunityTemplates([]);
          setTemplatesLoading(false);
          return;
        }
        const normalized = (data || []).map((t) => ({
          id: `community-${t.id}`,
          source: 'community',
          originalId: t.id,
          title: t.title,
          category: t.category || 'Community',
          description: t.description || '',
          img: t.image_url || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&h=250&auto=format&fit=crop',
          polls: Array.isArray(t.polls) ? t.polls : [],
          usage_count: t.usage_count || 0,
        }));
        setCommunityTemplates(normalized);
        setTemplatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const useTemplate = async (template) => {
    // Generate code outside try so it's accessible in catch
    const eventCode = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(36)).join('').toUpperCase().slice(0, 6);
    try {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([{
          code: eventCode,
          title: template.title,
          user_id: user?.id
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      for (const poll of template.polls) {
        const { data: newPoll, error: pollError } = await supabase
          .from('polls')
          .insert([{
            event_id: event.id,
            question: poll.question,
            type: poll.type,
            is_quiz: poll.is_quiz
          }])
          .select()
          .single();

        if (pollError) throw pollError;

        if (poll.options && poll.options.length > 0) {
          const optionsToInsert = poll.options.map(opt => ({
            poll_id: newPoll.id,
            text: typeof opt === 'string' ? opt : opt.text,
            is_correct: opt.is_correct || false
          }));
          await supabase.from('options').insert(optionsToInsert);
        } else if (poll.type === 'rating') {
          const ratings = ['1', '2', '3', '4', '5'].map(val => ({ poll_id: newPoll.id, text: val }));
          await supabase.from('options').insert(ratings);
        }
      }

      if (template.source === 'community' && template.originalId) {
        const nextUsage = (template.usage_count || 0) + 1;
        await supabase
          .from('community_templates')
          .update({ usage_count: nextUsage })
          .eq('id', template.originalId);
      }

      localStorage.setItem('active_event_code', eventCode);
      setView('host');
    } catch (err) {
      // Supabase auth lock race condition — verify event was actually saved before redirecting
      if (err?.message?.includes('stole it') || err?.message?.includes('lock')) {
        try {
          const { data: existing } = await supabase
            .from('events').select('id').eq('code', eventCode).maybeSingle();
          if (existing) {
            localStorage.setItem('active_event_code', eventCode);
            setView('host');
            return;
          }
        } catch (_) {}
        // Event was never saved — let the user retry cleanly
        alert('Техничка грешка при создавање на шаблонот. Обидете се повторно.');
        return;
      }
      console.error("Error using template:", err);
      alert("Грешка: " + (err?.message || JSON.stringify(err)));
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab setView={setView} setActiveTab={setActiveTab} user={user} useTemplate={useTemplate} />;
      case 'analytics':
        return <AnalyticsTab user={user} />;
      case 'presentations':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Мои настани</h2>
                <p className="text-slate-400 font-bold">Кликни на настан за да ги видиш резултатите или да го отвориш повторно.</p>
              </div>
              <button onClick={() => setView('host')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                + Нов настан
              </button>
            </div>

            {eventsLoading ? (
              <div className="grid grid-cols-3 gap-8">
                {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-[2.5rem] h-64 animate-pulse border border-slate-100" />)}
              </div>
            ) : allEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="text-7xl mb-6">📭</div>
                <h3 className="text-2xl font-black text-slate-300 mb-2">Сè уште нема настани</h3>
                <p className="text-slate-200 font-bold mb-8">Создај го твојот прв интерактивен час</p>
                <button onClick={() => setView('host')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                  + Нова презентација
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allEvents.map((ev, idx) => (
                  <div key={ev.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-indigo-50 transition-all hover:-translate-y-1">
                    <div className={`h-48 ${cardColors[idx % cardColors.length]} p-8 flex items-end relative`}>
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                        <span className="text-3xl text-white">📊</span>
                      </div>
                      <div className="absolute bottom-6 right-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30 text-white font-black text-xs">
                        #{ev.code}
                      </div>
                    </div>
                    <div className="p-8">
                      <h3 className="font-black text-xl text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {ev.title || 'Без наслов'}
                      </h3>
                      <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-6">{formatDate(ev.created_at)}</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedEvent(ev)}
                          className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                        >
                          📊 Резултати
                        </button>
                        <button
                          onClick={() => { localStorage.setItem('active_event_code', ev.code); setView('host'); }}
                          className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                        >
                          ▶ Отвори
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      case 'templates':
        const allTemplates = [...templates, ...communityTemplates];
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12"
          >
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Сите шаблони</h2>
                <p className="text-slate-400 font-bold">Официјални + community шаблони за брз старт.</p>
              </div>
            </div>

            {templatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm h-80 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {allTemplates.map((temp) => (
                 <div key={temp.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-2xl hover:shadow-indigo-50 transition-all">
                    <div className="h-48 relative overflow-hidden">
                      <img src={temp.img} alt={temp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600">
                          {temp.category}
                        </span>
                      </div>
                      {temp.source === 'community' && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-emerald-500/95 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            Community
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-8">
                      <h4 className="font-black text-slate-900 mb-6 line-clamp-2">{temp.title}</h4>
                      {temp.source === 'community' && (
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-4">
                          Користен {temp.usage_count || 0} пати
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => useTemplate(temp)}
                          className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all active:scale-95"
                        >
                          Користи
                        </button>
                        <button className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-xs hover:bg-slate-100 transition-all">Преглед</button>
                      </div>
                    </div>
                 </div>
               ))}
              </div>
            )}
          </motion.div>
        );
      case 'admin':
        return user?.role === 'admin'
          ? <AdminTab currentUser={user} />
          : null;
      case 'plan':
        const planInfo = {
          free:      { name: 'Бесплатен',    price: '€0',  period: 'Засекогаш',  participants: '200', polls: '3', events: '5' },
          basic:     { name: 'Бесплатен',    price: '€0',  period: 'Засекогаш',  participants: '200', polls: '3', events: '5' },
          monthly:   { name: 'Месечен',      price: '€5',  period: '/месец',     participants: '∞',  polls: '∞', events: '∞' },
          quarterly: { name: 'Квартален',    price: '€10', period: '/квартал',   participants: '∞',  polls: '∞', events: '∞' },
          semester:  { name: 'Семестар',     price: '€15', period: '/семестар',  participants: '∞',  polls: '∞', events: '∞' },
          yearly:    { name: 'Годишен',      price: '€20', period: '/година',    participants: '∞',  polls: '∞', events: '∞' },
          pro:       { name: 'PRO',          price: '€20', period: '/година',    participants: '∞',  polls: '∞', events: '∞' },
          admin:     { name: 'Администратор',price: '—',   period: 'Интерен',    participants: '∞',  polls: '∞', events: '∞' },
        };
        const currentPlan = planInfo[user?.plan] || planInfo.free;
        const isPro = !['basic', 'free', undefined, null].includes(user?.plan);
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 max-w-5xl mx-auto"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Мој План</h2>
            <div className="bg-white rounded-[3rem] border-2 border-slate-100 p-12 relative overflow-hidden mb-12 shadow-sm">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">Активен План</span>
                  <h3 className="text-4xl font-black text-slate-900 mb-2">{currentPlan.name}</h3>
                  <p className="text-slate-400 font-bold">
                    {isPro ? 'Неограничен пристап до сите функции.' : 'Вашиот план е секогаш бесплатен за наставници.'}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-5xl font-black text-slate-900 mb-2">{currentPlan.price}</div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{currentPlan.period}</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] -z-10 -translate-y-1/2 translate-x-1/2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Учесници', value: currentPlan.participants, total: currentPlan.participants },
                { label: 'Анкети',   value: currentPlan.polls,        total: currentPlan.polls },
                { label: 'Настани',  value: currentPlan.events,       total: currentPlan.events },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{stat.label}</p>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-black text-slate-900">{stat.value}</span>
                    {stat.total !== '∞' && <span className="text-slate-300 font-bold">/ {stat.total}</span>}
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isPro ? 'bg-emerald-500 w-1/4' : 'bg-indigo-600 w-full'}`} />
                  </div>
                </div>
              ))}
            </div>

            {!isPro && (
              <div className="mt-16 bg-slate-900 p-12 rounded-[3.5rem] flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-2xl shadow-indigo-100">
                <div>
                  <h4 className="text-2xl font-black text-white mb-2">Сакате повеќе можности?</h4>
                  <p className="text-indigo-200 font-bold opacity-70">Надградете го вашиот план и добијте неограничен пристап до сите AI алатки.</p>
                </div>
                <button
                  onClick={() => setView('pricing')}
                  className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-lg hover:bg-indigo-50 transition-all active:scale-95"
                >
                  Види планови
                </button>
              </div>
            )}
          </motion.div>
        );
      case 'team':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 max-w-4xl mx-auto text-center pt-32"
          >
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-16 rounded-[4rem] border-2 border-indigo-100/50 shadow-2xl shadow-indigo-50 relative overflow-hidden group">
               <div className="relative z-10">
                 <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto mb-10 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                    <span className="text-5xl font-black tracking-tighter">TEAM</span>
                 </div>
                 <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Работете заедно со вашиот тим</h2>
                 <p className="text-xl text-slate-500 font-bold mb-12 leading-relaxed opacity-80 uppercase tracking-widest text-xs">Функција достапна само во Pro и Semester плановите.</p>
                 <button 
                  onClick={() => setActiveTab('plan')}
                  className="px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95"
                >
                  Надгради сега
                </button>
               </div>
               <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/40 rounded-full blur-[80px]" />
            </div>
          </motion.div>
        );
      default:
        return (
          <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-8 animate-bounce">
               <span className="text-5xl">⚙️</span>
            </div>
            <h2 className="text-3xl font-black text-slate-300">Наскоро достапно...</h2>
            <p className="text-slate-200 font-bold mt-2 uppercase tracking-widest">Овој дел се подготвува за вас.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={onLogout} />
      
      <main className="flex-1 min-h-screen relative overflow-y-auto h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <EventResultsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};

export default Dashboard;
