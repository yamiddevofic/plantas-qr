import { Router } from 'express';
import { obtenerImagen } from '../controllers/plantaController.js';

const router = Router();

/**
 * @swagger
 * /api/imagenes/{id}:
 *   get:
 *     tags: [Plantas]
 *     summary: Foto subida desde la app (WebP)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Imagen WebP }
 *       404: { description: No existe }
 */
router.get('/:id', obtenerImagen);

export default router;
