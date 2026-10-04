import { Router } from 'express';
import multer from 'multer';
import {
  actualizarImagenIndividuo,
  actualizarIndividuo,
  crearIndividuo,
  eliminarIndividuo,
  obtenerIndividuo,
  obtenerFotoIndividuo,
  obtenerIndividuos,
  subirFotoIndividuo,
} from '../controllers/individuoController.js';
import qrAuth from '../middleware/qrAuth.js';

const router = Router();

// La foto se procesa en memoria (sharp → WebP) y se guarda en MongoDB.
const subidaFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(Object.assign(new Error('Solo se permiten imágenes'), { status: 400 }));
  },
}).single('foto');

// multer debe correr antes de qrAuth: la contraseña llega en el mismo formulario.
function recibirFoto(req, res, next) {
  subidaFoto(req, res, (error) => {
    if (!error) return next();
    const mensaje = error.code === 'LIMIT_FILE_SIZE' ? 'La foto supera los 15 MB' : error.message;
    res.status(400).json({ mensaje });
  });
}

/**
 * @swagger
 * /api/individuos:
 *   get:
 *     tags: [Individuos]
 *     summary: Obtener individuos geolocalizados como GeoJSON
 *     parameters:
 *       - in: query
 *         name: especieId
 *         schema: { type: string }
 *         description: Filtrar por ID de la ficha de especie
 *       - in: query
 *         name: parque
 *         schema: { type: string }
 *         description: Filtrar por nombre del parque
 *     responses:
 *       200:
 *         description: FeatureCollection GeoJSON
 */
router.get('/', obtenerIndividuos);

/**
 * @swagger
 * /api/individuos/{codigoArbol}/imagen:
 *   put:
 *     tags: [Individuos]
 *     summary: Asociar una imagen pública a un individuo (admin)
 *     parameters:
 *       - in: path
 *         name: codigoArbol
 *         required: true
 *         schema: { type: string, example: CIP-001 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imagen, password]
 *             properties:
 *               imagen: { type: string, example: /uploads/individuos/CIP-001.webp }
 *               password: { type: string }
 *     responses:
 *       200: { description: Imagen asociada }
 *       401: { description: Contraseña inválida o faltante }
 *       404: { description: Individuo no encontrado }
 */
router.put('/:codigoArbol/imagen', qrAuth, actualizarImagenIndividuo);

/**
 * @swagger
 * /api/individuos:
 *   post:
 *     tags: [Individuos]
 *     summary: Registrar un individuo con su ubicación (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codigoArbol, especieId, parque, latitud, longitud, password]
 *             properties:
 *               codigoArbol: { type: string, example: CIP-011 }
 *               especieId: { type: string, description: ID de la ficha de especie }
 *               parque: { type: string, example: Parque principal de Chitagá }
 *               latitud: { type: number, example: 7.1384 }
 *               longitud: { type: number, example: -72.6666 }
 *               altitudMsnm: { type: number }
 *               precisionGpsM: { type: number }
 *               imagen: { type: string, description: Ruta /uploads/... o URL HTTPS }
 *               password: { type: string }
 *     responses:
 *       201: { description: Individuo creado (GeoJSON Feature) }
 *       400: { description: Datos inválidos }
 *       401: { description: Contraseña inválida o faltante }
 *       409: { description: El código de árbol ya existe }
 */
router.post('/', qrAuth, crearIndividuo);

/**
 * @swagger
 * /api/individuos/{id}:
 *   get:
 *     tags: [Individuos]
 *     summary: Obtener un individuo por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: GeoJSON Feature }
 *       404: { description: No existe }
 *   put:
 *     tags: [Individuos]
 *     summary: Editar un individuo y/o su ubicación (admin). Solo se actualizan los campos enviados
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               codigoArbol: { type: string }
 *               especieId: { type: string }
 *               parque: { type: string }
 *               latitud: { type: number }
 *               longitud: { type: number }
 *               altitudMsnm: { type: number, nullable: true }
 *               precisionGpsM: { type: number, nullable: true }
 *               imagen: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Individuo actualizado }
 *       400: { description: Datos inválidos }
 *       401: { description: Contraseña inválida o faltante }
 *       404: { description: No existe }
 *       409: { description: El código de árbol ya existe }
 *   delete:
 *     tags: [Individuos]
 *     summary: Eliminar un individuo (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200: { description: Individuo eliminado }
 *       401: { description: Contraseña inválida o faltante }
 *       404: { description: No existe }
 */
router.get('/:id', obtenerIndividuo);
router.put('/:id', qrAuth, actualizarIndividuo);
router.delete('/:id', qrAuth, eliminarIndividuo);

/**
 * @swagger
 * /api/individuos/{id}/foto:
 *   get:
 *     tags: [Individuos]
 *     summary: Foto del individuo (WebP)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: variante
 *         schema: { type: string, enum: [movil, escritorio], default: movil }
 *     responses:
 *       200: { description: Imagen WebP }
 *       404: { description: Sin foto }
 *   post:
 *     tags: [Individuos]
 *     summary: Subir o reemplazar la foto de un individuo (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: variante
 *         description: movil (vertical 4:5, la foto principal) o escritorio (horizontal 16:9)
 *         schema: { type: string, enum: [movil, escritorio], default: movil }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [foto, password]
 *             properties:
 *               foto: { type: string, format: binary }
 *               password: { type: string }
 *     responses:
 *       200: { description: Individuo actualizado con su nueva imagen }
 *       400: { description: Falta la foto o no es una imagen }
 *       401: { description: Contraseña inválida o faltante }
 *       404: { description: No existe }
 */
router.get('/:id/foto', obtenerFotoIndividuo);
router.post('/:id/foto', recibirFoto, qrAuth, subirFotoIndividuo);

export default router;
