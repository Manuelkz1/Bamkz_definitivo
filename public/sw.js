const CACHE_NAME = 'bamkz-v1.0.0';
const STATIC_CACHE = 'bamkz-static-v1.0.0';
const DYNAMIC_CACHE = 'bamkz-dynamic-v1.0.0';

// Recursos críticos que se cachean inmediatamente
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Se agregan automáticamente durante el build
];

// Recursos que se cachean bajo demanda
const CACHEABLE_PATHS = [
  '/api/',
  '/images/',
  '/_app/',
  '/auth',
  '/cart',
  '/checkout'
];

// Recursos que nunca se cachean
const NO_CACHE_PATHS = [
  '/admin',
  '/functions',
  '/realtime'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo cachear requests GET
  if (request.method !== 'GET') {
    return;
  }
  
  // No cachear rutas específicas
  if (NO_CACHE_PATHS.some(path => url.pathname.startsWith(path))) {
    return;
  }
  
  // Estrategia Cache First para recursos estáticos
  if (request.destination === 'image' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      url.pathname.includes('/icons/')) {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              // Solo cachear respuestas exitosas
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return response;
            });
        })
        .catch(() => {
          // Fallback para imágenes
          if (request.destination === 'image') {
            return caches.match('/images/placeholder.jpg');
          }
        })
    );
    return;
  }
  
  // Estrategia Network First para páginas y API
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Solo cachear respuestas exitosas de páginas HTML
          if (response.status === 200 && 
              (request.headers.get('accept')?.includes('text/html') ||
               CACHEABLE_PATHS.some(path => url.pathname.startsWith(path)))) {
            
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Buscar en cache como fallback
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Fallback para páginas HTML
              if (request.headers.get('accept')?.includes('text/html')) {
                return caches.match('/offline.html');
              }
            });
        })
    );
  }
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Manejar notificaciones push (para futuras implementaciones)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      },
      actions: [
        {
          action: 'open',
          title: 'Abrir',
          icon: '/icons/action-open.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/icons/action-close.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Sync en segundo plano (para cuando se restaure la conexión)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aquí se pueden sincronizar datos pendientes
      console.log('[SW] Background sync triggered')
    );
  }
});
