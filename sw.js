// ============================================
// Service Worker - Tuta Absoluta App v4 (Smart Caching)
// استراتيجية تخزين ذكية: Network First للبيانات، Stale-While-Revalidate للأكواد، Cache First للأصول
// ============================================

const CACHE_NAME = 'tuta-app-v4'; // تم تحديث الإصدار لضمان تحميل الملفات الجديدة

// الملفات الأساسية التي يجب تخزينها فوراً
const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './robots.txt',
  './sitemap.xml',
  './js/data-loader.js',
  './js/worker.js' // إضافة Web Worker الجديد
];

// ملفات البيانات (JSON)
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

// ملفات الأيقونات والصور
const ICON_FILES = [
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './icons/favicon-32x32.png',
  './icons/favicon-16x16.png',
  './icons/apple-touch-icon.png'
];

const ALL_CACHE_URLS = [
  ...PRECACHE_URLS,
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
        return self.skipWaiting(); // تفعيل النسخة الجديدة فوراً
      })
      .catch(err => {
        console.error('[SW] Failed to cache some files:', err);
      })
  );
});

// ============================================
// Activate Event - تنشيط Service Worker وتنظيف القديم
// ============================================
self.addEventListener('activate', event => {
  console.log('[SW] Activating new version:', CACHE_NAME);
  
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
      return self.clients.claim(); // السيطرة على جميع الصفحات المفتوحة فوراً
    })
  );
});

// ============================================
// Fetch Event - طلبات الشبكة (الاستراتيجية الذكية)
// ============================================
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // تجاهل الطلبات غير GET أو طلبات الامتدادات
  if (request.method !== 'GET' || request.url.includes('chrome-extension')) return;
  
  const url = new URL(request.url);
  
  // 1. ملفات البيانات (JSON) - Network First (الشبكة أولاً، ثم الكاش)
  // يضمن دائماً الحصول على أحدث البيانات إذا كان هناك إنترنت
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cached => {
            return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
        })
    );
    return;
  }
  
  // 2. ملفات JavaScript و CSS - Stale While Revalidate (الكاش فوراً، ثم التحديث في الخلفية)
  // يضمن سرعة تحميل فورية مع الحصول على التحديثات في الزيارات التالية
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        
        return cached || fetchPromise;
      })
    );
    return;
  }
  
  // 3. الأيقونات والصور - Cache First (الكاش أولاً)
  if (url.pathname.includes('/icons/') || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
  
  // 4. كل الملفات الأخرى (بما في ذلك HTML) - Cache First مع Fallback لصفحة Offline
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      });
    }).catch(() => {
      // إذا فشل كل شيء وكان الطلب صفحة HTML، أعد صفحة index.html المخزنة
      if (request.headers.get('accept').includes('text/html')) {
        return caches.match('./index.html');
      }
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});

// ============================================
// Message Event - استقبال رسائل من الصفحة الرئيسية
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

console.log('[SW] Smart Service Worker loaded successfully');