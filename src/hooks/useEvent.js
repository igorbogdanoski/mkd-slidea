import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useEvent = (eventCode) => {
  const [event, setEvent] = useState(null);
  const [polls, setPolls] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    return () => {
      pollSubscription.unsubscribe();
      questionSubscription.unsubscribe();
    };
  }, [eventCode, event?.id]);

  const vote = async (optionId) => {
    const { error } = await supabase.rpc('increment_vote', { option_id: optionId });
    return { error };
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

  return { event, polls, questions, loading, error, vote, submitQuestion, upvoteQuestion };
};
