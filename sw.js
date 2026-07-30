const CACHE_NAME = 'pionner-cache-v1';

// Aquí debes poner los nombres exactos de tus archivos.
// No pongas enlaces de Firebase aquí, solo tus archivos locales.
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js',
  '/style.css',
  '/icono-192.png',
  '/icono-512.png'
];

// 1. INSTALACIÓN: Guarda los archivos en el caché del celular
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Archivos cacheados exitosamente');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. ACTIVACIÓN: Borra cachés viejos si actualizas la versión (v2, v3...)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. INTERCEPTOR: Cuando la app pide un archivo, busca primero en caché
self.addEventListener('fetch', event => {
  // Ignoramos las peticiones a Firebase y bases de datos externas
  // para que Firebase siga manejando su propio modo offline.
  if (event.request.url.includes('firestore') || event.request.url.includes('firebase')) {
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el archivo está en caché (offline), lo devuelve. 
        // Si no, lo busca en internet.
        return response || fetch(event.request);
      })
  );
});

