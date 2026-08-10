import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';
import Planta from '../models/Planta.js';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB');

  const plantas = await Planta.find();
  let actualizadas = 0;

  for (const p of plantas) {
    const imagenes = p.imagenes?.length
      ? p.imagenes
      : p.imagen
        ? [p.imagen]
        : [];
    const ubicaciones = p.ubicaciones?.length
      ? p.ubicaciones
      : p.ubicacion?.descripcion
        ? [p.ubicacion.descripcion]
        : [];

    const ejemplares = imagenes.map((imagen, i) => ({
      imagen,
      ubicacion: ubicaciones[i] || p.ubicacion?.descripcion || '',
    }));

    if (!ejemplares.length) continue;

    await Planta.updateOne({ _id: p._id }, { $set: { ejemplares } }, { runValidators: true });
    actualizadas++;
    console.log(`${p.nombre.comun} → ${ejemplares.length} ejemplares con ubicación`);
  }

  console.log(`\nResumen: ${actualizadas} plantas con ejemplares vinculados`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Fallo del script:', error);
  process.exit(1);
});
