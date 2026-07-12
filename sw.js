const CACHE_NAME = 'psicotreino-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Cache aberto');
        return cache.addAll(ASSETS);
      })
      .catch(function(err) {
        console.warn('[SW] Falha no cache:', err);
      })
  );
  self.skipWaiting();
});

// Activate - limpar caches antigas
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          console.log('[SW] Apagar cache antiga:', name);
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(event.request).then(function(response) {
          return response || caches.match('./index.html');
        });
      })
  );
});