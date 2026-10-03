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
