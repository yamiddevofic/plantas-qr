import Configuracion from '../models/Configuracion.js';

const CLAVE_VISTA = 'vistaMapa';

const numeroEn = (valor, min, max) => {
  const n = Number(valor);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

/** Valida y normaliza la cámara { center: [lng, lat], zoom, bearing, pitch }. */
function leerVista(cuerpo) {
  const [lng, lat] = Array.isArray(cuerpo?.center) ? cuerpo.center : [];
  const vista = {
    center: [numeroEn(lng, -180, 180), numeroEn(lat, -90, 90)],
    zoom: numeroEn(cuerpo?.zoom, 0, 22),
    bearing: numeroEn(cuerpo?.bearing, -360, 360),
    pitch: numeroEn(cuerpo?.pitch, 0, 85),
  };
  const valida = vista.center.every((n) => n !== null) && [vista.zoom, vista.bearing, vista.pitch].every((n) => n !== null);
  return valida ? vista : null;
}

export async function obtenerVistaMapa(_req, res) {
  try {
    const doc = await Configuracion.findOne({ clave: CLAVE_VISTA }).lean();
    // Sin vista guardada: la app usa la suya por defecto.
    res.json(doc?.valor ?? null);
  } catch (error) {
    res.status(500).json({ mensaje: 'No se pudo leer la vista del mapa', error: error.message });
  }
}

export async function guardarVistaMapa(req, res) {
  const vista = leerVista(req.body);
  if (!vista) return res.status(400).json({ mensaje: 'La vista del mapa no es válida' });
  try {
    await Configuracion.updateOne({ clave: CLAVE_VISTA }, { $set: { valor: vista } }, { upsert: true });
    res.json(vista);
  } catch (error) {
    res.status(500).json({ mensaje: 'No se pudo guardar la vista del mapa', error: error.message });
  }
}
