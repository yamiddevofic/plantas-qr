import Planta from '../models/Planta.js';
import Individuo from '../models/Individuo.js';
import QR from '../models/QR.js';
import Imagen, { guardarImagenes, idDeImagen } from '../models/Imagen.js';

function limpiarUsos(usos) {
  if (usos == null) return undefined;
  const lista = Array.isArray(usos)
    ? usos
    : String(usos).split(',').map((u) => u.trim()).filter(Boolean);
  const unidos = lista.join(',');
  try {
    const posible = JSON.parse(unidos);
    if (Array.isArray(posible)) {
      return posible.map((s) => String(s).trim()).filter(Boolean);
    }
  } catch {
    // No era JSON; se limpia elemento por elemento.
  }
  return lista
    .flatMap((s) => String(s).split(','))
    .map((s) => s.trim().replace(/^[[]*\s*"?/, '').replace(/\s*"?[\]]*$/, '').trim())
    .filter(Boolean);
}

function parsearBody(body) {
  const datos = {};
  if (!body || typeof body !== 'object') return datos;
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        datos[key] = JSON.parse(value);
        continue;
      } catch {
        // No era JSON válido; se deja como texto plano.
      }
    }
    const bracketMatch = key.match(/^(\w+)\[(\w+)\]$/);
    if (bracketMatch) {
      const [, padre, hijo] = bracketMatch;
      if (!datos[padre]) datos[padre] = {};
      datos[padre][hijo] = value;
      continue;
    }
    const dotMatch = key.match(/^(\w+)\.(\w+)$/);
    if (dotMatch) {
      const [, padre, hijo] = dotMatch;
      if (!datos[padre]) datos[padre] = {};
      datos[padre][hijo] = value;
      continue;
    }
    datos[key] = value;
  }
  if (datos.ubicacion) {
    if (typeof datos.ubicacion.latitud === 'string') datos.ubicacion.latitud = Number(datos.ubicacion.latitud);
    if (typeof datos.ubicacion.longitud === 'string') datos.ubicacion.longitud = Number(datos.ubicacion.longitud);
  }
  return datos;
}

async function resolverImagenes(datos, archivos) {
  let conservadas;
  if (Array.isArray(datos.imagenesConservar)) {
    conservadas = datos.imagenesConservar;
  } else {
    try {
      conservadas = JSON.parse(datos.imagenesConservar ?? '[]');
    } catch {
      conservadas = [];
    }
  }
  const nuevas = await guardarImagenes(archivos?.imagenes);
  const lista = [...conservadas, ...nuevas].filter(Boolean);
  if (archivos?.imagen?.[0]) lista.unshift(...(await guardarImagenes(archivos.imagen)));
  return { imagen: lista[0] || '', imagenes: lista.slice(1) };
}

export const crearPlanta = async (req, res) => {
  try {
    const datos = parsearBody(req.body);
    if (req.files) {
      Object.assign(datos, await resolverImagenes(datos, req.files));
    }
    delete datos.imagenesConservar;
    datos.usos = limpiarUsos(datos.usos);
    const planta = new Planta(datos);
    const guardada = await planta.save();
    res.status(201).json(guardada);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear planta', error: error.message });
  }
};

export const obtenerPlantas = async (req, res) => {
  try {
    const plantas = await Planta.find();
    res.json(plantas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener plantas', error: error.message });
  }
};

export const obtenerPlantaPorId = async (req, res) => {
  try {
    const planta = await Planta.findById(req.params.id);
    if (!planta) return res.status(404).json({ mensaje: 'Planta no encontrada' });
    res.json(planta);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener planta', error: error.message });
  }
};

export const buscarPorNombre = async (req, res) => {
  try {
    const { nombre } = req.query;
    if (!nombre) return res.status(400).json({ mensaje: 'El parámetro nombre es requerido' });
    const plantas = await Planta.find({
      $or: [
        { 'nombre.comun': { $regex: nombre, $options: 'i' } },
        { 'nombre.cientifico': { $regex: nombre, $options: 'i' } },
      ],
    });
    res.json(plantas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar plantas', error: error.message });
  }
};

export const buscarPorOrigen = async (req, res) => {
  try {
    const { origen } = req.query;
    if (!origen) return res.status(400).json({ mensaje: 'El parámetro origen es requerido' });
    const plantas = await Planta.find({ origen: { $regex: origen, $options: 'i' } });
    res.json(plantas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar plantas', error: error.message });
  }
};

export const buscarPorTipo = async (req, res) => {
  try {
    const { tipo } = req.query;
    if (!tipo) return res.status(400).json({ mensaje: 'El parámetro tipo es requerido' });
    const plantas = await Planta.find({ tipo: { $regex: tipo, $options: 'i' } });
    res.json(plantas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar plantas', error: error.message });
  }
};

export const buscarPorFamilia = async (req, res) => {
  try {
    const { familia } = req.query;
    if (!familia) return res.status(400).json({ mensaje: 'El parámetro familia es requerido' });
    const plantas = await Planta.find({ familia: { $regex: familia, $options: 'i' } });
    res.json(plantas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar plantas', error: error.message });
  }
};

export const actualizarPlanta = async (req, res) => {
  try {
    const datos = parsearBody(req.body);
    if (req.files) {
      Object.assign(datos, await resolverImagenes(datos, req.files));
    }
    delete datos.imagenesConservar;
    datos.usos = limpiarUsos(datos.usos);
    const planta = await Planta.findByIdAndUpdate(req.params.id, datos, { new: true, runValidators: true });
    if (!planta) return res.status(404).json({ mensaje: 'Planta no encontrada' });
    res.json(planta);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar planta', error: error.message });
  }
};

export const eliminarPlanta = async (req, res) => {
  try {
    const planta = await Planta.findById(req.params.id);
    if (!planta) return res.status(404).json({ mensaje: 'Planta no encontrada' });
    // Los individuos apuntan a la especie: borrarla los dejaría sin ficha.
    const arboles = await Individuo.countDocuments({ especieId: planta._id });
    if (arboles > 0) {
      return res.status(409).json({
        mensaje: `${planta.nombre.comun} tiene ${arboles} ${arboles === 1 ? 'árbol registrado' : 'árboles registrados'}. Elimínalos o cámbialos de especie en Gestión de individuos antes de borrarla.`,
      });
    }
    await Planta.deleteOne({ _id: planta._id });
    await QR.deleteMany({ plantaId: planta._id });
    await limpiarHuerfanas([planta.imagen, ...(planta.imagenes || [])].filter(Boolean));
    res.json({ mensaje: 'Planta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar planta', error: error.message });
  }
};

// Borra de la BD las fotos subidas que ninguna especie ni individuo usa ya.
async function limpiarHuerfanas(refs) {
  for (const ref of refs) {
    const id = idDeImagen(ref);
    if (!id) continue;
    const enUso = await Planta.exists({ $or: [{ imagen: ref }, { imagenes: ref }] });
    if (!enUso) await Imagen.deleteOne({ _id: id });
  }
}

/**
 * Fotos de una especie: `orden` (JSON) es la lista final, con las referencias
 * que ya tenía y `nueva:<n>` para la n-ésima foto subida en `fotos`. La primera
 * es la principal. Lo que no aparezca en `orden` se quita.
 */
export const actualizarFotosPlanta = async (req, res) => {
  try {
    const planta = await Planta.findById(req.params.id);
    if (!planta) return res.status(404).json({ mensaje: 'No existe esa especie' });

    let orden;
    try {
      orden = JSON.parse(req.body?.orden ?? '[]');
    } catch {
      orden = null;
    }
    if (!Array.isArray(orden)) return res.status(400).json({ mensaje: 'orden debe ser una lista JSON' });

    const actuales = [planta.imagen, ...(planta.imagenes || [])].filter(Boolean);
    const subidas = req.files?.fotos || [];
    const urlsNuevas = await guardarImagenes(subidas);
    const lista = [];
    for (const item of orden) {
      const nueva = /^nueva:(\d+)$/.exec(String(item));
      if (nueva) {
        const url = urlsNuevas[Number(nueva[1])];
        if (url) lista.push(url);
      } else if (actuales.includes(item) && !lista.includes(item)) {
        // Solo se conservan referencias que la especie ya tenía.
        lista.push(item);
      }
    }
    // Una foto subida que no se colocó en `orden` se agrega al final.
    for (const url of urlsNuevas) if (!lista.includes(url)) lista.push(url);

    planta.imagen = lista[0] ?? '';
    planta.imagenes = lista.slice(1);
    await planta.save();
    await limpiarHuerfanas(actuales.filter((ref) => !lista.includes(ref)));
    res.json(planta);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al guardar las fotos', error: error.message });
  }
};

export const obtenerImagen = async (req, res) => {
  try {
    if (!/^[0-9a-f]{24}$/.test(req.params.id)) return res.status(400).end();
    const imagen = await Imagen.findById(req.params.id).lean();
    if (!imagen) return res.status(404).json({ mensaje: 'No existe la imagen' });
    // Cada id es una foto distinta e inmutable: puede guardarse para siempre.
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.type(imagen.tipo || 'image/webp').send(Buffer.from(imagen.datos.buffer ?? imagen.datos));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener la imagen', error: error.message });
  }
};
