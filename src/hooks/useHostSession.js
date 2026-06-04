import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLiveAnnouncer } from './useLiveAnnouncer';

const getHostSessionId = () => {
  let sid = localStorage.getItem('mkd_host_session_id');
  if (!sid) {
    sid = crypto.randomUUID?.() || `host-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('mkd_host_session_id', sid);
  }
  return sid;
};

export const useHostSession = (user) => {
  const { announce } = useLiveAnnouncer();
  const [event, setEvent] = useState(null);
  const [polls, setPolls] = useState([]);
  const [activePollIndex, setActivePollIndex] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [recapSending, setRecapSending] = useState(false);
  const [recapSent, setRecapSent] = useState(false);
  const pollIndexInitialized = useRef(false);
  const navChannelRef = useRef(null);
  const presenceChannelRef = useRef(null);

  useEffect(() => {
    const initEvent = async () => {
      let eventCode = localStorage.getItem('active_event_code');
      if (!eventCode) {
        eventCode = Array.from(crypto.getRandomValues(new Uint8Array(4)))
          .map(b => b.toString(36)).join('').toUpperCase().slice(0, 6);
        const { data, error } = await supabase
          .from('events')
          .insert([{ code: eventCode, title: 'Мојот настан', user_id: user?.id || null }])
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
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true });

      if (error) {
        setPendingQuestions([]);
        return;
      }

      const rows = data || [];
      const activeOnly = rows.filter((q) => {
        if (Object.prototype.hasOwnProperty.call(q, 'is_answered')) {
          return q.is_answered === false;
        }
        return true;
      });
      const hasApprovalFlag = activeOnly.some((q) => Object.prototype.hasOwnProperty.call(q, 'is_approved'));
      setPendingQuestions(hasApprovalFlag ? activeOnly.filter((q) => q.is_approved === false) : activeOnly);
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

  useEffect(() => {
    if (pollIndexInitialized.current || !event?.active_poll_id || polls.length === 0) return;
    const idx = polls.findIndex((p) => p.id === event.active_poll_id);
    if (idx > 0) setActivePollIndex(idx);
    pollIndexInitialized.current = true;
  }, [polls, event?.active_poll_id]);

  useEffect(() => {
    if (!event?.id) return;
    const navChannel = supabase.channel(`event-nav-${event.id}`);
    navChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') navChannelRef.current = navChannel;
    });
    return () => {
      navChannelRef.current = null;
      supabase.removeChannel(navChannel);
    };
  }, [event?.id]);

  useEffect(() => {
    if (!event?.id) return;
    const presenceChannel = supabase.channel(`presence:${event.id}`, {
      config: { presence: { key: `host-${getHostSessionId()}` } }
    });
    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          role: 'host',
          active_poll_id: event.active_poll_id || null,
          online_at: new Date().toISOString(),
        });
      }
    });
    presenceChannelRef.current = presenceChannel;
    return () => {
      presenceChannelRef.current = null;
      supabase.removeChannel(presenceChannel);
    };
  }, [event?.id]);

  useEffect(() => {
    const poll = polls[activePollIndex];
    if (poll?.timer_ends_at) {
      const remaining = Math.max(0, Math.round((new Date(poll.timer_ends_at) - Date.now()) / 1000));
      setTimerRemaining(remaining > 0 ? remaining : null);
    } else {
      setTimerRemaining(null);
    }
  }, [activePollIndex, polls]);

  useEffect(() => {
    if (!timerRemaining) return;
    if (timerRemaining <= 0) { setTimerRemaining(null); return; }
    const t = setTimeout(() => setTimerRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [timerRemaining]);

  const refreshPolls = async () => {
    if (!event?.id) return;
    const { data } = await supabase.from('polls').select('*, options(*)').eq('event_id', event.id).order('position', { ascending: true }).order('created_at', { ascending: true });
    if (data) setPolls(data);
  };

  const sendPushToParticipants = async (poll) => {
    if (!event?.code) return;
    const label = poll.type === 'quiz' ? '🧠 Нов квиз' : poll.type === 'survey' ? '📋 Нова анкета' : '📊 Ново прашање';
    const q = poll.question ? poll.question.slice(0, 80) : '';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      await fetch('/api/push-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          eventCode: event.code,
          title: label,
          body: q,
          url: `/join/${event.code}`,
        }),
      });
    } catch { /* push is best-effort */ }
  };

  const setActivePoll = async (index) => {
    const nextPoll = polls[index];
    if (!nextPoll) return;

    setActivePollIndex(index);
    setEvent((prev) => (prev ? { ...prev, active_poll_id: nextPoll.id } : prev));
    announce(`Активна активност ${index + 1} од ${polls.length}: ${nextPoll.question || 'без наслов'}`);

    sendPushToParticipants(nextPoll);

    if (navChannelRef.current) {
      navChannelRef.current.send({
        type: 'broadcast',
        event: 'active-poll',
        payload: { event_id: event.id, active_poll_id: nextPoll.id },
      }).catch(() => {});
    }

    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({
        role: 'host',
        active_poll_id: nextPoll.id,
        online_at: new Date().toISOString(),
      }).catch(() => {});
    }

    const dbUpdateWithRetry = async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { error } = await supabase
            .from('events')
            .update({ active_poll_id: nextPoll.id })
            .eq('id', event.id);
          if (!error) return true;
          const isLockError = String(error.message || '').includes('lock:sb-');
          if (isLockError && attempt < 2) {
            await new Promise(r => setTimeout(r, 100 + attempt * 150));
            continue;
          }
          if (attempt === 2) {
            await supabase.from('events').update({ active_poll_id: nextPoll.id }).eq('code', event.code).catch(() => {});
          }
          return true;
        } catch (e) {
          if (attempt === 2) return true;
          await new Promise(r => setTimeout(r, 100 + attempt * 150));
        }
      }
      return true;
    };
    dbUpdateWithRetry();
  };

  const goNext = () => { if (activePollIndex < polls.length - 1) setActivePoll(activePollIndex + 1); };
  const goPrev = () => { if (activePollIndex > 0) setActivePoll(activePollIndex - 1); };

  const onSavePoll = async (pollData, editingPoll) => {
    try {
      if (editingPoll) {
        const { error: updateError } = await supabase
          .from('polls')
          .update({
            question: pollData.question,
            type: pollData.type || 'poll',
            is_quiz: !!pollData.is_quiz,
            presenter_notes: pollData.presenter_notes ?? null,
            curriculum_tags: pollData.curriculum_tags ?? null,
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
              is_correct: o.is_correct || false,
            }));
          }
          const { error: optError } = await supabase.from('options').insert(optionsToInsert);
          if (optError) throw optError;
        }
      } else {
        const { data: newPoll, error: pollError } = await supabase.from('polls').insert([{
          event_id: event.id,
          question: pollData.question,
          is_quiz: !!pollData.is_quiz,
          type: pollData.type || 'poll',
          survey_questions: pollData.survey_questions || [],
          presenter_notes: pollData.presenter_notes ?? null,
          curriculum_tags: pollData.curriculum_tags ?? null,
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
              is_correct: o.is_correct || false,
            }));
          }
          const { error: optError } = await supabase.from('options').insert(optionsToInsert);
          if (optError) throw optError;
        }
      }
    } catch (err) {
      console.error('Error saving poll:', err);
      alert('Настана грешка при зачувување на активноста. Ве молиме обидете се повторно.');
    }
  };

  const applyStarterTemplate = async (template) => {
    if (!event?.id) return;
    try {
      let basePosition = polls.length;
      for (const p of template.polls) {
        const { data: newPoll, error: pollError } = await supabase.from('polls').insert([{
          event_id: event.id,
          question: p.question,
          is_quiz: !!p.is_quiz,
          type: p.type || 'poll',
          position: basePosition++,
        }]).select().single();
        if (pollError) throw pollError;
        if (Array.isArray(p.options) && p.options.length > 0) {
          let optionsToInsert = [];
          if (p.type === 'rating') {
            optionsToInsert = ['1', '2', '3', '4', '5'].map(val => ({ poll_id: newPoll.id, text: val }));
          } else {
            optionsToInsert = p.options.map(o => ({
              poll_id: newPoll.id,
              text: typeof o === 'string' ? o : o.text,
              is_correct: o.is_correct || false,
            }));
          }
          const { error: optError } = await supabase.from('options').insert(optionsToInsert);
          if (optError) throw optError;
        }
      }
      const { data } = await supabase.from('polls').select('*, options(*)').eq('event_id', event.id).order('position', { ascending: true }).order('created_at', { ascending: true });
      if (data) setPolls(data);
    } catch (err) {
      console.error('Apply template failed:', err);
      alert('Грешка при применување на шаблонот.');
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
    if (activePollIndex === draggedIndex) setActivePollIndex(toIndex);
    await Promise.all(reordered.map((p, i) =>
      supabase.from('polls').update({ position: i }).eq('id', p.id)
    ));
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

  const handlePPTXImport = async (slides, pollType) => {
    for (const slide of slides) {
      if (pollType === 'ai' && slide._aiPoll) {
        const ai = slide._aiPoll;
        const { data: newPoll, error: pollError } = await supabase.from('polls').insert([{
          event_id: event.id,
          question: ai.question,
          type: ai.type || 'quiz',
          is_quiz: !!ai.is_quiz,
        }]).select().single();
        if (pollError) continue;
        const opts = (ai.options || [])
          .filter((o) => o && typeof o.text === 'string' && o.text.trim())
          .slice(0, 8);
        if (opts.length > 0) {
          await supabase.from('options').insert(opts.map((o) => ({
            poll_id: newPoll.id,
            text: o.text.trim().slice(0, 300),
            is_correct: !!o.is_correct,
          })));
        }
        continue;
      }

      const { data: newPoll, error: pollError } = await supabase.from('polls').insert([{
        event_id: event.id,
        question: slide.title,
        type: pollType,
        is_quiz: false,
      }]).select().single();
      if (pollError) continue;
      if (pollType === 'poll') {
        const opts = slide.allText.filter(t => t !== slide.title).slice(0, 8);
        if (opts.length > 0) {
          await supabase.from('options').insert(opts.map(text => ({ poll_id: newPoll.id, text })));
        }
      }
    }
  };

  const resetAllResults = async () => {
    if (!window.confirm('Дали сте сигурни? Сите резултати ќе бидат избришани и учесниците ќе можат да гласаат повторно.')) return;
    const pollIds = polls.map(p => p.id);
    if (pollIds.length === 0) return;
    await supabase.from('options').update({ votes: 0 }).in('poll_id', pollIds);
    await supabase.from('votes').delete().in('poll_id', pollIds);
  };

  const exportToCSV = async () => {
    const today = new Date().toLocaleDateString('mk-MK');
    const rows = [
      ['MKD Slidea — Извештај за резултати'],
      [`Настан: ${event.title || ''}`, `Код: ${event.code}`, `Датум: ${today}`],
      [],
      ['Прашање', 'Тип', 'Одговор', 'Гласови', '%', 'Точен'],
    ];
    for (const poll of polls) {
      const opts = (poll.options || []).filter(o => o.is_approved !== false);
      const total = opts.reduce((s, o) => s + (o.votes || 0), 0);
      const typeLabel = poll.is_quiz ? 'Квиз' : { poll: 'Анкета', wordcloud: 'Облак', open: 'Отворен текст', rating: 'Оценување', ranking: 'Рангирање', scale: 'Скала', survey: 'Формулар' }[poll.type] || 'Анкета';
      if (opts.length === 0) {
        rows.push([poll.question, typeLabel, '—', 0, '0%', '']);
      } else {
        opts.sort((a, b) => (b.votes || 0) - (a.votes || 0)).forEach((opt, i) => {
          const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
          rows.push([
            i === 0 ? poll.question : '',
            i === 0 ? typeLabel : '',
            opt.text,
            opt.votes || 0,
            `${pct}%`,
            poll.is_quiz ? (opt.is_correct ? 'Да' : 'Не') : '',
          ]);
        });
      }
      rows.push([]);
    }
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slidea-${event.code}-${today.replace(/\./g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendSessionRecap = async () => {
    if (!event?.id || recapSending || recapSent) return;
    setRecapSending(true);
    try {
      const res = await fetch('/api/email/session-recap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-plan': user?.plan || 'free',
        },
        body: JSON.stringify({ event_id: event.id }),
      });
      if (res.ok) setRecapSent(true);
    } catch { /* ignore */ }
    setRecapSending(false);
  };

  const publishTemplate = async ({ title, category, description }) => {
    if (!event || polls.length === 0) {
      alert('Нема активности за објавување.');
      return;
    }
    const payload = polls.map((p) => ({
      question: p.question,
      type: p.type || 'poll',
      is_quiz: !!p.is_quiz,
      options: (p.options || []).map((o) => ({ text: o.text, is_correct: !!o.is_correct })),
    }));
    const { error } = await supabase.from('community_templates').insert([{
      user_id: user?.id || null,
      title,
      category: category || 'Community',
      description: description || null,
      polls: payload,
      is_public: true,
    }]);
    if (error) {
      alert('Грешка при објавување: ' + error.message);
      return;
    }
    alert('Шаблонот е успешно објавен во Community библиотеката.');
  };

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

  const endSession = async () => {
    await supabase.from('events').update({ is_locked: true, active_poll_id: null }).eq('id', event.id);
    setEvent(prev => ({ ...prev, is_locked: true, active_poll_id: null }));
    setActivePollIndex(0);
    pollIndexInitialized.current = false;
    localStorage.removeItem('active_event_code');
  };

  const toggleLock = async () => {
    const next = !event.is_locked;
    await supabase.from('events').update({ is_locked: next }).eq('id', event.id);
    setEvent(prev => ({ ...prev, is_locked: next }));
    return next;
  };

  const adaptiveSuggestion = (() => {
    const lastQuiz = [...polls].reverse().find(p => p.is_quiz && Array.isArray(p.options) && p.options.length);
    if (!lastQuiz) return null;
    const correctOpts = lastQuiz.options.filter(o => o.is_correct);
    const totalVotes = lastQuiz.options.reduce((a, o) => a + (o.votes || 0), 0);
    if (!totalVotes || !correctOpts.length) return null;
    const correctVotes = correctOpts.reduce((a, o) => a + (o.votes || 0), 0);
    const acc = correctVotes / totalVotes;
    if (acc >= 0.8) return { bloom: 'analyze',    accuracy: acc, label: 'Класот блеска — пробај потежок Bloom: Анализа' };
    if (acc >= 0.4) return { bloom: 'apply',      accuracy: acc, label: 'Стабилно знаење — задржи го Bloom: Примена' };
    return              { bloom: 'understand', accuracy: acc, label: 'Има простор за повторување — Bloom: Разбирање' };
  })();

  return {
    event, setEvent,
    polls, setPolls,
    loading,
    activePollIndex, setActivePollIndex,
    pendingQuestions,
    timerRemaining,
    recapSending,
    recapSent,
    draggedIndex, setDraggedIndex,
    dragOverIndex, setDragOverIndex,
    pollIndexInitialized,
    adaptiveSuggestion,
    setActivePoll,
    goNext,
    goPrev,
    onSavePoll,
    applyStarterTemplate,
    handleDrop,
    onDeletePoll,
    onDuplicatePoll,
    handlePPTXImport,
    resetAllResults,
    exportToCSV,
    sendSessionRecap,
    publishTemplate,
    startTimer,
    stopTimer,
    endSession,
    toggleLock,
    refreshPolls,
  };
};
