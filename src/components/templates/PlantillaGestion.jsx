import PropTypes from 'prop-types';
import EmblemaArbolQr from '../atoms/EmblemaArbolQr';
import { IconoVolver } from '../atoms/IconosInicio';
import PiePagina from '../molecules/PiePagina';
import BuscadorBarra from '../organisms/BuscadorBarra';
import HeroGestion from '../organisms/HeroGestion';

/**
 * Estructura común de las páginas de administración (individuos y fotos de
 * especies): barra de vidrio con la marca, volver al catálogo y el tema; hero
 * con el paisaje (opcional); contenido y pie. `extras` va fuera del main
 * (formularios y diálogos que se abren encima).
 */
export default function PlantillaGestion({ hero = null, etiqueta = '', children, extras = null }) {
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

      {hero && <HeroGestion {...hero} />}

      <main
        id="app-main"
        className={`app-main gestion-main${hero ? '' : ' gestion-main-sin-hero'}`}
        aria-labelledby={hero ? hero.id : undefined}
        aria-label={hero ? undefined : etiqueta}
      >
        {children}
      </main>

      <PiePagina />
      {extras}
    </div>
  );
}

PlantillaGestion.propTypes = {
  /** Props de HeroGestion; sin ellas la página no lleva hero. */
  hero: PropTypes.shape({ id: PropTypes.string.isRequired }),
  /** Nombre accesible del contenido cuando no hay hero. */
  etiqueta: PropTypes.string,
  children: PropTypes.node,
  extras: PropTypes.node,
};
