import mongoose from 'mongoose';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Individuo from '../models/Individuo.js';
import Planta from '../models/Planta.js';

const EXTENSIONES_IMAGEN = ['.webp', '.jpg', '.jpeg', '.png'];
const CARPETA_IMAGENES_INDIVIDUOS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../public/uploads/individuos'
);

function imagenPublica(individuo) {
  if (individuo.imagen) return individuo.imagen;
  const codigo = individuo.codigoArbol;
  if (!/^[A-Z0-9-]+$/.test(codigo)) return '';
  const extension = EXTENSIONES_IMAGEN.find((ext) => fs.existsSync(
    path.join(CARPETA_IMAGENES_INDIVIDUOS, `${codigo}${ext}`)
  ));
  return extension ? `/uploads/individuos/${codigo}${extension}` : '';
}

// El catálogo histórico tiene varias fichas por especie (una por foto/ejemplar),
// cada una con su propio QR impreso. Los individuos cuelgan de una sola ficha
// canónica, así que al consultar por cualquiera de ellas se resuelven todas las
// fichas con el mismo nombre científico.
async function idsMismaEspecie(especieId) {
  const ficha = await Planta.findById(especieId, { 'nombre.cientifico': 1 }).lean();
  if (!ficha) return [especieId];
  const hermanas = await Planta.find({ 'nombre.cientifico': ficha.nombre.cientifico }, { _id: 1 }).lean();
  return hermanas.map((p) => p._id);
}

// Solo referencias servibles públicamente; no aceptar esquemas ejecutables,
// data URLs ni rutas relativas ambiguas.
function imagenValida(imagen) {
  const esRutaUploads = imagen.startsWith('/uploads/') && !imagen.includes('..') && !imagen.includes('\\');
  if (esRutaUploads) return true;
  try {
    return new URL(imagen).protocol === 'https:';
  } catch {
    return false;
  }
}

function aFeature(individuo) {
  return {
    type: 'Feature',
    id: String(individuo._id),
    geometry: individuo.ubicacion,
    properties: {
      id: String(individuo._id),
      codigoArbol: individuo.codigoArbol,
      parque: individuo.parque,
      altitudMsnm: individuo.altitudMsnm ?? null,
      precisionGpsM: individuo.precisionGpsM ?? null,
      imagen: imagenPublica(individuo),
      especie: individuo.especieId,
    },
  };
}

const POBLAR_ESPECIE = 'nombre familia tipo imagen';

// Número opcional: vacío/null limpia el campo; algo no numérico o negativo es error.
function numeroOpcional(valor, etiqueta) {
  if (valor === undefined) return { omitido: true };
  if (valor === null || valor === '') return { valor: null };
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 0) return { error: `${etiqueta} debe ser un número mayor o igual a 0` };
  return { valor: n };
}

// Valida el cuerpo de creación/edición. En edición (parcial) solo se revisan los
// campos presentes; en creación son obligatorios código, especie, parque y coordenadas.
async function leerCuerpo(body, { parcial }) {
  const cambios = {};
  const quitar = {};

  if (!parcial || body.codigoArbol !== undefined) {
    const codigo = String(body.codigoArbol ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{1,31}$/.test(codigo)) {
      return { error: 'codigoArbol es obligatorio (letras, números y guiones; p. ej. CIP-011)' };
    }
    cambios.codigoArbol = codigo;
  }

  if (!parcial || body.especieId !== undefined) {
    if (!mongoose.isValidObjectId(body.especieId)) return { error: 'especieId no es un ObjectId válido' };
    if (!(await Planta.exists({ _id: body.especieId }))) return { error: 'La especie indicada no existe', estado: 404 };
    cambios.especieId = body.especieId;
  }

  if (!parcial || body.parque !== undefined) {
    const parque = String(body.parque ?? '').trim();
    if (!parque) return { error: 'parque es obligatorio' };
    cambios.parque = parque;
  }

  if (!parcial || body.latitud !== undefined || body.longitud !== undefined) {
    const latitud = Number(body.latitud);
    const longitud = Number(body.longitud);
    const validas = body.latitud !== '' && body.longitud !== ''
      && body.latitud != null && body.longitud != null
      && Number.isFinite(latitud) && Number.isFinite(longitud)
      && latitud >= -90 && latitud <= 90 && longitud >= -180 && longitud <= 180;
    if (!validas) return { error: 'latitud (-90 a 90) y longitud (-180 a 180) son obligatorias y deben ser números' };
    cambios.ubicacion = { type: 'Point', coordinates: [longitud, latitud] };
  }

  for (const [campo, etiqueta] of [['altitudMsnm', 'altitudMsnm'], ['precisionGpsM', 'precisionGpsM']]) {
    const r = numeroOpcional(body[campo], etiqueta);
    if (r.error) return { error: r.error };
    if (r.omitido) continue;
    if (r.valor === null) quitar[campo] = '';
    else cambios[campo] = r.valor;
  }

  if (body.imagen !== undefined) {
    const imagen = typeof body.imagen === 'string' ? body.imagen.trim() : '';
    if (imagen && !imagenValida(imagen)) {
      return { error: 'imagen debe ser una ruta /uploads/... o una URL HTTPS' };
    }
    cambios.imagen = imagen;
  }

  return { cambios, quitar };
}

function responderError(res, error, mensaje) {
  if (error?.code === 11000) {
    return res.status(409).json({ mensaje: 'Ya existe un individuo con ese código de árbol' });
  }
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ mensaje: error.message });
  }
  return res.status(500).json({ mensaje, error: error.message });
}

export const obtenerIndividuos = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.especieId) {
      if (!mongoose.isValidObjectId(req.query.especieId)) {
        return res.status(400).json({ mensaje: 'especieId no es un ObjectId válido' });
      }
      filtro.especieId = { $in: await idsMismaEspecie(req.query.especieId) };
    }
    if (req.query.parque) filtro.parque = String(req.query.parque);

    const individuos = await Individuo.find(filtro)
      .populate('especieId', POBLAR_ESPECIE)
      .sort({ codigoArbol: 1 })
      .lean();

    res.json({
      type: 'FeatureCollection',
      features: individuos.map(aFeature),
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener individuos', error: error.message });
  }
};

export const actualizarImagenIndividuo = async (req, res) => {
  try {
    const codigo = String(req.params.codigoArbol || '').trim().toUpperCase();
    const imagen = typeof req.body?.imagen === 'string' ? req.body.imagen.trim() : '';
    if (!imagen) return res.status(400).json({ mensaje: 'El campo imagen es requerido' });

    if (!imagenValida(imagen)) {
      return res.status(400).json({ mensaje: 'imagen debe ser una ruta /uploads/... o una URL HTTPS' });
    }

    const individuo = await Individuo.findOneAndUpdate(
      { codigoArbol: codigo },
      { $set: { imagen } },
      { new: true, runValidators: true }
    );
    if (!individuo) return res.status(404).json({ mensaje: `No existe el individuo ${codigo}` });
    res.json({ codigoArbol: individuo.codigoArbol, imagen: individuo.imagen });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar la imagen del individuo', error: error.message });
  }
};

export const obtenerIndividuo = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'El id no es un ObjectId válido' });
    }
    const individuo = await Individuo.findById(req.params.id).populate('especieId', POBLAR_ESPECIE).lean();
    if (!individuo) return res.status(404).json({ mensaje: 'No existe el individuo' });
    res.json(aFeature(individuo));
  } catch (error) {
    responderError(res, error, 'Error al obtener el individuo');
  }
};

export const crearIndividuo = async (req, res) => {
  try {
    // En creación un opcional vacío simplemente no se guarda, por eso se ignora `quitar`.
    const { cambios, error, estado } = await leerCuerpo(req.body ?? {}, { parcial: false });
    if (error) return res.status(estado || 400).json({ mensaje: error });
    const creado = await Individuo.create(cambios);
    const individuo = await Individuo.findById(creado._id).populate('especieId', POBLAR_ESPECIE).lean();
    res.status(201).json(aFeature(individuo));
  } catch (error) {
    responderError(res, error, 'Error al crear el individuo');
  }
};

export const actualizarIndividuo = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'El id no es un ObjectId válido' });
    }
    const { cambios, quitar, error, estado } = await leerCuerpo(req.body ?? {}, { parcial: true });
    if (error) return res.status(estado || 400).json({ mensaje: error });
    const actualizacion = {};
    if (Object.keys(cambios).length) actualizacion.$set = cambios;
    if (Object.keys(quitar).length) actualizacion.$unset = quitar;
    if (!Object.keys(actualizacion).length) return res.status(400).json({ mensaje: 'No hay campos para actualizar' });

    const individuo = await Individuo.findByIdAndUpdate(req.params.id, actualizacion, { new: true, runValidators: true })
      .populate('especieId', POBLAR_ESPECIE)
      .lean();
    if (!individuo) return res.status(404).json({ mensaje: 'No existe el individuo' });
    res.json(aFeature(individuo));
  } catch (error) {
    responderError(res, error, 'Error al actualizar el individuo');
  }
};

export const eliminarIndividuo = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'El id no es un ObjectId válido' });
    }
    const individuo = await Individuo.findByIdAndDelete(req.params.id).lean();
    if (!individuo) return res.status(404).json({ mensaje: 'No existe el individuo' });
    res.json({ mensaje: `Individuo ${individuo.codigoArbol} eliminado`, id: String(individuo._id) });
  } catch (error) {
    responderError(res, error, 'Error al eliminar el individuo');
  }
};

const ANCHO_FOTO = 1280;
const CALIDAD_FOTO = 78;

export const subirFotoIndividuo = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'El id no es un ObjectId válido' });
    }
    if (!req.file?.buffer?.length) return res.status(400).json({ mensaje: 'Falta la foto (campo "foto")' });

    let datos;
    try {
      // rotate() aplica la orientación EXIF de la cámara antes de descartarla.
      datos = await sharp(req.file.buffer)
        .rotate()
        .resize({ width: ANCHO_FOTO, height: ANCHO_FOTO, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: CALIDAD_FOTO })
        .toBuffer();
    } catch {
      return res.status(400).json({ mensaje: 'El archivo no es una imagen válida' });
    }

    const actualizada = new Date();
    const imagen = `/api/individuos/${req.params.id}/foto?v=${actualizada.getTime()}`;
    const individuo = await Individuo.findByIdAndUpdate(
      req.params.id,
      { $set: { foto: { datos, tipo: 'image/webp', actualizada }, imagen } },
      { new: true }
    ).populate('especieId', POBLAR_ESPECIE).lean();
    if (!individuo) return res.status(404).json({ mensaje: 'No existe el individuo' });
    res.json(aFeature(individuo));
  } catch (error) {
    responderError(res, error, 'Error al guardar la foto del individuo');
  }
};

export const obtenerFotoIndividuo = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).end();
    const individuo = await Individuo.findById(req.params.id).select('+foto').lean();
    const foto = individuo?.foto;
    if (!foto?.datos) return res.status(404).json({ mensaje: 'Este individuo no tiene foto' });
    // La URL lleva ?v=<fecha>, así que cada versión puede guardarse para siempre.
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.type(foto.tipo || 'image/webp').send(Buffer.from(foto.datos.buffer ?? foto.datos));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener la foto', error: error.message });
  }
};
