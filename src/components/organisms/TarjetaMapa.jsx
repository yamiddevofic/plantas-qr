import PropTypes from 'prop-types';
import { LuMap } from 'react-icons/lu';

/**
 * Botón «Ver mapa»: abre la página del mapa (#/mapa). `href` lleva a todos los
 * árboles o, desde la ficha, a los de una especie.
 */
export default function TarjetaMapa({ id, href, etiqueta = 'Ver mapa', descripcion }) {
  return (
    <div className="boton-mapa-fila">
      <a id={id} className="boton-mapa" href={href} aria-label={descripcion ? `${etiqueta}: ${descripcion}` : etiqueta}>
        <LuMap aria-hidden="true" />
        {etiqueta}
      </a>
    </div>
  );
}

TarjetaMapa.propTypes = {
  /** id del enlace (para pruebas y anclas). */
  id: PropTypes.string,
  href: PropTypes.string.isRequired,
  etiqueta: PropTypes.string,
  /** Texto extra para lectores de pantalla, p. ej. cuántos árboles hay. */
  descripcion: PropTypes.string,
};
