import { normalizarUsos } from '../../../constantes';

export const TIPOS = ['árbol', 'arbusto', 'hierba', 'piedra', 'planta acuática', 'cactus', 'otro', 'palma', 'árbol (conífera)', 'árbol / arbusto según poda', 'arbusto / arbolito', 'arbusto bajo'];
export const ESTADOS_CONSERVACION = [
  'en peligro',
  'vulnerable',
  'casi amenazado',
  'preocupación menor',
  'datos insuficientes',
  'extinto en estado silvestre',
  'extinto',
  'no amenazada',
  'no amenazada (cultivada)',
  'no amenazada, aunque cada vez más escasa en áreas urbanas',
  'vulnerable (según catálogo plantaqr del parque)',
  'no amenazada / ampliamente distribuida en los Andes',
  'preocupación menor (LC)',
  'preocupación menor (LC) / Ampliamente cultivada',
  'no determinado',
];

export function inicialEstado(planta) {
  return {
    nombreComun: planta?.nombre?.comun ?? '',
    nombreCientifico: planta?.nombre?.cientifico ?? '',
    familia: planta?.familia ?? '',
    origen: planta?.origen ?? '',
    ejemplaresEnParque: planta?.ejemplaresEnParque ?? '',
    tipo: planta?.tipo ?? TIPOS[0],
    descripcionGeneral: planta?.descripcion?.general ?? '',
    descripcionHojas: planta?.descripcion?.hojas ?? '',
    altura: planta?.altura ?? '',
    // Un uso por línea: así sobreviven las frases que llevan comas.
    usos: (planta?.usos?.some((u) => String(u).includes(',') || String(u).length > 48)
      ? planta.usos
      : normalizarUsos(planta?.usos)).join('\n'),
    impacto: planta?.impacto ?? '',
    estadoConservacion: planta?.estadoConservacion ?? ESTADOS_CONSERVACION[0],
    latitud: planta?.ubicacion?.latitud ?? '',
    longitud: planta?.ubicacion?.longitud ?? '',
    ubicacionDescripcion: planta?.ubicacion?.descripcion ?? '',
  };
}
