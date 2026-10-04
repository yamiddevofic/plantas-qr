import { Fragment } from 'react';
import PropTypes from 'prop-types';
import Boton from '../atoms/Boton';
import EmblemaArbolQr from '../atoms/EmblemaArbolQr';
import { IconoBajar, IconoFlecha, IconoUbicacion } from '../atoms/IconosInicio';
import PaisajeHero from './PaisajeHero';
import BuscadorInicio from './BuscadorInicio';

/* El titular entra palabra por palabra; la segunda línea va en cursiva serif. */
const LINEA_1 = ['Cada', 'árbol,'];
const LINEA_2 = ['una', 'historia'];

/**
 * Hero de la página de inicio: paisaje andino del parque dibujado en SVG (se
 * adapta al modo claro/oscuro), el emblema animado del árbol con su QR, el
 * mensaje del proyecto y los llamados a la acción.
 */
export default function HeroInicio({ onConocerProyecto, plantas = null }) {
  return (
    <header className="hero-inicio">
      <PaisajeHero />

      <div className="hero-inicio-contenido">
        <div className="hero-inicio-emblema">
          <EmblemaArbolQr />
        </div>

        <div className="hero-inicio-texto-bloque">
          <p className="hero-inicio-ubicacion">
            <IconoUbicacion />
            <span>Chitagá, Norte de Santander</span>
            <span className="hero-inicio-altitud">2.345 m s. n. m.</span>
          </p>

          <h1 className="hero-inicio-titulo">
            <span className="hero-inicio-linea">
              {LINEA_1.map((palabra, i) => (
                <Fragment key={palabra}>
                  <span className="hero-inicio-palabra" style={{ '--i': i }}>{palabra}</span>{' '}
                </Fragment>
              ))}
            </span>
            <span className="hero-inicio-linea hero-inicio-acento">
              {LINEA_2.map((palabra, i) => (
                <Fragment key={palabra}>
                  <span className="hero-inicio-palabra" style={{ '--i': i + LINEA_1.length }}>{palabra}</span>{' '}
                </Fragment>
              ))}
            </span>
          </h1>

          <p className="hero-inicio-texto">
            Escanea el código QR de cualquier árbol del parque y descubre su
            ficha: familia, origen, usos y estado de conservación.
          </p>

          {/* Solo móvil: en escritorio el buscador va junto al botón de menú (PaginaInicio). */}
          <div className="hero-inicio-buscador">
            <BuscadorInicio plantas={plantas} />
          </div>

          <div className="hero-inicio-acciones">
            <Boton enlace href="#/galeria" variante="primary" clase="hero-inicio-cta">
              Ver especies
              <IconoFlecha />
            </Boton>
            <button type="button" className="hero-inicio-secundario" onClick={onConocerProyecto}>
              El proyecto
            </button>
          </div>
        </div>
      </div>

      <a className="hero-inicio-bajar" href="#como-funciona" aria-label="Ir a cómo funciona">
        <IconoBajar />
      </a>
    </header>
  );
}

HeroInicio.propTypes = {
  /** Navega hasta la sección del proyecto (scroll suave). */
  onConocerProyecto: PropTypes.func.isRequired,
  /** Catálogo para el buscador de móvil; null mientras carga. */
  plantas: PropTypes.arrayOf(PropTypes.object),
};
