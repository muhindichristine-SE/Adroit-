// Adroit Site Audit — Service Worker v4
// Place this file at the root of your GitHub Pages repo alongside index.html

const CACHE_NAME = 'adroit-site-audit-v4';

// Core files to cache on install
const PRECACHE = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// ── Install: cache core assets ────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())  // activate immediately, don't wait for old SW to die
  );
});

// ── Activate: clear old caches ────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())  // take control of all open tabs immediately
  );
});

// ── Fetch: cache-first for app shell, network-first for everything else ──
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cache-first for the app shell (index.html + jsPDF CDN)
  const isShell = url.pathname.endsWith('index.html')
    || url.pathname === '/'
    || url.pathname.endsWith('sw.js')
    || url.href.includes('jspdf');

  if (isShell) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          // Return cache immediately, but refresh in background
          fetch(event.request).then(fresh => {
            if (fresh && fresh.status === 200) {
              caches.open(CACHE_NAME).then(c => c.put(event.request, fresh));
            }
          }).catch(() => {});
          return cached;
        }
        // Not cached yet — fetch and cache
        return fetch(event.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Network-first for everything else (APIs, fonts, etc.)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
