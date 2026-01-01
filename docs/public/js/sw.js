// Service Worker for MGZON CLI Docs
const CACHE_NAME = 'mgzon-cli-v2.0.8';
const urlsToCache = [
  '/cli/',
  '/cli/index.html',
  '/cli/public/css/main.css',
  '/cli/public/js/main.js',
  '/cli/public/js/terminal.js',
  '/cli/public/js/router.js',
  '/cli/manifest.json',
  '/cli/schema.json',
  '/cli/sitemap.xml',
  '/cli/robots.txt',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700;800&display=swap'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event with network-first strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // For HTML pages, return offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/cli/offline.html');
            }
          });
      })
  );
});

// Background sync for analytics
self.addEventListener('sync', event => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  // Sync pending analytics events
  const pendingEvents = await getPendingAnalytics();
  for (const event of pendingEvents) {
    await sendAnalytics(event);
  }
}

// Handle push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/cli/icon-192x192.png',
    badge: '/cli/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore CLI',
        icon: '/cli/explore-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/cli/close-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('MGZON CLI', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/cli/#terminal')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/cli/')
    );
  }
});
