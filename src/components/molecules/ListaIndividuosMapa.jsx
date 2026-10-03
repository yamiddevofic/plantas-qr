import PropTypes from 'prop-types';
import { detalleIndividuo } from '../../mapa/capasIndividuos';

export default function ListaIndividuosMapa({ titulo, features, seleccionado, deshabilitado, onSeleccionar }) {
  return (
    <>
      <p className="mapa-lista-titulo" id="mapa-lista-titulo">{titulo}</p>
      <ul className="mapa-lista" aria-labelledby="mapa-lista-titulo">
        {features.map((feature) => {
          const { id, codigoArbol } = feature.properties;
          const activo = seleccionado === id;
          return (
            <li key={id}>
              <button
                type="button"
                className={`mapa-lista-item${activo ? ' activo' : ''}`}
                aria-pressed={activo}
                disabled={deshabilitado}
                onClick={() => onSeleccionar(feature)}
              >
                {feature.properties.imagen && (
                  <img
                    className="mapa-lista-imagen"
                    src={feature.properties.imagen}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(event) => { event.currentTarget.hidden = true; }}
                  />
                )}
                <span className="mapa-lista-codigo">{codigoArbol}</span>
                <span className="mapa-lista-detalle">{detalleIndividuo(feature.properties)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

ListaIndividuosMapa.propTypes = {
  titulo: PropTypes.string.isRequired,
  features: PropTypes.arrayOf(PropTypes.object).isRequired,
  seleccionado: PropTypes.string,
  deshabilitado: PropTypes.bool,
  onSeleccionar: PropTypes.func.isRequired,
};
