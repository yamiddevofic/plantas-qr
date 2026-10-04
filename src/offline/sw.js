/* Service worker de PlantaQR. No lo importa la app: vite.config.js lo copia a
   dist/sw.js sustituyendo __VERSION__ y __PRECACHE__ por el contenido del build.

   Estrategias
   - App (index.html y /assets/*): precargada al instalar; la navegación va a la red
     primero y cae al index.html guardado, así la SPA abre sin conexión.
   - /api (solo GET): red primero con límite de espera; si falla, la última copia.
   - /uploads (fotos): la copia guardada primero; lo que se ve una vez queda disponible.
   - Teselas de mapa y tipografías: la copia guardada primero (con tope de entradas).
   Las escrituras (POST/PUT/DELETE) nunca pasan por aquí: la app las pone en cola. */

const VERSION = '__VERSION__';
const PRECACHE = '__PRECACHE__';

const CACHE_APP = `plantaqr-app-${VERSION}`;
const CACHE_API = 'plantaqr-api-v1';
const CACHE_FOTOS = 'plantaqr-fotos-v1';
const CACHE_MAPA = 'plantaqr-mapa-v1';
// Mapa satelital del parque descargado a propósito (offline/mapaParque.js): no se
// recorta ni se borra; cacheFirst lo encuentra con caches.match().
const CACHE_MAPA_PARQUE = 'plantaqr-mapa-parque-v1';
const CACHES_VIGENTES = [CACHE_APP, CACHE_API, CACHE_FOTOS, CACHE_MAPA, CACHE_MAPA_PARQUE];

const LIMITE_FOTOS = 250;
const LIMITE_MAPA = 800;
const ESPERA_API_MS = 4000;

const HOSTS_MAPA = [
  'server.arcgisonline.com',
  'tiles.openfreemap.org',
  's3.amazonaws.com',
];
const HOSTS_TIPOGRAFIA = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_APP)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(
        nombres.filter((n) => n.startsWith('plantaqr-') && !CACHES_VIGENTES.includes(n)).map((n) => caches.delete(n)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function recortar(nombreCache, limite) {
  const cache = await caches.open(nombreCache);
  const claves = await cache.keys();
  for (let i = 0; i < claves.length - limite; i += 1) await cache.delete(claves[i]);
}

async function guardar(nombreCache, request, response, limite) {
  const cache = await caches.open(nombreCache);
  await cache.put(request, response);
  if (limite) recortar(nombreCache, limite);
}

async function cacheFirst(request, nombreCache, { limite, aceptarOpaca = false } = {}) {
  const guardada = await caches.match(request);
  if (guardada) return guardada;
  const respuesta = await fetch(request);
  if (respuesta.ok || (aceptarOpaca && respuesta.type === 'opaque')) {
    guardar(nombreCache, request, respuesta.clone(), limite);
  }
  return respuesta;
}

function redPrimeroConLimite(request, nombreCache) {
  const red = fetch(request).then((respuesta) => {
    if (respuesta.ok) guardar(nombreCache, request, respuesta.clone());
    return respuesta;
  });
  const espera = new Promise((resolver) => {
    setTimeout(resolver, ESPERA_API_MS, null);
  });
  return Promise.race([red, espera]).then(async (respuesta) => {
    if (respuesta) return respuesta;
    // Red lenta: se prefiere la copia, pero si no la hay se espera a la red.
    return (await caches.match(request)) || red;
  }).catch(async (error) => {
    const guardada = await caches.match(request);
    if (guardada) return guardada;
    throw error;
  });
}

async function navegacion(request) {
  try {
    const respuesta = await fetch(request);
    if (respuesta.ok) guardar(CACHE_APP, '/index.html', respuesta.clone());
    return respuesta;
  } catch {
    return (await caches.match('/index.html')) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api-docs')) return;
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(redPrimeroConLimite(request, CACHE_API));
    } else if (url.pathname.startsWith('/uploads/')) {
      event.respondWith(cacheFirst(request, CACHE_FOTOS, { limite: LIMITE_FOTOS }));
    } else if (request.mode === 'navigate') {
      event.respondWith(navegacion(request));
    } else if (url.pathname.startsWith('/assets/') || PRECACHE.includes(url.pathname)) {
      event.respondWith(cacheFirst(request, CACHE_APP));
    }
    return;
  }

  if (HOSTS_MAPA.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, CACHE_MAPA, { limite: LIMITE_MAPA }));
  } else if (HOSTS_TIPOGRAFIA.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, CACHE_MAPA, { aceptarOpaca: true }));
  }
});
