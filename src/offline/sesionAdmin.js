// Sesión de administrador de la app.
//
// - La contraseña vive solo en memoria mientras la app está abierta, compartida
//   por todas las páginas (así no se pide en cada acción tras entrar).
// - Para poder entrar sin conexión, tras una verificación correcta con el
//   servidor se guarda en el dispositivo una huella PBKDF2 (con sal y 210 000
//   iteraciones), nunca la contraseña.

const CLAVE_HUELLA = 'plantaqr:huella-admin:v1';
const ITERACIONES = 210000;

let passwordEnMemoria = '';

export const passwordSesion = () => passwordEnMemoria;
export function guardarPasswordSesion(password) {
  passwordEnMemoria = password;
}
export function cerrarSesion() {
  passwordEnMemoria = '';
}

const aBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const deBase64 = (texto) => Uint8Array.from(atob(texto), (c) => c.charCodeAt(0));

async function derivar(password, sal) {
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: ITERACIONES }, clave, 256);
}

/** Recuerda en el dispositivo la huella de una contraseña ya verificada por el servidor. */
export async function recordarHuella(password) {
  try {
    const sal = crypto.getRandomValues(new Uint8Array(16));
    const huella = await derivar(password, sal);
    localStorage.setItem(CLAVE_HUELLA, JSON.stringify({ sal: aBase64(sal), huella: aBase64(huella) }));
  } catch {
    // Sin WebCrypto o sin almacenamiento: solo se podrá entrar con conexión.
  }
}

export function hayHuella() {
  try {
    return Boolean(localStorage.getItem(CLAVE_HUELLA));
  } catch {
    return false;
  }
}

/** Compara sin conexión contra la huella guardada. */
export async function verificarHuella(password) {
  try {
    const { sal, huella } = JSON.parse(localStorage.getItem(CLAVE_HUELLA) || 'null') ?? {};
    if (!sal || !huella) return false;
    const calculada = aBase64(await derivar(password, deBase64(sal)));
    return calculada === huella;
  } catch {
    return false;
  }
}
