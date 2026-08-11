import PropTypes from 'prop-types';
import Hero from './Hero';

/**
 * Encabezado del catálogo (home). Envuelve <Hero> con los textos por
 * defecto del parque; todo es sobreescribible por prop para reutilizarlo
 * en otros parques o pantallas sin duplicar el componente.
 */
export default function EncabezadoApp({
  acciones,
  eyebrow,
  titulo = 'PlantaQR',
  subtitulo,
}) {
  return (
    <Hero
      acciones={acciones}
      corchete={eyebrow}
      titulo={titulo}
      subtitulo={subtitulo}
    />
  );
}

EncabezadoApp.propTypes = {
  /** Control accesible (p. ej. .menu-hamburguesa) en la esquina del hero. */
  acciones: PropTypes.node,
  /** Línea superior (eyebrow). */
  eyebrow: PropTypes.string,
  /** Título del hero (h1). */
  titulo: PropTypes.string,
  /** Bajada del hero. */
  subtitulo: PropTypes.string,
};