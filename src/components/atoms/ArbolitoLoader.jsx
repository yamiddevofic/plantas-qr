import PropTypes from 'prop-types';
import LogoPlantaQr from './LogoPlantaQr';

/**
 * Cargador de la app: el logo de PlantaQR respirando, una barra fina
 * indeterminada y el texto con puntos animados. Úsalo
 * dentro de un contenedor (por defecto) o a pantalla completa con `pantallaCompleta`.
 *
 * El tamaño se delega al CSS (clases .arbolito-carga-*) y el color sale de los
 * tokens del tema, así que funciona en modo claro y oscuro.
 */
export default function ArbolitoLoader({
  etiqueta = 'Cargando…',
  pantallaCompleta = false,
  clase = '',
}) {
  const raiz = `arbolito-carga${pantallaCompleta ? ' arbolito-carga-pantalla' : ''}`;
  // Los puntos suspensivos los pone la animación.
  const texto = etiqueta.replace(/(…|\.\.\.)$/, '');

  return (
    <div className={clase ? `${raiz} ${clase}`.trim() : raiz} role="status" aria-live="polite">
      <LogoPlantaQr clase="arbolito-carga-logo" />
      <span className="carga-barra" aria-hidden="true" />
      {texto && (
        <p className="arbolito-carga-texto">
          {texto}
          <span className="arbolito-carga-puntos" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
        </p>
      )}
    </div>
  );
}

ArbolitoLoader.propTypes = {
  /** Texto breve bajo el logo (p. ej. "Cargando catálogo"). Vacío lo oculta. */
  etiqueta: PropTypes.string,
  /** Muestra el cargador como capa fija a pantalla completa. */
  pantallaCompleta: PropTypes.bool,
  /** Clase(s) adicionales para dimensionar o ajustar desde el consumidor. */
  clase: PropTypes.string,
};
