import { useState } from 'react';
import PropTypes from 'prop-types';
import { LuPencil, LuTrash2 } from 'react-icons/lu';

const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

/** Fila de un individuo: foto, código y especie, ubicación y acciones. */
export default function TarjetaIndividuo({ feature, onEditar, onEliminar }) {
  const { codigoArbol, imagen, especie, pendiente, altitudMsnm } = feature.properties;
  const [longitud, latitud] = feature.geometry.coordinates;
  const [fotoRota, setFotoRota] = useState(false);

  return (
    <li className="individuo-fila">
      {imagen && !fotoRota ? (
        <img
          className="individuo-foto"
          src={imagen}
          alt={`Fotografía del árbol ${codigoArbol}`}
          loading="lazy"
          decoding="async"
          onError={() => setFotoRota(true)}
        />
      ) : (
        <span className="individuo-foto individuo-foto-vacia" aria-hidden="true">🌳</span>
      )}

      <div className="individuo-datos">
        <p className="individuo-codigo">
          {codigoArbol}
          {pendiente && (
            <span className="individuo-pendiente">{pendiente === 'foto' ? 'Foto sin subir' : 'Sin enviar'}</span>
          )}
        </p>
        <p className="individuo-especie">
          {especie ? <a href={`#/planta/${especie._id}`}>{especie.nombre?.comun}</a> : 'Especie no disponible'}
          {especie?.nombre?.cientifico && <em> {especie.nombre.cientifico}</em>}
        </p>
        <p className="individuo-meta">
          {latitud.toFixed(5)}, {longitud.toFixed(5)}
          {altitudMsnm != null && (
            <span className="individuo-meta-extra"> · {numero.format(altitudMsnm)} msnm</span>
          )}
        </p>
      </div>

      <div className="individuo-acciones">
        <button
          type="button"
          className="individuo-accion"
          onClick={() => onEditar(feature)}
          aria-label={`Editar ${codigoArbol}`}
          title="Editar"
        >
          <LuPencil aria-hidden="true" />
        </button>
        <button
          type="button"
          className="individuo-accion individuo-accion-peligro"
          onClick={() => onEliminar(feature)}
          aria-label={`Eliminar ${codigoArbol}`}
          title="Eliminar"
        >
          <LuTrash2 aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

TarjetaIndividuo.propTypes = {
  feature: PropTypes.object.isRequired,
  onEditar: PropTypes.func.isRequired,
  onEliminar: PropTypes.func.isRequired,
};
