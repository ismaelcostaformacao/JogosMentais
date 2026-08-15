const CACHE_NAME = 'psicotreino-v8';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

let notifConfig = { enabled: false, time: '09:00' };

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
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
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Mensagens do cliente
self.addEventListener('message', event => {
  if (event.data.type === 'SCHEDULE_NOTIF') {
    notifConfig = {
      enabled: event.data.enabled,
      time: event.data.time
    };
    scheduleNotification();
  }
});

// Agendar notificação diária
function scheduleNotification() {
  if (!notifConfig.enabled) return;
  
  const [hours, minutes] = notifConfig.time.split(':').map(Number);
  const now = new Date();
  const notifTime = new Date();
  notifTime.setHours(hours, minutes, 0, 0);
  
  if (notifTime < now) {
    notifTime.setDate(notifTime.getDate() + 1);
  }
  
  const delay = notifTime.getTime() - now.getTime();
  
  setTimeout(() => {
    showDailyNotif();
    // Agendar próximo
    scheduleNotification();
  }, delay);
}

function showDailyNotif() {
  self.registration.showNotification('🧠 Hora do Treino!', {
    body: 'Não te esqueças do teu treino psicotécnico de hoje!',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    tag: 'daily-training',
    requireInteraction: false,
    actions: [
      { action: 'start', title: 'Começar Treino' },
      { action: 'snooze', title: 'Lembrar Depois' }
    ]
  });
}

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || ' PsicoTreino PT';
  const options = {
    body: data.body || 'É hora de treinar a Mente!',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    tag: 'psicotreino-notif',
    requireInteraction: false,
  };
  
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'start') {
    event.waitUntil(clients.openWindow('/'));
  } else if (event.action === 'snooze') {
    // Adiar 1 hora
    setTimeout(() => showDailyNotif(), 3600000);
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});