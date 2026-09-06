const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(options.staff ? 'queless_staff_token' : 'queless_customer_token');
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
  if (!response.ok) throw new ApiError(data.message || 'Request failed', response.status);
  return data;
}
