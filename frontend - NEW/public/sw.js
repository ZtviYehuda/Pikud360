const CACHE_NAME = 'unit-cache-v36';
const OFFLINE_URL = '/offline.html';

// Core assets to pre-cache immediately
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/matzevet_logo.png',
  '/',
];

// Install event: Cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up old cache storages
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Apply caching strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Skip browser extensions or local chrome:// protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Do NOT cache any API requests
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/api/')) {
    return;
  }

  // HTML Page Navigation: Network-first, fallback to offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const offlineMatch = await cache.match(OFFLINE_URL);
        return offlineMatch || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
    );
    return;
  }

  // Stale-While-Revalidate caching strategy for other static assets
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            console.warn('[Service Worker] Fetch failed:', err);
            return cachedResponse || new Response('Network Error', { status: 503, statusText: 'Service Unavailable' });
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
