import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOGO = path.join(__dirname, '..', '..', 'public', 'uploads');
const MANIFIESTO = path.join(__dirname, '..', '..', 'src', 'variantesImagenes.json');

/* Anchos servidos por srcset. El original se conserva como fallback y como
   candidato más grande, así que aquí solo van los recortes. */
const ANCHOS = [400, 800];
const CALIDAD = 72;

const esVariante = (archivo) => new RegExp(`-(${ANCHOS.join('|')})\\.webp$`).test(archivo);

async function main() {
  const archivos = (await fs.readdir(CATALOGO))
    .filter((f) => f.endsWith('.webp') && !esVariante(f))
    .sort();

  /* El manifiesto guarda qué recortes existen y el ancho real del original: una
     foto angosta no genera el de 800px, y anunciarlo en el srcset daría 404.
     El ancho real también hace falta para declarar bien el candidato grande,
     que no siempre mide 1200px. */
  const manifiesto = {};
  let generadas = 0;
  let peso = 0;

  for (const archivo of archivos) {
    const base = path.basename(archivo, '.webp');
    // Leer a memoria primero: en Windows sharp bloquea el archivo de entrada.
    const entrada = await fs.readFile(path.join(CATALOGO, archivo));
    const { width } = await sharp(entrada).metadata();
    const anchos = ANCHOS.filter((a) => a < width);

    if (anchos.length === 0) {
      console.log(`· ${base} ya mide ${width}px, sin recortes`);
      continue;
    }

    for (const ancho of anchos) {
      const destino = path.join(CATALOGO, `${base}-${ancho}.webp`);
      const info = await sharp(entrada).resize({ width: ancho }).webp({ quality: CALIDAD }).toFile(destino);
      generadas++;
      peso += info.size;
    }

    manifiesto[base] = { recortes: anchos, ancho: width };
    console.log(`✓ ${base} (${width}px) → ${anchos.map((a) => `${a}px`).join(', ')}`);
  }

  await fs.writeFile(MANIFIESTO, `${JSON.stringify(manifiesto, null, 2)}\n`, 'utf8');

  /* Recortes que quedaron huérfanos de corridas anteriores: si el srcset ya no
     los anuncia son peso muerto en el build, y si los anuncia sin que existan
     dan 404. */
  const esperados = new Set(
    Object.entries(manifiesto).flatMap(([base, { recortes }]) => recortes.map((a) => `${base}-${a}.webp`)),
  );
  const huerfanos = (await fs.readdir(CATALOGO)).filter((f) => esVariante(f) && !esperados.has(f));
  for (const archivo of huerfanos) {
    await fs.rm(path.join(CATALOGO, archivo), { force: true });
    console.log(`− ${archivo} eliminado (huérfano)`);
  }

  const total = Object.keys(manifiesto).length;
  console.log(`\n${generadas} variantes (${(peso / 1024 / 1024).toFixed(1)} MB) para ${total} de ${archivos.length} fotos`);
  console.log(`Manifiesto en ${path.relative(process.cwd(), MANIFIESTO)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
