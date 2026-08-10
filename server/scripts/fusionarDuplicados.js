import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';
import Planta from '../models/Planta.js';
import QR from '../models/QR.js';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

function claveEspecie(p) {
  return String(p.nombre?.cientifico || p.nombre?.comun || '').toLowerCase().trim();
}

function unicos(lista) {
  const vistos = new Set();
  const resultado = [];
  for (const item of lista) {
    const v = String(item || '').trim();
    if (!v || vistos.has(v)) continue;
    vistos.add(v);
    resultado.push(v);
  }
  return resultado;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB');

  const plantas = await Planta.find().sort({ createdAt: 1 });
  const grupos = new Map();

  for (const p of plantas) {
    const clave = claveEspecie(p);
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(p);
  }

  let fusionados = 0;
  let eliminados = 0;
  let qrReasignados = 0;

  for (const miembros of grupos.values()) {
    const grupo = miembros.filter((m) => m.imagen || m.imagenes?.length);
    if (grupo.length === 0) continue;

    const imagenes = unicos(grupo.flatMap((m) => [m.imagen, ...(m.imagenes || [])]));
    const ubicaciones = unicos(grupo.flatMap((m) => [m.ubicacion?.descripcion]));

    const principal = grupo[0];
    const reemplazables = grupo.slice(1);

    if (reemplazables.length === 0) {
      if (imagenes.length > 1 && (principal.imagenes?.length || 0) < imagenes.length) {
        await Planta.updateOne(
          { _id: principal._id },
          { $set: { imagen: imagenes[0], imagenes } },
        );
        console.log(`Galería: ${principal.nombre.comun} (${principal.nombre.cientifico}) → ${imagenes.length} imágenes`);
      }
      continue;
    }

    const datosFusion = {
      imagen: imagenes[0],
      imagenes,
      ubicaciones,
      usos: unicos(miembros.flatMap((m) => m.usos || [])),
    };

    for (const reemplazable of reemplazables) {
      const reasignados = await QR.updateMany(
        { plantaId: reemplazable._id },
        { $set: { plantaId: principal._id } },
      );
      qrReasignados += reasignados.modifiedCount;
      await Planta.deleteOne({ _id: reemplazable._id });
      eliminados++;
    }

    await Planta.updateOne({ _id: principal._id }, { $set: datosFusion });
    fusionados++;
    console.log(
      `Fusionada: ${principal.nombre.comun} (${principal.nombre.cientifico}) → ` +
      `${miembros.length} ejemplares, ${imagenes.length} imágenes, ${ubicaciones.length} ubicaciones`,
    );
  }

  console.log(`\nResumen: ${fusionados} especies fusionadas, ${eliminados} duplicados eliminados, ${qrReasignados} QRs reasignados`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Fallo del script:', error);
  process.exit(1);
});
