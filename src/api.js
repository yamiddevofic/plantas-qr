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
  fd.append('password', datos.password || '');
  if (datos.imagenFile) fd.append('imagen', datos.imagenFile);
  if (Array.isArray(datos.imagenesConservar) && datos.imagenesConservar.length > 0) {
    fd.append('imagenesConservar', JSON.stringify(datos.imagenesConservar));
  }
  for (const archivo of datos.imagenesNuevas || []) {
    fd.append('imagenes', archivo);
  }
  return fd;
}

export async function crearPlanta(datos) {
  const res = await fetch(`${BASE}/plantas`, { method: 'POST', body: construirFormData(datos) });
  if (!res.ok) throw new Error(await leerError(res, 'Error al crear la planta'));
  return res.json();
}

export async function actualizarPlanta(id, datos) {
  const res = await fetch(`${BASE}/plantas/${id}`, { method: 'PUT', body: construirFormData(datos) });
  if (!res.ok) throw new Error(await leerError(res, 'Error al actualizar la planta'));
  return res.json();
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

export async function eliminarPlanta(id) {
  const res = await fetch(`${BASE}/plantas/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar planta');
  return res.json();
}
