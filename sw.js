const CACHE = 'hlasova-poznamka-v2';
const ASSETS = [
  '/hlasova-poznamka/',
  '/hlasova-poznamka/index.html',
  '/hlasova-poznamka/manifest.json',
  '/hlasova-poznamka/icon-192.png',
  '/hlasova-poznamka/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // API calls – always network, never cache
  if (e.request.url.includes('api.openai.com')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
