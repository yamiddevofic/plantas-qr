import PropTypes from 'prop-types';

/**
 * Iconos de línea propios del inicio (24×24, trazo 1.75). Heredan el color con
 * currentColor; las zonas `.icono-tinte` llevan un relleno suave del mismo tono.
 * Cada trazo usa pathLength=1 para poder "dibujarse" al aparecer (inicio.css).
 */
function Icono({ children, clase = '' }) {
  return (
    <svg
      className={`icono-inicio ${clase}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

Icono.propTypes = { children: PropTypes.node, clase: PropTypes.string };

const tipos = { clase: PropTypes.string };

/** Árbol con su placa QR colgada: "encuentra un árbol". */
export function IconoArbolPlaca({ clase }) {
  return (
    <Icono clase={clase}>
      <path className="icono-tinte" d="M11 3.5a5 5 0 0 0-4.6 7A4 4 0 0 0 9 17h4a4 4 0 0 0 2.6-6.5A5 5 0 0 0 11 3.5z" />
      <path className="trazo" pathLength="1" d="M11 3.5a5 5 0 0 0-4.6 7A4 4 0 0 0 9 17h4a4 4 0 0 0 2.6-6.5A5 5 0 0 0 11 3.5z" />
      <path className="trazo" pathLength="1" d="M11 21v-8M11 14l-2.5-2.5" />
      <path className="trazo" pathLength="1" d="M13 15.5l2.2 1.7" />
      <rect className="trazo" pathLength="1" x="15" y="16" width="6" height="6" rx="1.2" />
      <path className="trazo" pathLength="1" d="M17 18h.01M19 20h.01" />
    </Icono>
  );
}

/** Celular escaneando un código: "escanéalo". */
export function IconoEscanear({ clase }) {
  return (
    <Icono clase={clase}>
      <rect className="icono-tinte" x="6" y="2.5" width="12" height="19" rx="2.5" />
      <rect className="trazo" pathLength="1" x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path className="trazo" pathLength="1" d="M9.5 7.5h2v2h-2zM12.5 7.5h2v2h-2zM9.5 10.5h2v2h-2z" />
      <path className="trazo" pathLength="1" d="M13.5 12.5h1v1" />
      <path className="trazo icono-haz" pathLength="1" d="M3 15h18" />
      <path className="trazo" pathLength="1" d="M10.5 19h3" />
    </Icono>
  );
}

/** Hoja sobre una ficha: "descubre su historia". */
export function IconoFicha({ clase }) {
  return (
    <Icono clase={clase}>
      <path className="icono-tinte" d="M5 3.5h10l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20z" />
      <path className="trazo" pathLength="1" d="M5 3.5h10l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20z" />
      <path className="trazo" pathLength="1" d="M15 3.5V7.5h4" />
      <path className="trazo" pathLength="1" d="M8.5 17c0-4 2.5-6.5 6.5-6.5 0 4-2.5 6.5-6.5 6.5zM8.5 17l3-3" />
      <path className="trazo" pathLength="1" d="M8.5 7.5h3" />
    </Icono>
  );
}

/** Hoja: especies. */
export function IconoHoja({ clase }) {
  return (
    <Icono clase={clase}>
      <path className="icono-tinte" d="M4.5 19.5C4.5 10 10 4.5 19.5 4.5 19.5 14 14 19.5 4.5 19.5z" />
      <path className="trazo" pathLength="1" d="M4.5 19.5C4.5 10 10 4.5 19.5 4.5 19.5 14 14 19.5 4.5 19.5z" />
      <path className="trazo" pathLength="1" d="M4.5 19.5L14 10M9 15h4.5M9 15v-4.5" />
    </Icono>
  );
}

/** Ramas que se separan: familias botánicas. */
export function IconoFamilias({ clase }) {
  return (
    <Icono clase={clase}>
      <circle className="icono-tinte" cx="12" cy="5" r="2.5" />
      <circle className="trazo" pathLength="1" cx="12" cy="5" r="2.5" />
      <circle className="trazo" pathLength="1" cx="5" cy="19" r="2.5" />
      <circle className="trazo" pathLength="1" cx="12" cy="19" r="2.5" />
      <circle className="trazo" pathLength="1" cx="19" cy="19" r="2.5" />
      <path className="trazo" pathLength="1" d="M12 7.5v9M12 11c-4 0-7 1.5-7 5.5M12 11c4 0 7 1.5 7 5.5" />
    </Icono>
  );
}

/** Código QR. */
export function IconoQr({ clase }) {
  return (
    <Icono clase={clase}>
      <rect className="icono-tinte" x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect className="trazo" pathLength="1" x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect className="trazo" pathLength="1" x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect className="trazo" pathLength="1" x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <path className="trazo" pathLength="1" d="M13.5 13.5h3v3M20.5 13.5v.01M16.5 20.5h4v-4M13.5 17v3.5" />
    </Icono>
  );
}

/** Pin de ubicación con montaña: el parque. */
export function IconoUbicacion({ clase }) {
  return (
    <Icono clase={clase}>
      <path className="icono-tinte" d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
      <path className="trazo" pathLength="1" d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
      <path className="trazo" pathLength="1" d="M8.6 12l2.2-3 1.4 1.8 1-1.3 2.2 2.5" />
    </Icono>
  );
}

/** Ave en vuelo. */
export function IconoAve({ clase }) {
  return (
    <Icono clase={clase}>
      <path className="trazo" pathLength="1" d="M3 9c3-2 6-1.5 9 2 3-3.5 6-4 9-2" />
      <path className="trazo" pathLength="1" d="M7 15c2-1.2 3.6-1 5 .6 1.4-1.6 3-1.8 5-.6" />
    </Icono>
  );
}

/** Ardilla de cola esponjada. */
export function IconoArdilla({ clase }) {
  return (
    <Icono clase={clase}>
      <path className="icono-tinte" d="M9 20c-3.5 0-5.5-3-5-6.5C4.7 9 8.5 6.5 9 3.5c3 1 4.5 4 4 7.5" />
      <path className="trazo" pathLength="1" d="M9 20c-3.5 0-5.5-3-5-6.5C4.7 9 8.5 6.5 9 3.5c3 1 4.5 4 4 7.5" />
      <path className="trazo" pathLength="1" d="M9 20h8.5c.8 0 1-1 .5-1.5l-1.5-1.5c1.5-.5 2.5-1.8 2.5-3.5a3.5 3.5 0 0 0-3.5-3.5c-2.5 0-4 2-4 4.5V20" />
      <path className="trazo" pathLength="1" d="M17.5 9.5l.5-2M16 12.5h.01" />
    </Icono>
  );
}

/** Mariposa: polinizadores. */
export function IconoMariposa({ clase }) {
  return (
    <Icono clase={clase}>
      <path className="icono-tinte" d="M12 11C10 6 6.5 4 4 5s-1 6.5 3 7c-3 1-3.5 5-1 6s5-1.5 6-5.5c1 4 3.5 6.5 6 5.5s2-5-1-6c4-.5 5.5-6 3-7s-6 1-8 6z" />
      <path className="trazo" pathLength="1" d="M12 11C10 6 6.5 4 4 5s-1 6.5 3 7c-3 1-3.5 5-1 6s5-1.5 6-5.5c1 4 3.5 6.5 6 5.5s2-5-1-6c4-.5 5.5-6 3-7s-6 1-8 6z" />
      <path className="trazo" pathLength="1" d="M12 9v9M12 9l-1.5-3M12 9l1.5-3" />
    </Icono>
  );
}

/** Flecha hacia la derecha. */
export function IconoFlecha({ clase }) {
  return (
    <Icono clase={clase}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icono>
  );
}

/** Flecha hacia abajo (invitación a desplazarse). */
export function IconoBajar({ clase }) {
  return (
    <Icono clase={clase}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Icono>
  );
}

[
  IconoArbolPlaca, IconoEscanear, IconoFicha, IconoHoja, IconoFamilias, IconoQr,
  IconoUbicacion, IconoAve, IconoArdilla, IconoMariposa, IconoFlecha, IconoBajar,
].forEach((c) => { c.propTypes = tipos; });
