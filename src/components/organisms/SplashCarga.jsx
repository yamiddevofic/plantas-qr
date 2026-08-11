import PropTypes from 'prop-types';
import ArbolitoLoader from '../atoms/ArbolitoLoader';

/**
 * Splash de carga a pantalla completa: el arbolito que se rellena, el
 * texto breve y el nombre de la app. Se usa al entrar y en cada cambio
 * de página (ver App.jsx).
 */
export default function SplashCarga({ etiqueta = 'Cargando…' }) {
  return (
    <div className="hero-splash" role="status" aria-live="polite">
      <div className="hero-splash-contenido">
        <ArbolitoLoader etiqueta={etiqueta} />
        <p className="hero-splash-titulo">PlantaQR</p>
      </div>
    </div>
  );
}

SplashCarga.propTypes = {
  /** Texto breve bajo el arbolito (p. ej. "Cargando catálogo"). */
  etiqueta: PropTypes.string,
};