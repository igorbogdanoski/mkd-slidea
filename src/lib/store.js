import { create } from 'zustand';
import { supabase } from './supabase';

export const useEventStore = create((set, get) => ({
  event: null,
  polls: [],
  activePollId: null,
  activeParticipants: 0,
  loading: false,

  setEvent: (event) => set({ event, activePollId: event?.active_poll_id }),
  
  fetchPolls: async (eventId) => {
    const { data } = await supabase
      .from('polls')
      .select('*, options(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    if (data) set({ polls: data });
  },

  updateActivePoll: async (pollId) => {
    const { event } = get();
    if (!event) return;
    
    set({ activePollId: pollId });
    await supabase
      .from('events')
      .update({ active_poll_id: pollId })
      .eq('id', event.id);
  },

  setPresence: (count) => set({ activeParticipants: count }),

  // Real-time subscriptions
  subscribeToEvent: (eventId) => {
    const channel = supabase.channel(`event_${eventId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'events', 
        filter: `id=eq.${eventId}` 
      }, (payload) => {
        set({ activePollId: payload.new.active_poll_id });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'polls',
        filter: `event_id=eq.${eventId}`
      }, () => {
        get().fetchPolls(eventId);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  // Presence for Live Pulse
  subscribeToPresence: (eventId, username) => {
    const channel = supabase.channel(`presence_${eventId}`, {
      config: { presence: { key: username || 'anonymous' } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        set({ activeParticipants: Object.keys(state).length });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => supabase.removeChannel(channel);
  }
}));
