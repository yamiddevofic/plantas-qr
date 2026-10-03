import PropTypes from 'prop-types';
import { LuMap, LuMountainSnow, LuSatellite } from 'react-icons/lu';

const BASES = [
  { id: 'satelite', etiqueta: 'Satélite', Icono: LuSatellite },
  { id: 'mapa', etiqueta: 'Mapa', Icono: LuMap },
];

export default function ControlesMapa({ base, onBase, relieve3D, onRelieve, deshabilitado }) {
  return (
    <div className="mapa-controles">
      <div className="mapa-segmentado" role="group" aria-label="Tipo de mapa">
        {BASES.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            type="button"
            className="mapa-control"
            aria-pressed={base === id}
            disabled={deshabilitado}
            onClick={() => onBase(id)}
          >
            <Icono aria-hidden="true" />
            {etiqueta}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="mapa-control mapa-control-relieve"
        aria-pressed={relieve3D}
        disabled={deshabilitado}
        onClick={onRelieve}
      >
        <LuMountainSnow aria-hidden="true" />
        Relieve 3D
      </button>
    </div>
  );
}

ControlesMapa.propTypes = {
  base: PropTypes.oneOf(['satelite', 'mapa']).isRequired,
  onBase: PropTypes.func.isRequired,
  relieve3D: PropTypes.bool.isRequired,
  onRelieve: PropTypes.func.isRequired,
  deshabilitado: PropTypes.bool,
};
