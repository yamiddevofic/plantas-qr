import PropTypes from 'prop-types';
import LogoPlantaQr from './LogoPlantaQr';

/**
 * Marca visual de PlantaQR: el logo oficial, el mismo del ícono de la app. El
 * tamaño lo pone el CSS mediante `clase` (p. ej. .hero-brand-mark).
 */
export default function BrandMark({ clase = 'hero-brand-mark' }) {
  return (
    <span className={clase} aria-hidden="true">
      <LogoPlantaQr />
    </span>
  );
}

BrandMark.propTypes = {
  /** Clase(s) que dimensionan la marca (p. ej. `.hero-brand-mark`). */
  clase: PropTypes.string,
};
