// ============================================
// Service Worker - Tuta Absoluta App v4
// اكاديمية المهندس الزراعي
// ============================================

const CACHE_NAME = 'tuta-app-v4';

// ============================================
// الملفات الأساسية
// ============================================
const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// ملفات JavaScript
const JS_FILES = [
  './js/data-loader.js'
];

// ملفات البيانات
const DATA_FILES = [
  './data/faq.json',
  './data/sources.json',
  './data/bio-agents.json',
  './data/spread-reasons.json',
  './data/economic-impact.json',
  './data/thermal-model.json',
  './data/seasonal-data.json',
  './data/plan-cards.json',
  './data/ipm-program.json',
  './data/resistance.json'
];

// ملفات الأيقونات (متطابقة مع manifest.json + index.html)
const ICON_FILES = [
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-192.png',
  './icons/icon-256.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './icons/favicon-32x32.png',
  './icons/favicon-16x16.png',
  './icons/apple-touch-icon.png'
];

// كل الملفات مع بعض
const ALL_CACHE_URLS = [
  ...PRECACHE_URLS,
  ...JS_FILES,
  ...DATA_FILES,
  ...ICON_FILES
];

// ============================================
// Install Event
// ============================================
self.addEventListener('install', event => {
  console.log('[SW] Installing version:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching essential files...');
        // استخدام Promise.allSettled عشان لو ملف ناقص، الباقي يتخزنوا
        return Promise.allSettled(
          ALL_CACHE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Could not cache: ${url}`);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] All cacheable files stored');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Install error:', err);
      })
  );
});

// ============================================
// Activate Event
// ============================================
self.addEventListener('activate', event => {
  console.log('[SW] Activating version:', CACHE_NAME);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[SW] Old caches deleted');
      return self.clients.claim();
    })
  );
});

// ============================================
// Fetch Event
// ============================================
self.addEventListener('fetch', event => {
  const { request } = event;
  
  if (request.method !== 'GET') return;
  if (request.url.includes('chrome-extension')) return;
  
  const url = new URL(request.url);
  
  // 1. ملفات البيانات - Network First
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cached => {
            return cached || new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }
  
  // 2. CSS و JS - Stale While Revalidate
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, clone);
              });
            }
            return response;
          })
          .catch(() => cached);
        
        return cached || fetchPromise;
      })
    );
    return;
  }
  
  // 3. باقي الملفات - Cache First
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, clone);
          });
        }
        return response;
      });
    }).catch(() => {
      if (request.headers.get('accept').includes('text/html')) {
        return caches.match('./index.html');
      }
      return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    })
  );
});

// ============================================
// Message Event
// ============================================
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => caches.delete(cacheName));
    });
  }
});

console.log('[SW] Service Worker v4 loaded - Agricultural Engineer Academy');