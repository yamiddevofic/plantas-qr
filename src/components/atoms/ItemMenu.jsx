import PropTypes from 'prop-types';

/**
 * Ítem de menú: botón de línea completa con icono opcional, etiqueta y
 * descripción. Si se usa como toggler, expone `aria-expanded`/`aria-controls`
 * (la etiqueta debe reflejar el estado: "Ver filtros" / "Ocultar filtros").
 */
export default function ItemMenu({
  icono,
  etiqueta,
  descripcion,
  onClick,
  disabled = false,
  expandido,
  controles,
  pulsado,
}) {
  return (
    <li>
      <button
        type="button"
        className="menu-item"
        onClick={onClick}
        disabled={disabled}
        aria-expanded={expandido}
        aria-controls={controles}
        aria-pressed={pulsado}
      >
        {icono && (
          <span className="menu-item-icono" aria-hidden="true">
            {icono}
          </span>
        )}
        <span className="menu-item-texto">
          <span className="menu-item-etiqueta">{etiqueta}</span>
          {descripcion && <span className="menu-item-descripcion">{descripcion}</span>}
        </span>
      </button>
    </li>
  );
}

ItemMenu.propTypes = {
  /** Icono decorativo (SVG de react-icons). */
  icono: PropTypes.node,
  /** Texto principal del ítem. */
  etiqueta: PropTypes.string.isRequired,
  /** Línea secundaria explicativa. */
  descripcion: PropTypes.string,
  /** Acción al pulsar. */
  onClick: PropTypes.func.isRequired,
  /** Deshabilita el ítem (y comunica estado de operación en curso). */
  disabled: PropTypes.bool,
  /** Estado aria-expanded cuando el ítem expande/contrae contenido. */
  expandido: PropTypes.bool,
  /** id del contenido que controla (aria-controls). */
  controles: PropTypes.string,
  /** Estado pulsado (aria-pressed) para botones de alternancia. */
  pulsado: PropTypes.bool,
};