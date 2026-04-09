import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, warmUp } from '../lib/supabase';

export const useEvent = (eventCode) => {
  const [event, setEvent] = useState(null);
  const [polls, setPolls] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reactions, setReactions] = useState([]);
  const lastRealtimeNavAtRef = useRef(0);

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

    const rows = data || [];
    const activeOnly = rows.filter((q) => {
      if (Object.prototype.hasOwnProperty.call(q, 'is_answered')) {
        return q.is_answered === false;
      }
      return true;
    });

    const hasApprovalFlag = activeOnly.some((q) => Object.prototype.hasOwnProperty.call(q, 'is_approved'));
    setQuestions(hasApprovalFlag ? activeOnly.filter((q) => q.is_approved === true) : activeOnly);
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
          const { data, error } = await supabase
            .from('events')
            .select('*')
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

  useEffect(() => {
    if (!event?.id) return;

    const pollChannel = supabase
      .channel(`event-polls-${event.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'polls', filter: `event_id=eq.${event.id}` }, 
        () => fetchPolls(event.id)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'options' },
        () => {
          // Always refetch polls on option changes to keep live results synced
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

    const reactionChannel = supabase
      .channel(`event-reactions-${event.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'reactions', filter: `event_id=eq.${event.id}` }, 
        (payload) => {
          const newReaction = { ...payload.new, timestamp: Date.now() };
          setReactions(prev => [...prev, newReaction]);
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== payload.new.id));
          }, 4000);
        }
      )
      .subscribe();

    const eventChannel = supabase
      .channel(`event-details-${event.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${event.id}` },
        (payload) => setEvent(payload.new)
      )
      .subscribe();

    const navChannel = supabase
      .channel(`event-nav-${event.id}`)
      .on('broadcast', { event: 'active-poll' }, ({ payload }) => {
        const nextPollId = payload?.active_poll_id;
        if (!nextPollId) return;
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
        lastRealtimeNavAtRef.current = Date.now();
        setEvent((prev) => {
          if (!prev) return prev;
          if (String(prev.active_poll_id || '') === String(hostMeta.active_poll_id)) return prev;
          return { ...prev, active_poll_id: hostMeta.active_poll_id };
        });
      })
      .subscribe();

    // Polling fallback — only when realtime has been quiet for a while
    const syncInterval = setInterval(async () => {
      try {
        if (Date.now() - lastRealtimeNavAtRef.current < 12000) return;
        const { data } = await supabase.from('events').select('active_poll_id').eq('id', event.id).single();
        if (!data) return;
        
        const currentId = String(event.active_poll_id || '');
        const nextId = String(data.active_poll_id || '');
        
        if (currentId !== nextId) {
          setEvent(prev => {
            if (!prev) return prev;
            if (String(prev.active_poll_id || '') === nextId) return prev;
            return { ...prev, active_poll_id: data.active_poll_id };
          });
        }
      } catch (err) {
        // Silently ignore polling errors
      }
    }, 5000);

    // Polling fallback for poll results — ensures votes stay synced even if realtime misses updates
    const resultsInterval = setInterval(async () => {
      try {
        await fetchPolls(event.id);
      } catch (err) {
        // Silently ignore
      }
    }, 4000);

    return () => {
      clearInterval(syncInterval);
      clearInterval(resultsInterval);
      supabase.removeChannel(pollChannel);
      supabase.removeChannel(questionChannel);
      supabase.removeChannel(reactionChannel);
      supabase.removeChannel(eventChannel);
      supabase.removeChannel(navChannel);
      supabase.removeChannel(presenceNavChannel);
    };
  }, [event?.id, event?.active_poll_id, fetchPolls, fetchQuestions]);

  const sendReaction = async (emoji) => {
    if (!event) return;
    return await supabase.from('reactions').insert([{ event_id: event.id, emoji }]);
  };

  const vote = async (optionId, pollId, textValue, isModerated = false) => {
    if (textValue) {
      // Strip HTML tags and limit length before storing
      const clean = textValue.replace(/<[^>]+>/g, '').trim().slice(0, 300);
      if (!clean) return;
      const { data: existing } = await supabase
        .from('options')
        .select('id')
        .eq('poll_id', pollId)
        .ilike('text', clean)
        .single();

      if (existing) {
        return await supabase.rpc('increment_vote', { option_id: existing.id });
      } else {
        return await supabase.from('options').insert([{ poll_id: pollId, text: clean, votes: 1, is_approved: !isModerated }]);
      }
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

  const submitQuestion = async (text, author = "Гостин") => {
    if (!event) return;
    const clean = String(text || '').replace(/<[^>]+>/g, '').trim().slice(0, 300);
    if (clean.length < 3) return;
    const isApproved = !event.questions_moderation;
    return await supabase.from('questions').insert([{ event_id: event.id, text: clean, author, votes: 0, is_approved: isApproved }]);
  };

  const upvoteQuestion = async (questionId) => {
    return await supabase.rpc('increment_question_vote', { question_id: questionId });
  };

  const markQuestionAnswered = async (questionId) => {
    return await supabase
      .from('questions')
      .update({ is_answered: true })
      .eq('id', questionId);
  };

  return {
    event, polls, questions, reactions,
    loading, error, vote, submitSurvey, submitQuestion,
    upvoteQuestion, markQuestionAnswered, sendReaction
  };
};
