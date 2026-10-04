import { useState } from 'react';
import PropTypes from 'prop-types';
import { listaImagenes } from '../../constantes';
import { IconoCamara, IconoHoja, IconoLapiz, IconoPapelera } from '../atoms/IconosInicio';
import { esIdLocal } from '../../offline/colaEspecies';

const ESTADO_PENDIENTE = { crear: 'Nueva', editar: 'Sin enviar', fotos: 'Sin enviar' };

function Foto({ src, alt }) {
  const [rota, setRota] = useState(false);
  if (!src || rota) return <span className="gestion-tarjeta-sin-foto" aria-hidden="true"><IconoHoja /></span>;
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setRota(true)} />;
}

Foto.propTypes = { src: PropTypes.string, alt: PropTypes.string.isRequired };

/**
 * Tarjeta de una especie en Gestión de especies: foto principal, nombres,
 * cuántas fotos tiene y las acciones (editar datos, fotos, eliminar).
 */
export default function TarjetaEspecie({ planta, onEditar, onFotos, onEliminar, indice = 0 }) {
  const fotos = listaImagenes(planta);
  const nombre = planta.nombre.comun;
  // Una especie creada sin conexión aún no tiene ficha en el servidor.
  const local = esIdLocal(planta._id);

  return (
    <li className="gestion-tarjeta especie-tarjeta" style={{ '--i': Math.min(indice, 12) }}>
      <div className="gestion-tarjeta-foto">
        <Foto src={fotos[0]} alt={`Foto principal de ${nombre}`} />
        <span className={`gestion-insignia-fotos${fotos.length ? '' : ' vacia'}`}>
          <IconoCamara />
          {fotos.length === 0 ? 'Sin fotos' : `${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'}`}
        </span>
        {planta.pendiente && (
          <span className={`gestion-insignia-pendiente arriba${planta.errorSincronizacion ? ' rechazada' : ''}`}>
            {planta.errorSincronizacion ? 'No aceptada' : ESTADO_PENDIENTE[planta.pendiente]}
          </span>
        )}
      </div>

      <div className="gestion-tarjeta-cuerpo">
        <p className="gestion-tarjeta-titulo">
          {local ? nombre : <a href={`#/planta/${planta._id}`}>{nombre}</a>}
        </p>
        <p className="gestion-tarjeta-cientifico"><em>{planta.nombre.cientifico}</em></p>
        {planta.familia && <p className="gestion-tarjeta-familia">{planta.familia}</p>}
      </div>

      <div className="gestion-tarjeta-acciones">
        <button type="button" className="gestion-boton gestion-boton-texto" onClick={() => onEditar(planta)} aria-label={`Editar datos de ${nombre}`} title="Editar datos">
          <IconoLapiz />
          <span>Editar</span>
        </button>
        <button type="button" className="gestion-boton gestion-boton-texto" onClick={() => onFotos(planta)} aria-label={`Fotos de ${nombre}`} title={local ? 'Podrás editar las fotos cuando se envíe la especie' : 'Fotos'} disabled={local}>
          <IconoCamara />
          <span>Fotos</span>
        </button>
        <button type="button" className="gestion-boton gestion-boton-peligro" onClick={() => onEliminar(planta)} aria-label={`Eliminar ${nombre}`} title="Eliminar">
          <IconoPapelera />
        </button>
      </div>
    </li>
  );
}

TarjetaEspecie.propTypes = {
  planta: PropTypes.object.isRequired,
  onEditar: PropTypes.func.isRequired,
  onFotos: PropTypes.func.isRequired,
  onEliminar: PropTypes.func.isRequired,
  /** Posición en la lista, para escalonar la entrada. */
  indice: PropTypes.number,
};
