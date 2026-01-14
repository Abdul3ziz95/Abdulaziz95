
const CACHE_NAME = 'budget-ai-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './App.tsx',
  './index.tsx',
  './types.ts',
  './constants.ts',
  './utils.ts',
  './services/dbService.ts',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  'https://cdn-icons-png.flaticon.com/512/2654/2654260.png'
];

// تثبيت الـ Service Worker وحفظ الملفات
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching all assets for offline use');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تفعيل وتحديث الـ Cache القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استراتيجية Network-first مع Fallback للـ Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // تحديث الـ Cache بالنسخة الجديدة إذا نجح الاتصال
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // في حال عدم وجود إنترنت، استخدم النسخة المحفوظة
        return caches.match(event.request);
      })
  );
});
