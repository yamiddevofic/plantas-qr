// Integra al catálogo las especies registradas en las notas de campo (Google
// Keep), ya limpias en server/datos/especies-keep.json:
//
// - Si la especie ya existe (mismo nombre científico, un nombre científico
//   anterior conocido o el mismo nombre común), actualiza su información en
//   todas sus fichas y agrega las fotos nuevas a la ficha principal, sin quitar
//   las que ya tenía.
// - Si no existe, crea su ficha con todas sus fotos.
// - Los árboles con coordenadas GPS se registran como individuos (o se
//   actualizan si ya hay uno a menos de 3 m).
//
// Uso:
//   npm run importar-keep              → solo muestra el plan, no escribe
//   npm run importar-keep -- --aplicar → guarda los cambios
//
// Es idempotente: correrlo dos veces no duplica fichas, fotos ni individuos.
import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Planta from '../models/Planta.js';
import Individuo from '../models/Individuo.js';
import { PARQUE_PREDETERMINADO, sugerirCodigo } from '../../src/individuos.js';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATOS = path.join(__dirname, '..', 'datos', 'especies-keep.json');
const PUBLICO = path.join(__dirname, '..', '..', 'public');
const APLICAR = process.argv.includes('--aplicar');
const RADIO_MISMO_ARBOL_M = 3;

const normalizar = (texto) => String(texto ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/×/g, 'x')
  .toLowerCase().replace(/\s+/g, ' ').trim();

/** Nombre común sin variantes: "Arrayán / Mirto andino" → también "arrayan". */
const comunesDe = (planta) => {
  const comun = normalizar(planta.nombre?.comun);
  return new Set([comun, ...comun.split('/').map((p) => p.trim())].filter(Boolean));
};

const unicos = (lista) => [...new Set(lista.filter(Boolean))];

function distanciaM([lng1, lat1], [lng2, lat2]) {
  const r = 6371000;
  const rad = (g) => (g * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

/** Busca las fichas de cada especie: primero por científico, luego alias y por último nombre común. */
export function emparejar(entradas, plantas) {
  const tomadas = new Set();
  const grupos = new Map(entradas.map((e) => [e.clave, []]));
  const pasos = [
    (e, p) => normalizar(p.nombre?.cientifico) === e.clave,
    (e, p) => e.coincidencias.cientificos.includes(normalizar(p.nombre?.cientifico)),
    (e, p) => [...comunesDe(p)].some((c) => e.coincidencias.comunes.includes(c)),
  ];
  for (const paso of pasos) {
    for (const entrada of entradas) {
      // Una especie que ya encontró sus fichas no busca más por criterios más flojos.
      if (grupos.get(entrada.clave).length) continue;
      for (const planta of plantas) {
        const id = String(planta._id);
        if (!tomadas.has(id) && paso(entrada, planta)) {
          grupos.get(entrada.clave).push(planta);
          tomadas.add(id);
        }
      }
    }
  }
  return grupos;
}

function verificarFotos(entradas) {
  const faltan = entradas.flatMap((e) => e.fotos).filter((url) => !fs.existsSync(path.join(PUBLICO, url)));
  if (faltan.length) throw new Error(`Faltan fotos en public/: ${faltan.join(', ')}`);
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Falta configurar MONGODB_URI');
  const entradas = JSON.parse(fs.readFileSync(DATOS, 'utf8'));
  verificarFotos(entradas);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(APLICAR ? 'Modo: APLICAR cambios\n' : 'Modo: solo plan (agrega --aplicar para guardar)\n');

  const plantas = await Planta.find().sort({ createdAt: 1 });
  const grupos = emparejar(entradas, plantas);
  const resumen = { creadas: 0, actualizadas: 0, fotosNuevas: 0, individuosNuevos: 0, individuosActualizados: 0 };

  for (const entrada of entradas) {
    const fichas = grupos.get(entrada.clave);
    const nombre = entrada.ficha.nombre?.comun ?? entrada.clave;
    let especieId;

    if (fichas.length === 0) {
      if (entrada.soloComplemento) {
        console.log(`! ${nombre}: no está en el catálogo; se omite (solo traía fotos y conteo).`);
        continue;
      }
      const doc = {
        ...entrada.ficha,
        ubicacion: { latitud: 0, longitud: 0, descripcion: '' },
        imagen: entrada.fotos[0] ?? '',
        imagenes: entrada.fotos,
      };
      console.log(`+ CREAR ${nombre} (${entrada.ficha.nombre.cientifico}) · ${entrada.fotos.length} fotos · ${entrada.ficha.ejemplaresEnParque} ejemplares`);
      resumen.creadas += 1;
      resumen.fotosNuevas += entrada.fotos.length;
      if (APLICAR) especieId = (await Planta.create(doc))._id;
    } else {
      const [principal, ...hermanas] = fichas;
      const actuales = unicos([principal.imagen, ...(principal.imagenes ?? [])]);
      const nuevas = entrada.fotos.filter((f) => !actuales.includes(f));
      const imagenes = [...actuales, ...nuevas];
      const antes = `${principal.nombre.comun} (${principal.nombre.cientifico})`;
      console.log(
        `~ ACTUALIZAR ${antes}${fichas.length > 1 ? ` y ${hermanas.length} ficha(s) hermana(s)` : ''}`
        + `${entrada.soloComplemento ? '' : ` → ${nombre} (${entrada.ficha.nombre.cientifico})`}`
        + ` · +${nuevas.length} fotos (quedan ${imagenes.length}) · ${entrada.ficha.ejemplaresEnParque} ejemplares`,
      );
      resumen.actualizadas += fichas.length;
      resumen.fotosNuevas += nuevas.length;
      especieId = principal._id;

      if (APLICAR) {
        // Los datos de la especie van a todas sus fichas (así siguen agrupadas por
        // nombre científico); las fotos, solo a la principal. La ubicación de cada
        // ficha y el impacto escrito antes se conservan.
        const comunes = { ...entrada.ficha };
        if (!comunes.impacto) delete comunes.impacto;
        for (const ficha of fichas) {
          ficha.set(comunes);
          if (ficha === principal) {
            ficha.imagen = imagenes[0];
            ficha.imagenes = imagenes;
          }
          await ficha.save();
        }
      }
    }

    for (const arbol of entrada.individuos ?? []) {
      const coords = [arbol.lng, arbol.lat];
      const existentes = await Individuo.find({}, 'codigoArbol ubicacion especieId');
      const cercano = existentes.find((i) => distanciaM(i.ubicacion.coordinates, coords) <= RADIO_MISMO_ARBOL_M);
      const datos = {
        parque: PARQUE_PREDETERMINADO,
        ubicacion: { type: 'Point', coordinates: coords },
        altitudMsnm: arbol.altitudMsnm,
        precisionGpsM: arbol.precisionGpsM,
      };
      if (cercano) {
        console.log(`  · individuo ${cercano.codigoArbol} ya existe en ese punto; se vincula a ${nombre}`);
        resumen.individuosActualizados += 1;
        if (APLICAR && especieId) await Individuo.updateOne({ _id: cercano._id }, { $set: { ...datos, especieId } });
      } else {
        const codigo = sugerirCodigo(nombre, existentes.map((i) => i.codigoArbol));
        console.log(`  + individuo ${codigo} en ${arbol.lat}, ${arbol.lng} (${arbol.altitudMsnm} msnm)`);
        resumen.individuosNuevos += 1;
        if (APLICAR && especieId) {
          await Individuo.create({ ...datos, codigoArbol: codigo, especieId, imagen: entrada.fotos[0] ?? '' });
        }
      }
    }
  }

  // Fichas antiguas sin identificar: se informan, no se borran (pueden tener QR impresos).
  const sinNombre = plantas.filter((p) => /^no determinad|sin confirmar/i.test(`${p.nombre.cientifico} ${p.nombre.comun}`));
  if (sinNombre.length) {
    console.log('\nFichas sin identificar que siguen en el catálogo (revísalas a mano):');
    for (const p of sinNombre) console.log(`  ? ${p._id} · ${p.nombre.comun} · ${p.imagen}`);
  }

  console.log(
    `\nResumen: ${resumen.creadas} especies nuevas, ${resumen.actualizadas} fichas actualizadas, `
    + `${resumen.fotosNuevas} fotos agregadas, ${resumen.individuosNuevos} individuos nuevos, `
    + `${resumen.individuosActualizados} individuos vinculados.`,
  );
  if (!APLICAR) console.log('Nada se guardó. Para aplicar: npm run importar-keep -- --aplicar');
  await mongoose.disconnect();
}

// Solo corre al ejecutarse como comando (no al importarlo en pruebas).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(async (error) => {
    console.error('No se pudo importar desde Keep:', error);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  });
}
