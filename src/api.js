const BASE = '/api';

async function leerError(res, fallback) {
  try {
    const cuerpo = await res.json();
    if (cuerpo?.error) return cuerpo.error;
    if (cuerpo?.mensaje) return cuerpo.mensaje;
  } catch {
    // El cuerpo no era JSON; se usa el mensaje por defecto.
  }
  return fallback;
}

export async function fetchPlantas() {
  const res = await fetch(`${BASE}/plantas`);
  if (!res.ok) throw new Error('Error al obtener plantas');
  return res.json();
}

export async function obtenerPlanta(id) {
  const res = await fetch(`${BASE}/plantas/${id}`);
  if (!res.ok) throw new Error('No se pudo cargar la ficha de esta especie');
  return res.json();
}

export async function buscarPlanta(id) {
  const res = await fetch(`${BASE}/plantas/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('No se pudo consultar la especie');
  return res.json();
}

/** Individuos geolocalizados de una especie, como GeoJSON FeatureCollection. */
export async function fetchIndividuos(especieId, { signal } = {}) {
  const params = new URLSearchParams();
  if (especieId) params.set('especieId', especieId);
  const res = await fetch(`${BASE}/individuos?${params}`, { signal });
  if (!res.ok) throw new Error(await leerError(res, 'No se pudieron cargar los individuos'));
  return res.json();
}

export async function actualizarImagenIndividuo(codigoArbol, imagen, password) {
  const res = await fetch(`${BASE}/individuos/${encodeURIComponent(codigoArbol)}/imagen`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imagen, password }),
  });
  if (!res.ok) throw new Error(await leerError(res, 'No se pudo asociar la imagen al individuo'));
  return res.json();
}

async function pedirIndividuo(url, opciones, fallback) {
  let res;
  try {
    res = await fetch(url, opciones);
  } catch (error) {
    // fetch solo rechaza cuando no hubo respuesta (sin red, servidor caído):
    // quien llama puede guardar el cambio en la cola y reintentar luego.
    throw Object.assign(new Error('Sin conexión con el servidor'), { sinRed: true, causa: error });
  }
  if (!res.ok) throw new Error(await leerError(res, fallback));
  return res.json();
}

function enviarIndividuo(url, metodo, cuerpo, fallback) {
  return pedirIndividuo(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  }, fallback);
}

/**
 * Sube (o reemplaza) una foto de un individuo y devuelve su Feature actualizada:
 * 'movil' (vertical 4:5, la principal), 'escritorio' (horizontal 16:9) o 'noche'
 * (vertical 4:5, miniatura en modo noche).
 */
export function subirFotoIndividuo(id, foto, password, variante = 'movil') {
  const fd = new FormData();
  fd.append('password', password);
  fd.append('foto', foto, foto.name || 'foto.jpg');
  const consulta = variante === 'movil' ? '' : `?variante=${encodeURIComponent(variante)}`;
  return pedirIndividuo(`${BASE}/individuos/${encodeURIComponent(id)}/foto${consulta}`, { method: 'POST', body: fd }, 'No se pudo subir la foto');
}

export function crearIndividuo(datos, password) {
  return enviarIndividuo(`${BASE}/individuos`, 'POST', { ...datos, password }, 'No se pudo registrar el individuo');
}

export function actualizarIndividuo(id, datos, password) {
  return enviarIndividuo(`${BASE}/individuos/${encodeURIComponent(id)}`, 'PUT', { ...datos, password }, 'No se pudo actualizar el individuo');
}

export function eliminarIndividuo(id, password) {
  return enviarIndividuo(`${BASE}/individuos/${encodeURIComponent(id)}`, 'DELETE', { password }, 'No se pudo eliminar el individuo');
}

/** Fotos de un solo uso de la especie y su campo en el formulario de envío. */
export const FOTOS_UNICAS = { noche: 'fotoNoche', hoja: 'fotoHoja', fruto: 'fotoFruto' };

/**
 * Fotos de una especie. `orden` es la lista final: referencias existentes y
 * `nueva:<n>` para la n-ésima de `fotos`; la primera queda como principal.
 * `unicas` cambia las fotos de un solo uso ({ noche, hoja, fruto }): un archivo
 * la reemplaza, `null` la quita y si falta la clave queda como estaba.
 */
export function actualizarFotosPlanta(id, orden, fotos, password, unicas = {}) {
  const fd = new FormData();
  fd.append('password', password);
  fd.append('orden', JSON.stringify(orden));
  fotos.forEach((foto, i) => fd.append('fotos', foto, foto.name || `foto-${i + 1}.jpg`));
  const quitar = [];
  for (const [clave, campo] of Object.entries(FOTOS_UNICAS)) {
    if (!(clave in unicas)) continue;
    if (unicas[clave]) fd.append(campo, unicas[clave], `${clave}.jpg`);
    else quitar.push(clave);
  }
  if (quitar.length) fd.append('quitar', JSON.stringify(quitar));
  return pedirIndividuo(`${BASE}/plantas/${encodeURIComponent(id)}/fotos`, { method: 'PUT', body: fd }, 'No se pudieron guardar las fotos');
}

export async function fetchQRs() {
  const res = await fetch(`${BASE}/qr`);
  if (!res.ok) throw new Error('Error al obtener QRs');
  return res.json();
}

export async function obtenerQR(plantaId) {
  const res = await fetch(`${BASE}/qr/${plantaId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Error al obtener el código QR');
  return res.json();
}

export async function generarQR(plantaId, password) {
  const res = await fetch(`${BASE}/qr/generar/${plantaId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(await leerError(res, 'Error al generar QR'));
  return res.json();
}

export async function generarTodosQRs(password) {
  const res = await fetch(`${BASE}/qr/generar-todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(await leerError(res, 'Error al regenerar los QRs'));
  return res.json();
}

export function construirFormData(datos) {
  const fd = new FormData();
  fd.append('nombre[comun]', datos.nombreComun);
  fd.append('nombre[cientifico]', datos.nombreCientifico);
  fd.append('familia', datos.familia);
  fd.append('origen', datos.origen);
  fd.append('tipo', datos.tipo);
  fd.append('descripcion[general]', datos.descripcionGeneral);
  fd.append('descripcion[hojas]', datos.descripcionHojas);
  fd.append('altura', datos.altura);
  fd.append('usos', JSON.stringify(datos.usos));
  fd.append('impacto', datos.impacto);
  fd.append('estadoConservacion', datos.estadoConservacion);
  fd.append('ubicacion[latitud]', String(datos.latitud));
  fd.append('ubicacion[longitud]', String(datos.longitud));
  fd.append('ubicacion[descripcion]', datos.ubicacionDescripcion);
  if (datos.ejemplaresEnParque !== '' && datos.ejemplaresEnParque != null) {
    fd.append('ejemplaresEnParque', String(datos.ejemplaresEnParque));
  }
  fd.append('password', datos.password || '');
  // Una foto guardada sin conexión llega como Blob sin nombre: se le da uno.
  if (datos.imagenFile) fd.append('imagen', datos.imagenFile, datos.imagenFile.name || 'foto.jpg');
  if (Array.isArray(datos.imagenesConservar) && datos.imagenesConservar.length > 0) {
    fd.append('imagenesConservar', JSON.stringify(datos.imagenesConservar));
  }
  for (const archivo of datos.imagenesNuevas || []) {
    fd.append('imagenes', archivo);
  }
  return fd;
}

// Estas llamadas usan pedirIndividuo: si no hay red rechazan con `sinRed`, y quien
// llama (Gestión de especies) guarda el cambio en la cola para enviarlo después.
export function crearPlanta(datos) {
  return pedirIndividuo(`${BASE}/plantas`, { method: 'POST', body: construirFormData(datos) }, 'Error al crear la planta');
}

export function actualizarPlanta(id, datos) {
  return pedirIndividuo(`${BASE}/plantas/${id}`, { method: 'PUT', body: construirFormData(datos) }, 'Error al actualizar la planta');
}

export async function verificarAdmin(password) {
  const res = await fetch('/depurar-verificar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(await leerError(res, 'Contraseña incorrecta'));
  return res.json();
}

export function actualizarEjemplares(id, ejemplaresEnParque, password) {
  return enviarIndividuo(`${BASE}/plantas/${id}/ejemplares`, 'PATCH', { ejemplaresEnParque, password }, 'No se pudo guardar el número de ejemplares');
}

export function eliminarPlanta(id, password) {
  return enviarIndividuo(`${BASE}/plantas/${id}`, 'DELETE', { password }, 'Error al eliminar la especie');
}

// Vista con la que abre el mapa de todas las fichas. Se pide una vez por carga
// de la app y se comparte entre fichas; null si el administrador no la ha definido.
let vistaMapaPedida = null;

export function obtenerVistaMapa() {
  vistaMapaPedida ??= fetch(`${BASE}/configuracion/vista-mapa`)
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
  return vistaMapaPedida;
}

export async function guardarVistaMapa(vista, password) {
  const res = await fetch(`${BASE}/configuracion/vista-mapa`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...vista, password }),
  });
  if (!res.ok) throw new Error(await leerError(res, 'No se pudo guardar la vista del mapa'));
  const guardada = await res.json();
  vistaMapaPedida = Promise.resolve(guardada);
  return guardada;
}
