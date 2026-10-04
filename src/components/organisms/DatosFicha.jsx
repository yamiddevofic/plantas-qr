import PropTypes from 'prop-types';
import useRevelar from '../../hooks/useRevelar';
import { IconoArbol, IconoArbolPlaca, IconoFamilias, IconoGlobo, IconoRegla } from '../atoms/IconosInicio';

/** Datos rápidos de la especie en fichas con icono, que se dibujan al aparecer. */
export default function DatosFicha({ planta }) {
  const [ref, visible] = useRevelar({ umbral: 0.1 });
  const datos = [
    { Icono: IconoArbol, etiqueta: 'Tipo', valor: planta.tipo },
    { Icono: IconoFamilias, etiqueta: 'Familia', valor: planta.familia },
    { Icono: IconoGlobo, etiqueta: 'Origen', valor: planta.origen },
    { Icono: IconoRegla, etiqueta: 'Altura', valor: planta.altura },
    {
      Icono: IconoArbolPlaca,
      etiqueta: 'En el parque',
      valor: planta.ejemplaresEnParque
        ? `${planta.ejemplaresEnParque} ${planta.ejemplaresEnParque === 1 ? 'ejemplar' : 'ejemplares'}`
        : null,
    },
  ].filter((d) => d.valor);

  if (datos.length === 0) return null;

  return (
    <section
      ref={ref}
      className={`ficha-datos revelar${visible ? ' revelado' : ''}`}
      aria-labelledby="ficha-datos-titulo"
    >
      <h2 id="ficha-datos-titulo" className="inicio-eyebrow">Datos rápidos</h2>
      <dl className="ficha-datos-rejilla">
        {datos.map(({ Icono, etiqueta, valor }, i) => (
          <div key={etiqueta} className="ficha-dato" style={{ '--i': i }}>
            <dt>
              <span className="ficha-dato-icono"><Icono /></span>
              {etiqueta}
            </dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

DatosFicha.propTypes = {
  planta: PropTypes.object.isRequired,
};
