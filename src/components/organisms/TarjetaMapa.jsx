import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { LuArrowRight, LuMap } from 'react-icons/lu';
import { colorearPorEspecie } from '../../mapa/capasIndividuos';

const ANCHO = 120;
const ALTO = 72;
const MARGEN = 10;

/**
 * Miniatura de los árboles: cada punto en su posición real (proyección simple,
 * suficiente para un parque), con el color de su especie. Es decorativa: la
 * información está en el texto de la tarjeta.
 */
function puntosDe(coleccion) {
  const features = colorearPorEspecie(coleccion).coleccion.features.filter((f) => f.geometry?.coordinates);
  if (!features.length) return [];
  const lats = features.map((f) => f.geometry.coordinates[1]);
  const lngs = features.map((f) => f.geometry.coordinates[0]);
  const cos = Math.cos(((Math.min(...lats) + Math.max(...lats)) / 2) * (Math.PI / 180));
  const xs = lngs.map((l) => l * cos);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...lats), Math.max(...lats)];
  const escala = Math.min((ANCHO - 2 * MARGEN) / (x1 - x0 || 1), (ALTO - 2 * MARGEN) / (y1 - y0 || 1));
  const dx = (ANCHO - (x1 - x0) * escala) / 2;
  const dy = (ALTO - (y1 - y0) * escala) / 2;
  return features.map((f, i) => ({
    id: f.properties.id,
    x: dx + (xs[i] - x0) * escala,
    y: ALTO - (dy + (lats[i] - y0) * escala),
    r: (f.properties.cantidad ?? 1) > 1 ? 3.2 : 2.3,
    color: f.properties.color || 'var(--forest-700)',
  }));
}

/**
 * Acceso a la página del mapa (#/mapa): reemplaza al mapa incrustado en el
 * catálogo y en la ficha. `href` lleva a todos los árboles o a los de una especie.
 */
export default function TarjetaMapa({ id, antetitulo, titulo, texto, href, coleccion = null }) {
  const puntos = useMemo(() => puntosDe(coleccion), [coleccion]);
  return (
    <section className="tarjeta-mapa" aria-labelledby={id}>
      <a className="tarjeta-mapa-enlace" href={href}>
        <span className="tarjeta-mapa-vista" aria-hidden="true">
          <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="xMidYMid meet">
            {puntos.map((p) => (
              <circle key={p.id} cx={p.x} cy={p.y} r={p.r} fill={p.color} stroke="#ffffff" strokeWidth="0.8" />
            ))}
          </svg>
        </span>
        <span className="tarjeta-mapa-texto">
          <span className="tarjeta-mapa-antetitulo">
            <LuMap aria-hidden="true" />
            {antetitulo}
          </span>
          <span className="tarjeta-mapa-titulo" id={id}>{titulo}</span>
          {texto && <span className="tarjeta-mapa-descripcion">{texto}</span>}
          <span className="tarjeta-mapa-boton">
            Ver mapa
            <LuArrowRight aria-hidden="true" />
          </span>
        </span>
      </a>
    </section>
  );
}

TarjetaMapa.propTypes = {
  /** id del título (para aria-labelledby). */
  id: PropTypes.string.isRequired,
  antetitulo: PropTypes.string.isRequired,
  titulo: PropTypes.string.isRequired,
  texto: PropTypes.string,
  href: PropTypes.string.isRequired,
  /** Árboles que se dibujan en la miniatura. */
  coleccion: PropTypes.object,
};
