import PropTypes from 'prop-types';

/* Módulos sueltos del código QR (cuadrícula de 7×7, sin los tres marcadores). */
const MODULOS = [
  [4, 0], [3, 1], [4, 2], [3, 3], [0, 4], [2, 4], [4, 4], [6, 4],
  [1, 5], [3, 5], [5, 5], [4, 6], [6, 6], [5, 3], [6, 2],
];
const M = 3.4; // lado de un módulo
const O = 4.1; // margen de la placa

function Marcador({ x, y }) {
  return (
    <g transform={`translate(${O + x * M} ${O + y * M})`}>
      <rect width={M * 3} height={M * 3} rx="1.2" className="emblema-qr-modulo" />
      <rect x={M * 0.5} y={M * 0.5} width={M * 2} height={M * 2} rx="0.6" className="emblema-qr-placa" />
      <rect x={M} y={M} width={M} height={M} rx="0.4" className="emblema-qr-modulo" />
    </g>
  );
}

Marcador.propTypes = { x: PropTypes.number.isRequired, y: PropTypes.number.isRequired };

/**
 * Emblema animado del inicio: un árbol del parque que crece, mece la copa y
 * lleva colgada su placa con código QR, sobre la que pasa un haz de escaneo.
 * Resume el proyecto en un solo dibujo. Todo el color sale de tokens CSS
 * (inicio.css), así que se adapta solo al modo claro u oscuro.
 */
export default function EmblemaArbolQr({ clase = '', cargando = false }) {
  return (
    <svg
      className={`emblema ${clase}`.trim()}
      viewBox="0 0 160 160"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="emblema-halo" cx="80" cy="80" r="72" />
      <circle className="emblema-orbita" cx="80" cy="80" r="76" pathLength="100" />
      {/* Como cargador: un arco que recorre la órbita. */}
      {cargando && <circle className="emblema-arco" cx="80" cy="80" r="76" pathLength="100" />}

      <ellipse className="emblema-suelo" cx="80" cy="134" rx="40" ry="5" />

      <g className="emblema-arbol">
        <path
          className="emblema-tronco"
          d="M76 135c1.6-11 1.8-22 .4-33l-9-9 2.6-2.4 7.4 7.2c.3-3 .3-6 0-9h5.6c-.3 2.8-.3 5.7 0 8.6l8.2-8.4 2.6 2.4-10 10c-1.4 11.2-1.2 22.2.4 33.6z"
        />
        <g className="emblema-copa">
          <circle className="emblema-copa-b emblema-hoja-1" cx="54" cy="80" r="20" />
          <circle className="emblema-copa-b emblema-hoja-2" cx="106" cy="80" r="20" />
          <circle className="emblema-copa-c emblema-hoja-3" cx="80" cy="86" r="19" />
          <circle className="emblema-copa-a emblema-hoja-4" cx="80" cy="60" r="30" />
          <circle className="emblema-brillo" cx="69" cy="49" r="9" />
          <circle className="emblema-brillo" cx="51" cy="74" r="5" />
        </g>
      </g>

      {/* Hojitas que caen de la copa, en bucle. */}
      <g transform="translate(40 96)">
        <path className="emblema-hojita emblema-hojita-1" d="M0 0c4-3 9-2 10 0-1 3-6 4-10 0z" />
      </g>
      <g transform="translate(112 100)">
        <path className="emblema-hojita emblema-hojita-2" d="M0 0c4-3 9-2 10 0-1 3-6 4-10 0z" />
      </g>

      {/* Placa QR colgada de la rama derecha. */}
      <path className="emblema-cordel" d="M93 93c3 4 6 7 11 9" />
      <g className="emblema-etiqueta">
        <g transform="translate(100 100) rotate(-6)">
          <rect className="emblema-qr-placa emblema-qr-fondo" width="32" height="32" rx="5" />
          <Marcador x={0} y={0} />
          <Marcador x={4} y={0} />
          <Marcador x={0} y={4} />
          {MODULOS.map(([x, y]) => (
            <rect
              key={`${x}-${y}`}
              className="emblema-qr-modulo"
              x={O + x * M}
              y={O + y * M}
              width={M}
              height={M}
              rx="0.5"
            />
          ))}
          <rect className="emblema-haz" x="2" y="3" width="28" height="2.4" rx="1.2" />
          <path
            className="emblema-visor"
            d="M-4 4v-6a2 2 0 0 1 2-2h6M28-4h6a2 2 0 0 1 2 2v6M36 28v6a2 2 0 0 1-2 2h-6M4 36h-6a2 2 0 0 1-2-2v-6"
          />
        </g>
      </g>
    </svg>
  );
}

EmblemaArbolQr.propTypes = {
  /** Clase extra para dimensionar el emblema desde el consumidor. */
  clase: PropTypes.string,
  /** Añade el arco giratorio de carga alrededor del emblema. */
  cargando: PropTypes.bool,
};
