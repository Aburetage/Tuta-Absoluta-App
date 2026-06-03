// ============================================
// Service Worker - Tuta Absoluta App v4
// ============================================

const CACHE_NAME = 'tuta-app-v3';  // ← زود الرقم هنا كل ما تعدل

// الملفات الأساسية التي يجب تخزينها
const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './admin.html',
  './manifest.json',
  './robots.txt',
  './sitemap.xml'
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

// ملفات الأيقونات
const ICON_FILES = [
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
// Install Event - تثبيت Service Worker
// ============================================

self.addEventListener('install', event => {
  console.log('[SW] Installing new version:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching essential files...');
        return cache.addAll(ALL_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] All files cached successfully');
        // تفعيل النسخة الجديدة فوراً بدون انتظار إغلاق الصفحات القديمة
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Failed to cache some files:', err);
        // لا تمنع التثبيت حتى لو فشل بعض الملفات
      })
  );
});

// ============================================
// Activate Event - تنشيط Service Worker
// ============================================

self.addEventListener('activate', event => {
  console.log('[SW] Activating new version:', CACHE_NAME);
  
  event.waitUntil(
    // حذف كل الكاش القديم
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
      // السيطرة على جميع الصفحات المفتوحة فوراً
      return self.clients.claim();
    })
  );
});

// ============================================
// Fetch Event - طلبات الشبكة
// ============================================

self.addEventListener('fetch', event => {
  const { request } = event;
  
  // تجاهل الطلبات غير GET
  if (request.method !== 'GET') return;
  
  // تجاهل طلبات Chrome DevTools
  if (request.url.includes('chrome-extension')) return;
  
  // استراتيجية مختلفة حسب نوع الملف
  const url = new URL(request.url);
  
  // 1. ملفات البيانات - Network First (الشبكة أولاً)
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
            return cached || new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        })
    );
    return;
  }
  
  // 2. ملفات CSS و JS - Stale While Revalidate
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
  
  // 3. كل الملفات الأخرى - Cache First (الكاش أولاً)
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        return cached;
      }
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
      // صفحة Offline مخصصة
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
// Message Event - استقبال رسائل من الصفحة
// ============================================

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
});

// ============================================
// تحديث تلقائي كل ساعة
// ============================================

self.addEventListener('install', event => {
  // افحص وجود تحديث كل ساعة
  self.registration.addEventListener('updatefound', () => {
    const newWorker = self.registration.installing;
    console.log('[SW] Update found!');
  });
});

console.log('[SW] Service Worker loaded successfully');