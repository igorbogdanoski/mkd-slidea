import { useState, useEffect, useRef } from 'react';
import { track } from '@vercel/analytics';
import { supabase } from '../lib/supabase';
import { getAuthHeader } from '../lib/authHeader';
import { generateCode } from '../lib/eventCode';
import { useLiveAnnouncer } from './useLiveAnnouncer';

const getHostSessionId = () => {
  try {
    let sid = localStorage.getItem('mkd_host_session_id');
    if (!sid) {
      sid = crypto.randomUUID?.() || `host-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('mkd_host_session_id', sid);
    }
    return sid;
  } catch {
    // Safari private mode / storage quota exceeded — fall back to a
    // session-only id instead of throwing inside a render/effect.
    return `host-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
};

// Retries with a fresh random code on a UNIQUE constraint collision instead
// of leaving the host stuck with a silent failure.
const createEventWithRetry = async (userId, attempts = 5) => {
  for (let i = 0; i < attempts; i++) {
    const code = generateCode(6);
    const { data, error } = await supabase
      .from('events')
      .insert([{ code, title: 'Мојот настан', user_id: userId || null }])
      .select()
      .single();
    if (!error) return { data, code };
    if (error.code !== '23505') return { data: null, error };
  }
  return { data: null, error: new Error('Не успеа да се генерира уникатен код по неколку обиди.') };
};

const autoGenerateCover = async (eventId, title) => {
  try {
    const seed = Math.floor(Math.random() * 1_000_000);
    const safeTitle = (title || 'education').replace(/[^\w\s]/g, '').trim() || 'education';
    const prompt = `${safeTitle}, educational presentation cover, vibrant flat illustration, clean colorful background`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=576&nologo=true&seed=${seed}`;
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
      setTimeout(reject, 45000);
    });
    await supabase.from('events').update({ cover_image: url }).eq('id', eventId);
  } catch { /* best-effort — never blocks the UI */ }
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
        const { data, code, error } = await createEventWithRetry(user?.id);
        if (!error) {
          localStorage.setItem('active_event_code', code);
          setEvent(data);
          autoGenerateCover(data.id, data.title);
          track('event_created');
        } else {
          alert('Не успеа да се создаде настан. Ве молиме обидете се повторно.');
        }
      } else {
        const { data } = await supabase.from('events').select('*').eq('code', eventCode).single();
        if (data) {
          setEvent(data);
        } else {
          // Stored code no longer exists — clear it and create a fresh event
          localStorage.removeItem('active_event_code');
          const { data: newData, code, error } = await createEventWithRetry(user?.id);
          if (!error) {
            localStorage.setItem('active_event_code', code);
            setEvent(newData);
            track('event_created');
          } else {
            alert('Не успеа да се создаде настан. Ве молиме обидете се повторно.');
          }
        }
      }
      setLoading(false);
    };
    initEvent();
  }, []);

  useEffect(() => {
    if (!event?.id) return;
    const eventId = event.id;
    const fetchPolls = async () => {
      const { data } = await supabase.from('polls').select('*, options(*)').eq('event_id', eventId).order('position', { ascending: true }).order('created_at', { ascending: true });
      if (data) setPolls(data);
    };
    const fetchPendingQuestions = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('event_id', eventId)
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
      .channel(`host_polls_${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls', filter: `event_id=eq.${eventId}` }, fetchPolls)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'options', filter: `event_id=eq.${eventId}` }, fetchPolls)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `event_id=eq.${eventId}` }, fetchPendingQuestions)
      .subscribe();
    // Polling fallback: realtime alone can miss bursts of new wordcloud options
    const interval = setInterval(fetchPolls, 4000);
    return () => { sub.unsubscribe(); clearInterval(interval); };
  }, [event?.id]);

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
            const { error: fallbackError } = await supabase.from('events').update({ active_poll_id: nextPoll.id }).eq('code', event.code);
            return !fallbackError;
          }
          return false;
        } catch {
          if (attempt === 2) return false;
          await new Promise(r => setTimeout(r, 100 + attempt * 150));
        }
      }
      return false;
    };
    dbUpdateWithRetry().then((ok) => {
      // Local state and the broadcast/presence channels already advanced
      // optimistically above — if the DB write itself never landed, late
      // joiners would read a stale active_poll_id with no indication anything
      // went wrong, so surface it instead of failing silently.
      if (!ok) alert('Синхронизацијата со учесниците не успеа. Освежи ја страницата за да провериш дека сите гледаат исто прашање.');
    });
  };

  const goNext = () => { if (activePollIndex < polls.length - 1) setActivePoll(activePollIndex + 1); };
  const goPrev = () => { if (activePollIndex > 0) setActivePoll(activePollIndex - 1); };

  const onSavePoll = async (pollData, editingPoll) => {
    try {
      if (editingPoll) {
        const updatePayload = {
          question: pollData.question,
          type: pollData.type || 'poll',
          is_quiz: !!pollData.is_quiz,
          presenter_notes: pollData.presenter_notes ?? null,
          curriculum_tags: pollData.curriculum_tags ?? null,
          cover_url: pollData.cover_url ?? null,
          cover_meta: pollData.cover_meta ?? null,
        };
        // Editing a survey poll previously never touched survey_questions —
        // only top-level fields updated, so sub-question edits were silently
        // discarded. Only set it when the form actually sent one (undefined
        // for non-survey types) so this doesn't wipe it on other edits.
        if (pollData.survey_questions !== undefined) {
          updatePayload.survey_questions = pollData.survey_questions;
        }
        const { error: updateError } = await supabase
          .from('polls')
          .update(updatePayload)
          .eq('id', editingPoll.id);
        if (updateError) throw updateError;

        if (pollData.options) {
          let optionsPayload = [];
          if (pollData.type === 'rating') {
            optionsPayload = ['1', '2', '3', '4', '5'].map(val => ({ text: val, is_correct: false }));
          } else {
            optionsPayload = pollData.options.map(o => ({
              text: typeof o === 'string' ? o : o.text,
              is_correct: o.is_correct || false,
              label: (typeof o === 'string' ? null : o.label) || null,
            }));
          }

          // Update existing option rows in place (by id) for overlapping slots
          // instead of delete-then-insert. Delete-then-insert briefly leaves
          // both old and new options coexisting, and any vote cast on an
          // old option in that window is lost when the row is deleted.
          // Updating in place preserves vote counts and never creates a
          // transient duplicate state.
          const { data: existingOpts } = await supabase
            .from('options')
            .select('id')
            .eq('poll_id', editingPoll.id)
            .order('created_at', { ascending: true });
          const existing = existingOpts || [];

          const updates = optionsPayload.slice(0, existing.length).map((opt, i) =>
            supabase.from('options').update(opt).eq('id', existing[i].id)
          );
          if (updates.length > 0) await Promise.all(updates);

          if (optionsPayload.length > existing.length) {
            const toInsert = optionsPayload.slice(existing.length).map(opt => ({ ...opt, poll_id: editingPoll.id }));
            const { error: optError } = await supabase.from('options').insert(toInsert);
            if (optError) throw optError;
          } else if (existing.length > optionsPayload.length) {
            const toDeleteIds = existing.slice(optionsPayload.length).map(o => o.id);
            await supabase.from('options').delete().in('id', toDeleteIds);
          }
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
          cover_url: pollData.cover_url ?? null,
          cover_meta: pollData.cover_meta ?? null,
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
              label: (typeof o === 'string' ? null : o.label) || null,
            }));
          }
          const { error: optError } = await supabase.from('options').insert(optionsToInsert);
          if (optError) throw optError;
        }
      }
      return true;
    } catch (err) {
      console.error('Error saving poll:', err);
      alert('Настана грешка при зачувување на активноста. Ве молиме обидете се повторно.');
      return false;
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
      const isActive = polls[activePollIndex]?.id === pollId;
      await supabase.from('polls').delete().eq('id', pollId);
      if (isActive && polls.length > 1) {
        // Navigate away before realtime removes it from the array
        const safeIndex = activePollIndex > 0 ? activePollIndex - 1 : 1;
        setActivePoll(safeIndex);
      }
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
    let succeeded = 0;
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
        succeeded++;
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
      succeeded++;
    }
    return { succeeded, failed: slides.length - succeeded, total: slides.length };
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
          ...(await getAuthHeader()),
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
    const endedAt = new Date().toISOString();
    await supabase.from('events').update({ is_locked: true, active_poll_id: null, ended_at: endedAt }).eq('id', event.id);
    setEvent(prev => ({ ...prev, is_locked: true, active_poll_id: null, ended_at: endedAt }));
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

  // Lives on events.allow_multiple_votes, not localStorage — participants on
  // other devices need to read it too, not just this host's own browser.
  const setAllowMultipleVotes = async (next) => {
    setEvent(prev => (prev ? { ...prev, allow_multiple_votes: next } : prev));
    await supabase.from('events').update({ allow_multiple_votes: next }).eq('id', event.id);
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
    setAllowMultipleVotes,
    refreshPolls,
  };
};
