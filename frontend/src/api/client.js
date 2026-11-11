/**
 * client.js — one fetch wrapper for the whole app.
 * Adds the auth token, parses JSON, and turns errors into ApiError.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

const TOKEN_KEY = 'dn_token';
const USER_KEY = 'dn_user';

export const session = {
  get token() { return localStorage.getItem(TOKEN_KEY); },
  get user() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },
  save(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  saveUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * request('/cars/')
 * request('/auth/login/', { method: 'POST', json: {...}, auth: false })
 * request('/admin/cars/', { method: 'POST', form: FormData })
 */
export async function request(path, { method = 'GET', json, form, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (auth && session.token) headers.Authorization = `Token ${session.token}`;

  let body;
  if (form) body = form;
  else if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }

  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body });
  } catch {
    throw new ApiError(`Cannot reach the server. Is the backend running at ${API_BASE} ?`, 0);
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      session.clear();
      window.dispatchEvent(new Event('dn:unauthorized'));   // AuthContext listens to this
    }
    throw new ApiError(data?.detail || `Request failed (${res.status})`, res.status);
  }
  return data;
}
