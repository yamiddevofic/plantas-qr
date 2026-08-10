import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';
import Planta from '../models/Planta.js';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TIPOS_VALIDOS = Planta.schema.paths.tipo.enumValues;
const CONSERVACION_VALIDOS = Planta.schema.paths.estadoConservacion.enumValues;

function validarOAlternativo(valor, permitidos, alternativo) {
  if (permitidos.includes(valor)) return valor;
  return alternativo;
}

async function main() {
  const jsonPath = path.join(__dirname, '..', '..', 'parque-chitaga-platas.json');
  const plantas = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB');

  let creadas = 0;
  let actualizadas = 0;
  const errores = [];

  for (const p of plantas) {
    const doc = {
      nombre: {
        comun: p.nombre.comun,
        cientifico: p.nombre.cientifico,
      },
      familia: p.familia,
      origen: p.origen,
      tipo: validarOAlternativo(p.tipo, TIPOS_VALIDOS, 'otro'),
      descripcion: {
        general: p.descripcion.general,
        hojas: p.descripcion.hojas || '',
      },
      altura: p.altura,
      usos: Array.isArray(p.usos) ? p.usos.map(String) : [],
      impacto: p.impacto,
      estadoConservacion: validarOAlternativo(p.estadoConservacion, CONSERVACION_VALIDOS, 'datos insuficientes'),
      ubicacion: {
        latitud: Number(p.ubicacion.latitud) || 0,
        longitud: Number(p.ubicacion.longitud) || 0,
        descripcion: p.ubicacion.descripcion,
      },
      imagen: p.imagen ? `/${p.imagen}` : '',
    };

    try {
      const filtro = {
        'nombre.comun': doc.nombre.comun,
        'ubicacion.descripcion': doc.ubicacion.descripcion,
      };
      const existente = await Planta.findOne(filtro);
      if (!existente) {
        await Planta.create(doc);
        creadas++;
        console.log(`Creada: ${doc.nombre.comun} (${doc.nombre.cientifico})`);
        continue;
      }
      await Planta.findOneAndUpdate(filtro, doc, { runValidators: true });
      actualizadas++;
      console.log(`Actualizada: ${doc.nombre.comun} (${doc.nombre.cientifico})`);
    } catch (error) {
      errores.push({ nombre: doc.nombre.comun, error: error.message });
      console.error(`Error con ${doc.nombre.comun}: ${error.message}`);
    }
  }

  console.log(`\nResumen: ${creadas} creadas, ${actualizadas} actualizadas, ${errores.length} errores`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Fallo del script:', error);
  process.exit(1);
});