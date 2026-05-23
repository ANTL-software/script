// Service Worker pour ANTL Script PWA
// Version générée automatiquement lors du build - ne pas modifier manuellement
const BUILD_VERSION = '__BUILD_VERSION__';
const CACHE_NAME = `antl-script-v${BUILD_VERSION}`;
const STATIC_CACHE = `antl-script-static-v${BUILD_VERSION}`;
const DYNAMIC_CACHE = `antl-script-dynamic-v${BUILD_VERSION}`;

// Vérifier si nous sommes en mode développement
const isDevelopment = self.location.hostname === 'localhost' && self.location.port === '5173';

// Si en développement, désactiver complètement le Service Worker
if (isDevelopment) {
  console.log('[SW] Development mode detected - Service Worker will self-destruct');

  self.addEventListener('install', (event) => {
    console.log('[SW] Self-unregistering in development mode');
    self.registration.unregister().then(() => {
      console.log('[SW] Successfully unregistered');
    });
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    console.log('[SW] Activating only to unregister');
    self.clients.claim();
  });

  self.addEventListener('fetch', () => {});

} else {

// Fichiers à mettre en cache lors de l'installation
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/pwa-icons/icon-192x192.png',
  '/pwa-icons/icon-512x512.png',
  // Pages principales
  '/login',
  '/',
  '/plan-appel',
  '/objections'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static files:', error);
      })
  );

  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

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
    })
  );

  self.clients.claim();
});

// Patterns à exclure du cache
const DEV_PATTERNS = [
  /\/@vite\//,
  /\/@react-refresh/,
  /\/src\//,
  /\?t=/,
  /\?import/,
  /\.(tsx|ts|jsx)$/,
  /\.js.*\?t=/
];

const EXTERNAL_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'unpkg.com'
]);

// Stratégie de mise en cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  if (EXTERNAL_HOSTS.has(url.hostname)) {
    return;
  }

  if (DEV_PATTERNS.some(pattern => pattern.test(url.pathname + url.search))) {
    return;
  }

  // Stratégie pour les fichiers statiques
  if (STATIC_FILES.includes(url.pathname) ||
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image' ||
      request.destination === 'document') {

    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              return cache.put(request, responseClone);
            }).catch((error) => {
              console.warn('[SW] Cache operation failed:', error);
            });
          }
          return networkResponse;
        }).catch(() => {
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
    );

    return;
  }

  // Stratégie pour les appels API (Network First)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              return cache.put(request, responseClone);
            }).catch((error) => {
              console.warn('[SW] API cache operation failed:', error);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request);
        })
    );

    return;
  }
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      buildVersion: BUILD_VERSION,
      timestamp: Date.now()
    });
  }
});

}
