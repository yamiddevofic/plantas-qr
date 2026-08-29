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
/* El degradado del hero es vertical, así que sus filas son planas en
   horizontal; con la foto detrás la variación se dispara (0 frente a ~37).
   Sirve para saber si la captura salió sin la imagen de fondo. */
const UMBRAL_FOTO = 10;

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

async function variacionHorizontal(captura) {
  const { data, info } = await sharp(captura).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let total = 0;
  let filas = 0;

  for (let y = Math.floor(height * 0.1); y < height * 0.5; y += 10) {
    let suma = 0;
    let sumaCuadrados = 0;
    let n = 0;
    for (let x = 0; x < width; x += 4) {
      const i = (y * width + x) * channels;
      const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
      suma += v;
      sumaCuadrados += v * v;
      n++;
    }
    total += Math.sqrt(Math.max(0, sumaCuadrados / n - (suma / n) ** 2));
    filas++;
  }
  return filas ? total / filas : 0;
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
  /* Sin banda distinguible la página no pintó (error de red, servidor caído).
     Antes se seguía adelante y se sobrescribía og.jpg con la pantalla de error;
     mejor abortar y dejar la imagen buena en su sitio. */
  if (alto < height * 0.15 || alto > height * 0.95) {
    throw new Error(`No se distingue el hero en la captura (banda de ${alto}px sobre ${height}px). No se toca og.jpg.`);
  }
  return { top: inicio, alto };
}

async function comprobarUrl(url) {
  let respuesta;
  try {
    respuesta = await fetch(url, { redirect: 'follow' });
  } catch (error) {
    throw new Error(`No se pudo abrir ${url}. ¿Está el servidor levantado? npm run server`, { cause: error });
  }
  if (!respuesta.ok) throw new Error(`${url} respondió ${respuesta.status}. Levanta el servidor antes de capturar.`);
}

async function main() {
  const url = process.argv[2] || URL_POR_DEFECTO;
  await comprobarUrl(url);
  const navegador = await buscarNavegador();
  const perfil = await fs.mkdtemp(path.join(os.tmpdir(), 'og-'));
  const png = path.join(perfil, 'captura.png');

  console.log(`Capturando ${url} con ${path.basename(navegador)}...`);

  /* La foto del hero se revela en el onLoad de React (ImagenPlanta arranca en
     opacity: 0), así que a veces la captura llega antes y sale solo el
     degradado. Se reintenta dando más tiempo y se comprueba el resultado. */
  let captura = null;
  let width = 0;
  let height = 0;

  for (const presupuesto of [15000, 30000, 45000]) {
    await ejecutar(navegador, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      // Espera a que el compositor termine: sin esto la captura sale a medio pintar.
      '--run-all-compositor-stages-before-draw',
      '--force-device-scale-factor=' + ESCALA,
      `--window-size=${ANCHO},${ALTO_CAPTURA}`,
      `--virtual-time-budget=${presupuesto}`,
      `--user-data-dir=${perfil}`,
      `--screenshot=${png}`,
      url,
    ]);

    captura = await fs.readFile(png);
    ({ width, height } = await sharp(captura).metadata());
    const variacion = await variacionHorizontal(captura);
    if (variacion >= UMBRAL_FOTO) {
      console.log(`Captura de ${width}x${height} (variación ${variacion.toFixed(1)})`);
      break;
    }
    console.warn(`La foto del hero no alcanzó a pintar (variación ${variacion.toFixed(1)}); reintentando...`);
    captura = null;
  }

  if (!captura) throw new Error('La foto del hero nunca terminó de pintar. No se toca og.jpg.');

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
