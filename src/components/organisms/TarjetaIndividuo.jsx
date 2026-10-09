import { useState } from 'react';
import PropTypes from 'prop-types';
import { IconoArbol, IconoLapiz, IconoPapelera, IconoRegla, IconoUbicacion } from '../atoms/IconosInicio';

const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

/**
 * Tarjeta de un individuo: foto, código y especie, ubicación y acciones. En
 * móvil es una fila compacta; desde tableta, una tarjeta con la foto arriba.
 */
export default function TarjetaIndividuo({ feature, onEditar, onEliminar, indice = 0 }) {
  const { codigoArbol, imagen, especie, pendiente, altitudMsnm, cantidad = 1 } = feature.properties;
  const [longitud, latitud] = feature.geometry.coordinates;
  const [fotoRota, setFotoRota] = useState(false);

  return (
    <li className="gestion-tarjeta individuo-tarjeta" style={{ '--i': Math.min(indice, 12) }}>
      <div className="gestion-tarjeta-foto">
        {imagen && !fotoRota ? (
          <img
            src={imagen}
            alt={`Fotografía del árbol ${codigoArbol}`}
            loading="lazy"
            decoding="async"
            onError={() => setFotoRota(true)}
          />
        ) : (
          <span className="gestion-tarjeta-sin-foto" aria-hidden="true"><IconoArbol /></span>
        )}
        {pendiente && (
          <span className="gestion-insignia-pendiente">{pendiente === 'foto' ? 'Foto sin subir' : 'Sin enviar'}</span>
        )}
      </div>

      <div className="gestion-tarjeta-cuerpo">
        <p className="gestion-tarjeta-titulo">
          {codigoArbol}
          {cantidad > 1 && <span className="gestion-grupo" title="Este punto representa varios árboles">{cantidad} árboles</span>}
        </p>
        <p className="gestion-tarjeta-especie">
          {especie ? <a href={`#/planta/${especie._id}`}>{especie.nombre?.comun}</a> : 'Especie no disponible'}
        </p>
        {especie?.nombre?.cientifico && <p className="gestion-tarjeta-cientifico"><em>{especie.nombre.cientifico}</em></p>}
        <ul className="gestion-tarjeta-meta" aria-label="Ubicación">
          <li>
            <IconoUbicacion />
            <span>{latitud.toFixed(5)}, {longitud.toFixed(5)}</span>
          </li>
          {altitudMsnm != null && (
            <li className="gestion-tarjeta-altitud">
              <IconoRegla />
              <span>{numero.format(altitudMsnm)} msnm</span>
            </li>
          )}
        </ul>
      </div>

      <div className="gestion-tarjeta-acciones">
        <button
          type="button"
          className="gestion-boton"
          onClick={() => onEditar(feature)}
          aria-label={`Editar ${codigoArbol}`}
          title="Editar"
        >
          <IconoLapiz />
          <span>Editar</span>
        </button>
        <button
          type="button"
          className="gestion-boton gestion-boton-peligro"
          onClick={() => onEliminar(feature)}
          aria-label={`Eliminar ${codigoArbol}`}
          title="Eliminar"
        >
          <IconoPapelera />
        </button>
      </div>
    </li>
  );
}

TarjetaIndividuo.propTypes = {
  feature: PropTypes.object.isRequired,
  onEditar: PropTypes.func.isRequired,
  onEliminar: PropTypes.func.isRequired,
  /** Posición en la lista, para escalonar la entrada. */
  indice: PropTypes.number,
};
