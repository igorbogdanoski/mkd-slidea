import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Settings, Users, PieChart, MessageSquare, Plus, ThumbsUp, QrCode, MonitorPlay, Trophy } from 'lucide-react';
import QRCodeModal from '../components/QRCodeModal';
import CreatePollModal from '../components/CreatePollModal';
import CreateQuizModal from '../components/CreateQuizModal';
import { supabase } from '../lib/supabase';

const Host = ({ setView }) => {
  const [event, setEvent] = useState(null);
  const [polls, setPolls] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activePollIndex, setActivePollIndex] = useState(0);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
      const { data } = await supabase.from('polls').select('*, options(*)').eq('event_id', event.id);
      if (data) setPolls(data);
    };
    fetchPolls();
    const sub = supabase.channel('host_polls').on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, fetchPolls).subscribe();
    return () => { sub.unsubscribe(); };
  }, [event]);

  const onAddPoll = async (newPoll) => {
    const { data: pollData, error } = await supabase.from('polls').insert([{ event_id: event.id, question: newPoll.question, is_quiz: !!newPoll.is_quiz }]).select().single();
    if (error) return;
    const opts = newPoll.options.map(o => ({ poll_id: pollData.id, text: o.text, is_correct: !!o.is_correct }));
    await supabase.from('options').insert(opts);
    setIsCreatePollOpen(false);
    setIsCreateQuizOpen(false);
  };

  if (loading) return <div className="pt-32 text-center font-bold">Се вчитува...</div>;
  if (!event) return <div className="pt-32 text-center font-bold text-red-500">Грешка.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 pt-12 pb-24">
      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} eventCode={event.code} />
      <CreatePollModal isOpen={isCreatePollOpen} onClose={() => setIsCreatePollOpen(false)} onSave={onAddPoll} />
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
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black">Сите активности</h3>
                <div className="flex gap-2">
                  <button onClick={() => setIsCreatePollOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100"><Plus className="w-4 h-4" /> Анкета</button>
                  <button onClick={() => setIsCreateQuizOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-bold text-sm hover:bg-amber-100"><Trophy className="w-4 h-4" /> Квиз</button>
                </div>
              </div>

              <div className="space-y-4">
                {polls.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold">
                    Сè уште немате креирано активности.
                  </div>
                ) : (
                  polls.map((poll, index) => (
                    <div key={poll.id} onClick={() => setActivePollIndex(index)} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${activePollIndex === index ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${poll.is_quiz ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                          {poll.is_quiz ? 'КВИЗ' : 'АНКЕТА'}
                        </span>
                        {activePollIndex === index && <span className="text-indigo-600 text-[10px] font-black">АКТИВНА</span>}
                      </div>
                      <p className="font-bold text-slate-800">{poll.question}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Host;
