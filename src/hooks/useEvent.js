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
      .order('created_at', { ascending: true });
    setPolls(data || []);
  }, []);

  const fetchQuestions = useCallback(async (eventId) => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('event_id', eventId)
      .order('votes', { ascending: false });
    setQuestions(data || []);
  }, []);

  useEffect(() => {
    if (!eventCode) return;

    let mounted = true;

    const initializeEvent = async () => {
      try {
        setLoading(true);
        
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('code', eventCode)
          .single();

        if (eventError) throw eventError;
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
        { event: '*', schema: 'public', table: 'options', filter: `poll_id=in.(${polls.map(p => p.id).join(',')})` }, 
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

    return () => {
      supabase.removeChannel(pollChannel);
      supabase.removeChannel(questionChannel);
      supabase.removeChannel(reactionChannel);
      supabase.removeChannel(eventChannel);
    };
  }, [event?.id, fetchPolls, fetchQuestions, polls.length]);

  const sendReaction = async (emoji) => {
    if (!event) return;
    return await supabase.from('reactions').insert([{ event_id: event.id, emoji }]);
  };

  const vote = async (optionId, pollId, textValue) => {
    if (textValue) {
      const { data: existing } = await supabase
        .from('options')
        .select('id')
        .eq('poll_id', pollId)
        .eq('text', textValue)
        .single();

      if (existing) {
        return await supabase.rpc('increment_vote', { option_id: existing.id });
      } else {
        return await supabase.from('options').insert([{ poll_id: pollId, text: textValue, votes: 1 }]);
      }
    }
    return await supabase.rpc('increment_vote', { option_id: optionId });
  };

  const submitQuestion = async (text, author = "Гостин") => {
    if (!event) return;
    return await supabase.from('questions').insert([{ event_id: event.id, text, author, votes: 0 }]);
  };

  const upvoteQuestion = async (questionId) => {
    return await supabase.rpc('increment_question_vote', { question_id: questionId });
  };

  return { 
    event, polls, questions, reactions, 
    loading, error, vote, submitQuestion, 
    upvoteQuestion, sendReaction 
  };
};
