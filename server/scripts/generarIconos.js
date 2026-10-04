// Genera el ícono de la app a partir del emblema del inicio (el árbol con su
// placa QR, src/components/atoms/EmblemaArbolQr.jsx): favicon SVG, íconos PWA
// (192, 512 y "maskable" para Android) e ícono de iPhone (apple-touch-icon).
//
// Uso: npm run generar-iconos
//
// La geometría del emblema se copia aquí en coordenadas de su viewBox (160×160);
// si el dibujo del componente cambia, hay que actualizarla y volver a generar.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLICO = path.join(RAIZ, 'public');

// Paleta del modo claro del emblema y del cielo del inicio (inicio.css).
const COLOR = {
  cielo: ['#d6ede0', '#ecf6ee', '#fbf1dd'],
  copaA: '#4f9d74',
  copaB: '#2d6a4f',
  copaC: '#3b815e',
  brillo: '#d7f2e0',
  tronco: '#7a5434',
  suelo: '#173f2f',
  placa: '#ffffff',
  modulo: '#173f2f',
  haz: '#1fbf6a',
  visor: '#2d6a4f',
};

// Placa QR: cuadrícula de 7×7 con los tres marcadores y módulos sueltos.
const M = 3.4;
const O = 4.1;
const MODULOS = [
  [4, 0], [3, 1], [4, 2], [3, 3], [0, 4], [2, 4], [4, 4], [6, 4],
  [1, 5], [3, 5], [5, 5], [4, 6], [6, 6], [5, 3], [6, 2],
];

const marcador = (x, y) => `
    <g transform="translate(${O + x * M} ${O + y * M})">
      <rect width="${M * 3}" height="${M * 3}" rx="1.2" fill="${COLOR.modulo}"/>
      <rect x="${M * 0.5}" y="${M * 0.5}" width="${M * 2}" height="${M * 2}" rx="0.6" fill="${COLOR.placa}"/>
      <rect x="${M}" y="${M}" width="${M}" height="${M}" rx="0.4" fill="${COLOR.modulo}"/>
    </g>`;

// El emblema sin halo, órbita ni hojitas: en el ícono el fondo hace de halo.
const EMBLEMA = `
  <ellipse cx="80" cy="134" rx="40" ry="5" fill="${COLOR.suelo}" fill-opacity="0.14"/>
  <path fill="${COLOR.tronco}" d="M76 135c1.6-11 1.8-22 .4-33l-9-9 2.6-2.4 7.4 7.2c.3-3 .3-6 0-9h5.6c-.3 2.8-.3 5.7 0 8.6l8.2-8.4 2.6 2.4-10 10c-1.4 11.2-1.2 22.2.4 33.6z"/>
  <circle cx="54" cy="80" r="20" fill="${COLOR.copaB}"/>
  <circle cx="106" cy="80" r="20" fill="${COLOR.copaB}"/>
  <circle cx="80" cy="86" r="19" fill="${COLOR.copaC}"/>
  <circle cx="80" cy="60" r="30" fill="${COLOR.copaA}"/>
  <circle cx="69" cy="49" r="9" fill="${COLOR.brillo}" fill-opacity="0.55"/>
  <circle cx="51" cy="74" r="5" fill="${COLOR.brillo}" fill-opacity="0.55"/>
  <path d="M93 93c3 4 6 7 11 9" fill="none" stroke="${COLOR.tronco}" stroke-width="1.6" stroke-linecap="round"/>
  <g transform="translate(100 100) rotate(-6)">
    <rect x="0.6" y="1.6" width="32" height="32" rx="5" fill="#000" fill-opacity="0.12"/>
    <rect width="32" height="32" rx="5" fill="${COLOR.placa}"/>
    ${marcador(0, 0)}${marcador(4, 0)}${marcador(0, 4)}
    ${MODULOS.map(([x, y]) => `<rect x="${O + x * M}" y="${O + y * M}" width="${M}" height="${M}" rx="0.5" fill="${COLOR.modulo}"/>`).join('')}
    <rect x="2" y="14.8" width="28" height="2.4" rx="1.2" fill="${COLOR.haz}"/>
    <path d="M-4 4v-6a2 2 0 0 1 2-2h6M28-4h6a2 2 0 0 1 2 2v6M36 28v6a2 2 0 0 1-2 2h-6M4 36h-6a2 2 0 0 1-2-2v-6" fill="none" stroke="${COLOR.visor}" stroke-width="2" stroke-linecap="round"/>
  </g>`;

// Caja del dibujo en el viewBox del emblema (copa, tronco y placa con su visor).
const CAJA = { x: 34, y: 30, ancho: 104, alto: 108 };

/**
 * Ícono de 512×512. `escala` es cuánto ocupa el dibujo (ancho de la caja / 512);
 * `redondeado` deja esquinas redondas transparentes (favicon y PWA "any"); sin
 * él, el fondo llena el cuadrado (maskable de Android e iPhone, que recortan solos).
 */
function icono({ escala, redondeado }) {
  const k = (512 * escala) / CAJA.ancho;
  const cx = CAJA.x + CAJA.ancho / 2;
  const cy = CAJA.y + CAJA.alto / 2;
  // Un poco por debajo del centro: el árbol "se apoya" en el suelo del ícono.
  const tx = 256 - cx * k;
  const ty = 262 - cy * k;
  const [c1, c2, c3] = COLOR.cielo;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="0.55" stop-color="${c2}"/>
      <stop offset="1" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="resplandor" cx="0.5" cy="0.72" r="0.55">
      <stop offset="0" stop-color="#ffd88a" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffd88a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" ${redondeado ? 'rx="112"' : ''} fill="url(#cielo)"/>
  <rect width="512" height="512" ${redondeado ? 'rx="112"' : ''} fill="url(#resplandor)"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(4)})">${EMBLEMA}
  </g>
</svg>
`;
}

async function png(svg, lado, destino) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(lado, lado).png({ compressionLevel: 9 }).toFile(destino);
  console.log(`✓ ${path.relative(RAIZ, destino)} (${lado}×${lado})`);
}

async function main() {
  const conEsquinas = icono({ escala: 0.7, redondeado: true });
  // Android recorta el maskable en círculo o forma propia: el dibujo cabe en el
  // 80% central (zona segura). iPhone redondea las esquinas y pinta de negro lo
  // transparente, así que su ícono va a sangre.
  const maskable = icono({ escala: 0.52, redondeado: false });
  const iphone = icono({ escala: 0.66, redondeado: false });

  await fs.mkdir(path.join(PUBLICO, 'icons'), { recursive: true });
  await fs.writeFile(path.join(PUBLICO, 'favicon.svg'), conEsquinas);
  console.log('✓ public/favicon.svg');
  await png(conEsquinas, 192, path.join(PUBLICO, 'icons/icono-192.png'));
  await png(conEsquinas, 512, path.join(PUBLICO, 'icons/icono-512.png'));
  await png(maskable, 512, path.join(PUBLICO, 'icons/icono-maskable-512.png'));
  await png(iphone, 180, path.join(PUBLICO, 'icons/apple-touch-icon.png'));
  await png(conEsquinas, 48, path.join(PUBLICO, 'favicon-48.png'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
