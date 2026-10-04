/**
 * Fondo del hero del inicio, dibujado por completo en SVG: cielo con nubes (día)
 * o estrellas (noche), sol o luna asomando tras la cordillera, montañas andinas
 * en capas con neblina, y en primer plano árboles del parque (palma de cera,
 * araucaria, cipreses), aves y luciérnagas. Los colores son tokens CSS
 * (inicio.css): el mismo dibujo sirve para el modo claro y el oscuro.
 */

/* Curva suave que pasa por los puntos (Catmull-Rom → Bézier) y cierra por abajo. */
function colina(puntos, base = 360) {
  let d = `M${puntos[0][0]} ${puntos[0][1]}`;
  for (let i = 0; i < puntos.length - 1; i += 1) {
    const p0 = puntos[i - 1] ?? puntos[i];
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    const p3 = puntos[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  const ultimo = puntos[puntos.length - 1][0];
  return `${d} L${ultimo} ${base} L${puntos[0][0]} ${base} Z`;
}

const CORDILLERA =
  'M0 200 L70 172 L130 186 L215 132 L290 168 L360 146 L455 98 L540 150 L615 124 L700 160 L790 112 L860 150 L930 128 L1010 84 L1100 146 L1180 118 L1265 158 L1350 122 L1440 150 L1440 360 L0 360 Z';

const MONTES = colina([
  [0, 236], [130, 204], [260, 226], [390, 186], [520, 218], [660, 178], [800, 212],
  [940, 188], [1080, 222], [1220, 180], [1340, 208], [1440, 194],
]);

const LOMAS = colina([
  [0, 276], [170, 250], [340, 270], [500, 246], [700, 268], [900, 242], [1100, 264],
  [1280, 246], [1440, 262],
]);

const SUELO = colina([
  [0, 312], [200, 298], [420, 310], [640, 300], [860, 314], [1080, 298], [1300, 308], [1440, 300],
]);

const PRADO = colina([
  [0, 346], [240, 334], [520, 342], [800, 332], [1080, 344], [1300, 336], [1440, 340],
]);

/* Cipreses pequeños sobre las lomas: [x, y de la base, alto]. */
const CIPRESES_LEJANOS = [
  [96, 262, 22], [118, 258, 30], [436, 256, 24], [462, 252, 34], [742, 262, 20],
  [1004, 250, 28], [1030, 254, 20], [1356, 254, 26], [1380, 256, 18],
];

/* Generador determinista: las estrellas no cambian de sitio entre renders. */
function aleatorio(semilla) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const azar = aleatorio(42);
const ESTRELLAS = Array.from({ length: 70 }, () => ({
  x: Math.round(azar() * 1440),
  y: Math.round(azar() * 560),
  r: +(0.6 + azar() * 1.3).toFixed(2),
  retraso: +(azar() * 5).toFixed(2),
}));

const LUCIERNAGAS = [
  [470, 262], [560, 248], [612, 286], [700, 276], [790, 292], [880, 258], [958, 284],
  [1060, 270], [380, 284], [230, 270], [1230, 264], [1320, 286],
];

function Cipres({ x, base, alto, clase }) {
  const ancho = alto * 0.32;
  return (
    <path
      className={clase}
      d={`M${x} ${base - alto} C${x + ancho * 0.7} ${base - alto * 0.55} ${x + ancho} ${base - alto * 0.2} ${x + ancho * 0.55} ${base} L${x - ancho * 0.55} ${base} C${x - ancho} ${base - alto * 0.2} ${x - ancho * 0.7} ${base - alto * 0.55} ${x} ${base - alto} Z`}
    />
  );
}

function Nube({ x, y, escala = 1, clase = '' }) {
  return (
    <g className={`paisaje-nube ${clase}`}>
      <g transform={`translate(${x} ${y}) scale(${escala})`}>
        <path d="M0 40c0-12 10-20 22-20 4-12 15-20 28-20 15 0 27 10 30 24 2-1 5-1 7-1 11 0 19 8 19 17z" />
      </g>
    </g>
  );
}

export default function PaisajeHero() {
  return (
    <div className="paisaje" aria-hidden="true">
      {/* Cielo: estrellas, nubes y aves. Cubre todo el hero. */}
      <svg className="paisaje-cielo" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">
        <g className="paisaje-estrellas">
          {ESTRELLAS.map((e, i) => (
            <circle
              key={i}
              cx={e.x}
              cy={e.y}
              r={e.r}
              style={{ animationDelay: `${e.retraso}s` }}
            />
          ))}
        </g>
        <Nube x={150} y={150} escala={1.5} clase="paisaje-nube-1" />
        <Nube x={560} y={96} escala={0.9} clase="paisaje-nube-2" />
        <Nube x={830} y={330} escala={1.1} clase="paisaje-nube-3" />
        <Nube x={1150} y={210} escala={1.3} clase="paisaje-nube-1" />
      </svg>

      {/* Tierra: cordillera, lomas y árboles, anclada al borde inferior. */}
      <svg className="paisaje-tierra" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" focusable="false">
        <defs>
          <linearGradient id="paisaje-niebla" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="paisaje-niebla-0" />
            <stop offset="1" className="paisaje-niebla-1" />
          </linearGradient>
          <radialGradient id="paisaje-resplandor">
            <stop offset="0" className="paisaje-resplandor-0" />
            <stop offset="1" className="paisaje-resplandor-1" />
          </radialGradient>
        </defs>

        <g className="paisaje-astro">
          <circle cx="820" cy="118" r="110" fill="url(#paisaje-resplandor)" />
          <circle className="paisaje-astro-disco" cx="820" cy="118" r="42" />
          <g className="paisaje-crateres">
            <circle cx="806" cy="106" r="8" />
            <circle cx="834" cy="128" r="5.5" />
            <circle cx="826" cy="100" r="3" />
          </g>
        </g>

        <g className="paisaje-aves">
          <path className="paisaje-ave" d="M560 74q7-8 14 0q7-8 14 0" />
          <path className="paisaje-ave paisaje-ave-2" d="M598 92q5-6 10 0q5-6 10 0" />
          <path className="paisaje-ave paisaje-ave-3" d="M532 98q5-5 9 0q5-5 9 0" />
        </g>

        <path className="paisaje-capa-1" d={CORDILLERA} />
        <rect className="paisaje-neblina" x="0" y="120" width="1440" height="150" fill="url(#paisaje-niebla)" />
        <path className="paisaje-capa-2" d={MONTES} />
        <path className="paisaje-capa-3" d={LOMAS} />
        {CIPRESES_LEJANOS.map(([x, base, alto]) => (
          <Cipres key={x} x={x} base={base} alto={alto} clase="paisaje-arbol-lejano" />
        ))}
        <path className="paisaje-capa-4" d={SUELO} />

        {/* Primer plano: árboles del parque, cada uno con su leve vaivén. */}
        <g className="paisaje-vaiven paisaje-vaiven-1">
          <Cipres x={170} base={306} alto={92} clase="paisaje-arbol" />
          <Cipres x={204} base={306} alto={64} clase="paisaje-arbol" />
        </g>

        {/* Palma de cera del Quindío */}
        <g className="paisaje-vaiven paisaje-vaiven-2">
          <path className="paisaje-tronco" d="M517 306c1-52 2-104 4-152h4c-1 50-1 102 0 152z" />
          <g className="paisaje-palma">
            <path d="M523 152c-16-6-36-4-50 8 16-4 32-4 50-8z" />
            <path d="M523 152c-12-12-30-18-46-14 16 2 31 7 46 14z" />
            <path d="M523 152c-2-16-12-28-24-34 9 10 16 21 24 34z" />
            <path d="M523 152c4-16 16-26 30-30-11 9-21 18-30 30z" />
            <path d="M523 152c14-10 34-12 48-6-16 0-32 2-48 6z" />
            <path d="M523 152c18-2 36 6 46 20-15-8-30-14-46-20z" />
          </g>
        </g>

        {/* Árbol de copa redonda */}
        <g className="paisaje-vaiven paisaje-vaiven-3">
          <path className="paisaje-tronco" d="M600 304c2-18 2-34 0-48h7c-2 14-2 30 0 48z" />
          <circle className="paisaje-arbol" cx="604" cy="242" r="30" />
          <circle className="paisaje-arbol" cx="582" cy="258" r="20" />
          <circle className="paisaje-arbol" cx="627" cy="256" r="22" />
        </g>

        {/* Araucaria */}
        <g className="paisaje-vaiven paisaje-vaiven-1">
          <path className="paisaje-tronco" d="M928 304c1-50 1-108 2-160h4c1 52 1 110 2 160z" />
          <g className="paisaje-arbol">
            <path d="M932 146c-8 4-14 6-24 6 10 3 18 2 24-1 6 3 14 4 24 1-10 0-16-2-24-6z" />
            <path d="M932 170c-12 6-24 8-38 8 14 4 28 2 38-2 10 4 24 6 38 2-14 0-26-2-38-8z" />
            <path d="M932 196c-16 6-32 10-50 10 18 5 36 3 50-2 14 5 32 7 50 2-18 0-34-4-50-10z" />
            <path d="M932 222c-20 7-40 11-60 11 22 5 44 3 60-3 16 6 38 8 60 3-20 0-40-4-60-11z" />
            <path d="M932 248c-22 7-44 11-66 11 24 5 48 3 66-3 18 6 42 8 66 3-22 0-44-4-66-11z" />
          </g>
        </g>

        <g className="paisaje-vaiven paisaje-vaiven-3">
          <path className="paisaje-tronco" d="M1228 304c2-16 2-30 0-42h7c-2 12-2 26 0 42z" />
          <circle className="paisaje-arbol" cx="1232" cy="246" r="26" />
          <circle className="paisaje-arbol" cx="1252" cy="262" r="18" />
          <circle className="paisaje-arbol" cx="1212" cy="262" r="17" />
        </g>

        <g className="paisaje-vaiven paisaje-vaiven-2">
          <Cipres x={1330} base={306} alto={104} clase="paisaje-arbol" />
          <Cipres x={1366} base={306} alto={70} clase="paisaje-arbol" />
        </g>

        <g className="paisaje-luciernagas">
          {LUCIERNAGAS.map(([x, y], i) => (
            <circle key={x} cx={x} cy={y} r="2.6" style={{ animationDelay: `${(i * 0.73) % 4}s` }} />
          ))}
        </g>

        {/* Prado del color de la página: el hero se funde con el contenido. */}
        <path className="paisaje-prado" d={PRADO} />
      </svg>
    </div>
  );
}
