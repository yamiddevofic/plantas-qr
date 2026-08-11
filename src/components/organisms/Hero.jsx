import PropTypes from 'prop-types';
import BrandMark from '../atoms/BrandMark';

const VARIANTE_HOME = 'home';
const VARIANTE_DETALLE = 'detalle';

const CORCHETE_DEFAULT = 'Parque principal de Chitagá';
const SUBTITULO_DEFAULT =
  'Identifica cada árbol del parque y conoce su historia: escanea su código QR o explora el catálogo de especies.';

/**
 * Hero reutilizable del catálogo: banda de marca + texto sobreimpreso.
 *
 * - variante="home": banda sólida con la paleta del sistema (sin imagen,
 *   que vive en la sección "Conoce el parque") y contenido centrado.
 * - variante="detalle": recibe `media` (p. ej. <GaleriaFotos/>) como capa
 *   visual y texto inferior sobre la foto.
 *
 * Contrato de `acciones`: debe ser UN solo control enfocable (p. ej. un
 * `<button>`) que gestione su propio estado y exponga `aria-expanded` y
 * `aria-controls` si es un toggler, para no romper el árbol accesible.
 */
export default function Hero({
  variante = VARIANTE_HOME,
  acciones,
  marca = <BrandMark />,
  corchete = CORCHETE_DEFAULT,
  titulo,
  subtitulo = SUBTITULO_DEFAULT,
  media,
}) {
  const esHome = variante === VARIANTE_HOME;
  const raiz = esHome ? 'hero' : 'detalle-hero-full';
  const contenedorTexto = esHome ? 'hero-content' : 'detalle-hero-texto';
  const claseCorchete = esHome ? 'hero-eyebrow' : 'detalle-hero-eyebrow';
  const claseTitulo = esHome ? 'hero-title' : 'detalle-hero-nombre';
  const claseSubtitulo = esHome ? 'hero-subtitle' : 'detalle-hero-cientifico';

  return (
    <header className={raiz}>
      {!esHome && media}

      {acciones && <div className="hero-acciones">{acciones}</div>}

      <div className={contenedorTexto}>
        {esHome && marca}
        {corchete && <p className={claseCorchete}>{corchete}</p>}
        <h1 className={claseTitulo}>{titulo}</h1>
        {subtitulo && <p className={claseSubtitulo}>{subtitulo}</p>}
      </div>
    </header>
  );
}

Hero.propTypes = {
  /** 'home' (banda de marca + contenido centrado) o 'detalle' (media + texto inferior). */
  variante: PropTypes.oneOf([VARIANTE_HOME, VARIANTE_DETALLE]),
  /** Control accesible en la esquina superior derecha (ver contrato arriba). */
  acciones: PropTypes.node,
  /** Marca (hoja) del home; por defecto <BrandMark/>. */
  marca: PropTypes.node,
  /** Línea superior (eyebrow) sobre el título. */
  corchete: PropTypes.string,
  /** Título principal del hero (se renderiza como <h1>). */
  titulo: PropTypes.string.isRequired,
  /** Bajada bajo el título. */
  subtitulo: PropTypes.string,
  /** Capa visual para variante="detalle" (p. ej. <GaleriaFotos/>). */
  media: PropTypes.node,
};