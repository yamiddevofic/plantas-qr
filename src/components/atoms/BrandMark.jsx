import PropTypes from 'prop-types';
import { LuTreeDeciduous } from 'react-icons/lu';

/**
 * Marca visual del parque (hoja). El color se resuelve con tokens CSS
 * (--forest-700), de modo que sigue la paleta del sistema aunque el
 * proyecto cambie de tema o paleta. El dimensionado se delega al CSS
 * mediante `clase` (p. ej. .hero-brand-mark).
 */
export default function BrandMark({ clase = 'hero-brand-mark' }) {
  return <LuTreeDeciduous aria-hidden="true" className={clase} />;
}

BrandMark.propTypes = {
  /** Clase(s) que dimensionan el SVG (p. ej. `.hero-brand-mark`). */
  clase: PropTypes.string,
};