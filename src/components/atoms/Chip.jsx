import PropTypes from 'prop-types';
import { IconoHoja } from './IconosInicio';

/** Etiqueta de un uso tradicional, con una hojita; entra escalonada según `indice`. */
export default function Chip({ children, indice = 0 }) {
  return (
    <li className="detalle-chip" style={{ '--i': indice }}>
      <IconoHoja />
      {children}
    </li>
  );
}

Chip.propTypes = {
  children: PropTypes.node,
  indice: PropTypes.number,
};
