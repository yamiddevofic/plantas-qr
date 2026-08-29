import fs from 'fs/promises';
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

/* El catálogo que viaja con el build vive en public/uploads; server/uploads solo
   guarda lo que se sube desde el panel y se pierde en cada despliegue. */
const CATALOGO = path.join(__dirname, '..', '..', 'public', 'uploads');
const SUBIDAS = path.join(__dirname, '..', 'uploads');
const RESPALDOS = path.join(__dirname, '..', '..', 'tmp');

const CONVERTIBLES = new Set(['.jpg', '.jpeg', '.png', '.gif']);

async function listarArchivos(dir) {
  try {
    return new Set(await fs.readdir(dir));
  } catch {
    return new Set();
  }
}

/* Deja la referencia como /uploads/archivo.ext: en Mongo quedaron algunas sin la
   barra inicial y el navegador las resuelve relativas a /planta/:id. */
function conBarra(ref) {
  const limpio = String(ref).trim();
  if (limpio.startsWith('/uploads/')) return limpio;
  if (limpio.startsWith('uploads/')) return `/${limpio}`;
  return limpio;
}

function normalizarRef(ref, disponibles) {
  const conBarraInicial = conBarra(ref);
  if (!conBarraInicial.startsWith('/uploads/')) return conBarraInicial;

  const archivo = conBarraInicial.slice('/uploads/'.length);
  const ext = path.extname(archivo).toLowerCase();
  if (!CONVERTIBLES.has(ext)) return conBarraInicial;

  const gemelo = `${archivo.slice(0, -ext.length)}.webp`;
  return disponibles.has(gemelo) ? `/uploads/${gemelo}` : conBarraInicial;
}

function existeEnDisco(ref, disponibles) {
  if (!ref.startsWith('/uploads/')) return true;
  return disponibles.has(ref.slice('/uploads/'.length));
}

async function main() {
  const purgarRotas = process.argv.includes('--purgar-rotas');
  const simulacion = process.argv.includes('--simulacion');

  const disponibles = new Set([
    ...(await listarArchivos(CATALOGO)),
    ...(await listarArchivos(SUBIDAS)),
  ]);
  console.log(`${disponibles.size} archivos disponibles entre public/uploads y server/uploads\n`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB\n');

  const plantas = await Planta.find().lean();

  await fs.mkdir(RESPALDOS, { recursive: true });
  const respaldo = path.join(RESPALDOS, `respaldo-plantas-${new Date().toISOString().slice(0, 10)}.json`);
  await fs.writeFile(respaldo, JSON.stringify(plantas, null, 2), 'utf8');
  console.log(`Respaldo de ${plantas.length} plantas en ${path.relative(process.cwd(), respaldo)}\n`);

  const rotas = new Set();
  let actualizadas = 0;

  for (const planta of plantas) {
    /* imagen e imagenes se fusionan en el carrusel (listaImagenes), así que
       comparten deduplicado. ejemplares es una lista paralela foto+ubicación
       que la app no renderiza: lleva su propio conjunto para no vaciarla. */
    const conservar = (usadas) => (ref) => {
      if (!ref) return '';
      const normalizada = normalizarRef(ref, disponibles);
      if (!existeEnDisco(normalizada, disponibles)) {
        rotas.add(normalizada);
        if (purgarRotas) return '';
      }
      if (usadas.has(normalizada)) return '';
      usadas.add(normalizada);
      return normalizada;
    };

    const enCarrusel = conservar(new Set());
    const enEjemplares = conservar(new Set());

    const imagen = enCarrusel(planta.imagen);
    const imagenes = (planta.imagenes || []).map(enCarrusel).filter(Boolean);
    const ejemplares = (planta.ejemplares || [])
      .map((e) => ({ ...e, imagen: enEjemplares(e?.imagen) }))
      .filter((e) => e.imagen || e.ubicacion);

    const antes = JSON.stringify([planta.imagen || '', planta.imagenes || [], (planta.ejemplares || []).map((e) => e?.imagen || '')]);
    const despues = JSON.stringify([imagen, imagenes, ejemplares.map((e) => e.imagen)]);
    if (antes === despues) continue;

    const refsAntes = [planta.imagen || '', ...(planta.imagenes || []), ...(planta.ejemplares || []).map((e) => e?.imagen || '')];
    const refsDespues = [imagen, ...imagenes, ...ejemplares.map((e) => e.imagen)];
    console.log(`${planta.nombre?.comun || planta._id}: ${refsAntes.filter(Boolean).length} → ${refsDespues.filter(Boolean).length} referencias`);
    refsAntes.forEach((antes, i) => {
      const despues = refsDespues[i];
      if (antes && antes !== despues) console.log(`   ${antes} → ${despues || '(eliminada)'}`);
    });

    if (!simulacion) await Planta.findByIdAndUpdate(planta._id, { imagen, imagenes, ejemplares });
    actualizadas++;
  }

  console.log(`\n${actualizadas} plantas ${simulacion ? 'se actualizarían' : 'actualizadas'}`);

  if (rotas.size > 0) {
    console.log(`\n${rotas.size} referencias apuntan a archivos que no existen:`);
    for (const ref of [...rotas].sort()) console.log(`  ${ref}`);
    if (!purgarRotas) console.log('Se conservaron. Usa --purgar-rotas para quitarlas de las fichas.');
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
