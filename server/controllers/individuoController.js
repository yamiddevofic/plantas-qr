import mongoose from 'mongoose';
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
      .populate('especieId', 'nombre familia tipo imagen')
      .sort({ codigoArbol: 1 })
      .lean();

    res.json({
      type: 'FeatureCollection',
      features: individuos.map((individuo) => ({
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
      })),
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

    // Solo referencias servibles públicamente; no aceptar esquemas ejecutables,
    // data URLs ni rutas relativas ambiguas.
    const esRutaUploads = imagen.startsWith('/uploads/') && !imagen.includes('..') && !imagen.includes('\\');
    let esUrlHttps = false;
    try {
      esUrlHttps = new URL(imagen).protocol === 'https:';
    } catch {
      // No era URL absoluta; puede ser una ruta /uploads permitida.
    }
    if (!esRutaUploads && !esUrlHttps) {
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
