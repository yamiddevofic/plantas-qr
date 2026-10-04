import PropTypes from 'prop-types';
import { IconoCandado } from '../atoms/IconosInicio';
import PaisajeHero from './PaisajeHero';

/**
 * Encabezado de las páginas de administración, con el lenguaje de la galería:
 * paisaje SVG del parque, titular con acento serif, cifras en píldoras de
 * vidrio y la acción principal de la página. Más bajo que el de la galería
 * para llegar rápido a la lista.
 */
export default function HeroGestion({ id, titulo, acento, texto = null, cifras = null, accion = null, compacto = false }) {
  return (
    <header className={`hero-inicio hero-galeria hero-gestion${compacto ? ' hero-gestion-compacto' : ''}`}>
      <PaisajeHero />

      <div className="hero-inicio-contenido">
        <div className="hero-inicio-texto-bloque">
          <p className="hero-inicio-ubicacion">
            <IconoCandado />
            <span>Administración del parque</span>
          </p>

          <h1 id={id} className="hero-inicio-titulo">
            <span className="hero-inicio-palabra" style={{ '--i': 0 }}>{titulo}</span>{' '}
            <span className="hero-inicio-palabra hero-inicio-acento" style={{ '--i': 1 }}>{acento}</span>
          </h1>

          {texto && <p className="hero-inicio-texto">{texto}</p>}

          {cifras && (
            <ul className="hero-galeria-cifras" aria-label="Resumen">
              {cifras.map(({ Icono, valor, etiqueta }) => (
                <li key={etiqueta}>
                  <Icono />
                  <strong>{valor}</strong> {etiqueta}
                </li>
              ))}
            </ul>
          )}

          {accion && <div className="hero-gestion-accion">{accion}</div>}
        </div>
      </div>
    </header>
  );
}

HeroGestion.propTypes = {
  /** id del h1, para el aria-labelledby del contenido. */
  id: PropTypes.string.isRequired,
  /** Primera parte del titular, en sans. */
  titulo: PropTypes.string.isRequired,
  /** Palabra final del titular, en serif cursiva. */
  acento: PropTypes.string.isRequired,
  /** Párrafo bajo el titular; opcional. */
  texto: PropTypes.string,
  /** Píldoras de resumen: { Icono, valor, etiqueta }. Ocultas mientras carga. */
  cifras: PropTypes.arrayOf(
    PropTypes.shape({
      Icono: PropTypes.elementType.isRequired,
      valor: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      etiqueta: PropTypes.string.isRequired,
    }),
  ),
  /** Botón de la acción principal (p. ej. "Agregar individuo"). */
  accion: PropTypes.node,
  /** Versión más baja, para páginas que son sobre todo una lista. */
  compacto: PropTypes.bool,
};
