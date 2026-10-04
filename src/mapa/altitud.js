// Altitud del terreno en un punto, desde el modelo digital de elevación de
// Open-Meteo (gratuito, sin clave). Es aproximada (~±10 m en montaña): sirve para
// llenar el campo al marcar el mapa, y la persona puede corregirla a mano.
const URL_ELEVACION = 'https://api.open-meteo.com/v1/elevation';

/**
 * @returns {Promise<number|null>} metros sobre el nivel del mar, redondeados; null
 * si no hay conexión, la consulta falla o tarda más de `tiempoMs`.
 */
export async function altitudDelTerreno(latitud, longitud, { tiempoMs = 6000 } = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), tiempoMs);
  try {
    const respuesta = await fetch(`${URL_ELEVACION}?latitude=${latitud}&longitude=${longitud}`, { signal: control.signal });
    if (!respuesta.ok) return null;
    const { elevation } = await respuesta.json();
    const metros = Array.isArray(elevation) ? elevation[0] : elevation;
    return Number.isFinite(metros) ? Math.round(metros) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(temporizador);
  }
}
