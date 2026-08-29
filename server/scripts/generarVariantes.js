import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOGO = path.join(__dirname, '..', '..', 'public', 'uploads');
const MANIFIESTO = path.join(__dirname, '..', '..', 'src', 'variantesImagenes.json');

/* Anchos servidos por srcset. El original de 1200px se conserva como fallback
   y como candidato más grande, así que aquí solo van los recortes. */
const ANCHOS = [400, 800];
const CALIDAD = 72;

const esVariante = (archivo) => new RegExp(`-(${ANCHOS.join('|')})\\.webp$`).test(archivo);

async function main() {
  const archivos = (await fs.readdir(CATALOGO))
    .filter((f) => f.endsWith('.webp') && !esVariante(f))
    .sort();

  const conVariantes = [];
  let generadas = 0;
  let peso = 0;

  for (const archivo of archivos) {
    const base = path.basename(archivo, '.webp');
    // Leer a memoria primero: en Windows sharp bloquea el archivo de entrada.
    const entrada = await fs.readFile(path.join(CATALOGO, archivo));
    const { width } = await sharp(entrada).metadata();
    const anchos = ANCHOS.filter((a) => a < width);
    if (anchos.length === 0) continue;

    for (const ancho of anchos) {
      const destino = path.join(CATALOGO, `${base}-${ancho}.webp`);
      const info = await sharp(entrada).resize({ width: ancho }).webp({ quality: CALIDAD }).toFile(destino);
      generadas++;
      peso += info.size;
    }

    conVariantes.push(base);
    console.log(`✓ ${base} → ${anchos.map((a) => `${a}px`).join(', ')}`);
  }

  await fs.writeFile(MANIFIESTO, `${JSON.stringify(conVariantes, null, 2)}\n`, 'utf8');

  console.log(`\n${generadas} variantes (${(peso / 1024 / 1024).toFixed(1)} MB) para ${conVariantes.length} fotos`);
  console.log(`Manifiesto en ${path.relative(process.cwd(), MANIFIESTO)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
