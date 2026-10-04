import PropTypes from 'prop-types';
import BotonTema from '../atoms/BotonTema';
import EmblemaArbolQr from '../atoms/EmblemaArbolQr';
import { IconoVolver } from '../atoms/IconosInicio';
import PiePagina from '../molecules/PiePagina';
import HeroGestion from '../organisms/HeroGestion';

/**
 * Estructura común de las páginas de administración (individuos y fotos de
 * especies): barra de vidrio con la marca, volver al catálogo y el tema; hero
 * con el paisaje; contenido y pie. `extras` va fuera del main (formularios y
 * diálogos que se abren encima).
 */
export default function PlantillaGestion({ hero, children, extras = null }) {
  return (
    <div className="app">
      <a className="skip-link" href="#app-main">Saltar al contenido</a>

      <header className="galeria-header gestion-header">
        <a className="home-marca" href="#/" aria-label="PlantaQR, ir al inicio">
          <EmblemaArbolQr clase="home-marca-icono" />
          <span>PlantaQR</span>
        </a>
        <div className="gestion-header-acciones">
          <a className="gestion-volver" href="#/galeria" aria-label="Volver al catálogo">
            <IconoVolver />
            <span>Catálogo</span>
          </a>
          <BotonTema />
        </div>
      </header>

      <HeroGestion {...hero} />

      <main id="app-main" className="app-main gestion-main" aria-labelledby={hero.id}>
        {children}
      </main>

      <PiePagina />
      {extras}
    </div>
  );
}

PlantillaGestion.propTypes = {
  /** Props de HeroGestion. */
  hero: PropTypes.shape({ id: PropTypes.string.isRequired }).isRequired,
  children: PropTypes.node,
  extras: PropTypes.node,
};
