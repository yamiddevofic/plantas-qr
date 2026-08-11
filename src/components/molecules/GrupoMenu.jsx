import PropTypes from 'prop-types';

/**
 * Grupo de ítems dentro del menú: título de sección y lista de <ItemMenu>.
 */
export default function GrupoMenu({ titulo, children }) {
  return (
    <div className="menu-grupo">
      <p className="menu-grupo-titulo">{titulo}</p>
      <ul className="menu-grupo-lista">{children}</ul>
    </div>
  );
}

GrupoMenu.propTypes = {
  /** Título de la sección del menú. */
  titulo: PropTypes.string.isRequired,
  /** Ítems del grupo (ItemMenu). */
  children: PropTypes.node.isRequired,
};