// Genera el logo de la web y los íconos de la app a partir del logo oficial de
// PlantaQR (el de las diapositivas: árbol con raíces y "PLANTA QR" en un
// escudo), guardado con fondo transparente en server/datos/logo-plantaqr.png.
//
// Salidas:
//   public/logo-plantaqr.webp      logo de la interfaz (marca, menú, cargador)
//   public/logo-plantaqr-512.png   logo para buscadores (schema.org) y enlaces
//   public/favicon-32.png, favicon-48.png
//   public/icons/icono-192.png, icono-512.png, icono-maskable-512.png
//   public/icons/apple-touch-icon.png
//
// Uso: npm run generar-iconos
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLICO = path.join(RAIZ, 'public');
const ORIGEN = path.join(RAIZ, 'server/datos/logo-plantaqr.png');

const TRANSPARENTE = { r: 0, g: 0, b: 0, alpha: 0 };
const BLANCO = { r: 255, g: 255, b: 255, alpha: 1 };

/**
 * Lienzo cuadrado de `lado` px con el logo centrado ocupando `escala` del lado.
 * Android recorta el "maskable" en círculo (el dibujo debe caber en el 80%
 * central) e iPhone pinta de negro lo transparente: esos dos llevan fondo blanco.
 */
async function icono({ lado, escala, fondo = TRANSPARENTE }) {
  const dibujo = Math.round(lado * escala);
  const logo = await sharp(ORIGEN).resize(dibujo, dibujo, { fit: 'contain', background: TRANSPARENTE }).toBuffer();
  const margen = Math.round((lado - dibujo) / 2);
  return sharp({ create: { width: lado, height: lado, channels: 4, background: fondo } })
    .composite([{ input: logo, left: margen, top: margen }])
    .png({ compressionLevel: 9, palette: true, quality: 95, effort: 10 })
    .toBuffer();
}

async function guardar(buffer, destino) {
  await fs.writeFile(destino, buffer);
  const { width, height } = await sharp(buffer).metadata();
  console.log(`✓ ${path.relative(RAIZ, destino)} (${width}×${height}, ${Math.round(buffer.length / 1024)} KB)`);
}

async function main() {
  await fs.mkdir(path.join(PUBLICO, 'icons'), { recursive: true });

  // En la interfaz se ve a 34–140 px; 320 cubre pantallas de densidad 2×.
  await guardar(
    await sharp(ORIGEN).resize(320, 320).webp({ quality: 88, alphaQuality: 90 }).toBuffer(),
    path.join(PUBLICO, 'logo-plantaqr.webp'),
  );
  await guardar(await icono({ lado: 512, escala: 1 }), path.join(PUBLICO, 'logo-plantaqr-512.png'));

  await guardar(await icono({ lado: 32, escala: 1 }), path.join(PUBLICO, 'favicon-32.png'));
  await guardar(await icono({ lado: 48, escala: 1 }), path.join(PUBLICO, 'favicon-48.png'));
  await guardar(await icono({ lado: 192, escala: 0.96 }), path.join(PUBLICO, 'icons/icono-192.png'));
  await guardar(await icono({ lado: 512, escala: 0.96 }), path.join(PUBLICO, 'icons/icono-512.png'));
  await guardar(await icono({ lado: 512, escala: 0.72, fondo: BLANCO }), path.join(PUBLICO, 'icons/icono-maskable-512.png'));
  await guardar(await icono({ lado: 180, escala: 0.84, fondo: BLANCO }), path.join(PUBLICO, 'icons/apple-touch-icon.png'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
