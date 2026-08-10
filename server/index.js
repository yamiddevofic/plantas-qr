import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import plantaRoutes from './routes/plantaRoutes.js';
import qrRoutes from './routes/qrRoutes.js';

dotenv.config();

// El DNS del sistema falla en consultas TXT (queryTxt ETIMEOUT) con MongoDB Atlas.
// Se fuerzan resolvers públicos para que el driver pueda resolver cluster0.sgk1yod.mongodb.net.
dns.setServers(['8.8.8.8', '1.1.1.1']);

console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Cargada' : 'No encontrada');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '..', 'dist');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '30d',
    immutable: true,
    setHeaders(res, filePath) {
      const ext = path.extname(filePath).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
      }
    },
  }),
);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Plantas QR',
      version: '1.0.0',
      description: 'API para gestionar plantas y sus códigos QR',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      schemas: {
        Planta: {
          type: 'object',
          required: ['nombre', 'familia', 'origen', 'tipo', 'descripcion', 'altura', 'impacto', 'estadoConservacion', 'ubicacion'],
          properties: {
            _id: { type: 'string', description: 'ID de la planta' },
            nombre: {
              type: 'object',
              required: ['comun', 'cientifico'],
              properties: {
                comun: { type: 'string' },
                cientifico: { type: 'string' },
              },
            },
            familia: { type: 'string' },
            origen: { type: 'string' },
            tipo: { type: 'string', enum: ['árbol', 'arbusto', 'hierba', 'piedra', 'planta acuática', 'cactus', 'otro', 'palma', 'árbol (conífera)', 'árbol / arbusto según poda', 'arbusto / arbolito', 'arbusto bajo'] },
            descripcion: {
              type: 'object',
              properties: {
                general: { type: 'string' },
                hojas: { type: 'string' },
              },
            },
            altura: { type: 'string' },
            usos: { type: 'array', items: { type: 'string' } },
            impacto: { type: 'string' },
            estadoConservacion: { type: 'string', enum: ['en peligro', 'vulnerable', 'casi amenazado', 'preocupación menor', 'datos insuficientes', 'extinto en estado silvestre', 'extinto', 'no amenazada', 'no amenazada (cultivada)', 'no amenazada, aunque cada vez más escasa en áreas urbanas', 'vulnerable (según catálogo plantaqr del parque)', 'no determinado'] },
            ubicacion: {
              type: 'object',
              properties: {
                latitud: { type: 'number' },
                longitud: { type: 'number' },
                descripcion: { type: 'string' },
              },
            },
            imagen: { type: 'string', description: 'Data URL o URL de la imagen de la planta' },
          },
        },
        QR: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            plantaId: { type: 'string' },
            url: { type: 'string' },
            imagen: { type: 'string', description: 'Data URL de la imagen QR' },
          },
        },
      },
    },
  },
  apis: ['./server/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use('/api/plantas', plantaRoutes);
app.use('/api/qr', qrRoutes);

const indexFile = path.join(distPath, 'index.html');

app.get('/', (_req, res) => {
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  res.json({ mensaje: 'API de Plantas QR funcionando', documentacion: `/api-docs` });
});

app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  next();
});

const db = mongoose.connection;

db.addListener('error', (err) => {
  console.error('Error de conexión a MongoDB:', err);
});

db.addListener('open', () => {
  console.log('Conectado a MongoDB');
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Swagger disponible en http://localhost:${PORT}/api-docs`);
  });
});

mongoose.connect(process.env.MONGODB_URI);

export default app;
