import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Settings, Users, PieChart, MessageSquare, Plus, 
  ThumbsUp, QrCode, MonitorPlay, Trophy, ArrowLeft, 
  Lock, Unlock, Eye, EyeOff, RotateCcw, Play, Pause, Timer as TimerIcon 
} from 'lucide-react';
import QRCodeModal from '../components/QRCodeModal';
import CreatePollModal from '../components/CreatePollModal';
import CreateQuizModal from '../components/CreateQuizModal';
import InteractionTypeGrid from '../components/InteractionTypeGrid';
import { supabase } from '../lib/supabase';

const Host = ({ setView }) => {
  const [event, setEvent] = useState(null);
  const [polls, setPolls] = useState([]);
  const [activePollIndex, setActivePollIndex] = useState(0);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [showInteractionGrid, setShowInteractionGrid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('poll');

  useEffect(() => {
    const initEvent = async () => {
      let eventCode = localStorage.getItem('active_event_code');
      if (!eventCode) {
        eventCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data, error } = await supabase
          .from('events')
          .insert([{ code: eventCode, title: 'Мојот настан' }])
          .select()
          .single();
        if (!error) {
          localStorage.setItem('active_event_code', eventCode);
          setEvent(data);
        }
      } else {
        const { data } = await supabase.from('events').select('*').eq('code', eventCode).single();
        setEvent(data);
      }
      setLoading(false);
    };
    initEvent();
  }, []);

  useEffect(() => {
    if (!event) return;
    const fetchPolls = async () => {
      const { data } = await supabase.from('polls').select('*, options(*)').eq('event_id', event.id).order('created_at', { ascending: true });
      if (data) setPolls(data);
    };
    fetchPolls();
    const sub = supabase.channel('host_polls').on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, fetchPolls).subscribe();
    return () => { sub.unsubscribe(); };
  }, [event]);

  const onAddPoll = async (newPoll) => {
    const { data: pollData, error } = await supabase.from('polls').insert([{ 
      event_id: event.id, 
      question: newPoll.question, 
      is_quiz: !!newPoll.is_quiz,
      type: newPoll.type || 'poll' 
    }]).select().single();
    
    if (error) return;
    
    let optionsToInsert = [];
    if (newPoll.type === 'rating') {
      optionsToInsert = ['1', '2', '3', '4', '5'].map(val => ({ poll_id: pollData.id, text: val, votes: 0 }));
    } else if (newPoll.options && newPoll.options.length > 0) {
      optionsToInsert = newPoll.options.map(o => ({ poll_id: pollData.id, text: o.text, is_correct: !!o.is_correct }));
    }
    
    if (optionsToInsert.length > 0) {
      await supabase.from('options').insert(optionsToInsert);
    }
    
    setIsCreatePollOpen(false);
    setIsCreateQuizOpen(false);
    setShowInteractionGrid(false);
  };

  const handleInteractionSelect = (type) => {
    setSelectedType(type);
    if (type === 'quiz') {
      setIsCreateQuizOpen(true);
    } else {
      setIsCreatePollOpen(true);
    }
  };

  if (loading) return <div className="pt-32 text-center font-bold">Се вчитува...</div>;
  if (!event) return <div className="pt-32 text-center font-bold text-red-500">Грешка.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 pt-12 pb-24">
      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} eventCode={event.code} />
      <CreatePollModal 
        isOpen={isCreatePollOpen} 
        onClose={() => setIsCreatePollOpen(false)} 
        onSave={onAddPoll} 
        type={selectedType}
      />
      <CreateQuizModal isOpen={isCreateQuizOpen} onClose={() => setIsCreateQuizOpen(false)} onSave={onAddPoll} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
            <Zap className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black">Контролна табла</h2>
            <p className="text-slate-400 text-sm font-bold">Управувајте со {event.code}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => setIsQRModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-mono font-bold text-slate-600 text-lg transition-all group">
            <QrCode className="w-5 h-5 group-hover:rotate-12 transition-transform" /> #{event.code}
          </button>
          <button onClick={() => window.open(`/event/${event.code}/present`, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl font-bold text-sm transition-all">
            <MonitorPlay className="w-4 h-4" /> Презентација
          </button>
          <button onClick={() => setView('landing')} className="flex items-center gap-2 px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all text-sm">Затвори</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          <AnimatePresence mode="wait">
            {showInteractionGrid ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setShowInteractionGrid(false)}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" /> Назад кон активностите
                  </button>
                  <h3 className="text-2xl font-black">Избери тип на активност</h3>
                  <div className="w-24" /> {/* Spacer */}
                </div>
                <InteractionTypeGrid onSelect={handleInteractionSelect} />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div>
                      <h3 className="text-3xl font-black mb-2">Сите активности</h3>
                      <p className="text-slate-400 font-bold">Управувај со прашањата за твојата публика.</p>
                    </div>
                    <button 
                      onClick={() => setShowInteractionGrid(true)} 
                      className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                    >
                      <Plus className="w-6 h-6" /> Додај активност
                    </button>
                  </div>

                  <div className="space-y-4">
                    {polls.length === 0 ? (
                      <div className="p-24 text-center bg-slate-50/50 rounded-[2.5rem] border-4 border-dashed border-slate-100">
                        <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <Plus className="w-10 h-10 text-slate-200" />
                        </div>
                        <h4 className="text-xl font-black text-slate-400 mb-2">Сè уште немате активности</h4>
                        <p className="text-slate-300 font-bold mb-8">Започнете со додавање на првата интеракција за вашата публика.</p>
                        <button 
                          onClick={() => setShowInteractionGrid(true)} 
                          className="px-8 py-3 bg-white border-2 border-slate-100 text-slate-400 rounded-xl font-black hover:border-indigo-600 hover:text-indigo-600 transition-all"
                        >
                          Креирај сега
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {polls.map((poll, index) => (
                          <div 
                            key={poll.id} 
                            onClick={() => setActivePollIndex(index)} 
                            className={`p-8 rounded-[2rem] border-2 cursor-pointer transition-all relative overflow-hidden ${activePollIndex === index ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-white hover:border-indigo-100'}`}
                          >
                            {activePollIndex === index && (
                              <div className="absolute top-0 right-0 p-4 flex gap-2 bg-white/50 backdrop-blur-md rounded-bl-[1.5rem] border-l border-b border-indigo-100 z-10">
                                <button title="Заклучи гласање" className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-red-500 transition-all">
                                  <Lock size={18} />
                                </button>
                                <button title="Скриј резултати" className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-amber-500 transition-all">
                                  <EyeOff size={18} />
                                </button>
                                <button title="Ресетирај" className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                                  <RotateCcw size={18} />
                                </button>
                              </div>
                            )}
                            <div className="flex justify-between items-center mb-4">
                              <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${poll.is_quiz ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                {poll.is_quiz ? 'КВИЗ' : poll.type || 'АНКЕТА'}
                              </span>
                              {activePollIndex === index && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                                  <span className="text-indigo-600 text-[10px] font-black tracking-widest">АКТИВНА</span>
                                </div>
                              )}
                            </div>
                            <p className="font-black text-xl text-slate-800 leading-tight mb-2">{poll.question}</p>
                            <p className="text-slate-400 font-bold text-sm">{poll.options?.length || 0} опции • 0 одговори</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Host;
