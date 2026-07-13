import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateCode } from '../lib/eventCode';

export const useDashboardData = ({ user, activeTab, setView }) => {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [communityTemplates, setCommunityTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let onboardingDone = false;
    try { onboardingDone = !!localStorage.getItem('onboarding_v1_done'); } catch { /* private mode / quota — treat as not done */ }
    if (onboardingDone) return;
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => { if (count === 0) navigate('/onboarding'); });
  }, [user?.id]);

  useEffect(() => {
    if (activeTab !== 'presentations' || !user?.id) return;
    setEventsLoading(true);
    supabase
      .from('events')
      .select('id, code, title, cover_image, created_at, starts_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setAllEvents(data || []); setEventsLoading(false); });
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (activeTab !== 'templates') return;
    let cancelled = false;
    setTemplatesLoading(true);
    supabase
      .from('community_templates')
      .select('id, title, category, description, image_url, polls, usage_count, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(80)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error loading community templates:', error);
          setCommunityTemplates([]);
          setTemplatesLoading(false);
          return;
        }
        const normalized = (data || []).map((t) => ({
          id: `community-${t.id}`,
          source: 'community',
          originalId: t.id,
          title: t.title,
          category: t.category || 'Community',
          description: t.description || '',
          img: t.image_url || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&h=250&auto=format&fit=crop',
          polls: Array.isArray(t.polls) ? t.polls : [],
          usage_count: t.usage_count || 0,
        }));
        setCommunityTemplates(normalized);
        setTemplatesLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeTab]);

  const applyTemplate = async (template) => {
    let eventCode;
    try {
      // Retry with a fresh code on a UNIQUE constraint collision instead of
      // failing outright — code generation is exactly 6 chars (one random
      // byte per char), so this only ever loops on a genuine collision.
      let event, eventError;
      for (let attempt = 0; attempt < 5; attempt++) {
        eventCode = generateCode(6);
        ({ data: event, error: eventError } = await supabase
          .from('events')
          .insert([{ code: eventCode, title: template.title, user_id: user?.id }])
          .select()
          .single());
        if (!eventError || eventError.code !== '23505') break;
      }
      if (eventError) throw eventError;

      for (const poll of template.polls) {
        const { data: newPoll, error: pollError } = await supabase
          .from('polls')
          .insert([{ event_id: event.id, question: poll.question, type: poll.type, is_quiz: poll.is_quiz }])
          .select()
          .single();
        if (pollError) throw pollError;

        if (poll.options && poll.options.length > 0) {
          await supabase.from('options').insert(
            poll.options.map(opt => ({
              poll_id: newPoll.id,
              text: typeof opt === 'string' ? opt : opt.text,
              is_correct: opt.is_correct || false,
            }))
          );
        } else if (poll.type === 'rating') {
          await supabase.from('options').insert(
            ['1', '2', '3', '4', '5'].map(val => ({ poll_id: newPoll.id, text: val }))
          );
        }
      }

      if (template.source === 'community' && template.originalId) {
        await supabase
          .from('community_templates')
          .update({ usage_count: (template.usage_count || 0) + 1 })
          .eq('id', template.originalId);
      }

      localStorage.setItem('active_event_code', eventCode);
      setView('host');
    } catch (err) {
      // Matches Supabase's own Web Locks API contention error format
      // (`lock:sb-...`), not a bare "lock" substring — a generic word like
      // that would also match unrelated errors (e.g. a genuine Postgres row
      // lock timeout), which is a different failure mode entirely.
      if (err?.message?.includes('stole it') || err?.message?.includes('lock:sb-')) {
        try {
          const { data: existing } = await supabase
            .from('events').select('id').eq('code', eventCode).maybeSingle();
          if (existing) { localStorage.setItem('active_event_code', eventCode); setView('host'); return; }
        } catch { /* fall through to the generic error alert below */ }
        alert('Техничка грешка при создавање на шаблонот. Обидете се повторно.');
        return;
      }
      console.error('Error using template:', err);
      alert('Грешка: ' + (err?.message || JSON.stringify(err)));
    }
  };

  return { allEvents, eventsLoading, communityTemplates, templatesLoading, applyTemplate };
};
