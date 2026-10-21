import PropTypes from 'prop-types';
import LogoPlantaQr from '../atoms/LogoPlantaQr';

/**
 * Pantalla de carga entre páginas (ver App.jsx): fondo liso, el logo de
 * PlantaQR respirando, una barra fina indeterminada y el texto.
 */
export default function SplashCarga({ etiqueta = 'Cargando…' }) {
  const texto = etiqueta.replace(/(…|\.\.\.)$/, '');
  return (
    <div className="hero-splash" role="status" aria-live="polite">
      <div className="hero-splash-contenido">
        <LogoPlantaQr clase="hero-splash-logo" />
        <span className="carga-barra" aria-hidden="true" />
        <p className="arbolito-carga-texto">
          {texto}
          <span className="arbolito-carga-puntos" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
        </p>
      </div>
    </div>
  );
}

SplashCarga.propTypes = {
  /** Texto breve bajo el logo (p. ej. "Cargando catálogo"). */
  etiqueta: PropTypes.string,
};
