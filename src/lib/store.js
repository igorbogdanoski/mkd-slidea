import { create } from 'zustand';
import { supabase } from './supabase';

export const useEventStore = create((set, get) => ({
  event: null,
  polls: [],
  activePollId: null,
  activeParticipants: 0,
  // Activity Heatmap: rolling count of participants who pinged "active" within last 4s.
  activeNow: 0,
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
  setActiveNow: (count) => set({ activeNow: count }),

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
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'options',
      }, () => {
        get().fetchPolls(eventId);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  // Presence for Live Pulse + Activity Heatmap.
  // activeParticipants = total online; activeNow = active within last 4s (heatbeat).
  subscribeToPresence: (eventId, username) => {
    const channel = supabase.channel(`presence_${eventId}`, {
      config: { presence: { key: username || 'anonymous' } }
    });

    const computeActiveNow = () => {
      const state = channel.presenceState();
      const cutoff = Date.now() - 4000;
      let active = 0;
      Object.values(state).forEach((entries) => {
        entries.forEach((entry) => {
          const t = entry?.last_active ? new Date(entry.last_active).getTime() : 0;
          if (t >= cutoff) active += 1;
        });
      });
      set({ activeNow: active });
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        set({ activeParticipants: Object.keys(state).length });
        computeActiveNow();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
          });
        }
      });

    // Heartbeat: re-track every 3s + recompute activeNow rolling window.
    const heartbeat = setInterval(async () => {
      try {
        await channel.track({
          online_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
        });
        computeActiveNow();
      } catch { /* channel closed */ }
    }, 3000);

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
    };
  }
}));
