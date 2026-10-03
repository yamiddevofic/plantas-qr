// Cola de cambios de individuos hechos sin conexión.
//
// Las funciones de cambio son puras (reciben y devuelven la cola) para poder
// razonar sobre ellas; `leerCola`/`guardarCola` la conservan en localStorage.
// La contraseña de administrador NUNCA se guarda aquí: se pide al sincronizar.
//
// Operación: { tipo: 'crear' | 'editar' | 'eliminar' | 'foto', id, datos?, error? }
//   - crear: `id` es temporal (prefijo `local-`) hasta que el servidor asigne el real.
//   - editar / eliminar: `id` es el del individuo en el servidor.
//   - `datos` es el cuerpo que acepta la API (codigoArbol, especieId, latitud…).
//   - foto: la imagen está en IndexedDB (offline/fotos.js) con la clave `id`;
//     `codigoArbol` solo sirve para nombrarla en pantalla.
//   - `error` marca una operación que el servidor rechazó (409, 400…) para mostrarla.

const CLAVE = 'plantaqr:cola-individuos:v1';

export const esIdLocal = (id) => String(id).startsWith('local-');

export function nuevoIdLocal() {
  const azar = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `local-${azar}`;
}

export function leerCola() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    const cola = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(cola) ? cola : [];
  } catch {
    return [];
  }
}

export function guardarCola(cola) {
  try {
    if (cola.length) localStorage.setItem(CLAVE, JSON.stringify(cola));
    else localStorage.removeItem(CLAVE);
  } catch (error) {
    // Modo privado o cuota llena: los cambios siguen en memoria mientras dure la página.
    console.warn('No se pudo guardar la cola sin conexión:', error);
  }
}

/** Agrega un individuo nuevo. */
export function encolarCrear(cola, datos, id = nuevoIdLocal()) {
  return [...cola, { tipo: 'crear', id, datos }];
}

/** Edita: si el individuo aún no existe en el servidor se modifica su `crear`. */
export function encolarEditar(cola, id, datos) {
  if (cola.some((op) => op.id === id && (op.tipo === 'crear' || op.tipo === 'editar'))) {
    return cola.map((op) => (op.id === id && op.tipo !== 'eliminar' ? { tipo: op.tipo, id, datos } : op));
  }
  return [...cola, { tipo: 'editar', id, datos }];
}

/** Elimina: si nunca llegó al servidor, basta con descartar sus operaciones. */
export function encolarEliminar(cola, id) {
  const sinEste = cola.filter((op) => op.id !== id);
  return esIdLocal(id) ? sinEste : [...sinEste, { tipo: 'eliminar', id }];
}

/** Foto nueva para un individuo (local o del servidor); una sola por individuo. */
export function encolarFoto(cola, id, codigoArbol) {
  const sinFotoPrevia = cola.filter((op) => !(op.tipo === 'foto' && op.id === id));
  return [...sinFotoPrevia, { tipo: 'foto', id, codigoArbol }];
}

/** Quita todas las operaciones de un individuo. */
export const descartar = (cola, id) => cola.filter((op) => op.id !== id);

/** Quita solo esa operación (mismo tipo e id). */
export const descartarOperacion = (cola, { tipo, id }) => cola.filter((op) => !(op.tipo === tipo && op.id === id));

/** Marca con error todas las operaciones de un individuo. */
export const marcarError = (cola, id, mensaje) => cola.map((op) => (op.id === id ? { ...op, error: mensaje } : op));

/** Marca con error solo esa operación. */
export const marcarErrorOperacion = (cola, { tipo, id }, mensaje) => cola.map((op) => (
  op.tipo === tipo && op.id === id ? { ...op, error: mensaje } : op
));

/** Cuando el servidor crea un individuo, lo que quedaba con su id local pasa al real. */
export const reasignarId = (cola, de, a) => cola.map((op) => (op.id === de ? { ...op, id: a } : op));

/**
 * Superpone la cola sobre los individuos del servidor para mostrar lo que verá
 * la persona aunque aún no se haya enviado. Cada Feature afectada lleva
 * `properties.pendiente` ('crear' | 'editar').
 */
export function aplicarCola(features, cola, plantas) {
  if (!cola.length) return features;
  const especiePorId = new Map(plantas.map((p) => [p._id, p]));
  const aFeature = (op, base) => {
    const { datos } = op;
    const especie = especiePorId.get(datos.especieId) ?? base?.properties.especie ?? null;
    return {
      type: 'Feature',
      id: op.id,
      geometry: { type: 'Point', coordinates: [datos.longitud, datos.latitud] },
      properties: {
        ...base?.properties,
        id: op.id,
        codigoArbol: datos.codigoArbol,
        parque: datos.parque,
        altitudMsnm: datos.altitudMsnm ?? null,
        precisionGpsM: datos.precisionGpsM ?? null,
        imagen: datos.imagen || base?.properties.imagen || '',
        especie: especie && { _id: especie._id, nombre: especie.nombre, familia: especie.familia },
        pendiente: op.tipo,
        errorSincronizacion: op.error ?? null,
      },
    };
  };

  let resultado = features;
  for (const op of cola) {
    if (op.tipo === 'eliminar') {
      resultado = resultado.filter((f) => f.properties.id !== op.id);
    } else if (op.tipo === 'editar') {
      resultado = resultado.map((f) => (f.properties.id === op.id ? aFeature(op, f) : f));
    } else if (op.tipo === 'crear') {
      resultado = [...resultado, aFeature(op)];
    }
  }
  return resultado.sort((a, b) => a.properties.codigoArbol.localeCompare(b.properties.codigoArbol, 'es', { numeric: true }));
}
