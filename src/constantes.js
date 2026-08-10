export const ESTADOS = {
  extinto: 'estado-extinto',
  'extinto en estado silvestre': 'estado-silvestre',
  'en peligro': 'estado-peligro',
  vulnerable: 'estado-vulnerable',
  'casi amenazado': 'estado-amenazado',
  'preocupación menor': 'estado-bien',
  'datos insuficientes': 'estado-info',
  'vulnerable (según catálogo plantaqr del parque)': 'estado-vulnerable',
  'no amenazada': 'estado-bien',
  'no amenazada (cultivada)': 'estado-cultivada',
  'no amenazada, aunque cada vez más escasa en áreas urbanas': 'estado-escasa',
  'no determinado': 'estado-info',
};

export function estadoClass(estado) {
  return ESTADOS[estado] || 'estado-info';
}

export function abreviarTexto(texto, maxPalabras = 2) {
  const t = String(texto || '').trim();
  if (!t) return '';
  const limpio = t
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
  const palabras = limpio.split(' ').filter(Boolean);
  const primera = palabras[0] || '';
  const cortado = primera.includes('/') ? primera : palabras.slice(0, maxPalabras).join(' ');
  return cortado.replace(/[,;]\s*$/, '').trim();
}

export const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="220" viewBox="0 0 300 220">
    <rect width="300" height="220" fill="#e7f2ea"/>
    <text x="150" y="110" text-anchor="middle" dominant-baseline="middle"
          font-family="sans-serif" font-size="48" fill="#45906c">🌿</text>
  </svg>`
);

export function listaImagenes({ imagen, imagenes }) {
  const base = [imagen, ...(imagenes || [])];
  return [...new Set(base.filter(Boolean))];
}

export function normalizarUsos(lista) {
  if (!Array.isArray(lista)) return [];
  const unidos = lista.join(',');
  try {
    const posible = JSON.parse(unidos);
    if (Array.isArray(posible)) {
      return posible.map((s) => String(s).trim()).filter(Boolean);
    }
  } catch {
    // No era JSON; se limpia elemento por elemento.
  }
  return lista
    .flatMap((s) => String(s).split(','))
    .map((s) => s.trim().replace(/^[[]*\s*"?/, '').replace(/\s*"?[\]]*$/, '').trim())
    .filter(Boolean);
}