import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const ejecutar = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(__dirname, '..', '..');
const DESTINO = path.join(RAIZ, 'public', 'og.jpg');

const URL_POR_DEFECTO = 'http://localhost:3001/';
const ANCHO = 1200;
const ALTO = 630;
/* Se captura una ventana holgada y luego se recorta el hero midiéndolo sobre
   la imagen: cuadrar el alto de la ventana a mano dejaba franja blanca o
   cortaba el botón, porque el hero no siempre arranca en y=0. */
const ALTO_CAPTURA = 760;
/* Open Graph pide 1200x630. Se captura al doble para que el texto no salga
   pixelado y se reduce después. */
const ESCALA = 2;
/* WhatsApp descarta las vistas previas pesadas, así que la calidad se ajusta
   hacia abajo hasta entrar en el presupuesto. */
const LIMITE_BYTES = 300 * 1024;

const CANDIDATOS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

async function buscarNavegador() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  for (const ruta of CANDIDATOS) {
    try {
      await fs.access(ruta);
      return ruta;
    } catch {
      // Siguiente candidato.
    }
  }
  throw new Error('No se encontró Chrome ni Edge. Define CHROME_PATH con la ruta al ejecutable.');
}

/* El hero es la banda de foto de arriba; debajo empieza el cuerpo blanco de la
   página. Se baja hasta encontrar la primera fila con contenido (puede haber
   margen blanco arriba) y desde ahí hasta la primera fila blanca de lado a
   lado: eso es el borde inferior del hero. */
async function medirHero(captura, width, height) {
  const { data, info } = await sharp(captura).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const canales = info.channels;
  const esBlanca = (y) => {
    for (let x = 0; x < width; x += 8) {
      const i = (y * width + x) * canales;
      if (data[i] < 244 || data[i + 1] < 244 || data[i + 2] < 244) return false;
    }
    return true;
  };

  let inicio = 0;
  while (inicio < height && esBlanca(inicio)) inicio++;

  let fin = inicio;
  while (fin < height && !esBlanca(fin)) fin++;

  const alto = fin - inicio;
  // Si no se distingue la banda, se devuelve la captura entera y se avisa.
  if (alto < height * 0.15) {
    console.warn('No se pudo aislar el hero; se usa la captura completa.');
    return { top: 0, alto: height };
  }
  return { top: inicio, alto };
}

async function main() {
  const url = process.argv[2] || URL_POR_DEFECTO;
  const navegador = await buscarNavegador();
  const perfil = await fs.mkdtemp(path.join(os.tmpdir(), 'og-'));
  const png = path.join(perfil, 'captura.png');

  console.log(`Capturando ${url} con ${path.basename(navegador)}...`);

  await ejecutar(navegador, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=' + ESCALA,
    `--window-size=${ANCHO},${ALTO_CAPTURA}`,
    // Deja correr el JS y la descarga de la foto: la landing pinta tras montar React.
    '--virtual-time-budget=15000',
    `--user-data-dir=${perfil}`,
    `--screenshot=${png}`,
    url,
  ]);

  const captura = await fs.readFile(png);
  const { width, height } = await sharp(captura).metadata();
  console.log(`Captura de ${width}x${height}`);

  const { top, alto } = await medirHero(captura, width, height);
  console.log(`Hero detectado: ${width}x${alto} desde y=${top}`);
  const recortada = await sharp(captura).extract({ left: 0, top, width, height: alto }).toBuffer();

  let calidad = 88;
  let salida;
  do {
    salida = await sharp(recortada).resize(ANCHO, ALTO, { fit: 'cover', position: 'centre' }).jpeg({ quality: calidad, mozjpeg: true }).toBuffer();
    if (salida.length <= LIMITE_BYTES) break;
    calidad -= 8;
  } while (calidad >= 50);

  await fs.writeFile(DESTINO, salida);
  await fs.rm(perfil, { recursive: true, force: true });

  console.log(`${path.relative(RAIZ, DESTINO)} → ${ANCHO}x${ALTO}, ${Math.round(salida.length / 1024)} KB (calidad ${calidad})`);
  if (salida.length > LIMITE_BYTES) console.warn('Sigue por encima de 300 KB; WhatsApp puede descartarla.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
