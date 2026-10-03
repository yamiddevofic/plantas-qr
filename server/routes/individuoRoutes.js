import { Router } from 'express';
import { actualizarImagenIndividuo, obtenerIndividuos } from '../controllers/individuoController.js';
import qrAuth from '../middleware/qrAuth.js';

const router = Router();

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

export default router;
