import PropTypes from 'prop-types';

/**
 * Logo oficial de PlantaQR (árbol con raíces y "PLANTA QR" en un escudo), el
 * mismo de las diapositivas y del ícono de la app. Se genera con
 * `npm run generar-iconos`. El tamaño lo pone el CSS mediante `clase`.
 * Sin `alt` es decorativo (la marca ya se nombra en el texto de al lado).
 */
export default function LogoPlantaQr({ clase = '', alt = '' }) {
  return (
    <img
      className={`logo-plantaqr ${clase}`.trim()}
      src="/logo-plantaqr.webp"
      width="320"
      height="320"
      alt={alt}
      aria-hidden={alt ? undefined : 'true'}
      decoding="async"
      draggable="false"
    />
  );
}

LogoPlantaQr.propTypes = {
  /** Clase(s) que dimensionan el logo. */
  clase: PropTypes.string,
  /** Texto alternativo; vacío lo deja como decorativo. */
  alt: PropTypes.string,
};
