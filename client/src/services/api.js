import { handleMockRequest } from './mockData.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(options.staff ? 'queless_staff_token' : 'queless_customer_token');
  
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // If server returned 404/500/etc when backend exists but endpoint not found, throw ApiError
      throw new ApiError(data.message || 'Request failed', response.status);
    }
    return data;
  } catch (err) {
    // If it is an explicit ApiError with a status from an active backend, throw it
    if (err instanceof ApiError) {
      throw err;
    }
    // If it's a network/connection failure (e.g. Failed to fetch on GitHub Pages / offline backend), fall back to in-browser mock
    console.warn(`[QueLess API] Network error connecting to ${API_BASE}${path}. Switching to in-browser Mock DB engine.`, err);
    return await handleMockRequest(path, options);
  }
}

