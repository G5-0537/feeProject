/**
 * staffStore — Zustand store for the entire Staff Dashboard state.
 * Demonstrates: Intro to Zustand / Redux Toolkit (Syllabus Topics 49-54)
 *              Global vs Local State, State architecture in React apps
 *
 * All staff state lives here — queue rows, summary stats, branch info, pause state.
 * Components read from the store; no prop-drilling, no duplicate API calls.
 */
import { create } from 'zustand';
import { apiRequest } from '../services/api.js';

export const useStaffStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  queue: [],
  summary: {},
  branch: {},
  services: [],
  isPaused: false,
  isUpdatingPause: false,
  isLoading: false,
  error: '',

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Fetch full dashboard data: queue, summary, branch */
  fetchDashboard: async () => {
    set({ isLoading: true, error: '' });
    try {
      const result = await apiRequest('/staff/dashboard', { staff: true });
      set({
        queue: result.queue || [],
        summary: result.summary || {},
        branch: result.branch || {},
        isPaused: result.branch?.is_paused ?? result.summary?.is_paused ?? false,
        isLoading: false,
        error: '',
      });
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  /** Fetch services list for dropdowns */
  fetchServices: async () => {
    try {
      const data = await apiRequest('/staff/services', { staff: true });
      set({ services: data });
    } catch {
      set({ services: [] });
    }
  },

  /** Toggle queue pause/resume */
  togglePause: async () => {
    const { isPaused, fetchDashboard } = get();
    set({ isUpdatingPause: true });
    try {
      const res = await apiRequest('/staff/queue/pause', {
        method: 'PATCH',
        body: { is_paused: !isPaused },
        staff: true,
      });
      set({ isPaused: res.is_paused });
      await fetchDashboard();
      return res.message || (res.is_paused ? 'Queue paused.' : 'Queue resumed.');
    } catch (err) {
      throw err;
    } finally {
      set({ isUpdatingPause: false });
    }
  },

  /** Call next customer for a service */
  callNext: async (serviceId) => {
    try {
      const result = await apiRequest('/staff/queue/call-next', {
        method: 'POST',
        body: { service_id: Number(serviceId) },
        staff: true,
      });
      get().fetchDashboard();
      return result;
    } catch (err) {
      throw err;
    }
  },

  /** Update a queue entry status */
  updateStatus: async (entryId, status) => {
    try {
      const result = await apiRequest(`/staff/queue/${entryId}/status`, {
        method: 'PATCH',
        body: { status },
        staff: true,
      });
      get().fetchDashboard();
      return result;
    } catch (err) {
      throw err;
    }
  },
}));

