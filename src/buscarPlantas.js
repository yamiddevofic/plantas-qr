// Búsqueda de especies en el catálogo (sin tildes ni mayúsculas), compartida por
// la lupa y la barra de búsqueda del catálogo.

export const LIMITE_RESULTADOS = 8;

export function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Especies cuyo nombre común o científico, familia, tipo o nombres alternos contienen `texto`. */
export function buscarPlantas(catalogo, texto, limite = LIMITE_RESULTADOS) {
  const q = normalizar(texto).trim();
  if (!q || !catalogo) return [];
  return catalogo
    .filter((p) => [
      normalizar(p.nombre?.comun),
      normalizar(p.nombre?.cientifico),
      normalizar(p.familia),
      normalizar(p.tipo),
      normalizar((p.nombresAlternos ?? []).join(' ')),
    ].join(' ').includes(q))
    .slice(0, limite);
}
