import { Router } from 'express';
import { guardarVistaMapa, obtenerVistaMapa } from '../controllers/configuracionController.js';
import qrAuth from '../middleware/qrAuth.js';

const router = Router();

/**
 * @swagger
 * /api/configuracion/vista-mapa:
 *   get:
 *     tags: [Configuración]
 *     summary: Vista con la que abre el mapa de todas las fichas (null si no se ha definido)
 *     responses:
 *       200:
 *         description: Cámara del mapa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               nullable: true
 *               properties:
 *                 center: { type: array, items: { type: number }, description: '[longitud, latitud]' }
 *                 zoom: { type: number }
 *                 bearing: { type: number }
 *                 pitch: { type: number }
 */
router.get('/vista-mapa', obtenerVistaMapa);

/**
 * @swagger
 * /api/configuracion/vista-mapa:
 *   put:
 *     tags: [Configuración]
 *     summary: Define la vista con la que abre el mapa de todas las fichas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, center, zoom, bearing, pitch]
 *             properties:
 *               password: { type: string, description: 'Contraseña de administrador (ADMIN_PASSWORD)' }
 *               center: { type: array, items: { type: number }, description: '[longitud, latitud]' }
 *               zoom: { type: number }
 *               bearing: { type: number }
 *               pitch: { type: number }
 *     responses:
 *       200:
 *         description: Vista guardada
 *       400:
 *         description: Vista no válida
 *       401:
 *         description: Contraseña incorrecta
 */
router.put('/vista-mapa', qrAuth, guardarVistaMapa);

export default router;
