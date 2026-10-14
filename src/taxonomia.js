// Conteo de especies y familias según las convenciones de nomenclatura botánica
// (Código Internacional de Nomenclatura, ICN). El catálogo tiene varias fichas
// por especie (una por QR impreso) y nombres con anotaciones de campo, así que
// contar fichas no sirve para decir cuántas especies hay.

const sinTildes = (texto) => String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');

/* Rangos infraespecíficos: no crean una especie nueva. */
const INFRAESPECIFICOS = new Set(['var.', 'subsp.', 'ssp.', 'f.', 'fo.', 'cv.', 'forma', 'variedad']);

/**
 * Clave de la especie a partir del nombre científico:
 * - Binomio (género + epíteto): `Prunus serotina var. capuli` → `prunus serotina`.
 * - Se ignoran las notas entre paréntesis y los rangos infraespecíficos
 *   (variedades, subespecies, formas, cultivares).
 * - Híbridos: `Photinia x fraseri` y `Photinia × fraseri` → `photinia × fraseri`.
 * - Identificado solo hasta género: `Cupressus sp. (probablemente …)` →
 *   `cupressus sp.` (cuenta como un taxón, como en un inventario).
 * - Sin determinar o sin género: null (no se cuenta).
 */
export function claveEspecie(cientifico) {
  const limpio = sinTildes(cientifico)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!limpio || limpio.startsWith('no determinad')) return null;

  const [genero, ...resto] = limpio.split(' ');
  if (!/^[a-z]+$/.test(genero)) return null;

  let i = 0;
  let hibrido = false;
  if (resto[i] === 'x' || resto[i] === '×') {
    hibrido = true;
    i += 1;
  }
  const epiteto = resto[i];
  if (!epiteto || INFRAESPECIFICOS.has(epiteto)) return `${genero} sp.`;
  if (epiteto === 'sp.' || epiteto === 'sp' || epiteto === 'spp.' || epiteto === 'spp') return `${genero} sp.`;
  return hibrido ? `${genero} × ${epiteto}` : `${genero} ${epiteto}`;
}

/* Familia botánica; "No determinada" no cuenta. */
function claveFamilia(familia) {
  const limpio = sinTildes(familia).trim().toLowerCase();
  if (!limpio || limpio.startsWith('no determinad')) return null;
  return limpio;
}

/**
 * Número de especies y familias distintas del catálogo. Como en un inventario
 * florístico, un «Género sp.» solo suma si ese género no tiene ya una especie
 * determinada (si no, es muy probablemente la misma planta sin precisar).
 */
export function contarTaxones(plantas) {
  const especies = new Set();
  const familias = new Set();
  for (const planta of plantas) {
    const especie = claveEspecie(planta.nombre?.cientifico);
    if (!especie) continue;
    especies.add(especie);
    const familia = claveFamilia(planta.familia);
    if (familia) familias.add(familia);
  }
  const generosDeterminados = new Set(
    [...especies].filter((e) => !e.endsWith(' sp.')).map((e) => e.split(' ')[0]),
  );
  const conteo = [...especies].filter(
    (e) => !e.endsWith(' sp.') || !generosDeterminados.has(e.split(' ')[0]),
  ).length;
  return { especies: conteo, familias: familias.size };
}
