import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(__dirname, '..', '..');

/* Comprueba que todo lo que el srcset va a anunciar exista de verdad en el
   build: un candidato inexistente da 404 y el navegador no reintenta. */
const manifiesto = JSON.parse(await fs.readFile(path.join(RAIZ, 'src', 'variantesImagenes.json'), 'utf8'));
const enDist = new Set(await fs.readdir(path.join(RAIZ, 'dist', 'uploads')));

const faltan = [];
let anunciados = 0;

for (const [base, { recortes, ancho }] of Object.entries(manifiesto)) {
  for (const archivo of [...recortes.map((a) => `${base}-${a}.webp`), `${base}.webp`]) {
    anunciados++;
    if (!enDist.has(archivo)) faltan.push(archivo);
  }
  if (!Number.isInteger(ancho) || ancho <= 0) faltan.push(`${base}: ancho inválido (${ancho})`);
}

const sobran = [...enDist].filter((f) => {
  const m = f.match(/^(.+)-(400|800)\.webp$/);
  return m && !manifiesto[m[1]]?.recortes.includes(Number(m[2]));
});

console.log(`${Object.keys(manifiesto).length} fotos · ${anunciados} archivos anunciados por srcset`);
console.log(faltan.length ? `FALTAN:\n  ${faltan.join('\n  ')}` : 'Todos existen en dist/uploads.');
if (faltan.length) process.exitCode = 1;
console.log(sobran.length ? `Recortes en dist sin declarar: ${sobran.join(', ')}` : 'Sin recortes huérfanos.');
