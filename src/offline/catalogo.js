// Guarda el catálogo completo en el teléfono para verlo sin conexión: la lista de
// especies, la ficha, el QR y los individuos de cada una, y sus fotos. Todo va a las
// mismas cachés que usa el service worker (sw.js), que las encuentra con
// caches.match() al estar sin red; por eso no hace falta que el worker controle la
// página al descargar.

import VARIANTES from '../variantesImagenes.json';

const CACHE_API = 'plantaqr-api-v1';
const CACHE_FOTOS = 'plantaqr-fotos-v1';
const CLAVE_ESTADO = 'plantaqr:catalogo-offline:v1';
const CONCURRENCIA = 6;

export function leerEstadoCatalogo() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ESTADO) || 'null');
  } catch {
    return null;
  }
}

function guardarEstado(estado) {
  try {
    localStorage.setItem(CLAVE_ESTADO, JSON.stringify(estado));
  } catch {
    // Sin almacenamiento solo se pierde el aviso; los datos siguen en caché.
  }
}

/**
 * Archivos de una foto del catálogo que hay que tener para verla bien: los recortes
 * de hasta 800 px (tarjetas y ficha en móvil) y el original solo si no hay recorte
 * de 800 (entonces ya es pequeño). Sin conexión, el worker sirve otro tamaño de la
 * misma foto si el que pide el navegador no está guardado.
 */
export function archivosDeFoto(src) {
  if (typeof src !== 'string' || !src) return [];
  if (!src.startsWith('/')) return []; // fotos de otros sitios: no se guardan
  const coincide = src.match(/^\/uploads\/(.+)\.webp$/);
  const entrada = coincide && VARIANTES[coincide[1]];
  if (!entrada) return [src];
  const recortes = entrada.recortes.filter((a) => a <= 800).map((a) => `/uploads/${coincide[1]}-${a}.webp`);
  return entrada.recortes.includes(800) ? recortes : [...recortes, src];
}

/**
 * Descarga lo que falte (6 peticiones a la vez). `onProgreso(hechas, total)` se
 * llama tras cada una. Devuelve { especies, archivos, fallidos, bytes, fecha }.
 */
export async function descargarCatalogo(onProgreso) {
  if (!('caches' in window)) throw new Error('Este navegador no permite guardar el catálogo sin conexión.');
  const [cacheApi, cacheFotos] = await Promise.all([caches.open(CACHE_API), caches.open(CACHE_FOTOS)]);

  let hechas = 0;
  let total = 0;
  let fallidos = 0;
  let bytes = 0;
  const avanzar = () => {
    hechas += 1;
    onProgreso?.(hechas, total);
  };

  /** Pide una ruta de la API y la deja guardada. Devuelve el JSON. */
  async function datos(ruta) {
    const respuesta = await fetch(ruta);
    if (!respuesta.ok) throw new Error(String(respuesta.status));
    await cacheApi.put(ruta, respuesta.clone());
    return respuesta.json();
  }

  /** Corre tareas con un tope de concurrencia; una que falle no frena a las demás. */
  async function correr(tareas) {
    const cola = [...tareas];
    await Promise.all(Array.from({ length: CONCURRENCIA }, async () => {
      while (cola.length) {
        try {
          await cola.shift()();
        } catch {
          fallidos += 1;
        }
        avanzar();
      }
    }));
  }

  // 1. Datos: la lista manda; de cada especie, ficha, QR e individuos.
  total = 2;
  const plantas = await datos('/api/plantas');
  const fotos = new Set();
  const sumarFotos = (...rutas) => rutas.flatMap(archivosDeFoto).forEach((r) => fotos.add(r));
  // Todas las fotos de la especie: carrusel, portada de noche, hoja, tallo y fruto.
  const fotosDe = (p) => [p.imagen, ...(p.imagenes ?? []), p.imagenNoche, p.imagenHoja, p.imagenTallo, p.imagenFruto];
  plantas.forEach((p) => sumarFotos(...fotosDe(p)));
  avanzar();
  await datos('/api/qr').catch(() => { fallidos += 1; });
  avanzar();

  const tareasDatos = plantas.flatMap((p) => [
    async () => {
      const ficha = await datos(`/api/plantas/${p._id}`);
      sumarFotos(...fotosDe(ficha));
    },
    () => datos(`/api/qr/${p._id}`).catch((e) => {
      if (e.message !== '404') throw e; // una especie sin QR no es un fallo
    }),
    async () => {
      const coleccion = await datos(`/api/individuos?especieId=${p._id}`);
      (coleccion.features ?? []).forEach((f) => sumarFotos(f.properties?.imagen, f.properties?.imagenEscritorio, f.properties?.imagenNoche));
    },
  ]);
  total += tareasDatos.length;
  await correr(tareasDatos);

  // 2. Fotos: las del catálogo van a la caché de fotos; las que sirve la API (tomadas
  // desde la app), a la de datos, que es la que el worker consulta para ellas.
  const tareasFotos = [...fotos].map((ruta) => async () => {
    const cache = ruta.startsWith('/uploads/') ? cacheFotos : cacheApi;
    const existente = await cache.match(ruta);
    if (existente) return;
    const respuesta = await fetch(ruta);
    if (!respuesta.ok) throw new Error(String(respuesta.status));
    bytes += Number(respuesta.headers.get('content-length')) || (await respuesta.clone().blob()).size;
    await cache.put(ruta, respuesta);
  });
  total += tareasFotos.length;
  await correr(tareasFotos);

  navigator.storage?.persist?.().catch(() => {});
  const resultado = { especies: plantas.length, archivos: fotos.size, fallidos, bytes, fecha: new Date().toISOString() };
  guardarEstado(resultado);
  return resultado;
}
