import PropTypes from 'prop-types';

/**
 * Contador de especies registradas/filtradas del catálogo, con anuncio
 * accesible (aria-live) de los cambios.
 */
export default function ContadorEspecies({ total, filtrados, activos }) {
  return (
    <p className="count" aria-live="polite" aria-atomic="true">
      <span className="count-dot" aria-hidden="true" />
      {activos
        ? `${filtrados} de ${total} ${total === 1 ? 'especie' : 'especies'}`
        : `${total} ${total === 1 ? 'especie registrada' : 'especies registradas'}`}
    </p>
  );
}

ContadorEspecies.propTypes = {
  /** Total de especies del catálogo. */
  total: PropTypes.number.isRequired,
  /** Especies que coinciden con los filtros activos. */
  filtrados: PropTypes.number.isRequired,
  /** true si hay búsqueda o filtros aplicados. */
  activos: PropTypes.bool.isRequired,
};