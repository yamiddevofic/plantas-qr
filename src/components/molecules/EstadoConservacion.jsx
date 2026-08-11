import { ESCALA_CONSERVACION, estadoClass } from '../../constantes';

/**
 * Píldora del estado de conservación de una especie: color según la
 * escala termómetro del catálogo, con la etiqueta general y el detalle
 * del estado (tooltip con la descripción de la categoría).
 */
export default function EstadoConservacion({ estado }) {
  const clase = estadoClass(estado);
  const descripcion =
    ESCALA_CONSERVACION.find((e) => e.clase === clase)?.descripcion ||
    'Estado de conservación de la especie según la escala del catálogo.';

  return (
    <span className={`estado-pill ${clase}`} title={descripcion}>
      <span className="estado-pill-punto" aria-hidden="true" />
      <span className="estado-pill-texto">
        <span className="estado-pill-caption">Estado de conservación</span>
        <span className="estado-pill-valor">{estado}</span>
      </span>
    </span>
  );
}