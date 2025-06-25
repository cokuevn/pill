// Service Worker for PWA
const CACHE_NAME = 'pill-reminder-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

// Intercept requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Handle notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'take_pill') {
    // Mark pill as taken
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].postMessage({
            type: 'PILL_TAKEN',
            pillId: event.notification.data.pillId
          });
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  } else {
    // Open app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Show scheduled notifications
self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { pill, time } = event.data;
    const now = new Date();
    const notificationTime = new Date(time);
    const delay = notificationTime.getTime() - now.getTime();
    
    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification(`Time to take ${pill.name}`, {
          body: `Don't forget to take your ${pill.name}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: { pillId: pill.id },
          actions: [
            {
              action: 'take_pill',
              title: 'Taken'
            }
          ],
          requireInteraction: true,
          silent: false
        });
      }, delay);
    }
  }
});