import { create } from 'zustand';

// Shared presence/event state consumed by EventWrapper, Presenter, Participant
// and RemoteController. Realtime subscriptions and poll-fetching live in
// useEvent.js — this store used to duplicate that logic (fetchPolls,
// updateActivePoll, subscribeToEvent, subscribeToPresence) but nothing ever
// called it, so it was removed to avoid two divergent implementations of the
// same realtime sync.
export const useEventStore = create((set) => ({
  event: null,
  activeParticipants: 0,
  // Activity Heatmap: rolling count of participants who pinged "active" within last 4s.
  activeNow: 0,

  setEvent: (event) => set({ event }),
  setPresence: (count) => set({ activeParticipants: count }),
  setActiveNow: (count) => set({ activeNow: count }),
}));
