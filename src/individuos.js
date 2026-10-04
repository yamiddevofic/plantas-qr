// Utilidades puras del módulo de individuos (árboles físicos geolocalizados).

export const PARQUE_PREDETERMINADO = 'Parque Principal de Chitagá';

const sinTildes = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** CIP-011: tres letras del nombre común y el siguiente número libre de esa serie. */
export function sugerirCodigo(nombreComun, codigosExistentes) {
  const prefijo = sinTildes(String(nombreComun || '')).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
  if (prefijo.length < 2) return '';
  const patron = new RegExp(`^${prefijo}-(\\d+)$`);
  let mayor = 0;
  for (const codigo of codigosExistentes) {
    const coincidencia = patron.exec(codigo);
    if (coincidencia) mayor = Math.max(mayor, Number(coincidencia[1]));
  }
  return `${prefijo}-${String(mayor + 1).padStart(3, '0')}`;
}

/**
 * El catálogo histórico tiene varias fichas por especie (una por foto/ejemplar).
 * Se agrupan por nombre científico: `id` es la primera ficha del grupo (la que se
 * guarda en el individuo) e `ids` son todas las hermanas.
 */
export function agruparEspecies(plantas) {
  const grupos = new Map();
  for (const planta of plantas) {
    const clave = String(planta.nombre?.cientifico ?? planta._id).trim().toLowerCase();
    const grupo = grupos.get(clave);
    if (grupo) {
      grupo.ids.push(planta._id);
    } else {
      grupos.set(clave, {
        id: planta._id,
        ids: [planta._id],
        nombre: planta.nombre?.comun ?? '',
        cientifico: planta.nombre?.cientifico ?? '',
      });
    }
  }
  return [...grupos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/** Parque más usado entre los individuos existentes (o el predeterminado). */
export function parqueMasUsado(features) {
  const conteo = new Map();
  for (const f of features) conteo.set(f.properties.parque, (conteo.get(f.properties.parque) ?? 0) + 1);
  let mejor = PARQUE_PREDETERMINADO;
  let max = 0;
  for (const [parque, n] of conteo) {
    if (n > max) { mejor = parque; max = n; }
  }
  return mejor;
}

// ── GPS: combinar varias lecturas ────────────────────────────────
// La primera lectura del teléfono suele venir del WiFi o las antenas (decenas o
// cientos de metros de error); el GPS real afina en unos segundos. Se usan solo
// las lecturas cercanas a la mejor y se promedian dando más peso a las más precisas.

/**
 * @param {{latitud:number, longitud:number, precision:number, altitud?:number|null}[]} lecturas
 * @returns {{latitud:number, longitud:number, precision:number, altitud:number|null, usadas:number}|null}
 */
export function combinarLecturas(lecturas) {
  const validas = lecturas.filter((l) => Number.isFinite(l.latitud) && Number.isFinite(l.longitud) && l.precision > 0);
  if (!validas.length) return null;
  const mejor = Math.min(...validas.map((l) => l.precision));
  const limite = Math.max(mejor * 1.5, mejor + 3);
  const buenas = validas.filter((l) => l.precision <= limite);
  let suma = 0;
  let lat = 0;
  let lng = 0;
  for (const l of buenas) {
    const peso = 1 / (l.precision * l.precision);
    suma += peso;
    lat += l.latitud * peso;
    lng += l.longitud * peso;
  }
  const alturas = buenas.map((l) => l.altitud).filter((a) => Number.isFinite(a));
  return {
    latitud: Number((lat / suma).toFixed(7)),
    longitud: Number((lng / suma).toFixed(7)),
    // Se informa la precisión de la mejor lectura: el promedio no se vende como más exacto.
    precision: Number(mejor.toFixed(1)),
    altitud: alturas.length ? Math.round(alturas.reduce((a, b) => a + b, 0) / alturas.length) : null,
    usadas: buenas.length,
  };
}

/** Calificación de una precisión en metros, para mostrarla en pantalla. */
export function calidadPrecision(metros) {
  if (!Number.isFinite(metros)) return { nivel: 'mala', texto: 'Sin señal' };
  if (metros <= 5) return { nivel: 'excelente', texto: 'Excelente' };
  if (metros <= 10) return { nivel: 'buena', texto: 'Buena' };
  if (metros <= 20) return { nivel: 'regular', texto: 'Regular' };
  return { nivel: 'mala', texto: 'Baja' };
}
