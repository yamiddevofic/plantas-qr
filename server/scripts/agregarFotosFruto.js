// Agrega la foto de fruto (o cono) a las especies que no la tienen, con fotos de
// licencia libre listadas en server/datos/fotos-fruto-externas.json (Wikimedia
// Commons e iNaturalist). Cada foto se descarga, se convierte a WebP como las que
// se suben desde la app (máx. 1600 px, calidad 80), se guarda en MongoDB y queda
// con su crédito (autor, licencia y enlace), que la ficha muestra bajo la foto.
//
// Solo toca especies cuya foto de fruto está vacía: si ya se cargó una desde
// «Gestión de especies», se respeta.
//
// Uso:
//   npm run agregar-fotos-fruto              → solo muestra el plan, no escribe
//   npm run agregar-fotos-fruto -- --aplicar → guarda los cambios
import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import sharp from 'sharp';
import Planta from '../models/Planta.js';
import Imagen from '../models/Imagen.js';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATOS = path.join(__dirname, '..', 'datos', 'fotos-fruto-externas.json');
const RESPALDOS = path.join(__dirname, '..', '..', 'tmp');
const APLICAR = process.argv.includes('--aplicar');
const AGENTE = 'PlantasQR/1.0 (https://plantas-qr.vercel.app)';

const esperar = (ms) => new Promise((resolver) => { setTimeout(resolver, ms); });

/* Wikimedia limita las descargas seguidas (HTTP 429): se reintenta con pausas crecientes. */
async function descargarWebp(url) {
  let r;
  for (let intento = 0; intento < 6; intento += 1) {
    r = await fetch(url, { headers: { 'User-Agent': AGENTE } });
    if (r.status !== 429) break;
    await esperar(5000 * (intento + 1));
  }
  if (!r.ok) throw new Error(`HTTP ${r.status} al descargar ${url}`);
  const original = Buffer.from(await r.arrayBuffer());
  return sharp(original)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Falta configurar MONGODB_URI');
  const { fotos } = JSON.parse(fs.readFileSync(DATOS, 'utf8'));

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(APLICAR ? 'Modo: APLICAR cambios\n' : 'Modo: solo plan (agrega --aplicar para guardar)\n');

  const pendientes = [];
  for (const foto of fotos) {
    const fichas = await Planta.find({ 'nombre.cientifico': foto.cientifico });
    if (!fichas.length) {
      console.log(`! ${foto.nombre}: no está en el catálogo; se omite.`);
      continue;
    }
    for (const ficha of fichas) {
      if (ficha.imagenFruto) {
        console.log(`= ${ficha.nombre.comun}: ya tiene foto de fruto; se respeta.`);
        continue;
      }
      console.log(`+ ${ficha.nombre.comun} ← ${foto.archivoFuente}\n    ${foto.credito.texto}`);
      pendientes.push({ ficha, foto });
    }
  }

  if (APLICAR && pendientes.length) {
    fs.mkdirSync(RESPALDOS, { recursive: true });
    const archivo = path.join(RESPALDOS, `respaldo-fotos-fruto-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(archivo, JSON.stringify(pendientes.map(({ ficha }) => ({
      _id: ficha._id, imagenFruto: ficha.imagenFruto, creditos: ficha.creditos,
    })), null, 2));
    console.log(`\nRespaldo: ${archivo}`);
    for (const { ficha, foto } of pendientes) {
      const datos = await descargarWebp(foto.descarga);
      const imagen = await Imagen.create({ datos, tipo: 'image/webp' });
      ficha.imagenFruto = `/api/imagenes/${imagen._id}`;
      ficha.set('creditos.fruto', foto.credito);
      await ficha.save();
      console.log(`  ✓ ${ficha.nombre.comun} (${Math.round(datos.length / 1024)} KB)`);
      await esperar(1500);
    }
  }

  console.log(`\nResumen: ${pendientes.length} foto(s) de fruto ${APLICAR ? 'agregadas' : 'por agregar'}.`);
  if (!APLICAR) console.log('Nada se guardó. Para aplicar: npm run agregar-fotos-fruto -- --aplicar');
  await mongoose.disconnect();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(async (error) => {
    console.error('No se pudieron agregar las fotos de fruto:', error);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  });
}
