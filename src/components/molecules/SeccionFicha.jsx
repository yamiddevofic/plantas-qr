import PropTypes from 'prop-types';
import useRevelar from '../../hooks/useRevelar';

/**
 * Sección de la ficha con el mismo encabezado del inicio (raya + antetítulo)
 * y un icono que se dibuja cuando la sección entra en pantalla.
 */
export default function SeccionFicha({ id, titulo, antetitulo, icono: Icono, clase = '', children }) {
  const [ref, visible] = useRevelar({ umbral: 0.1 });

  return (
    <section
      ref={ref}
      className={`detalle-seccion revelar${visible ? ' revelado' : ''} ${clase}`.trim()}
      aria-labelledby={id}
    >
      <header className="detalle-seccion-cabecera">
        {Icono && (
          <span className="detalle-seccion-icono">
            <Icono />
          </span>
        )}
        <div>
          {antetitulo && <p className="inicio-eyebrow">{antetitulo}</p>}
          <h2 id={id} className="detalle-seccion-titulo">{titulo}</h2>
        </div>
      </header>
      {children}
    </section>
  );
}

SeccionFicha.propTypes = {
  id: PropTypes.string.isRequired,
  titulo: PropTypes.string.isRequired,
  /** Línea pequeña sobre el título, como en las secciones del inicio. */
  antetitulo: PropTypes.string,
  /** Componente de icono (IconosInicio) para la insignia del encabezado. */
  icono: PropTypes.elementType,
  /** Clase extra para ubicar la sección en la rejilla de la ficha. */
  clase: PropTypes.string,
  children: PropTypes.node,
};
