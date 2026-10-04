// Cola de cambios de especies hechos sin conexión (Gestión de especies).
//
// Mismo esquema que la de individuos (offline/cola.js): las funciones de cambio
// son puras (reciben y devuelven la cola) y `leerColaEspecies`/`guardarColaEspecies`
// la conservan en localStorage. La contraseña de administrador NUNCA se guarda:
// se pide al sincronizar.
//
// Operación: { tipo: 'crear' | 'editar' | 'fotos' | 'eliminar', id, nombre, error? }
//   - crear:    `id` temporal (prefijo `local-`). `datos` es lo que acepta la API
//               (nombreComun, familia, usos[]…) sin el archivo; `foto` indica si hay
//               una foto en IndexedDB (clave claveFotoEspecie(id, 'principal')).
//   - editar:   `id` del servidor; `datos` igual que en crear. Sin conexión no se
//               cambian fotos desde el formulario: para eso está «Fotos».
//   - fotos:    `orden` es la lista final (referencias que ya tenía y `nueva:<n>`);
//               las `nuevas` fotos están en IndexedDB con claveFotoEspecie(id, n).
//   - eliminar: borra la especie del servidor.
//   - `error` marca una operación que el servidor rechazó (409, 400…) para mostrarla.

import { borrarFoto } from './fotos.js';

export { esIdLocal, nuevoIdLocal } from './cola.js';

const CLAVE = 'plantaqr:cola-especies:v1';

export function leerColaEspecies() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    const cola = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(cola) ? cola : [];
  } catch {
    return [];
  }
}

export function guardarColaEspecies(cola) {
  try {
    if (cola.length) localStorage.setItem(CLAVE, JSON.stringify(cola));
    else localStorage.removeItem(CLAVE);
  } catch (error) {
    // Modo privado o cuota llena: los cambios siguen en memoria mientras dure la página.
    console.warn('No se pudo guardar la cola de especies sin conexión:', error);
  }
}

/** Clave en IndexedDB de una foto de especie: 'principal' (alta) o el índice de las nuevas. */
export const claveFotoEspecie = (id, sufijo) => `especie::${id}::${sufijo}`;

/** Claves de IndexedDB que usa una operación. */
export function clavesDeFotos(op) {
  if (op.tipo === 'crear' && op.foto) return [claveFotoEspecie(op.id, 'principal')];
  if (op.tipo === 'fotos') return Array.from({ length: op.nuevas ?? 0 }, (_, i) => claveFotoEspecie(op.id, i));
  return [];
}

/** Borra de IndexedDB las fotos de una operación (al enviarla, reemplazarla o descartarla). */
export async function borrarFotosDeOperacion(op) {
  for (const clave of clavesDeFotos(op)) await borrarFoto(clave).catch(() => {});
}

const mismaOperacion = (a, b) => a.tipo === b.tipo && a.id === b.id;

/** Especie nueva. */
export function encolarCrear(cola, id, datos, foto = false) {
  return [...cola, { tipo: 'crear', id, nombre: datos.nombreComun, datos, foto }];
}

/**
 * Edita: si la especie aún no existe en el servidor se modifica su `crear`; si ya
 * hay un `editar` pendiente se reemplaza. `foto` (solo para altas) cambia si hay
 * foto guardada; `undefined` conserva lo que había.
 */
export function encolarEditar(cola, id, datos, foto) {
  const nombre = datos.nombreComun;
  if (cola.some((op) => op.id === id && (op.tipo === 'crear' || op.tipo === 'editar'))) {
    return cola.map((op) => {
      if (op.id !== id || (op.tipo !== 'crear' && op.tipo !== 'editar')) return op;
      return { ...op, nombre, datos, error: undefined, ...(op.tipo === 'crear' && foto !== undefined ? { foto } : {}) };
    });
  }
  return [...cola, { tipo: 'editar', id, nombre, datos }];
}

/** Fotos de una especie ya existente; solo vale la última lista guardada. */
export function encolarFotos(cola, id, nombre, orden, nuevas) {
  return [...cola.filter((op) => !(op.id === id && op.tipo === 'fotos')), { tipo: 'fotos', id, nombre, orden, nuevas }];
}

/** Elimina: si nunca llegó al servidor, basta con descartar sus operaciones. */
export function encolarEliminar(cola, id, nombre) {
  const sinEsta = cola.filter((op) => op.id !== id);
  return String(id).startsWith('local-') ? sinEsta : [...sinEsta, { tipo: 'eliminar', id, nombre }];
}

/** Quita todas las operaciones de una especie. */
export const descartar = (cola, id) => cola.filter((op) => op.id !== id);

/** Quita solo esa operación (mismo tipo e id). */
export const descartarOperacion = (cola, objetivo) => cola.filter((op) => !mismaOperacion(op, objetivo));

/** Marca con error todas las operaciones de una especie. */
export const marcarError = (cola, id, mensaje) => cola.map((op) => (op.id === id ? { ...op, error: mensaje } : op));

/** Marca con error solo esa operación. */
export const marcarErrorOperacion = (cola, objetivo, mensaje) => cola.map((op) => (
  mismaOperacion(op, objetivo) ? { ...op, error: mensaje } : op
));

/** Cuando el servidor crea una especie, lo que quedaba con su id local pasa al real. */
export const reasignarId = (cola, de, a) => cola.map((op) => (op.id === de ? { ...op, id: a } : op));

/** Campos de una especie a partir de lo que escribió la persona en el formulario. */
export function datosAPlanta(datos, base = {}) {
  const ejemplares = datos.ejemplaresEnParque === '' || datos.ejemplaresEnParque == null
    ? base.ejemplaresEnParque
    : Number(datos.ejemplaresEnParque);
  return {
    nombre: { comun: datos.nombreComun, cientifico: datos.nombreCientifico },
    familia: datos.familia,
    origen: datos.origen,
    tipo: datos.tipo,
    descripcion: { general: datos.descripcionGeneral, hojas: datos.descripcionHojas },
    altura: datos.altura,
    usos: datos.usos,
    impacto: datos.impacto,
    estadoConservacion: datos.estadoConservacion,
    ubicacion: {
      ...base.ubicacion,
      latitud: Number(datos.latitud),
      longitud: Number(datos.longitud),
      descripcion: datos.ubicacionDescripcion,
    },
    ...(ejemplares === undefined ? {} : { ejemplaresEnParque: ejemplares }),
  };
}

/** Fotos de una especie según una operación `fotos`: `locales` traduce las claves a URLs de vista previa. */
function fotosDeOperacion(op, locales) {
  const lista = op.orden
    .map((ref) => {
      const nueva = /^nueva:(\d+)$/.exec(ref);
      return nueva ? locales[claveFotoEspecie(op.id, Number(nueva[1]))] : ref;
    })
    .filter(Boolean);
  return { imagen: lista[0] ?? '', imagenes: lista.slice(1) };
}

/**
 * Superpone la cola sobre las especies del servidor para mostrar lo que verá la
 * persona aunque aún no se haya enviado. Cada especie afectada lleva
 * `pendiente` ('crear' | 'editar' | 'fotos') y, si el servidor la rechazó,
 * `errorSincronizacion`. `locales` mapea claves de IndexedDB a URLs temporales.
 */
export function aplicarColaEspecies(plantas, cola, locales = {}) {
  if (!cola.length) return plantas;
  let resultado = plantas;
  for (const op of cola) {
    if (op.tipo === 'eliminar') {
      resultado = resultado.filter((p) => p._id !== op.id);
    } else if (op.tipo === 'editar') {
      resultado = resultado.map((p) => (p._id === op.id
        ? { ...p, ...datosAPlanta(op.datos, p), pendiente: p.pendiente ?? 'editar', errorSincronizacion: op.error ?? null }
        : p));
    } else if (op.tipo === 'fotos') {
      resultado = resultado.map((p) => (p._id === op.id
        ? { ...p, ...fotosDeOperacion(op, locales), pendiente: p.pendiente ?? 'fotos', errorSincronizacion: op.error ?? p.errorSincronizacion ?? null }
        : p));
    } else if (op.tipo === 'crear') {
      resultado = [{
        ...datosAPlanta(op.datos),
        _id: op.id,
        imagen: op.foto ? locales[claveFotoEspecie(op.id, 'principal')] ?? '' : '',
        imagenes: [],
        pendiente: 'crear',
        errorSincronizacion: op.error ?? null,
      }, ...resultado];
    }
  }
  return resultado;
}
