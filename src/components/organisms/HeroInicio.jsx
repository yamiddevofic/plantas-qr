import { Fragment } from 'react';
import PropTypes from 'prop-types';
import Boton from '../atoms/Boton';
import { IconoBajar, IconoFlecha, IconoUbicacion } from '../atoms/IconosInicio';
import FotosHero from './FotosHero';
import BuscadorInicio from './BuscadorInicio';
import { irAElemento } from '../../desplazamiento';

/* El titular entra palabra por palabra; la segunda línea va en cursiva serif. */
const LINEA_1 = ['Cada', 'árbol,'];
const LINEA_2 = ['una', 'historia'];

/**
 * Hero de la página de inicio: fotos del parque de fondo (con un velo oscuro
 * para que el texto contraste), el mensaje del proyecto y los llamados a la
 * acción.
 */
export default function HeroInicio({ onConocerProyecto, plantas = null }) {
  return (
    <header className="hero-inicio hero-con-fotos">
      <FotosHero />

      <div className="hero-inicio-contenido">
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

      {/* Botón y no enlace: un href="#..." cambiaría el hash y el router lo tomaría por una ruta. */}
      <button
        type="button"
        className="hero-inicio-bajar"
        aria-label="Ir a cómo funciona"
        onClick={() => irAElemento('como-funciona')}
      >
        <IconoBajar />
      </button>
    </header>
  );
}

HeroInicio.propTypes = {
  /** Navega hasta la sección del proyecto (scroll suave). */
  onConocerProyecto: PropTypes.func.isRequired,
  /** Catálogo para el buscador de móvil; null mientras carga. */
  plantas: PropTypes.arrayOf(PropTypes.object),
};
