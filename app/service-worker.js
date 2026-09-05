// PWA offline shell cache. Wave 1.5 change: network-first instead of cache-first, so
// a controlled-beta revocation (the beta gate's server-side allowlist check in
// beta.js) is actually re-checked on every load a device has connectivity for,
// instead of a stale cached copy silently working forever offline. Bump CACHE_NAME
// on any asset change to invalidate old caches.
//
// Residual risk: a device that goes offline right after a successful load still has
// a working cached copy until it's next online (network-first can't check a kill
// switch with no network). That's an accepted tradeoff for this pass, not a bug —
// see beta-worker/README.md "What this does not protect against".
const CACHE_NAME = 'maintenance-dashboard-shell-v11';
const SHELL_ASSETS = [
  'navigator.html',
  'vehicle-profile.html',
  'silhouette-explorer.html',
  'a3-explorer-standalone.html',
  'beta-config.js',
  'beta.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'favicon.png',
  'img/audi-a3-8v-topdown.png',
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
  const req = event.request;
  // Only the app's own same-origin GETs (pages, data/*.json) go through the shell
  // cache. Everything else — and specifically every call to the beta worker
  // (cross-origin, and POST for /event, /selfreport, /profile) — passes straight
  // to the network untouched. This matters for two reasons: Cache.put() throws on
  // a non-GET request, and a cross-device profile GET must never be served from a
  // stale cache, which is exactly what "backend-controlled data should not be
  // cached as stale forever" means for this endpoint.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return response;
      })
      .catch(() => caches.match(req))
  );
});
