import { Router } from 'express';
import { generarQR, obtenerQRPorPlanta, verPlantaPorQR, obtenerTodosQR, generarTodosQR } from '../controllers/qrController.js';

const router = Router();

/**
 * @swagger
 * /api/qr/generar-todos:
 *   post:
 *     tags: [QR]
 *     summary: Regenerar o crear los códigos QR de todas las plantas
 *     responses:
 *       200:
 *         description: Resumen de la regeneración con los QRs generados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: number }
 *                 creados: { type: number }
 *                 actualizados: { type: number }
 *                 errores: { type: number }
 *                 resultados:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QR'
 *       500:
 *         description: Error al regenerar los QRs
 */
router.post('/generar-todos', generarTodosQR);

/**
 * @swagger
 * /api/qr:
 *   get:
 *     tags: [QR]
 *     summary: Obtener todos los códigos QR
 *     responses:
 *       200:
 *         description: Lista de QRs con planta poblada
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/QR'
 */
router.get('/', obtenerTodosQR);

/**
 * @swagger
 * /api/qr/generar/{plantaId}:
 *   post:
 *     tags: [QR]
 *     summary: Generar o actualizar un código QR para una planta
 *     parameters:
 *       - in: path
 *         name: plantaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la planta
 *     responses:
 *       201:
 *         description: QR generado correctamente
 *       404:
 *         description: Planta no encontrada
 */
router.post('/generar/:plantaId', generarQR);

/**
 * @swagger
 * /api/qr/ver/{plantaId}:
 *   get:
 *     tags: [QR]
 *     summary: Ver información de la planta escaneando el QR (acceso directo)
 *     parameters:
 *       - in: path
 *         name: plantaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la planta
 *     responses:
 *       200:
 *         description: Información de la planta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Planta'
 *       404:
 *         description: Planta no encontrada
 */
router.get('/ver/:plantaId', verPlantaPorQR);

/**
 * @swagger
 * /api/qr/{plantaId}:
 *   get:
 *     tags: [QR]
 *     summary: Obtener el código QR de una planta específica
 *     parameters:
 *       - in: path
 *         name: plantaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la planta
 *     responses:
 *       200:
 *         description: QR encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QR'
 *       404:
 *         description: QR no encontrado
 */
router.get('/:plantaId', obtenerQRPorPlanta);

export default router;
