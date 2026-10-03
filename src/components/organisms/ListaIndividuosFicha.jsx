import { useState } from 'react';
import PropTypes from 'prop-types';
import { LuMapPin } from 'react-icons/lu';

const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

function Foto({ src, codigo }) {
  const [rota, setRota] = useState(false);
  if (!src || rota) return <span className="ficha-individuo-foto ficha-individuo-foto-vacia" aria-hidden="true">🌳</span>;
  return <img className="ficha-individuo-foto" src={src} alt={`Fotografía del árbol ${codigo}`} loading="lazy" decoding="async" onError={() => setRota(true)} />;
}

Foto.propTypes = { src: PropTypes.string, codigo: PropTypes.string.isRequired };

/** Individuos registrados de la especie; tocar uno lo señala en el mapa. */
export default function ListaIndividuosFicha({ individuos, seleccionado, onVer }) {
  return (
    <div className="ficha-individuos">
      <p className="ficha-individuos-titulo">
        {individuos.length} {individuos.length === 1 ? 'individuo registrado' : 'individuos registrados'} en el parque
      </p>
      <ul>
        {individuos.map((feature) => {
          const { id, codigoArbol, imagen, altitudMsnm, precisionGpsM } = feature.properties;
          const detalle = [
            altitudMsnm != null && `${numero.format(altitudMsnm)} msnm`,
            precisionGpsM != null && `GPS ±${numero.format(precisionGpsM)} m`,
          ].filter(Boolean).join(' · ');
          const activo = seleccionado === id;
          return (
            <li key={id}>
              <button
                type="button"
                className={`ficha-individuo${activo ? ' activo' : ''}`}
                aria-pressed={activo}
                onClick={() => onVer(feature)}
              >
                <Foto src={imagen} codigo={codigoArbol} />
                <span className="ficha-individuo-texto">
                  <strong>{codigoArbol}</strong>
                  {detalle && <span>{detalle}</span>}
                </span>
                <span className="ficha-individuo-ver">
                  <LuMapPin aria-hidden="true" />
                  <span>Ver en el mapa</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

ListaIndividuosFicha.propTypes = {
  individuos: PropTypes.arrayOf(PropTypes.object).isRequired,
  seleccionado: PropTypes.string,
  onVer: PropTypes.func.isRequired,
};
