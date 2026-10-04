import { useState } from 'react';
import PropTypes from 'prop-types';
import { listaImagenes } from '../../constantes';
import { IconoCamara, IconoHoja, IconoLapiz } from '../atoms/IconosInicio';

function Foto({ src, alt }) {
  const [rota, setRota] = useState(false);
  if (!src || rota) return <span className="gestion-tarjeta-sin-foto" aria-hidden="true"><IconoHoja /></span>;
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setRota(true)} />;
}

Foto.propTypes = { src: PropTypes.string, alt: PropTypes.string.isRequired };

/** Tarjeta de una ficha en "Fotos de especies": foto principal, nombres y cuántas fotos tiene. */
export default function TarjetaFotosEspecie({ planta, onEditar, indice = 0 }) {
  const fotos = listaImagenes(planta);
  const nombre = planta.nombre.comun;

  return (
    <li className="gestion-tarjeta especie-tarjeta" style={{ '--i': Math.min(indice, 12) }}>
      <div className="gestion-tarjeta-foto">
        <Foto src={fotos[0]} alt={`Foto principal de ${nombre}`} />
        <span className={`gestion-insignia-fotos${fotos.length ? '' : ' vacia'}`}>
          <IconoCamara />
          {fotos.length === 0 ? 'Sin fotos' : `${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'}`}
        </span>
      </div>

      <div className="gestion-tarjeta-cuerpo">
        <p className="gestion-tarjeta-titulo">{nombre}</p>
        <p className="gestion-tarjeta-cientifico"><em>{planta.nombre.cientifico}</em></p>
        {planta.familia && <p className="gestion-tarjeta-familia">{planta.familia}</p>}
      </div>

      <div className="gestion-tarjeta-acciones">
        <button
          type="button"
          className="gestion-boton"
          onClick={() => onEditar(planta)}
          aria-label={`Editar fotos de ${nombre}`}
          title="Editar fotos"
        >
          <IconoLapiz />
          <span>Editar fotos</span>
        </button>
      </div>
    </li>
  );
}

TarjetaFotosEspecie.propTypes = {
  planta: PropTypes.object.isRequired,
  onEditar: PropTypes.func.isRequired,
  /** Posición en la lista, para escalonar la entrada. */
  indice: PropTypes.number,
};
