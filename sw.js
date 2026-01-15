
const CACHE_NAME = 'budget-smart-ghp-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './App.tsx',
  './constants.ts',
  './types.ts',
  './utils.ts',
  './services/dbService.ts',
  './components/Dashboard.tsx',
  './components/SectionView.tsx',
  './components/TransactionForm.tsx',
  './components/HistoryList.tsx'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => k !== CACHE_NAME && caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
