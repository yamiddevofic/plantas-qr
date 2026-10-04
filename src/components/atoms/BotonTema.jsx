import { useId } from 'react';
import { useTema } from '../../tema.js';

/**
 * Interruptor rápido de modo claro/oscuro: el sol recoge sus rayos y una
 * sombra lo convierte en luna (y al revés). Mismo estado que la opción del menú.
 */
export default function BotonTema() {
  const { tema, alternar } = useTema();
  const esOscuro = tema === 'oscuro';
  const idMascara = useId();

  return (
    <button
      type="button"
      className={`boton-tema${esOscuro ? ' es-oscuro' : ''}`}
      aria-pressed={esOscuro}
      aria-label="Modo oscuro"
      title={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onClick={alternar}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <mask id={idMascara}>
          <rect width="24" height="24" fill="#fff" />
          <circle className="boton-tema-sombra" cx="24" cy="2" r="6" fill="#000" />
        </mask>
        <circle className="boton-tema-astro" cx="12" cy="12" r="5" mask={`url(#${idMascara})`} />
        <g className="boton-tema-rayos">
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </g>
      </svg>
    </button>
  );
}
