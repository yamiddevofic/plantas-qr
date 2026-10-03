// Fotos tomadas sin conexión, guardadas en IndexedDB (localStorage no admite
// archivos y se queda corto). Clave: id del individuo (local-… o del servidor).

const BD = 'plantaqr';
const ALMACEN = 'fotos-individuos';

function abrir() {
  return new Promise((resolver, rechazar) => {
    if (!('indexedDB' in globalThis)) {
      rechazar(new Error('Este navegador no permite guardar fotos sin conexión'));
      return;
    }
    const peticion = indexedDB.open(BD, 1);
    peticion.onupgradeneeded = () => peticion.result.createObjectStore(ALMACEN);
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => rechazar(peticion.error);
  });
}

async function operar(modo, accion) {
  const bd = await abrir();
  try {
    return await new Promise((resolver, rechazar) => {
      const tx = bd.transaction(ALMACEN, modo);
      const resultado = accion(tx.objectStore(ALMACEN));
      tx.oncomplete = () => resolver(resultado?.result);
      tx.onerror = () => rechazar(tx.error);
      tx.onabort = () => rechazar(tx.error || new Error('Operación cancelada'));
    });
  } finally {
    bd.close();
  }
}

export async function guardarFoto(id, blob) {
  await operar('readwrite', (almacen) => almacen.put(blob, id));
  // Pide al navegador no borrar estos datos aunque falte espacio.
  navigator.storage?.persist?.().catch(() => {});
}

export const leerFoto = (id) => operar('readonly', (almacen) => almacen.get(id));

export const borrarFoto = (id) => operar('readwrite', (almacen) => almacen.delete(id));

export async function moverFoto(de, a) {
  const blob = await leerFoto(de);
  if (!blob) return;
  await guardarFoto(a, blob);
  await borrarFoto(de);
}

const LADO_MAXIMO = 1600;

/**
 * Reduce la foto de la cámara (a menudo 4–12 MB) a un JPEG de ≤1600 px antes de
 * guardarla o enviarla: ocupa menos en el teléfono y sube más rápido con mala
 * señal. Si el navegador no puede procesarla, se usa el archivo original.
 */
export async function comprimirFoto(archivo) {
  try {
    const imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    imagen.close?.();
    const blob = await new Promise((resolver) => { lienzo.toBlob(resolver, 'image/jpeg', 0.85); });
    return blob && blob.size < archivo.size ? blob : archivo;
  } catch {
    return archivo;
  }
}
