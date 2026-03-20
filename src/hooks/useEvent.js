import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useEvent = (eventCode) => {
  const [event, setEvent] = useState(null);
  const [polls, setPolls] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!eventCode) return;

    const fetchEventData = async () => {
      try {
        setLoading(true);
        
        // Fetch event
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('code', eventCode)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);

        // Fetch polls
        const { data: pollsData } = await supabase
          .from('polls')
          .select('*, options(*)')
          .eq('event_id', eventData.id)
          .order('created_at', { ascending: true });

        setPolls(pollsData || []);

        // Fetch questions
        const { data: questionsData } = await supabase
          .from('questions')
          .select('*')
          .eq('event_id', eventData.id)
          .order('votes', { ascending: false });

        setQuestions(questionsData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();

    // Subscribe to changes
    const pollSubscription = supabase
      .channel('public:polls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls', filter: `event_id=eq.${event?.id}` }, fetchEventData)
      .subscribe();

    const questionSubscription = supabase
      .channel('public:questions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `event_id=eq.${event?.id}` }, fetchEventData)
      .subscribe();

    const reactionSubscription = supabase
      .channel('public:reactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions', filter: `event_id=eq.${event?.id}` }, (payload) => {
        setReactions(prev => [...prev, payload.new]);
        // Auto-remove reactions after animation
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== payload.new.id));
        }, 5000);
      })
      .subscribe();

    return () => {
      pollSubscription.unsubscribe();
      questionSubscription.unsubscribe();
      reactionSubscription.unsubscribe();
    };
  }, [eventCode, event?.id]);

  const sendReaction = async (emoji) => {
    if (!event) return;
    const { error } = await supabase
      .from('reactions')
      .insert([{ event_id: event.id, emoji }]);
    return { error };
  };

  const vote = async (optionId, pollId, textValue) => {
    if (textValue) {
      // Check if option with this text exists for this poll
      const { data: existing } = await supabase
        .from('options')
        .select('id')
        .eq('poll_id', pollId)
        .eq('text', textValue)
        .single();

      if (existing) {
        return await supabase.rpc('increment_vote', { option_id: existing.id });
      } else {
        // Insert new option
        return await supabase
          .from('options')
          .insert([{ poll_id: pollId, text: textValue, votes: 1 }]);
      }
    }
    return await supabase.rpc('increment_vote', { option_id: optionId });
  };

  const submitQuestion = async (text, author = "Гостин") => {
    const { error } = await supabase
      .from('questions')
      .insert([{ event_id: event.id, text, author, votes: 0 }]);
    return { error };
  };

  const upvoteQuestion = async (questionId) => {
    const { error } = await supabase.rpc('increment_question_vote', { question_id: questionId });
    return { error };
  };

  return { 
    event, 
    polls, 
    questions, 
    reactions,
    loading, 
    error, 
    vote, 
    submitQuestion, 
    upvoteQuestion,
    sendReaction
  };
};
