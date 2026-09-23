/**
 * Thin wrapper around fetch().
 *
 * Every call goes to the backend REST API over HTTP and attaches the JWT
 * token in the Authorization header (see NETWORK.md and SECURITY.md).
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const TOKEN_KEY = 'ufh_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

/** Thrown for any non-2xx response; message is the friendly text from the API. */
export class ApiRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, isFormData = false } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiRequestError('Cannot reach the server. Is the backend running?', 0);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // The token is missing, invalid or expired: clear it and tell the app,
      // which sends the person back to the login screen.
      tokenStore.clear();
      window.dispatchEvent(new Event('ufh:session-expired'));
    }
    throw new ApiRequestError(data.error || 'Something went wrong. Please try again.', response.status);
  }

  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: payload }),

  reference: () => request('/reference'),
  dashboard: () => request('/dashboard'),

  listRequests: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    ).toString();
    return request(`/requests${query ? `?${query}` : ''}`);
  },
  getRequest: (id) => request(`/requests/${id}`),
  createRequest: (formData) => request('/requests', { method: 'POST', body: formData, isFormData: true }),
  assignRequest: (id) => request(`/requests/${id}/assign`, { method: 'POST' }),
  updateStatus: (id, status, comment) =>
    request(`/requests/${id}/status`, { method: 'PATCH', body: { status, comment } }),
  addNote: (id, comment) => request(`/requests/${id}/updates`, { method: 'POST', body: { comment } })
};

/**
 * Photos sit behind an authenticated route, so they cannot be loaded with a
 * plain <img src="...">. We fetch the file with the token and turn it into a
 * temporary object URL.
 */
export async function fetchRequestImage(id) {
  const response = await fetch(`${BASE_URL}/requests/${id}/image`, {
    headers: { Authorization: `Bearer ${tokenStore.get()}` }
  });
  if (!response.ok) throw new ApiRequestError('The photo could not be loaded.', response.status);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
