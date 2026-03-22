import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ArrowLeft, Sparkles, ChevronLeft, ChevronRight, Settings, X, Timer, Square, ShieldCheck, Check, Trash2, MessageSquare, FileDown, Eye, EyeOff, BarChart2, Copy, UserPlus
} from 'lucide-react';
import QRCodeModal from '../components/QRCodeModal';
import CreatePollModal from '../components/CreatePollModal';
import CreateQuizModal from '../components/CreateQuizModal';
import InteractionTypeGrid from '../components/InteractionTypeGrid';
import AIAssistantModal from '../components/AIAssistantModal';
import ExportPDFModal from '../components/ExportPDFModal';
import ParticipantStatsModal from '../components/ParticipantStatsModal';
import { supabase } from '../lib/supabase';
import HostHeader from '../components/Host/HostHeader';
import PollCard from '../components/Host/PollCard';
const Host = ({ setView, user }) => {
  const [event, setEvent] = useState(null);
  const [polls, setPolls] = useState([]);
  const [activePollIndex, setActivePollIndex] = useState(0);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [showInteractionGrid, setShowInteractionGrid] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(
    () => localStorage.getItem('setting_multiple_votes') !== 'false'
  );
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('poll');
  const [editingPoll, setEditingPoll] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

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
      const { data } = await supabase.from('polls').select('*, options(*)').eq('event_id', event.id).order('position', { ascending: true }).order('created_at', { ascending: true });
      if (data) setPolls(data);
    };
    const fetchPendingQuestions = async () => {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('event_id', event.id)
        .eq('is_answered', false)
        .eq('is_approved', false)
        .order('created_at', { ascending: true });
      setPendingQuestions(data || []);
    };
    fetchPolls();
    fetchPendingQuestions();
    const sub = supabase
      .channel(`host_polls_${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls', filter: `event_id=eq.${event.id}` }, fetchPolls)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'options' }, fetchPolls)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `event_id=eq.${event.id}` }, fetchPendingQuestions)
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [event]);

  const onSavePoll = async (pollData) => {
    try {
      if (editingPoll) {
        // Update existing poll
        const { error: updateError } = await supabase
          .from('polls')
          .update({ 
            question: pollData.question,
            type: pollData.type || 'poll',
            is_quiz: !!pollData.is_quiz
          })
          .eq('id', editingPoll.id);
        
        if (updateError) throw updateError;

        if (pollData.options) {
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
          const { error: optError } = await supabase.from('options').insert(optionsToInsert);
          if (optError) throw optError;
        }
        setEditingPoll(null);
      } else {
        // Create new poll
        const { data: newPoll, error: pollError } = await supabase.from('polls').insert([{ 
          event_id: event.id, 
          question: pollData.question, 
          is_quiz: !!pollData.is_quiz,
          type: pollData.type || 'poll' 
        }]).select().single();
        
        if (pollError) throw pollError;

        if (pollData.options && pollData.options.length > 0) {
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
          const { error: optError } = await supabase.from('options').insert(optionsToInsert);
          if (optError) throw optError;
        }
      }
      
      setIsCreatePollOpen(false);
      setIsCreateQuizOpen(false);
      setShowInteractionGrid(false);
    } catch (err) {
      console.error("Error saving poll:", err);
      alert("Настана грешка при зачувување на активноста. Ве молиме обидете се повторно.");
    }
  };

  const handleDrop = async (toIndex) => {
    if (draggedIndex === null || draggedIndex === toIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...polls];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setPolls(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
    // Update active poll index if needed
    if (activePollIndex === draggedIndex) setActivePollIndex(toIndex);
    // Persist positions to DB
    await Promise.all(reordered.map((p, i) =>
      supabase.from('polls').update({ position: i }).eq('id', p.id)
    ));
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

  const onDeletePoll = async (pollId) => {
    if (window.confirm('Дали сте сигурни дека сакате да ја избришете оваа активност?')) {
      await supabase.from('polls').delete().eq('id', pollId);
    }
  };

  const onDuplicatePoll = async (poll) => {
    const { data: newPoll, error } = await supabase
      .from('polls')
      .insert([{ event_id: event.id, question: `${poll.question} (копија)`, type: poll.type, is_quiz: poll.is_quiz, position: polls.length }])
      .select().single();
    if (error || !newPoll) return;
    if (poll.options?.length > 0) {
      await supabase.from('options').insert(
        poll.options.map(o => ({ poll_id: newPoll.id, text: o.text, is_correct: o.is_correct || false }))
      );
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

  const goNext = () => { if (activePollIndex < polls.length - 1) setActivePoll(activePollIndex + 1); };
  const goPrev = () => { if (activePollIndex > 0) setActivePoll(activePollIndex - 1); };

  // Sync host timer display when switching polls
  useEffect(() => {
    const poll = polls[activePollIndex];
    if (poll?.timer_ends_at) {
      const remaining = Math.max(0, Math.round((new Date(poll.timer_ends_at) - Date.now()) / 1000));
      setTimerRemaining(remaining > 0 ? remaining : null);
    } else {
      setTimerRemaining(null);
    }
  }, [activePollIndex, polls]);

  const startTimer = async (seconds) => {
    const endsAt = new Date(Date.now() + seconds * 1000).toISOString();
    setTimerRemaining(seconds);
    const activePoll = polls[activePollIndex];
    if (activePoll) {
      await supabase.from('polls').update({ timer_ends_at: endsAt }).eq('id', activePoll.id);
    }
  };

  const stopTimer = async () => {
    setTimerRemaining(null);
    const activePoll = polls[activePollIndex];
    if (activePoll) {
      await supabase.from('polls').update({ timer_ends_at: null }).eq('id', activePoll.id);
    }
  };

  useEffect(() => {
    if (!timerRemaining) return;
    if (timerRemaining <= 0) { setTimerRemaining(null); return; }
    const t = setTimeout(() => setTimerRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [timerRemaining]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activePollIndex, polls]);

  if (loading) return <div className="pt-32 text-center font-bold">Се вчитува...</div>;
  if (!event) return <div className="pt-32 text-center font-bold text-red-500">Грешка.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 pt-12 pb-24">
      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} eventCode={event.code} />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={() => setIsSettingsOpen(false)}>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl z-10 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-[2rem]" />
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black">Поставки на настанот</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Multiple votes */}
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-black text-slate-900">Повеќекратно гласање</p>
                  <p className="text-sm text-slate-400 font-bold mt-0.5">Учесниците можат да гласаат повеќепати по Refresh</p>
                </div>
                <button
                  onClick={() => {
                    const next = !allowMultipleVotes;
                    setAllowMultipleVotes(next);
                    localStorage.setItem('setting_multiple_votes', String(next));
                  }}
                  className={`relative w-14 h-7 rounded-full transition-colors ${allowMultipleVotes ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${allowMultipleVotes ? 'translate-x-7' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Q&A moderation */}
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-black text-slate-900">Модерација на прашања</p>
                  <p className="text-sm text-slate-400 font-bold mt-0.5">Прашањата од публиката чекаат одобрување</p>
                </div>
                <button
                  onClick={async () => {
                    const next = !event.questions_moderation;
                    await supabase.from('events').update({ questions_moderation: next }).eq('id', event.id);
                    setEvent(prev => ({ ...prev, questions_moderation: next }));
                  }}
                  className={`relative w-14 h-7 rounded-full transition-colors ${event.questions_moderation ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${event.questions_moderation ? 'translate-x-7' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Event title */}
              <div className="p-5 bg-slate-50 rounded-2xl">
                <p className="font-black text-slate-900 mb-3">Наслов на настанот</p>
                <input
                  type="text"
                  defaultValue={event.title || ''}
                  onBlur={async (e) => {
                    if (e.target.value.trim()) {
                      await supabase.from('events').update({ title: e.target.value.trim() }).eq('id', event.id);
                    }
                  }}
                  className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold focus:border-indigo-600 outline-none transition-all"
                  placeholder="Мојот настан"
                />
              </div>

              {/* Co-host */}
              <div className="p-5 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus className="w-4 h-4 text-slate-600" />
                  <p className="font-black text-slate-900">Ко-домаќин</p>
                </div>
                <p className="text-sm text-slate-400 font-bold mb-4">Сподели пристап до овој настан со колега</p>
                {event.cohost_code ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-white border-2 border-indigo-100 rounded-xl px-4 py-3">
                      <span className="flex-1 font-black text-indigo-700 tracking-widest text-lg">{event.cohost_code}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(event.cohost_code);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Копирај"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Ко-домаќинот го внесува овој код на почетната страница
                    </p>
                    <button
                      onClick={async () => {
                        await supabase.from('events').update({ cohost_code: null }).eq('id', event.id);
                        setEvent(prev => ({ ...prev, cohost_code: null }));
                      }}
                      className="text-xs font-black text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest"
                    >
                      Откажи ко-домаќин пристап
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      const code = Math.random().toString(36).slice(2, 10).toUpperCase();
                      await supabase.from('events').update({ cohost_code: code }).eq('id', event.id);
                      setEvent(prev => ({ ...prev, cohost_code: code }));
                    }}
                    className="w-full py-3 bg-white border-2 border-dashed border-slate-200 text-slate-500 rounded-xl font-black text-sm hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Генерирај ко-домаќин код
                  </button>
                )}
              </div>

              {/* Event password */}
              <div className="p-5 bg-slate-50 rounded-2xl">
                <p className="font-black text-slate-900 mb-1">Лозинка за настанот</p>
                <p className="text-sm text-slate-400 font-bold mb-3">Учесниците мора да ја внесат пред да влезат</p>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    defaultValue={event.password || ''}
                    onBlur={async (e) => {
                      const val = e.target.value.trim() || null;
                      await supabase.from('events').update({ password: val }).eq('id', event.id);
                      setEvent(prev => ({ ...prev, password: val }));
                    }}
                    placeholder="Без лозинка"
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold focus:border-indigo-600 outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {event.password && (
                  <p className="mt-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    🔒 Настанот е заштитен со лозинка
                  </p>
                )}
              </div>

              {/* Brand color */}
              <div className="p-5 bg-slate-50 rounded-2xl">
                <p className="font-black text-slate-900 mb-1">Брендирачка боја</p>
                <p className="text-sm text-slate-400 font-bold mb-4">Акцентна боја во Презентерот</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#0ea5e9'].map(c => (
                    <button
                      key={c}
                      onClick={async () => {
                        await supabase.from('events').update({ brand_color: c }).eq('id', event.id);
                        setEvent(prev => ({ ...prev, brand_color: c }));
                      }}
                      className="w-9 h-9 rounded-full border-4 transition-all hover:scale-110 active:scale-95"
                      style={{
                        backgroundColor: c,
                        borderColor: (event.brand_color || '#6366f1') === c ? c : 'transparent',
                        boxShadow: (event.brand_color || '#6366f1') === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none',
                      }}
                    />
                  ))}
                  <label className="w-9 h-9 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-all overflow-hidden relative" title="Прилагодена боја">
                    <span className="text-slate-400 text-xs font-black">+</span>
                    <input
                      type="color"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      value={event.brand_color || '#6366f1'}
                      onChange={async (e) => {
                        await supabase.from('events').update({ brand_color: e.target.value }).eq('id', event.id);
                        setEvent(prev => ({ ...prev, brand_color: e.target.value }));
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Embed code */}
              <div className="p-5 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-black text-slate-900">Embed / iFrame</p>
                </div>
                <p className="text-sm text-slate-400 font-bold mb-3">Вградете ги анкетите на вашата веб-страница</p>
                <div className="relative">
                  <textarea
                    readOnly
                    rows={3}
                    value={`<iframe src="${window.location.origin}/event/${event.code}/embed" width="100%" height="480" frameborder="0" style="border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)"></iframe>`}
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-mono text-xs text-slate-600 resize-none focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`<iframe src="${window.location.origin}/event/${event.code}/embed" width="100%" height="480" frameborder="0" style="border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)"></iframe>`);
                  }}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-100 text-slate-500 rounded-xl font-black text-xs hover:border-indigo-300 hover:text-indigo-600 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" /> Копирај iFrame код
                </button>
              </div>

              {/* Logo upload */}
              <div className="p-5 bg-slate-50 rounded-2xl">
                <p className="font-black text-slate-900 mb-1">Лого</p>
                <p className="text-sm text-slate-400 font-bold mb-4">Се прикажува во Презентерот наместо MKD Slidea</p>
                <div className="flex items-center gap-4">
                  {event.logo_url ? (
                    <div className="relative group">
                      <img src={event.logo_url} alt="Лого" className="h-14 w-auto max-w-[120px] object-contain rounded-xl bg-white border border-slate-200 p-1" />
                      <button
                        onClick={async () => {
                          await supabase.from('events').update({ logo_url: null }).eq('id', event.id);
                          setEvent(prev => ({ ...prev, logo_url: null }));
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >✕</button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 font-black text-xl">?</div>
                  )}
                  <label className="flex-1 flex flex-col items-center justify-center px-4 py-4 bg-white border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                    <span className="text-sm font-black text-slate-500">Прикачи слика</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">PNG, JPG, SVG до 2MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || file.size > 2 * 1024 * 1024) return;
                        const ext = file.name.split('.').pop();
                        const path = `${event.id}.${ext}`;
                        const { error } = await supabase.storage.from('event-logos').upload(path, file, { upsert: true });
                        if (error) { alert('Грешка при прикачување. Проверете дали bucket-от постои.'); return; }
                        const { data: urlData } = supabase.storage.from('event-logos').getPublicUrl(path);
                        await supabase.from('events').update({ logo_url: urlData.publicUrl }).eq('id', event.id);
                        setEvent(prev => ({ ...prev, logo_url: urlData.publicUrl }));
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all"
            >
              Зачувај и затвори
            </button>
          </div>
        </div>
      )}
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
        user={user}
      />
      <ExportPDFModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        event={event}
        polls={polls}
      />
      <ParticipantStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        event={event}
        polls={polls}
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
                <InteractionTypeGrid user={user} onSelect={handleInteractionSelect} />
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
                      {polls.length > 0 && (
                        <>
                          <button
                            onClick={() => setIsStatsOpen(true)}
                            className="flex items-center justify-center gap-2 px-5 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                            title="Статистики по учесник"
                          >
                            <BarChart2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setIsExportOpen(true)}
                            className="flex items-center justify-center gap-2 px-5 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                            title="Извоз PDF"
                          >
                            <FileDown className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center justify-center gap-2 px-5 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:border-slate-300 hover:text-slate-700 transition-all shadow-sm active:scale-95"
                        title="Поставки"
                      >
                        <Settings className="w-5 h-5" />
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
                      <div className="space-y-4">
                        {/* Navigation bar */}
                        <div className="flex items-center justify-between bg-slate-900 text-white rounded-2xl px-6 py-3 gap-4 flex-wrap">
                          <button onClick={goPrev} disabled={activePollIndex === 0}
                            className="flex items-center gap-2 font-black text-sm disabled:opacity-30 hover:text-indigo-400 transition-colors disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-5 h-5" /> Претходна
                          </button>

                          {/* Timer controls */}
                          <div className="flex items-center gap-2">
                            {timerRemaining > 0 ? (
                              <>
                                <span className={`font-black text-2xl tabular-nums ${timerRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                  {String(Math.floor(timerRemaining / 60)).padStart(2,'0')}:{String(timerRemaining % 60).padStart(2,'0')}
                                </span>
                                <button onClick={stopTimer} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-xs transition-all">
                                  <Square className="w-3 h-3" /> Стоп
                                </button>
                              </>
                            ) : (
                              <>
                                <Timer className="w-4 h-4 text-slate-400" />
                                {[15, 30, 60, 90].map(s => (
                                  <button key={s} onClick={() => startTimer(s)}
                                    className="px-3 py-1.5 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl font-black text-xs transition-all"
                                  >
                                    {s}s
                                  </button>
                                ))}
                              </>
                            )}
                          </div>

                          <button onClick={goNext} disabled={activePollIndex === polls.length - 1}
                            className="flex items-center gap-2 font-black text-sm disabled:opacity-30 hover:text-indigo-400 transition-colors disabled:cursor-not-allowed"
                          >
                            Следна <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                        {/* Moderation queue */}
                        {(() => {
                          const activePoll = polls[activePollIndex];
                          const pending = activePoll?.needs_moderation
                            ? (activePoll.options || []).filter(o => o.is_approved === false)
                            : [];
                          if (!pending.length) return null;
                          return (
                            <div className="bg-violet-50 border-2 border-violet-200 rounded-[2rem] p-6 mb-2">
                              <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-5 h-5 text-violet-600" />
                                <span className="font-black text-violet-700 uppercase tracking-widest text-xs">Чекаат одобрување ({pending.length})</span>
                              </div>
                              <div className="space-y-2">
                                {pending.map(opt => (
                                  <div key={opt.id} className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 border border-violet-100">
                                    <span className="font-bold text-slate-700">{opt.text}</span>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={async () => {
                                          await supabase.from('options').update({ is_approved: true }).eq('id', opt.id);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs transition-all"
                                      >
                                        <Check size={14} /> Одобри
                                      </button>
                                      <button
                                        onClick={async () => {
                                          await supabase.from('options').delete().eq('id', opt.id);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-black text-xs transition-all"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        {/* Q&A moderation queue */}
                        {pendingQuestions.length > 0 && (
                          <div className="bg-sky-50 border-2 border-sky-200 rounded-[2rem] p-6 mb-2">
                            <div className="flex items-center gap-2 mb-4">
                              <MessageSquare className="w-5 h-5 text-sky-600" />
                              <span className="font-black text-sky-700 uppercase tracking-widest text-xs">Прашања — чекаат одобрување ({pendingQuestions.length})</span>
                            </div>
                            <div className="space-y-2">
                              {pendingQuestions.map(q => (
                                <div key={q.id} className="flex items-start justify-between bg-white rounded-2xl px-5 py-3 border border-sky-100 gap-4">
                                  <div>
                                    <p className="font-bold text-slate-700">{q.text}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{q.author}</p>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <button
                                      onClick={async () => {
                                        await supabase.from('questions').update({ is_approved: true }).eq('id', q.id);
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs transition-all"
                                    >
                                      <Check size={14} /> Одобри
                                    </button>
                                    <button
                                      onClick={async () => {
                                        await supabase.from('questions').delete().eq('id', q.id);
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-black text-xs transition-all"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {polls.map((poll, index) => (
                            <div
                              key={poll.id}
                              draggable
                              onDragStart={() => setDraggedIndex(index)}
                              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                              onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
                              onDrop={() => handleDrop(index)}
                              className={`transition-all ${dragOverIndex === index && draggedIndex !== index ? 'scale-[1.02] ring-2 ring-indigo-400 ring-offset-2 rounded-[2rem]' : ''} ${draggedIndex === index ? 'opacity-40' : ''}`}
                            >
                              <PollCard
                                poll={poll}
                                index={index}
                                activePollIndex={activePollIndex}
                                setActivePoll={setActivePoll}
                                onEdit={onEditPoll}
                                onDelete={onDeletePoll}
                                onDuplicate={onDuplicatePoll}
                                onPollUpdated={() => {
                                  supabase.from('polls').select('*, options(*)').eq('event_id', event.id).order('position', { ascending: true }).order('created_at', { ascending: true }).then(({ data }) => { if (data) setPolls(data); });
                                }}
                              />
                            </div>
                          ))}
                        </div>
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
