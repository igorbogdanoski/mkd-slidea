import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, warmUp } from '../lib/supabase';
import { pipelineQuestions } from '../lib/questionsCore';

export const useEvent = (eventCode) => {
  const [event, setEvent] = useState(null);
  const [polls, setPolls] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reactions, setReactions] = useState([]);
  const lastRealtimeNavAtRef = useRef(0);
  const hasRealtimeNavRef = useRef(false);
  const lastRealtimePollsAtRef = useRef(0);
  const reactionChannelRef = useRef(null);
  const reactionTimeoutsRef = useRef(new Set());

  const fetchPolls = useCallback(async (eventId) => {
    const { data } = await supabase
      .from('polls')
      .select('*, options(*)')
      .eq('event_id', eventId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    setPolls(data || []);
  }, []);

  const fetchQuestions = useCallback(async (eventId) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('event_id', eventId)
      .order('votes', { ascending: false });

    if (error) {
      setQuestions([]);
      return;
    }

    setQuestions(pipelineQuestions(data || []));
  }, []);

  useEffect(() => {
    if (!eventCode) return;

    const normalizedCode = String(eventCode).replace(/^#/, '').trim().toUpperCase();
    if (!normalizedCode) return;

    let mounted = true;

    const initializeEvent = async () => {
      try {
        setLoading(true);

        // Proactively warm REST/Auth endpoints without blocking too long
        await Promise.race([
          warmUp(),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);

        // Retry once on failure — handles transient auth state in new tabs
        let eventData = null;
        let eventError = null;
        for (let attempt = 0; attempt < 4; attempt++) {
          // SECURITY: explicit column list — password & cohost_code are
          // revoked from the anon role and must not be requested here.
          const { data, error } = await supabase
            .from('events')
            .select('id, code, title, created_at, active_poll_id, is_locked, async_mode, async_deadline, questions_moderation, brand_color, logo_url, user_id, has_password, allow_multiple_votes, ended_at')
            .ilike('code', normalizedCode)
            .order('created_at', { ascending: false })
            .limit(1);

          eventError = error;
          eventData = Array.isArray(data) && data.length > 0 ? data[0] : null;

          if (!eventError && eventData) break;
          if (attempt < 3) {
            const backoff = [1200, 1800, 2500][attempt] || 2500;
            await new Promise((r) => setTimeout(r, backoff));
          }
        }

        // Fallback for strict/legacy RLS setups: security-definer RPC
        if (!eventData) {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_event_by_code', { p_code: normalizedCode });
          if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
            eventData = rpcData[0];
            eventError = null;
          } else if (rpcError) {
            eventError = rpcError;
          }
        }

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Настанот не е пронајден.');
        if (mounted) {
          setEvent(eventData);
          await Promise.all([
            fetchPolls(eventData.id),
            fetchQuestions(eventData.id)
          ]);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeEvent();

    return () => {
      mounted = false;
    };
  }, [eventCode, fetchPolls, fetchQuestions]);

  // Ref to track current active_poll_id without including it in the subscription
  // effect's dependency array. Including it in deps would tear down and re-build
  // all 6 channels on every host poll-navigation, creating a brief gap where
  // participant votes could be missed.
  const activePollIdRef = useRef(event?.active_poll_id);
  useEffect(() => {
    activePollIdRef.current = event?.active_poll_id;
  }, [event?.active_poll_id]);

  useEffect(() => {
    if (!event?.id) return;

    const pollChannel = supabase
      .channel(`event-polls-${event.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'polls', filter: `event_id=eq.${event.id}` },
        () => { lastRealtimePollsAtRef.current = Date.now(); fetchPolls(event.id); }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'options', filter: `event_id=eq.${event.id}` },
        () => {
          lastRealtimePollsAtRef.current = Date.now();
          fetchPolls(event.id);
        }
      )
      .subscribe();

    const questionChannel = supabase
      .channel(`event-questions-${event.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'questions', filter: `event_id=eq.${event.id}` }, 
        () => fetchQuestions(event.id)
      )
      .subscribe();

    // Sprint 8.3.2 — Realtime BROADCAST overlay (zero DB cost).
    // Постара DB-backed insert табела сè уште работи како fallback, но primary
    // патот е ефемерен broadcast `reactions:<event_id>`.
    const reactionChannel = supabase
      .channel(`reactions:${event.id}`, { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'emoji' }, ({ payload }) => {
        const id = payload?.id || `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const newReaction = { id, emoji: payload?.emoji || '👍', timestamp: Date.now() };
        setReactions(prev => [...prev, newReaction]);
        const t = setTimeout(() => {
          reactionTimeoutsRef.current.delete(t);
          setReactions(prev => prev.filter(r => r.id !== id));
        }, 4000);
        reactionTimeoutsRef.current.add(t);
      })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions', filter: `event_id=eq.${event.id}` },
        (payload) => {
          const newReaction = { ...payload.new, timestamp: Date.now() };
          setReactions(prev => [...prev, newReaction]);
          const t = setTimeout(() => {
            reactionTimeoutsRef.current.delete(t);
            setReactions(prev => prev.filter(r => r.id !== payload.new.id));
          }, 4000);
          reactionTimeoutsRef.current.add(t);
        }
      )
      .subscribe();
    reactionChannelRef.current = reactionChannel;

    const eventChannel = supabase
      .channel(`event-details-${event.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${event.id}` },
        (payload) => setEvent(prev => prev ? { ...prev, ...payload.new } : payload.new)
      )
      .subscribe();

    const navChannel = supabase
      .channel(`event-nav-${event.id}`)
      .on('broadcast', { event: 'active-poll' }, ({ payload }) => {
        const nextPollId = payload?.active_poll_id;
        if (!nextPollId) return;
        hasRealtimeNavRef.current = true;
        lastRealtimeNavAtRef.current = Date.now();
        setEvent((prev) => {
          if (!prev) return prev;
          if (String(prev.active_poll_id || '') === String(nextPollId)) return prev;
          return { ...prev, active_poll_id: nextPollId };
        });
      })
      .subscribe();

    const presenceNavChannel = supabase
      .channel(`presence:${event.id}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceNavChannel.presenceState();
        const allMeta = Object.values(state).flat();
        const hostMeta = allMeta
          .filter((m) => m?.role === 'host' && m?.active_poll_id)
          .sort((a, b) => new Date(b.online_at || 0).getTime() - new Date(a.online_at || 0).getTime())[0];

        if (!hostMeta?.active_poll_id) return;
        hasRealtimeNavRef.current = true;
        lastRealtimeNavAtRef.current = Date.now();
        setEvent((prev) => {
          if (!prev) return prev;
          if (String(prev.active_poll_id || '') === String(hostMeta.active_poll_id)) return prev;
          return { ...prev, active_poll_id: hostMeta.active_poll_id };
        });
      })
      .subscribe();

    // syncInterval: HTTP REST fallback for active_poll_id when WebSocket is quiet.
    // Mobile browsers drop WebSocket connections in background — this is the safety net.
    // Does NOT use hasRealtimeNavRef as a permanent disable; only skips when realtime
    // fired recently (time-based grace window), so recovery always works.
    const syncInterval = setInterval(async () => {
      try {
        if (Date.now() - lastRealtimeNavAtRef.current < 8000) return;
        const { data } = await supabase
          .from('events')
          .select('active_poll_id, is_locked')
          .eq('id', event.id)
          .single();
        if (!data) return;

        const currentId = String(activePollIdRef.current || '');
        const nextId = String(data.active_poll_id || '');

        if (currentId !== nextId) {
          lastRealtimeNavAtRef.current = Date.now();
          setEvent(prev => {
            if (!prev) return prev;
            if (String(prev.active_poll_id || '') === nextId) return prev;
            return { ...prev, active_poll_id: data.active_poll_id, is_locked: data.is_locked };
          });
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 3000);

    // resultsInterval: HTTP fallback for vote counts. Skipped when realtime
    // delivered a polls/options change recently — avoids redundant DB hits.
    const resultsInterval = setInterval(async () => {
      try {
        if (Date.now() - lastRealtimePollsAtRef.current < 5000) return;
        await fetchPolls(event.id);
      } catch {
        // Silently ignore
      }
    }, 6000);

    return () => {
      clearInterval(syncInterval);
      clearInterval(resultsInterval);
      supabase.removeChannel(pollChannel);
      supabase.removeChannel(questionChannel);
      supabase.removeChannel(reactionChannel);
      reactionChannelRef.current = null;
      reactionTimeoutsRef.current.forEach(clearTimeout);
      reactionTimeoutsRef.current.clear();
      supabase.removeChannel(eventChannel);
      supabase.removeChannel(navChannel);
      supabase.removeChannel(presenceNavChannel);
    };
  }, [event?.id, fetchPolls, fetchQuestions]);

  // Sprint 8.3.2 — primary path: Realtime broadcast (zero DB cost).
  // Ако broadcast потфрли (rare), fallback на DB insert.
  const sendReaction = async (emoji) => {
    if (!event) return;
    if (!event.is_reactions_enabled && event.is_reactions_enabled !== undefined) return;
    const id = `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      // Reuse the persistent `reactions:${event.id}` channel (created once in
      // the subscription effect above) instead of opening a second channel on
      // the same topic per send — two joins to the same topic on one Realtime
      // socket can supersede/hiccup the primary listening channel, briefly
      // dropping incoming reactions for everyone. That channel is configured
      // with broadcast.self=true, so this send echoes back through its own
      // `.on('broadcast', 'emoji', ...)` handler — no separate optimistic
      // render is needed here.
      const ch = reactionChannelRef.current;
      if (!ch) throw new Error('channel-not-ready');
      const res = await ch.send({ type: 'broadcast', event: 'emoji', payload: { id, emoji } });
      if (res === 'ok') return { data: { id }, error: null };
    } catch { /* fall through */ }
    return await supabase.from('reactions').insert([{ event_id: event.id, emoji }]);
  };

  const vote = async (optionId, pollId, textValue, weight) => {
    if (textValue) {
      const clean = textValue.replace(/<[^>]+>/g, '').trim().slice(0, 300);
      if (!clean) return { data: null, error: null };
      // Text votes go through a server endpoint to bypass anon RLS on the options table
      const res = await fetch('/api/vote-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, text: clean }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { data: null, error: { message: errData.error || 'Text vote failed' } };
      }
      return { data: null, error: null };
    }
    // Ranking submits a Borda-count weight per option (see increment_vote_weighted)
    // instead of a flat +1, so the full ordering — not just the top pick — counts.
    if (weight) {
      return await supabase.rpc('increment_vote_weighted', { option_id: optionId, weight });
    }
    return await supabase.rpc('increment_vote', { option_id: optionId });
  };

  const submitSurvey = async (pollId, answers, sessionId) => {
    return await supabase.from('survey_responses').insert([{
      poll_id: pollId,
      session_id: sessionId,
      answers,
    }]);
  };

  // Sprint 8.3.1 — session id за анонимни upvotes (per browser)
  const getSessionId = () => {
    if (typeof window === 'undefined') return 'srv';
    let sid = window.localStorage.getItem('mkd_session');
    if (!sid) {
      sid = (crypto?.randomUUID?.() || `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
      window.localStorage.setItem('mkd_session', sid);
    }
    return sid;
  };

  const submitQuestion = async (text, author = "Гостин") => {
    if (!event) return;
    const clean = String(text || '').replace(/<[^>]+>/g, '').trim().slice(0, 300);
    if (clean.length < 3) return;
    const isApproved = !event.questions_moderation;
    return await supabase.from('questions').insert([{
      event_id: event.id,
      text: clean,
      author,
      votes: 0,
      is_approved: isApproved,
      session_id: getSessionId(),
    }]);
  };

  // Sprint 8.3.1 — toggle session-scoped upvote (anti-spam, RPC атомски).
  // Fallback на старо `increment_question_vote` ако RPC уште не е мигриран.
  const upvoteQuestion = async (questionId) => {
    const sid = getSessionId();
    const { data, error } = await supabase.rpc('toggle_question_upvote', {
      p_question_id: questionId,
      p_session_id: sid,
    });
    if (error) {
      // pre-migration fallback
      return supabase.rpc('increment_question_vote', { question_id: questionId });
    }
    return { data, error: null };
  };

  const markQuestionAnswered = async (questionId) => {
    return await supabase
      .from('questions')
      .update({ is_answered: true, answered_at: new Date().toISOString() })
      .eq('id', questionId);
  };

  // Sprint 8.3.1 — pin / hide за host moderation queue
  const setQuestionPinned = async (questionId, pinned) => {
    return await supabase
      .from('questions')
      .update({ is_pinned: !!pinned })
      .eq('id', questionId);
  };

  const setQuestionHidden = async (questionId, hidden) => {
    return await supabase
      .from('questions')
      .update({ is_hidden: !!hidden })
      .eq('id', questionId);
  };

  const refetchLockState = useCallback(async () => {
    if (!event?.id) return;
    const { data } = await supabase
      .from('events')
      .select('is_locked, active_poll_id')
      .eq('id', event.id)
      .single();
    if (data) setEvent((prev) => (prev ? { ...prev, ...data } : prev));
  }, [event?.id]);

  // Presenter-side lock toggle (same as host toggleLock but from useEvent context).
  const toggleLock = useCallback(async () => {
    if (!event?.id) return;
    const next = !event.is_locked;
    await supabase.from('events').update({ is_locked: next }).eq('id', event.id);
    setEvent((prev) => (prev ? { ...prev, is_locked: next } : prev));
    return next;
  }, [event?.id, event?.is_locked]);

  // Start a countdown timer on the active poll by setting timer_ends_at = now + seconds.
  const startTimer = useCallback(async (seconds, pollId) => {
    if (!pollId) return;
    const endsAt = new Date(Date.now() + seconds * 1000).toISOString();
    await supabase.from('polls').update({ timer_ends_at: endsAt }).eq('id', pollId);
    setPolls((prev) => prev.map((p) => p.id === pollId ? { ...p, timer_ends_at: endsAt } : p));
  }, []);

  const stopTimer = useCallback(async (pollId) => {
    if (!pollId) return;
    await supabase.from('polls').update({ timer_ends_at: null }).eq('id', pollId);
    setPolls((prev) => prev.map((p) => p.id === pollId ? { ...p, timer_ends_at: null } : p));
  }, []);

  return {
    event, polls, questions, reactions,
    loading, error, vote, submitSurvey, submitQuestion,
    upvoteQuestion, markQuestionAnswered,
    setQuestionPinned, setQuestionHidden,
    sendReaction,
    getSessionId,
    refetchLockState,
    toggleLock,
    startTimer,
    stopTimer,
  };
};
