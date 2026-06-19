// Adroit Site Audit — Service Worker v7
// Place this file at the root of your GitHub Pages repo alongside index.html

const CACHE_NAME = 'adroit-site-audit-v7';

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

// ── Activate: clear ALL old caches and take control immediately ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: NETWORK-FIRST for the app shell, so you always get the ──
// ── latest index.html immediately. Falls back to cache only if offline. ──
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  const isShell = url.pathname.endsWith('index.html')
    || url.pathname === '/'
    || url.pathname.endsWith('sw.js')
    || url.href.includes('jspdf');

  if (isShell) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(fresh => {
          if (fresh && fresh.status === 200) {
            const clone = fresh.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return fresh;
        })
        .catch(() => caches.match(event.request))  // offline fallback
    );
    return;
  }

  // Network-first for everything else (APIs, fonts, etc.)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
