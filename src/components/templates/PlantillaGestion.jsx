import PropTypes from 'prop-types';
import EmblemaArbolQr from '../atoms/EmblemaArbolQr';
import { IconoVolver } from '../atoms/IconosInicio';
import PiePagina from '../molecules/PiePagina';
import BuscadorBarra from '../organisms/BuscadorBarra';

/**
 * Estructura común de las páginas de administración (individuos y fotos de
 * especies): barra de vidrio con la marca, volver al catálogo y el tema;
 * contenido y pie. `extras` va fuera del main (formularios y diálogos que se
 * abren encima).
 */
export default function PlantillaGestion({ etiqueta, children, extras = null }) {
  return (
    <div className="app">
      <a className="skip-link" href="#app-main">Saltar al contenido</a>

      <header className="galeria-header gestion-header">
        <a className="gestion-inicio" href="#/" aria-label="PlantaQR, ir al inicio" title="Ir al inicio">
          <EmblemaArbolQr clase="home-marca-icono" />
        </a>
        <BuscadorBarra />
        <div className="gestion-header-acciones">
          <a className="gestion-volver" href="#/galeria" aria-label="Volver al catálogo">
            <IconoVolver />
            <span>Catálogo</span>
          </a>
        </div>
      </header>

      <main id="app-main" className="app-main gestion-main" aria-label={etiqueta}>
        {children}
      </main>

      <PiePagina />
      {extras}
    </div>
  );
}

PlantillaGestion.propTypes = {
  /** Nombre accesible del contenido. */
  etiqueta: PropTypes.string.isRequired,
  children: PropTypes.node,
  extras: PropTypes.node,
};
