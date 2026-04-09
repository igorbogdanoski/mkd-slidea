import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useEvent = (eventCode) => {
  const [event, setEvent] = useState(null);
  const [polls, setPolls] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reactions, setReactions] = useState([]);

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
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_answered', false)
      .eq('is_approved', true)
      .order('votes', { ascending: false });
    setQuestions(data || []);
  }, []);

  useEffect(() => {
    if (!eventCode) return;

    const normalizedCode = String(eventCode).replace(/^#/, '').trim().toUpperCase();
    if (!normalizedCode) return;

    let mounted = true;

    const initializeEvent = async () => {
      try {
        setLoading(true);

        // Retry once on failure — handles transient auth state in new tabs
        let eventData = null;
        let eventError = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .ilike('code', normalizedCode)
            .order('created_at', { ascending: false })
            .limit(1);

          eventError = error;
          eventData = Array.isArray(data) && data.length > 0 ? data[0] : null;

          if (!eventError && eventData) break;
          if (attempt === 0) await new Promise(r => setTimeout(r, 1200));
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
        () => fetchPolls(event.id)
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

    // Polling fallback — syncs active poll every 3s in case real-time misses it
    const syncInterval = setInterval(async () => {
      const { data } = await supabase.from('events').select('active_poll_id').eq('id', event.id).single();
      if (data && data.active_poll_id !== event.active_poll_id) {
        setEvent(prev => ({ ...prev, active_poll_id: data.active_poll_id }));
      }
    }, 3000);

    return () => {
      clearInterval(syncInterval);
      supabase.removeChannel(pollChannel);
      supabase.removeChannel(questionChannel);
      supabase.removeChannel(reactionChannel);
      supabase.removeChannel(eventChannel);
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
    const isApproved = !event.questions_moderation;
    return await supabase.from('questions').insert([{ event_id: event.id, text, author, votes: 0, is_approved: isApproved }]);
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
