import PropTypes from 'prop-types';
import EmblemaArbolQr from '../atoms/EmblemaArbolQr';
import PaisajeHero from './PaisajeHero';

/**
 * Pantalla de carga entre páginas (ver App.jsx), con el mismo lenguaje del
 * inicio: cielo y paisaje del parque en SVG (claro u oscuro), el emblema del
 * árbol con su QR girando como cargador y la marca.
 */
export default function SplashCarga({ etiqueta = 'Cargando…' }) {
  const texto = etiqueta.replace(/(…|\.\.\.)$/, '');
  return (
    <div className="hero-splash" role="status" aria-live="polite">
      <PaisajeHero />
      <div className="hero-splash-contenido">
        <span className="hero-splash-emblema" aria-hidden="true">
          <EmblemaArbolQr cargando />
        </span>
        <p className="hero-splash-titulo">Planta<em>QR</em></p>
        <p className="arbolito-carga-texto">
          {texto}
          <span className="arbolito-carga-puntos" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
        </p>
      </div>
    </div>
  );
}

SplashCarga.propTypes = {
  /** Texto breve bajo la marca (p. ej. "Cargando catálogo"). */
  etiqueta: PropTypes.string,
};
