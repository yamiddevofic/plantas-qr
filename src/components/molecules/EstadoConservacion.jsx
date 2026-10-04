import PropTypes from 'prop-types';
import useRevelar from '../../hooks/useRevelar';
import { ESCALA_CONSERVACION, estadoClass } from '../../constantes';
import { IconoEscudo } from '../atoms/IconosInicio';

/* Escala de riesgo simplificada para el medidor: de estable a extinta. Cada
   clase del catálogo cae en un nivel; "datos insuficientes" no marca ninguno. */
const NIVELES = [
  { etiqueta: 'Estable', clases: ['estado-bien', 'estado-cultivada'] },
  { etiqueta: 'Escasa', clases: ['estado-escasa'] },
  { etiqueta: 'Casi amenazada', clases: ['estado-amenazado'] },
  { etiqueta: 'Vulnerable', clases: ['estado-vulnerable'] },
  { etiqueta: 'En peligro', clases: ['estado-peligro'] },
  { etiqueta: 'Extinta', clases: ['estado-silvestre', 'estado-extinto'] },
];

/**
 * Tarjeta del estado de conservación: el estado de la ficha, su descripción
 * y un medidor de riesgo que se llena hasta el nivel de la especie.
 */
export default function EstadoConservacion({ estado, detalle = '', onVerEscala }) {
  const [ref, visible] = useRevelar({ umbral: 0.2 });
  const clase = estadoClass(estado);
  const nivel = NIVELES.findIndex((n) => n.clases.includes(clase));
  const descripcion =
    ESCALA_CONSERVACION.find((e) => e.clase === clase)?.descripcion ||
    'Estado de conservación de la especie según la escala del catálogo.';
  const texto = String(estado).charAt(0).toUpperCase() + String(estado).slice(1);
  // El detalle solo reemplaza la descripción si dice algo más que el nivel.
  const detalleUtil = detalle && detalle.trim().toLowerCase() !== String(estado).trim().toLowerCase() ? detalle : '';

  return (
    <section
      ref={ref}
      className={`estado-tarjeta revelar${visible ? ' revelado' : ''}`}
      data-nivel={nivel}
      aria-labelledby="ficha-estado-titulo"
    >
      <div className="estado-tarjeta-cabecera">
        <span className="estado-tarjeta-icono"><IconoEscudo /></span>
        <div>
          <h2 id="ficha-estado-titulo" className="inicio-eyebrow">Estado de conservación</h2>
          <p className="estado-tarjeta-valor">{texto}</p>
        </div>
      </div>

      <div
        className="estado-medidor"
        role="img"
        aria-label={
          nivel >= 0
            ? `Nivel de riesgo: ${NIVELES[nivel].etiqueta}, ${nivel + 1} de ${NIVELES.length}`
            : 'Nivel de riesgo sin evaluar'
        }
        style={{ '--nivel': nivel }}
      >
        <div className="estado-medidor-barra">
          {NIVELES.map((n, i) => (
            <span
              key={n.etiqueta}
              className={`estado-medidor-tramo${i <= nivel ? ' lleno' : ''}${i === nivel ? ' actual' : ''}`}
              style={{ '--i': i }}
            />
          ))}
        </div>
        <div className="estado-medidor-extremos" aria-hidden="true">
          <span>{NIVELES[0].etiqueta}</span>
          <span>{NIVELES[NIVELES.length - 1].etiqueta}</span>
        </div>
      </div>

      <p className="estado-tarjeta-descripcion">{detalleUtil || descripcion}</p>

      {onVerEscala && (
        <button type="button" className="estado-tarjeta-escala" onClick={onVerEscala}>
          Ver la escala completa
        </button>
      )}
    </section>
  );
}

EstadoConservacion.propTypes = {
  /** Estado tal como viene en la ficha (p. ej. "vulnerable"). */
  estado: PropTypes.string.isRequired,
  /** Explicación propia de la especie; reemplaza la descripción genérica del nivel. */
  detalle: PropTypes.string,
  /** Abre la ventana con la escala de colores; sin él no se muestra el botón. */
  onVerEscala: PropTypes.func,
};
