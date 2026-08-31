// Minimal offline cache for the PWA shell so Wave 1 testers can reopen the app
// without a connection after the first successful load. Bump CACHE_NAME on any
// asset change to invalidate old caches.
const CACHE_NAME = 'maintenance-dashboard-shell-v3';
const SHELL_ASSETS = [
  'navigator.html',
  'vehicle-profile.html',
  'silhouette-explorer.html',
  'manifest.json',
  '../data/fastener-data.js',
  '../data/mod-taxonomy.js',
  '../data/silhouettes.js',
  '../data/vehicles/registry.json',
  '../data/vehicles/audi-a3-8v.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
