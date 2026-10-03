import PropTypes from 'prop-types';
import { LuMapPin, LuPencil, LuTrash2 } from 'react-icons/lu';
import { detalleIndividuo } from '../../mapa/capasIndividuos';
import Boton from '../atoms/Boton';

export default function TarjetaIndividuo({ feature, onEditar, onEliminar }) {
  const { codigoArbol, parque, imagen, especie } = feature.properties;
  const [longitud, latitud] = feature.geometry.coordinates;
  const detalle = detalleIndividuo(feature.properties);

  return (
    <li className="individuo-tarjeta">
      {imagen ? (
        <img
          className="individuo-foto"
          src={imagen}
          alt={`Fotografía del árbol ${codigoArbol}`}
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.hidden = true; }}
        />
      ) : (
        <span className="individuo-foto individuo-foto-vacia" aria-hidden="true">🌳</span>
      )}
      <div className="individuo-datos">
        <p className="individuo-codigo">{codigoArbol}</p>
        <p className="individuo-especie">
          {especie ? (
            <a href={`#/planta/${especie._id}`}>{especie.nombre?.comun}</a>
          ) : 'Especie no disponible'}
          {especie?.nombre?.cientifico && <em> · {especie.nombre.cientifico}</em>}
        </p>
        <p className="individuo-meta">
          <LuMapPin aria-hidden="true" />
          {latitud.toFixed(6)}, {longitud.toFixed(6)}
        </p>
        <p className="individuo-meta">{parque}{detalle && ` · ${detalle}`}</p>
      </div>
      <div className="individuo-acciones">
        <Boton variante="ghost" onClick={() => onEditar(feature)} aria-label={`Editar ${codigoArbol}`}>
          <LuPencil aria-hidden="true" className="btn-lupa-icono" />
          Editar
        </Boton>
        <Boton variante="ghost" clase="btn-peligro" onClick={() => onEliminar(feature)} aria-label={`Eliminar ${codigoArbol}`}>
          <LuTrash2 aria-hidden="true" className="btn-lupa-icono" />
          Eliminar
        </Boton>
      </div>
    </li>
  );
}

TarjetaIndividuo.propTypes = {
  feature: PropTypes.object.isRequired,
  onEditar: PropTypes.func.isRequired,
  onEliminar: PropTypes.func.isRequired,
};
