const CACHE_NAME = 'nexnet-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  // Error pages
  '/400.html',
  '/401.html',
  '/403.html',
  '/404.html',
  '/405.html',
  '/408.html',
  '/409.html',
  '/410.html',
  '/418.html',
  '/429.html',
  '/451.html',
  '/500.html',
  '/501.html',
  '/502.html',
  '/503.html',
  '/504.html',
  '/505.html',
  '/507.html',
  '/508.html',
  '/home/',
  '/home/index.html',
  '/css/main.css',
  '/js/space.js',
  '/logo.svg',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        // Return a minimal offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
