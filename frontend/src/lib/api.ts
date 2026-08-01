const QUEUE_KEY = 'iter-offline-queue';

type QueuedRequest = { url: string; method: string; body?: string; headers: Record<string, string>; createdAt: string };

function readQueue(): QueuedRequest[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}

function queueWrite(url: string, init: RequestInit) {
  const headers = Object.fromEntries(new Headers(init.headers).entries());
  const entries = readQueue();
  entries.push({ url, method: init.method || 'POST', body: typeof init.body === 'string' ? init.body : undefined, headers, createdAt: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(entries));
}

export async function flushOfflineQueue() {
  const queued = readQueue();
  if (!queued.length || !navigator.onLine) return;
  const remaining: QueuedRequest[] = [];
  for (const item of queued) {
    try {
      const response = await fetch(item.url, { method: item.method, body: item.body, headers: { ...item.headers, Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'X-Offline-Sync': 'true' } });
      if (!response.ok) remaining.push(item);
    } catch { remaining.push(item); }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

export function installApiFetchInterceptor() {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input.toString();
    const isApi = url.startsWith('/api/');
    const token = localStorage.getItem('token');
    const headers = new Headers(init.headers);
    if (isApi && token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    try {
      const response = await nativeFetch(input, { ...init, headers });
      // Auto-logout on expired/invalid token
      if (isApi && (response.status === 401 || response.status === 403)) {
        const clone = response.clone();
        const data = await clone.json().catch(() => ({}));
        // Only auto-logout on auth errors, not general permission errors for sub-resources
        if (response.status === 401 || data?.message === 'Invalid or expired token') {
          localStorage.clear();
          window.location.href = '/login';
          return response;
        }
      }
      return response;
    } catch (error) {
      if (isApi && !['GET', 'HEAD'].includes((init.method || 'GET').toUpperCase())) {
        queueWrite(url, { ...init, headers });
        return new Response(JSON.stringify({ queued: true, message: 'Saved locally and queued for sync.' }), { status: 202, headers: { 'Content-Type': 'application/json' } });
      }
      throw error;
    }
  };
  window.addEventListener('online', () => { void flushOfflineQueue(); });
  void flushOfflineQueue();
}
