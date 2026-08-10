import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';
import Planta from '../models/Planta.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS = path.join(__dirname, '..', 'uploads');

const CALIDAD_WEBP = 80;
const ANCHO_MAXIMO = 1600;
const EXTENSIONES = new Set(['.jpg', '.jpeg', '.png', '.gif']);

async function optimizarArchivo(ruta) {
  const base = path.basename(ruta);
  const webpRuta = path.join(path.dirname(ruta), `${path.basename(ruta, path.extname(ruta))}.webp`);

  try {
    const metadata = await sharp(ruta, { failOn: 'none' }).metadata();
    if (!metadata.width || !metadata.height) return null;

    const optimizada = await sharp(ruta, { failOn: 'none', animated: path.extname(base).toLowerCase() === '.gif' })
      .rotate()
      .resize({ width: ANCHO_MAXIMO, withoutEnlargement: true })
      .webp({ quality: CALIDAD_WEBP })
      .toFile(webpRuta);

    const original = await fs.stat(ruta);

    if (optimizada.size >= original.size) {
      await fs.rm(webpRuta, { force: true });
      return { base, original: original.size, final: optimizada.size, guardado: 0, omitida: true };
    }

    return {
      base,
      original: original.size,
      final: optimizada.size,
      guardado: Math.round(((original.size - optimizada.size) / original.size) * 100),
    };
  } catch (error) {
    return { base, error: error.message };
  }
}

function toWebp(url) {
  if (!url || typeof url !== 'string') return url;
  const ext = path.extname(url.split('?')[0]).toLowerCase();
  if (!EXTENSIONES.has(ext)) return url;
  return `${url.slice(0, -ext.length)}.webp`;
}

async function actualizarRutasMongo() {
  dotenv.config();
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\nConectado a MongoDB para actualizar rutas .webp...');

    const plantas = await Planta.find();
    let actualizadas = 0;

    for (const planta of plantas) {
      const imagen = toWebp(planta.imagen);
      const imagenes = (planta.imagenes || []).map(toWebp);
      const ejemplares = (planta.ejemplares || []).map((e) => (e ? { ...e, imagen: toWebp(e.imagen) } : e));

      if (
        imagen !== planta.imagen ||
        imagenes.some((img, i) => img !== (planta.imagenes || [])[i]) ||
        ejemplares.some((e, i) => e && e.imagen !== (planta.ejemplares || [])[i]?.imagen)
      ) {
        await Planta.findByIdAndUpdate(planta._id, { imagen, imagenes, ejemplares });
        actualizadas++;
      }
    }

    console.log(`${actualizadas} plantas actualizadas a rutas .webp`);
  } catch (error) {
    console.warn(`No se pudo actualizar MongoDB (${error.message}). Las rutas quedan en jpg/png; el servidor debe estar en ejecución.`);
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  const optimizarSolo = process.argv.includes('--solo-imagenes');

  const archivos = await fs.readdir(UPLOADS);
  const imagenes = archivos.filter((archivo) => EXTENSIONES.has(path.extname(archivo).toLowerCase()));

  console.log(`Optimizando ${imagenes.length} imágenes en ${UPLOADS}...\n`);

  let totalOriginal = 0;
  let totalFinal = 0;
  let optimizadas = 0;

  for (const archivo of imagenes) {
    const ruta = path.join(UPLOADS, archivo);
    const resultado = await optimizarArchivo(ruta);
    if (!resultado) continue;

    if (resultado.error) {
      console.error(`✗ ${resultado.base} → Error: ${resultado.error}`);
      continue;
    }
    if (resultado.omitida) {
      console.log(`· ${resultado.base} → Se mantiene (webp no es más liviano)`);
      continue;
    }

    totalOriginal += resultado.original;
    totalFinal += resultado.final;
    optimizadas++;
    console.log(
      `✓ ${resultado.base} → ${(resultado.original / 1024).toFixed(0)}KB → ${(resultado.final / 1024).toFixed(0)}KB (−${resultado.guardado}%)`,
    );
  }

  console.log(`\n${optimizadas} imágenes convertidas a webp`);
  if (totalOriginal > 0) {
    console.log(
      `Ahorro: ${(totalOriginal / 1024 / 1024).toFixed(1)} MB → ${(totalFinal / 1024 / 1024).toFixed(1)} MB (−${Math.round((1 - totalFinal / totalOriginal) * 100)}%)`,
    );
  }

  if (!optimizarSolo) await actualizarRutasMongo();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});