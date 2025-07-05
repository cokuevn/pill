// Enhanced Service Worker для PWA - Stable Version без AdSense ошибок
const CACHE_NAME = 'pill-reminder-v4-stable';
const STATIC_CACHE = 'pill-reminder-static-v4';
const DYNAMIC_CACHE = 'pill-reminder-dynamic-v4';

// Файлы для кэширования
const STATIC_FILES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Стратегия кэширования
self.addEventListener('fetch', (event) => {
  // Игнорируем запросы расширений браузера
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонируем ответ для кэширования
            const responseToCache = response.clone();

            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Возвращаем офлайн страницу для навигационных запросов
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'take_pill') {
    // Отметить таблетку как принятую
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          const client = clientList[0];
          client.postMessage({
            type: 'PILL_TAKEN',
            pillId: event.notification.data.pillId
          });
          return client.focus();
        }
        return clients.openWindow('/');
      })
    );
  } else {
    // Открыть приложение
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        const client = clientList.find(c => c.url === self.registration.scope);
        if (client) {
          return client.focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Планирование уведомлений
const scheduledNotifications = new Map();

self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { pill, time } = event.data;
    const now = new Date();
    const notificationTime = new Date(time);
    const delay = notificationTime.getTime() - now.getTime();
    
    console.log(`[SW] Scheduling notification for ${pill.name} in ${delay}ms`);
    
    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        showNotification(pill);
        scheduledNotifications.delete(pill.id);
      }, delay);
      
      scheduledNotifications.set(pill.id, timeoutId);
    }
  }
  
  if (event.data.type === 'CANCEL_NOTIFICATION') {
    const { pillId } = event.data;
    const timeoutId = scheduledNotifications.get(pillId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      scheduledNotifications.delete(pillId);
      console.log(`[SW] Cancelled notification for pill ${pillId}`);
    }
  }
});

// Показ уведомления
function showNotification(pill) {
  const options = {
    body: `Don't forget to take your ${pill.name}`,
    icon: '/manifest-icon-192.maskable.png',
    badge: '/manifest-icon-192.maskable.png',
    image: generatePillImage(pill.icon),
    data: { pillId: pill.id },
    actions: [
      {
        action: 'take_pill',
        title: '✓ Taken',
        icon: '/manifest-icon-192.maskable.png'
      },
      {
        action: 'snooze',
        title: 'Remind later',
        icon: '/manifest-icon-192.maskable.png'
      }
    ],
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200],
    tag: `pill-${pill.id}`,
    renotify: true
  };

  self.registration.showNotification(`💊 Time for ${pill.name}!`, options);
}

// Генерация изображения для таблетки
function generatePillImage(emoji) {
  // В реальном приложении здесь можно генерировать изображение
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="#4096FF"/>
      <text x="50" y="65" font-size="40" text-anchor="middle" fill="white">${emoji}</text>
    </svg>
  `)}`;
}

// Обработка Push уведомлений (для будущего использования)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/manifest-icon-192.maskable.png',
      badge: '/manifest-icon-192.maskable.png',
      data: data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Обработка фоновой синхронизации
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Здесь можно синхронизировать данные с сервером
  console.log('[SW] Background sync triggered');
  return Promise.resolve();
}

// Периодическая фоновая синхронизация (экспериментальная функция)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'pill-reminder-sync') {
    event.waitUntil(doPillReminderSync());
  }
});

function doPillReminderSync() {
  console.log('[SW] Periodic sync for pill reminders');
  return Promise.resolve();
}