// Completa las fichas del catálogo inicial (palma de cera, palma canaria y
// ciprés) con los datos de server/datos/especies-complementos.json, que se
// investigaron en fuentes bibliográficas:
//
// - `completar`: solo llena los campos vacíos; lo que ya tenga la ficha se respeta.
// - `reemplazar`: sobrescribe esos campos (p. ej. el estado de conservación,
//   para usar la categoría UICN).
//
// Uso:
//   npm run completar-especies              → solo muestra el plan, no escribe
//   npm run completar-especies -- --aplicar → guarda los cambios
//
// Antes de escribir deja un respaldo de las fichas en tmp/. Es idempotente.
import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Planta from '../models/Planta.js';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATOS = path.join(__dirname, '..', 'datos', 'especies-complementos.json');
const RESPALDOS = path.join(__dirname, '..', '..', 'tmp');
const APLICAR = process.argv.includes('--aplicar');

const vacio = (v) => v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

/** Lista de cambios [ruta, antes, después] para una ficha. */
export function planDeCambios(ficha, { completar = {}, reemplazar = {} }) {
  const cambios = [];
  for (const [clave, valor] of Object.entries(completar)) {
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      for (const [sub, v] of Object.entries(valor)) {
        if (vacio(ficha[clave]?.[sub]) && !vacio(v)) cambios.push([`${clave}.${sub}`, ficha[clave]?.[sub], v]);
      }
    } else if (vacio(ficha[clave]) && !vacio(valor)) {
      cambios.push([clave, ficha[clave], valor]);
    }
  }
  for (const [clave, valor] of Object.entries(reemplazar)) {
    if (ficha[clave] !== valor) cambios.push([clave, ficha[clave], valor]);
  }
  return cambios;
}

const corto = (v) => {
  const t = Array.isArray(v) ? `[${v.length}]` : String(v ?? '—');
  return t.length > 70 ? `${t.slice(0, 67)}…` : t;
};

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Falta configurar MONGODB_URI');
  const { especies } = JSON.parse(fs.readFileSync(DATOS, 'utf8'));

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(APLICAR ? 'Modo: APLICAR cambios\n' : 'Modo: solo plan (agrega --aplicar para guardar)\n');

  const pendientes = [];
  for (const [cientifico, datos] of Object.entries(especies)) {
    const fichas = await Planta.find({ 'nombre.cientifico': cientifico });
    if (!fichas.length) {
      console.log(`! ${cientifico}: no está en el catálogo; se omite.`);
      continue;
    }
    for (const ficha of fichas) {
      const cambios = planDeCambios(ficha.toObject(), datos);
      console.log(`~ ${ficha.nombre.comun} (${ficha._id}) · ${cambios.length} campo(s)`);
      for (const [ruta, antes, despues] of cambios) console.log(`    ${ruta}: ${corto(antes)} → ${corto(despues)}`);
      if (cambios.length) pendientes.push({ ficha, cambios });
    }
  }

  if (APLICAR && pendientes.length) {
    fs.mkdirSync(RESPALDOS, { recursive: true });
    const archivo = path.join(RESPALDOS, `respaldo-completar-especies-${new Date().toISOString().slice(0, 10)}.json`);
    fs.writeFileSync(archivo, JSON.stringify(pendientes.map(({ ficha }) => ficha.toObject()), null, 2));
    console.log(`\nRespaldo: ${archivo}`);
    for (const { ficha, cambios } of pendientes) {
      for (const [ruta, , despues] of cambios) ficha.set(ruta, despues);
      await ficha.save();
    }
  }

  const total = pendientes.reduce((n, p) => n + p.cambios.length, 0);
  console.log(`\nResumen: ${pendientes.length} ficha(s), ${total} campo(s) ${APLICAR ? 'guardados' : 'por guardar'}.`);
  if (!APLICAR) console.log('Nada se guardó. Para aplicar: npm run completar-especies -- --aplicar');
  await mongoose.disconnect();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(async (error) => {
    console.error('No se pudieron completar las especies:', error);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  });
}
