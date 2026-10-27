import { useSyncExternalStore } from 'react';

/**
 * Zustand-Style Global State Store for QueLess
 * Built using React's native `useSyncExternalStore` pattern.
 * Provides global state without prop-drilling:
 * - Bookmarked/favorite clinics & businesses
 * - Active category filter
 * - Recent business views
 * - Booking draft / cart state
 */

let state = {
  bookmarkedIds: JSON.parse(localStorage.getItem('queless_bookmarks') || '[]'),
  selectedCategory: 'All',
  recentViews: JSON.parse(localStorage.getItem('queless_recent_views') || '[]'),
  bookingDraft: null, // Temporary booking basket
};

const listeners = new Set();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function persistState() {
  try {
    localStorage.setItem('queless_bookmarks', JSON.stringify(state.bookmarkedIds));
    localStorage.setItem('queless_recent_views', JSON.stringify(state.recentViews));
  } catch (err) {
    console.warn('Failed to persist queueStore state:', err);
  }
}

export const queueStore = {
  getState() {
    return state;
  },

  setState(fnOrNewState) {
    const nextState = typeof fnOrNewState === 'function' ? fnOrNewState(state) : fnOrNewState;
    state = { ...state, ...nextState };
    persistState();
    emitChange();
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Actions
  toggleBookmark(businessId) {
    const id = Number(businessId);
    const exists = state.bookmarkedIds.includes(id);
    const updated = exists
      ? state.bookmarkedIds.filter((bId) => bId !== id)
      : [...state.bookmarkedIds, id];
    
    this.setState({ bookmarkedIds: updated });
    return !exists;
  },

  isBookmarked(businessId) {
    return state.bookmarkedIds.includes(Number(businessId));
  },

  setSelectedCategory(category) {
    this.setState({ selectedCategory: category });
  },

  addRecentView(business) {
    if (!business || !business.id) return;
    const filtered = state.recentViews.filter((b) => b.id !== business.id);
    const updated = [
      { id: business.id, name: business.name, category: business.category, address: business.address },
      ...filtered
    ].slice(0, 5); // Keep last 5

    this.setState({ recentViews: updated });
  },

  setBookingDraft(draft) {
    this.setState({ bookingDraft: draft });
  },

  clearBookingDraft() {
    this.setState({ bookingDraft: null });
  }
};

/**
 * Custom React Hook to select state from queueStore
 * Usage: const bookmarks = useQueueStore(s => s.bookmarkedIds);
 */
export function useQueueStore(selector = (s) => s) {
  return useSyncExternalStore(
    queueStore.subscribe,
    () => selector(queueStore.getState()),
    () => selector(queueStore.getState())
  );
}
