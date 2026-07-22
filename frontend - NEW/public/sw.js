const CACHE_NAME = 'toren-cache-v1';
const OFFLINE_URL = '/offline.html';

// Core assets to pre-cache immediately
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/logo_unit.png',
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

  // Do NOT cache API auth, live heartbeat, notifications, or feedback tickets
  if (
    url.pathname.includes('/api/auth') || 
    url.pathname.includes('/api/notification/unread') || 
    url.pathname.includes('/api/support/tickets') ||
    url.pathname.includes('/api/employees/heartbeat')
  ) {
    return;
  }

  // HTML Page Navigation: Network-first, fallback to offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  // Stale-While-Revalidate caching strategy for other static assets
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[Service Worker] Fetch failed, serving cache:', err);
        });
        
        return cachedResponse || fetchPromise;
      });
    })
  );
});
