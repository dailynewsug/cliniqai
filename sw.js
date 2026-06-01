const CACHE_NAME = 'medvise-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('MedVise cache opened');
      return cache.addAll(urlsToCache).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('api.')) return;
  if (event.request.url.includes('onrender.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200) return response;
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, cloned);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});