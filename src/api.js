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

/** Sube (o reemplaza) la foto de un individuo; devuelve su Feature actualizada. */
/** Sube la foto vertical ('movil', 4:5) u horizontal ('escritorio', 16:9) de un individuo. */
export function subirFotoIndividuo(id, foto, password, variante = 'movil') {
  const fd = new FormData();
  fd.append('password', password);
  fd.append('foto', foto, foto.name || 'foto.jpg');
  const consulta = variante === 'escritorio' ? '?variante=escritorio' : '';
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

/**
 * Fotos de una especie. `orden` es la lista final: referencias existentes y
 * `nueva:<n>` para la n-ésima de `fotos`; la primera queda como principal.
 */
export function actualizarFotosPlanta(id, orden, fotos, password) {
  const fd = new FormData();
  fd.append('password', password);
  fd.append('orden', JSON.stringify(orden));
  fotos.forEach((foto, i) => fd.append('fotos', foto, foto.name || `foto-${i + 1}.jpg`));
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
