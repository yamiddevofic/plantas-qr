import PropTypes from 'prop-types';
import { IconoArbolPlaca, IconoHoja } from '../atoms/IconosInicio';

const PESTANAS = [
  { id: 'especies', href: '#/especies', etiqueta: 'Especies', Icono: IconoHoja },
  { id: 'individuos', href: '#/individuos', etiqueta: 'Individuos', Icono: IconoArbolPlaca },
];

/** Cambia entre las dos partes del módulo de gestión: especies y sus árboles (individuos). */
export default function PestanasGestion({ actual }) {
  return (
    <nav className="gestion-pestanas" aria-label="Secciones de gestión">
      {PESTANAS.map(({ id, href, etiqueta, Icono }) => (
        <a key={id} href={href} className="gestion-pestana" aria-current={id === actual ? 'page' : undefined}>
          <Icono />
          {etiqueta}
        </a>
      ))}
    </nav>
  );
}

PestanasGestion.propTypes = {
  actual: PropTypes.oneOf(['especies', 'individuos']).isRequired,
};
