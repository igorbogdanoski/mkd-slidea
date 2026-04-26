/* MKD Slidea Service Worker
 * Strategy:
 *   - Network-first for HTML/API (always fresh content for live events).
 *   - Cache-first for static assets (hashed by Vite build => safe).
 *   - Offline fallback page for navigation when offline.
 * Versioning: bump CACHE_VERSION to force-evict old caches.
 */

const CACHE_VERSION = 'mkd-slidea-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache cross-origin (Supabase, Gemini, Vercel, etc).
  if (url.origin !== self.location.origin) return;

  // Never cache API routes — must always be live.
  if (url.pathname.startsWith('/api/')) return;

  // Navigation: network-first, fall back to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets: cache-first.
  if (/\.(?:js|css|svg|png|jpg|jpeg|webp|woff2?|ttf)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (!res || res.status !== 200) return res;
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        });
      })
    );
  }
});
