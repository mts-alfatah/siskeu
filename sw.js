const CACHE_NAME = 'siskeu-cache-v5';
const urlsToCache = [
  './',
  './index.html',
  './dashboard.html',
  './style.css',
  './script.js',
  './manifest.json',
  './mts.ico'
];

// Menginstal cache saat pertama kali dibuka
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Menghapus cache lama saat service worker baru aktif
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
    })
  );
  self.clients.claim();
});

// Menggunakan cache agar lebih cepat dimuat (opsional untuk offline)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
