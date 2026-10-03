// Estado de instalación de la app (PWA). Chrome y Edge disparan
// `beforeinstallprompt` una sola vez y muy pronto, por eso se escucha al cargar
// el módulo (main.jsx lo importa) y no al montar el componente.

let aviso = null;
let instalada = false;
const oyentes = new Set();
const avisar = () => oyentes.forEach((fn) => fn());

function enModoApp() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

if (typeof window !== 'undefined') {
  instalada = enModoApp();
  window.addEventListener('beforeinstallprompt', (e) => {
    // Se guarda para lanzarlo desde el botón del menú en vez de la mini barra.
    e.preventDefault();
    aviso = e;
    avisar();
  });
  window.addEventListener('appinstalled', () => {
    aviso = null;
    instalada = true;
    avisar();
  });
}

export function suscribirInstalacion(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

let instantanea = { puedeLanzar: false, instalada };
export function estadoInstalacion() {
  const puedeLanzar = Boolean(aviso);
  if (instantanea.puedeLanzar !== puedeLanzar || instantanea.instalada !== instalada) {
    instantanea = { puedeLanzar, instalada };
  }
  return instantanea;
}

/** Abre el diálogo nativo de instalación. Devuelve true si la persona aceptó. */
export async function lanzarInstalacion() {
  if (!aviso) return false;
  const evento = aviso;
  aviso = null;
  avisar();
  await evento.prompt();
  const { outcome } = await evento.userChoice;
  return outcome === 'accepted';
}

export function esIOS() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}
