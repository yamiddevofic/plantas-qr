import { Router } from 'express';
import {
  crearPlanta,
  obtenerPlantas,
  obtenerPlantaPorId,
  buscarPorNombre,
  buscarPorOrigen,
  buscarPorTipo,
  buscarPorFamilia,
  actualizarPlanta,
  eliminarPlanta,
} from '../controllers/plantaController.js';
import upload from '../config/upload.js';

const router = Router();

/**
 * @swagger
 * /api/plantas:
 *   post:
 *     tags: [Plantas]
 *     summary: Crear una nueva planta
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [nombre, familia, origen, tipo, descripcion, altura, impacto, estadoConservacion, ubicacion]
 *             properties:
 *               nombre:
 *                 type: object
 *                 properties:
 *                   comun: { type: string }
 *                   cientifico: { type: string }
 *               familia: { type: string }
 *               origen: { type: string }
 *               tipo: { type: string, enum: [árbol, arbusto, hierba, piedra, planta acuática, cactus, otro, palma, árbol (conífera), árbol / arbusto según poda, arbusto / arbolito, arbusto bajo] }
 *               descripcion:
 *                 type: object
 *                 properties:
 *                   general: { type: string }
 *                   hojas: { type: string }
 *               altura: { type: string }
 *               usos: { type: string, description: 'Arreglo JSON de usos o usos separados por comas' }
 *               impacto: { type: string }
 *               estadoConservacion: { type: string, enum: [en peligro, vulnerable, casi amenazado, preocupación menor, datos insuficientes, extinto en estado silvestre, extinto, no amenazada, no amenazada (cultivada), no amenazada, aunque cada vez más escasa en áreas urbanas, vulnerable (según catálogo plantaqr del parque), no determinado] }
 *               ubicacion:
 *                 type: object
 *                 properties:
 *                   latitud: { type: number }
 *                   longitud: { type: number }
 *                   descripcion: { type: string }
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen de la planta (jpg, png, gif, webp, max 5MB)
 *     responses:
 *       201:
 *         description: Planta creada correctamente
 *       400:
 *         description: Error de validación
 */
router.post('/', upload.single('imagen'), crearPlanta);

/**
 * @swagger
 * /api/plantas:
 *   get:
 *     tags: [Plantas]
 *     summary: Obtener todas las plantas
 *     responses:
 *       200:
 *         description: Lista de plantas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Planta'
 */
router.get('/', obtenerPlantas);

/**
 * @swagger
 * /api/plantas/buscar/nombre:
 *   get:
 *     tags: [Plantas]
 *     summary: Buscar plantas por nombre (común o científico)
 *     parameters:
 *       - in: query
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre a buscar
 *     responses:
 *       200:
 *         description: Lista de plantas encontradas
 *       400:
 *         description: Parámetro requerido faltante
 */
router.get('/buscar/nombre', buscarPorNombre);

/**
 * @swagger
 * /api/plantas/buscar/origen:
 *   get:
 *     tags: [Plantas]
 *     summary: Buscar plantas por origen
 *     parameters:
 *       - in: query
 *         name: origen
 *         required: true
 *         schema:
 *           type: string
 *         description: Origen a buscar
 *     responses:
 *       200:
 *         description: Lista de plantas encontradas
 *       400:
 *         description: Parámetro requerido faltante
 */
router.get('/buscar/origen', buscarPorOrigen);

/**
 * @swagger
 * /api/plantas/buscar/tipo:
 *   get:
 *     tags: [Plantas]
 *     summary: Buscar plantas por tipo
 *     parameters:
 *       - in: query
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [árbol, arbusto, hierba, piedra, planta acuática, cactus, otro]
 *         description: Tipo a buscar
 *     responses:
 *       200:
 *         description: Lista de plantas encontradas
 *       400:
 *         description: Parámetro requerido faltante
 */
router.get('/buscar/tipo', buscarPorTipo);

/**
 * @swagger
 * /api/plantas/buscar/familia:
 *   get:
 *     tags: [Plantas]
 *     summary: Buscar plantas por familia
 *     parameters:
 *       - in: query
 *         name: familia
 *         required: true
 *         schema:
 *           type: string
 *         description: Familia a buscar
 *     responses:
 *       200:
 *         description: Lista de plantas encontradas
 *       400:
 *         description: Parámetro requerido faltante
 */
router.get('/buscar/familia', buscarPorFamilia);

/**
 * @swagger
 * /api/plantas/{id}:
 *   get:
 *     tags: [Plantas]
 *     summary: Obtener una planta por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la planta
 *     responses:
 *       200:
 *         description: Planta encontrada
 *       404:
 *         description: Planta no encontrada
 */
router.get('/:id', obtenerPlantaPorId);

/**
 * @swagger
 * /api/plantas/{id}:
 *   put:
 *     tags: [Plantas]
 *     summary: Actualizar una planta por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la planta
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: object
 *                 properties:
 *                   comun: { type: string }
 *                   cientifico: { type: string }
 *               familia: { type: string }
 *               origen: { type: string }
 *               tipo: { type: string, enum: [árbol, arbusto, hierba, piedra, planta acuática, cactus, otro, palma, árbol (conífera), árbol / arbusto según poda, arbusto / arbolito, arbusto bajo] }
 *               descripcion:
 *                 type: object
 *                 properties:
 *                   general: { type: string }
 *                   hojas: { type: string }
 *               altura: { type: string }
 *               usos: { type: string, description: 'Arreglo JSON de usos o usos separados por comas' }
 *               impacto: { type: string }
 *               estadoConservacion: { type: string, enum: [en peligro, vulnerable, casi amenazado, preocupación menor, datos insuficientes, extinto en estado silvestre, extinto, no amenazada, no amenazada (cultivada), no amenazada, aunque cada vez más escasa en áreas urbanas, vulnerable (según catálogo plantaqr del parque), no determinado] }
 *               ubicacion:
 *                 type: object
 *                 properties:
 *                   latitud: { type: number }
 *                   longitud: { type: number }
 *                   descripcion: { type: string }
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen de la planta (jpg, png, gif, webp, max 5MB)
 *     responses:
 *       200:
 *         description: Planta actualizada
 *       404:
 *         description: Planta no encontrada
 */
router.put('/:id', upload.single('imagen'), actualizarPlanta);

/**
 * @swagger
 * /api/plantas/{id}:
 *   delete:
 *     tags: [Plantas]
 *     summary: Eliminar una planta por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la planta
 *     responses:
 *       200:
 *         description: Planta eliminada
 *       404:
 *         description: Planta no encontrada
 */
router.delete('/:id', eliminarPlanta);

export default router;
