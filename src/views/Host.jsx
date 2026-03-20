import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Plus, ArrowLeft, Sparkles
} from 'lucide-react';
import QRCodeModal from '../components/QRCodeModal';
import CreatePollModal from '../components/CreatePollModal';
import CreateQuizModal from '../components/CreateQuizModal';
import InteractionTypeGrid from '../components/InteractionTypeGrid';
import AIAssistantModal from '../components/AIAssistantModal';
import { supabase } from '../lib/supabase';
import HostHeader from '../components/Host/HostHeader';
import PollCard from '../components/Host/PollCard';

const Host = ({ setView }) => {
  const [event, setEvent] = useState(null);
  const [polls, setPolls] = useState([]);
  const [activePollIndex, setActivePollIndex] = useState(0);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [showInteractionGrid, setShowInteractionGrid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('poll');
  const [editingPoll, setEditingPoll] = useState(null);

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

  const onSavePoll = async (pollData) => {
    if (editingPoll) {
      // Update existing poll
      const { error: updateError } = await supabase
        .from('polls')
        .update({ 
          question: pollData.question,
          type: pollData.type || 'poll'
        })
        .eq('id', editingPoll.id);
      
      if (!updateError && pollData.options) {
        // Simple strategy: delete and re-insert options for consistency if changed
        // In a real app we'd diff, but this is simpler for MVP
        await supabase.from('options').delete().eq('poll_id', editingPoll.id);
        
        let optionsToInsert = [];
        if (pollData.type === 'rating') {
          optionsToInsert = ['1', '2', '3', '4', '5'].map(val => ({ poll_id: editingPoll.id, text: val }));
        } else {
          optionsToInsert = pollData.options.map(o => ({ 
            poll_id: editingPoll.id, 
            text: typeof o === 'string' ? o : o.text,
            is_correct: o.is_correct || false
          }));
        }
        await supabase.from('options').insert(optionsToInsert);
      }
      setEditingPoll(null);
    } else {
      // Create new poll (previous logic)
      const { data: newPoll, error } = await supabase.from('polls').insert([{ 
        event_id: event.id, 
        question: pollData.question, 
        is_quiz: !!pollData.is_quiz,
        type: pollData.type || 'poll' 
      }]).select().single();
      
      if (!error && pollData.options) {
        let optionsToInsert = [];
        if (pollData.type === 'rating') {
          optionsToInsert = ['1', '2', '3', '4', '5'].map(val => ({ poll_id: newPoll.id, text: val }));
        } else {
          optionsToInsert = pollData.options.map(o => ({ 
            poll_id: newPoll.id, 
            text: typeof o === 'string' ? o : o.text,
            is_correct: o.is_correct || false
          }));
        }
        await supabase.from('options').insert(optionsToInsert);
      }
    }
    
    setIsCreatePollOpen(false);
    setIsCreateQuizOpen(false);
    setShowInteractionGrid(false);
  };

  const onEditPoll = (poll) => {
    setEditingPoll(poll);
    setSelectedType(poll.type || 'poll');
    if (poll.is_quiz) {
      setIsCreateQuizOpen(true);
    } else {
      setIsCreatePollOpen(true);
    }
  };

  const handleInteractionSelect = (type) => {
    setSelectedType(type);
    if (type === 'quiz') {
      setIsCreateQuizOpen(true);
    } else {
      setIsCreatePollOpen(true);
    }
  };

  const setActivePoll = async (index) => {
    setActivePollIndex(index);
    if (polls[index]) {
      await supabase
        .from('events')
        .update({ active_poll_id: polls[index].id })
        .eq('id', event.id);
    }
  };

  if (loading) return <div className="pt-32 text-center font-bold">Се вчитува...</div>;
  if (!event) return <div className="pt-32 text-center font-bold text-red-500">Грешка.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 pt-12 pb-24">
      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} eventCode={event.code} />
      <CreatePollModal 
        isOpen={isCreatePollOpen} 
        onClose={() => { setIsCreatePollOpen(false); setEditingPoll(null); }} 
        onSave={onSavePoll} 
        type={selectedType}
        initialData={editingPoll}
      />
      <CreateQuizModal 
        isOpen={isCreateQuizOpen} 
        onClose={() => { setIsCreateQuizOpen(false); setEditingPoll(null); }} 
        onSave={onSavePoll} 
        initialData={editingPoll}
      />
      <AIAssistantModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onGenerate={onSavePoll} 
      />

      <HostHeader event={event} setIsQRModalOpen={setIsQRModalOpen} setView={setView} />

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
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setShowInteractionGrid(true)} 
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                      >
                        <Plus className="w-6 h-6" /> Додај активност
                      </button>
                      <button 
                        onClick={() => setIsAIModalOpen(true)} 
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black text-lg hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                      >
                        <Sparkles className="w-6 h-6 text-indigo-600" /> Креирај со AI
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {polls.length === 0 ? (
                      <div className="p-24 text-center bg-slate-50/50 rounded-[2.5rem] border-4 border-dashed border-slate-100">
                        <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <Plus className="w-10 h-10 text-slate-200" />
                        </div>
                        <h4 className="text-xl font-black text-slate-400 mb-2">Сè уште немате активности</h4>
                        <p className="text-slate-300 font-bold mb-8">Започнете со додавање на првата интеракција за вашата публика.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <button 
                            onClick={() => setShowInteractionGrid(true)} 
                            className="px-8 py-3 bg-white border-2 border-slate-100 text-slate-400 rounded-xl font-black hover:border-indigo-600 hover:text-indigo-600 transition-all"
                          >
                            Започни рачно
                          </button>
                          <button 
                            onClick={() => setIsAIModalOpen(true)}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                          >
                            <Sparkles className="w-5 h-5" /> Креирај со AI
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {polls.map((poll, index) => (
                          <PollCard 
                            key={poll.id} 
                            poll={poll} 
                            index={index} 
                            activePollIndex={activePollIndex} 
                            setActivePoll={setActivePoll} 
                            onEdit={onEditPoll}
                          />
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
