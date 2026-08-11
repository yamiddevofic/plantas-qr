import PropTypes from 'prop-types';
import { FiRefreshCw } from 'react-icons/fi';

/**
 * Botón de icono para recargar el catálogo desde el servidor.
 * Acompaña al contador de especies como acción ligera y accesible
 * (target ≥ 44px, aria-label y title propios). Mientras `cargando`
 * es verdadero, el icono gira y el botón queda deshabilitado.
 */
export default function BotonActualizar({ onClick, cargando = false }) {
  return (
    <button
      type="button"
      className={`accion-icono ${cargando ? 'actualizando' : ''}`.trim()}
      onClick={onClick}
      disabled={cargando}
      title={cargando ? 'Actualizando catálogo…' : 'Actualizar catálogo'}
      aria-label={cargando ? 'Actualizando catálogo…' : 'Actualizar catálogo'}
    >
      <FiRefreshCw aria-hidden="true" className={cargando ? 'girando' : undefined} />
    </button>
  );
}

BotonActualizar.propTypes = {
  /** Acción de recarga del catálogo. */
  onClick: PropTypes.func.isRequired,
  /** Operación en curso: gira el icono y deshabilita el botón. */
  cargando: PropTypes.bool,
};