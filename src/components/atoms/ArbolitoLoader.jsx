import PropTypes from 'prop-types';
import { LuTreeDeciduous } from 'react-icons/lu';

/**
 * Loader del catálogo: el árbol del parque que se "riega" y se rellena
 * de color desde el contorno mientras carga. Úsalo dentro de un
 * contenedor (por defecto) o a pantalla completa con `pantallaCompleta`.
 *
 * El tamaño se delega al CSS (clases .arbolito-carga-*) y el color
 * hereda los tokens del tema (--forest-600).
 */
export default function ArbolitoLoader({
  etiqueta = 'Cargando…',
  pantallaCompleta = false,
  clase = '',
}) {
  const raiz = `arbolito-carga${pantallaCompleta ? ' arbolito-carga-pantalla' : ''}`;

  return (
    <div className={clase ? `${raiz} ${clase}`.trim() : raiz} role="status" aria-live="polite">
      <span className="arbolito-carga-arbol" aria-hidden="true">
        <LuTreeDeciduous className="arbolito-carga-contorno" />
        <span className="arbolito-carga-relleno">
          <LuTreeDeciduous className="arbolito-carga-relleno-arbol" />
        </span>
      </span>
      {etiqueta && <p className="arbolito-carga-texto">{etiqueta}</p>}
    </div>
  );
}

ArbolitoLoader.propTypes = {
  /** Texto breve bajo el árbol (p. ej. "Cargando catálogo"). Vacío lo oculta. */
  etiqueta: PropTypes.string,
  /** Muestra el loader como overlay fijo a pantalla completa. */
  pantallaCompleta: PropTypes.bool,
  /** Clase(s) adicionales para dimensionar o ajustar desde el consumidor. */
  clase: PropTypes.string,
};