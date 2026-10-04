import PropTypes from 'prop-types';
import EmblemaArbolQr from './EmblemaArbolQr';

/**
 * Marca visual de PlantaQR: el emblema del inicio (árbol con su placa QR), el
 * mismo dibujo del ícono de la app. El tamaño lo pone el CSS mediante `clase`
 * (p. ej. .hero-brand-mark).
 */
export default function BrandMark({ clase = 'hero-brand-mark' }) {
  return (
    <span className={clase} aria-hidden="true">
      <EmblemaArbolQr />
    </span>
  );
}

BrandMark.propTypes = {
  /** Clase(s) que dimensionan la marca (p. ej. `.hero-brand-mark`). */
  clase: PropTypes.string,
};
