import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';
import Planta from '../models/Planta.js';
import Individuo from '../models/Individuo.js';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

const nombreCientifico = 'Cupressus sp. (probablemente C. lusitanica)';
const nombreParque = 'Parque Principal de Chitagá';
const imagenesPorCodigo = {
  'CIP-001': '/uploads/individuos/CIP-001.webp',
  'CIP-002': '/uploads/individuos/CIP-002.webp',
  'CIP-008': '/uploads/individuos/CIP-008.webp',
  'CIP-010': '/uploads/individuos/CIP-010.webp',
};

const coordenadas = [
  { lat: 7.138553333, lng: -72.665020000, acc: 1.9, alt: 2345 },
  { lat: 7.138385000, lng: -72.665033333, acc: 1.6, alt: 2343 },
  { lat: 7.138120000, lng: -72.665075000, acc: 1.6, alt: 2344 },
  { lat: 7.138008333, lng: -72.665001667, acc: 1.5, alt: 2345 },
  { lat: 7.137950000, lng: -72.664950000, acc: 1.4, alt: 2352 },
  { lat: 7.137948333, lng: -72.664928333, acc: 1.6, alt: 2352 },
  { lat: 7.138090000, lng: -72.664885000, acc: 1.6, alt: 2347 },
  { lat: 7.138141667, lng: -72.664866667, acc: 1.5, alt: 2349 },
  { lat: 7.137978333, lng: -72.664815000, acc: 1.6, alt: 2348 },
  { lat: 7.138605000, lng: -72.664853333, acc: 1.4, alt: 2354 },
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Falta configurar MONGODB_URI');
  await mongoose.connect(process.env.MONGODB_URI);

  const especie = await Planta.findOne({ 'nombre.cientifico': nombreCientifico }).sort({ createdAt: 1 });
  if (!especie) {
    throw new Error(`No existe en la colección plantas la especie científica "${nombreCientifico}". Importa primero el catálogo.`);
  }

  // Actualiza los metadatos compartidos en la ficha canónica sin tocar las otras
  // fichas Ciprés históricas ni sus IDs/QR impresos.
  especie.nombre.comun = 'Ciprés';
  especie.familia = 'Cupressaceae';
  especie.origen = 'Introducida; muy naturalizada y cultivada en los Andes colombianos';
  especie.descripcion.general = 'Conífera de follaje denso y fino. En el parque aparece tanto sin podar como trabajada en topiario.';
  especie.descripcion.hojas = 'Escamiformes, muy pequeñas, en ramillas aplanadas, verde intenso a verde amarillento';
  especie.usos = ['Ornamental', 'Cercas vivas', 'Arte topiario', 'Madera aromática', 'Cortavientos'];
  especie.impacto = 'Refugio para aves; ayuda a fijar suelo en taludes y bordes de camino';
  especie.estadoConservacion = 'no amenazada';
  await especie.save();

  const operaciones = coordenadas.map(({ lat, lng, acc, alt }, index) => {
    const codigoArbol = `CIP-${String(index + 1).padStart(3, '0')}`;
    const set = {
      especieId: especie._id,
      parque: nombreParque,
      ubicacion: { type: 'Point', coordinates: [lng, lat] },
      altitudMsnm: alt,
      precisionGpsM: acc,
    };
    if (imagenesPorCodigo[codigoArbol]) set.imagen = imagenesPorCodigo[codigoArbol];
    return {
      updateOne: {
        filter: { codigoArbol },
        update: { $set: set },
        upsert: true,
      },
    };
  });
  const resultado = await Individuo.bulkWrite(operaciones, { ordered: true });

  console.log(`Especie vinculada: ${especie.nombre.comun} (${especie._id})`);
  console.log(`Individuos: ${coordenadas.length}; insertados ${resultado.upsertedCount}, actualizados ${resultado.modifiedCount}.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('No se pudieron cargar los individuos de Ciprés:', error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
