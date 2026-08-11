import Planta from '../models/Planta.js';

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

function resolverImagenes(datos, archivos) {
  let conservadas = [];
  if (Array.isArray(datos.imagenesConservar)) {
    conservadas = datos.imagenesConservar;
  } else {
    try {
      conservadas = JSON.parse(datos.imagenesConservar ?? '[]');
    } catch {
      conservadas = [];
    }
  }
  const nuevas = (archivos?.imagenes || []).map((archivo) => `/uploads/${archivo.filename}`);
  const lista = [...conservadas, ...nuevas].filter(Boolean);
  if (archivos?.imagen?.[0]) lista.unshift(`/uploads/${archivos.imagen[0].filename}`);
  return { imagen: lista[0] || '', imagenes: lista.slice(1) };
}

export const crearPlanta = async (req, res) => {
  try {
    const datos = parsearBody(req.body);
    if (req.files) {
      Object.assign(datos, resolverImagenes(datos, req.files));
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
      Object.assign(datos, resolverImagenes(datos, req.files));
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
    const planta = await Planta.findByIdAndDelete(req.params.id);
    if (!planta) return res.status(404).json({ mensaje: 'Planta no encontrada' });
    res.json({ mensaje: 'Planta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar planta', error: error.message });
  }
};
