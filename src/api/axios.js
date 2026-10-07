import axios from 'axios';

export const API_URL = (process.env.REACT_APP_API_URL || 'https://qroll-backend-five.vercel.app/api/v1')
  .replace(/\/$/, '');

const API = axios.create({
  baseURL: API_URL,
  // Generous timeout: a free-tier server can take up to a minute to wake.
  timeout: 70000,
});

// ---- Server status (shown as a banner while a sleeping server wakes up) ----
let status = 'online';
const listeners = new Set();
function setStatus(next) {
  if (next === status) return;
  status = next;
  listeners.forEach((fn) => fn(status));
}
export function subscribeStatus(fn) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

// ---- Logout signal when the token is rejected ----
const authListeners = new Set();
export function onUnauthorized(fn) {
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}

// A request that takes longer than a few seconds usually means the server is waking up.
let pending = 0;
let slowTimer = null;
function begin() {
  pending += 1;
  if (!slowTimer) slowTimer = setTimeout(() => { if (pending > 0) setStatus('waking'); }, 5000);
}
function end() {
  pending = Math.max(0, pending - 1);
  if (pending === 0 && slowTimer) { clearTimeout(slowTimer); slowTimer = null; }
}

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  begin();
  return req;
});

const MAX_RETRIES = 6;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

API.interceptors.response.use(
  (res) => {
    end();
    setStatus('online');
    return res;
  },
  async (error) => {
    end();
    const cfg = error.config || {};
    const code = error.response?.status;
    const isGet = (cfg.method || 'get').toLowerCase() === 'get';
    // Gateway errors, or a request that never reached the server, mean it is asleep
    // or restarting: retry with backoff. Writes are only retried when we know the
    // server did not process them, so nothing gets created twice.
    const transient = code === 502 || code === 503 || code === 504
      || (!error.response && (isGet || error.code === 'ERR_NETWORK'));
    if (transient && !cfg.noRetry && (cfg.__retries || 0) < MAX_RETRIES) {
      cfg.__retries = (cfg.__retries || 0) + 1;
      setStatus(cfg.__retries >= MAX_RETRIES - 1 ? 'offline' : 'waking');
      await wait(Math.min(2000 * cfg.__retries, 10000));
      return API(cfg);
    }
    if (transient || !error.response) setStatus('offline');
    if (code === 401 && !String(cfg.url || '').startsWith('/auth/')) {
      authListeners.forEach((fn) => fn());
    }
    return Promise.reject(error);
  }
);

// Friendly message for any failed request.
export function errorMessage(err, fallback = 'Something went wrong') {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err && !err.response) return 'Cannot reach the server. Check your internet and try again.';
  return fallback;
}

// Fire-and-forget ping so a sleeping server starts waking as soon as the page opens.
export function warmUp() {
  API.get('/health', { timeout: 60000 }).catch(() => {});
}

export default API;
