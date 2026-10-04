// Fotos tomadas sin conexión, guardadas en IndexedDB (localStorage no admite
// archivos y se queda corto). Clave: claveFoto(id, variante), donde id es el del
// individuo (local-… o del servidor). La foto móvil usa el id solo, como antes.

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

export const VARIANTES = ['movil', 'escritorio'];

/** Clave en IndexedDB de la foto de un individuo según su variante. */
export const claveFoto = (id, variante = 'movil') => (variante === 'escritorio' ? `${id}::escritorio` : id);

async function moverClave(de, a) {
  const blob = await leerFoto(de);
  if (!blob) return;
  await guardarFoto(a, blob);
  await borrarFoto(de);
}

/** Cuando un individuo local recibe su id real, sus fotos (ambas variantes) lo siguen. */
export async function moverFoto(de, a) {
  for (const variante of VARIANTES) await moverClave(claveFoto(de, variante), claveFoto(a, variante));
}

/** Borra las fotos guardadas de un individuo (ambas variantes). */
export async function borrarFotos(id) {
  for (const variante of VARIANTES) await borrarFoto(claveFoto(id, variante));
}

const LADO_MAXIMO = 1600;

/** Proporción (ancho/alto) y lado mayor máximo de cada variante. */
export const FORMATOS = {
  movil: { proporcion: 4 / 5, etiqueta: '4:5', lado: 2000 },
  escritorio: { proporcion: 16 / 9, etiqueta: '16:9', lado: 2560 },
};

/** Pasa un lienzo a JPEG; null si el navegador no pudo. */
export const lienzoAJpeg = (lienzo, calidad = 0.9) => new Promise((resolver) => { lienzo.toBlob(resolver, 'image/jpeg', calidad); });

/**
 * Recorta una región de una fuente (imagen o fotograma de video) y la reduce
 * para que su lado mayor no pase de `lado`. Devuelve un JPEG.
 */
export async function recortarRegion(fuente, { x, y, ancho, alto }, lado) {
  const escala = Math.min(1, lado / Math.max(ancho, alto));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(ancho * escala);
  lienzo.height = Math.round(alto * escala);
  const ctx = lienzo.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(fuente, x, y, ancho, alto, 0, 0, lienzo.width, lienzo.height);
  return lienzoAJpeg(lienzo);
}

/** La región centrada más grande con esa proporción (ancho/alto) dentro de ancho × alto. */
export function regionCentrada(ancho, alto, proporcion) {
  if (ancho / alto > proporcion) {
    const w = alto * proporcion;
    return { x: (ancho - w) / 2, y: 0, ancho: w, alto };
  }
  const h = ancho / proporcion;
  return { x: 0, y: (alto - h) / 2, ancho, alto: h };
}

/**
 * Foto elegida de la galería: se recorta al centro con la proporción de la
 * variante. Si el navegador no puede procesarla, se usa tal cual.
 */
export async function recortarFoto(archivo, variante) {
  const { proporcion, lado } = FORMATOS[variante];
  try {
    const imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
    const blob = await recortarRegion(imagen, regionCentrada(imagen.width, imagen.height, proporcion), lado);
    imagen.close?.();
    return blob || archivo;
  } catch {
    return archivo;
  }
}

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
