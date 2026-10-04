// Descarga el mapa satelital del parque y sus alrededores al teléfono, para que el
// mapa del formulario de individuos funcione en campo sin conexión. Las teselas van
// a una caché propia que el service worker no recorta (sw.js) y que encuentra al
// buscar con caches.match(), igual que las que se guardan al navegar.

import { SATELITE, urlTeselaSatelite } from '../mapa/fuentes';

export const CACHE_MAPA_PARQUE = 'plantaqr-mapa-parque-v1';
const CLAVE_ESTADO = 'plantaqr:mapa-parque:v1';

// Centro del Parque Principal de Chitagá (promedio de los individuos con GPS).
const CENTRO = { lat: 7.13825, lng: -72.66495 };

// Zonas por nivel de zoom: más detalle cerca del parque, más área a menos zoom
// (para ubicarse en el casco urbano). Radios en grados (~111 km por grado).
const ZONAS = [
  { zooms: [14, 15], radio: 0.02 }, // ~2,2 km: el pueblo
  { zooms: [16, 17], radio: 0.006 }, // ~670 m: el parque y las calles vecinas
  { zooms: [18], radio: 0.004 }, // ~450 m: máximo detalle de Esri sobre Chitagá
];

const lon2x = (lng, z) => Math.floor(((lng + 180) / 360) * 2 ** z);
const lat2y = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};

/** URLs de todas las teselas a descargar. */
export function teselasDelParque() {
  const urls = [];
  for (const { zooms, radio } of ZONAS) {
    for (const z of zooms) {
      if (z > SATELITE.maxzoom) continue;
      const x0 = lon2x(CENTRO.lng - radio, z);
      const x1 = lon2x(CENTRO.lng + radio, z);
      const y0 = lat2y(CENTRO.lat + radio, z);
      const y1 = lat2y(CENTRO.lat - radio, z);
      for (let x = x0; x <= x1; x += 1) {
        for (let y = y0; y <= y1; y += 1) urls.push(urlTeselaSatelite(z, x, y));
      }
    }
  }
  return urls;
}

export function leerEstado() {
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
    // Sin almacenamiento solo se pierde el aviso; las teselas siguen en caché.
  }
}

/**
 * Descarga las teselas que falten (6 a la vez). `onProgreso(hechas, total)` se
 * llama tras cada una. Devuelve { total, guardadas, fallidas, bytes }.
 */
export async function descargarMapaParque(onProgreso) {
  if (!('caches' in window)) throw new Error('Este navegador no permite guardar el mapa sin conexión.');
  const cache = await caches.open(CACHE_MAPA_PARQUE);
  const urls = teselasDelParque();
  let hechas = 0;
  let fallidas = 0;
  let bytes = 0;
  const cola = [...urls];

  async function trabajador() {
    while (cola.length) {
      const url = cola.shift();
      try {
        const existente = await cache.match(url);
        if (existente) {
          bytes += Number(existente.headers.get('content-length')) || 0;
        } else {
          const respuesta = await fetch(url, { mode: 'cors', credentials: 'omit' });
          if (!respuesta.ok) throw new Error(String(respuesta.status));
          const blob = await respuesta.clone().blob();
          bytes += blob.size;
          await cache.put(url, respuesta);
        }
      } catch {
        fallidas += 1;
      }
      hechas += 1;
      onProgreso?.(hechas, urls.length);
    }
  }

  await Promise.all(Array.from({ length: 6 }, trabajador));
  navigator.storage?.persist?.().catch(() => {});
  const resultado = { total: urls.length, guardadas: urls.length - fallidas, fallidas, bytes, fecha: new Date().toISOString() };
  if (resultado.guardadas > 0) guardarEstado(resultado);
  return resultado;
}
