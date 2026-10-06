// Capas, popup y utilidades de MapLibre para el mapa de individuos. No importa
// MapLibre: recibe `map` y `lib` ya cargados para mantener el chunk diferido.

export const FUENTE = 'individuos';
const FUENTE_TERRENO = 'terreno';
// MapLibre recomienda no compartir la fuente DEM entre terreno y sombreado.
const FUENTE_SOMBRA = 'terreno-sombra';
const CAPA_SOMBRA = 'terreno-sombreado';
export const CAPA_PUNTOS = 'individuos-puntos';
const CAPA_ETIQUETAS = 'individuos-etiquetas';
// Vista con la que abre el mapa de la ficha: sobre el parque, con el este hacia arriba
// (bearing 90), inclinada (pitch 55) para ver el parque en perspectiva, y un zoom
// en el que la escala marca 20 m en unos 65 px.
export const VISTA_INICIAL = { center: [-72.6645375, 7.1384873], zoom: 18, bearing: 90, pitch: 55 };

// Desplazamiento vertical (px) para centrar en pantalla el bloque punto + popup:
// el popup se abre por encima del punto (anchor bottom), así que el punto baja la
// mitad de ese bloque. Se limita para que el popup no se salga por arriba.
export function desplazamientoSeleccion(map, popup, separacion = 18) {
  const alto = map.getContainer().clientHeight;
  const altoPopup = popup?.getElement()?.offsetHeight ?? 0;
  return Math.max(0, Math.min((altoPopup + separacion) / 2, alto / 2 - 24));
}

// Cámara al activar el relieve: algo más lejos e inclinada para que entren las
// laderas que rodean el casco urbano.
export const CAMARA_3D = { pitch: 65, bearing: -25, zoomMax: 16.2 };

const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

export function prefiereMenosMovimiento() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// Un color por especie, igual en el mapa general y en el de la ficha. Verdes,
// naranjas, amarillos y azules; todos se leen sobre la foto aérea con el borde
// blanco de los puntos.
export const PALETA_ESPECIES = [
  '#52b788', '#f4a261', '#ffd166', '#4ea8de',
  '#95d5b2', '#e76f51', '#f9c74f', '#90e0ef',
  '#2d6a4f', '#fb8500', '#e9c46a', '#3a86ff',
  '#74c69d', '#ff9f1c', '#ffe066', '#48cae4',
  '#40916c', '#d9622b', '#ffba08', '#2a9df4',
  '#d9ed92', '#f79d65', '#f1fa8c', '#5390d9',
];

/**
 * Color de una especie, derivado de su id (hash FNV-1a): es el mismo en el mapa
 * general y en la ficha sin que esta conozca las demás especies. Con más
 * especies que colores, algunas comparten tono.
 */
export function colorDeEspecie(id) {
  let h = 2166136261;
  for (const c of String(id)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return PALETA_ESPECIES[(h >>> 0) % PALETA_ESPECIES.length];
}

/**
 * Añade a cada individuo el color y el nombre de su especie (propiedades planas:
 * MapLibre no lee objetos anidados en las expresiones) y devuelve la leyenda,
 * con las especies ordenadas por nombre.
 */
export function colorearPorEspecie(coleccion) {
  const especies = new Map();
  for (const f of coleccion?.features ?? []) {
    const especie = f.properties.especie;
    if (!especie?._id) continue;
    const previa = especies.get(especie._id);
    if (previa) previa.total += 1;
    else especies.set(especie._id, { id: especie._id, nombre: especie.nombre?.comun || 'Especie sin nombre', total: 1 });
  }
  const leyenda = [...especies.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  leyenda.forEach((e) => { e.color = colorDeEspecie(e.id); });
  const colores = new Map(leyenda.map((e) => [e.id, e.color]));
  return {
    coleccion: {
      ...coleccion,
      features: (coleccion?.features ?? []).map((f) => {
        const color = colores.get(f.properties.especie?._id);
        return color ? { ...f, properties: { ...f.properties, color } } : f;
      }),
    },
    leyenda,
  };
}

// Las capas de MapLibre no entienden var(--x): se leen los tokens al pintar para
// que los puntos sigan la paleta del tema activo.
function token(nombre, alternativo) {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim() || alternativo;
}

export function detalleIndividuo({ altitudMsnm, precisionGpsM }) {
  const partes = [];
  if (altitudMsnm != null) partes.push(`${numero.format(altitudMsnm)} msnm`);
  if (precisionGpsM != null) partes.push(`precisión GPS ±${numero.format(precisionGpsM)} m`);
  return partes.join(' · ');
}

// Contenido de los popups con nodos DOM (textContent), nunca HTML interpolado.
// Estructura común: foto a todo el ancho arriba y un cuerpo con los textos.

function crearNodo(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  nodo.className = clase;
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

function armarPopup(foto, alt, clase) {
  const raiz = crearNodo('div', `mapa-popup ${clase}`.trim());
  if (foto) {
    const imagen = crearNodo('img', 'mapa-popup-imagen');
    imagen.src = foto;
    imagen.alt = alt;
    // El popup solo existe cuando ya se abrió el individuo: cargar de inmediato.
    imagen.loading = 'eager';
    imagen.decoding = 'async';
    imagen.addEventListener('error', () => {
      imagen.remove();
      raiz.classList.add('mapa-popup-sin-foto');
    }, { once: true });
    raiz.append(imagen);
  } else {
    raiz.classList.add('mapa-popup-sin-foto');
  }
  const cuerpo = crearNodo('div', 'mapa-popup-cuerpo');
  raiz.append(cuerpo);
  return { raiz, cuerpo };
}

function agregarEnlace(cuerpo, enlace) {
  const ir = crearNodo('a', 'mapa-popup-enlace', 'Ver ficha de la especie');
  ir.href = enlace;
  ir.append(crearNodo('span', 'mapa-popup-enlace-flecha', '→'));
  cuerpo.append(ir);
}

/** Popup de la ficha: el individuo (su foto, código y datos del GPS). */
export function contenidoPopup(props, nombreEspecie, { enlace = null } = {}) {
  const { raiz, cuerpo } = armarPopup(props.imagen, `Fotografía del árbol ${props.codigoArbol}`, '');
  cuerpo.append(crearNodo('p', 'mapa-popup-titulo', props.codigoArbol));
  if (nombreEspecie) cuerpo.append(crearNodo('p', 'mapa-popup-subtitulo', nombreEspecie));
  const detalle = detalleIndividuo(props);
  if (detalle) cuerpo.append(crearNodo('p', 'mapa-popup-detalle', detalle));
  if (enlace) agregarEnlace(cuerpo, enlace);
  return raiz;
}

/**
 * Popup del mapa general: el individuo tocado (su foto y su código o, si no
 * tiene, el nombre de la especie) y el botón a la ficha de su especie.
 */
export function contenidoPopupEspecie(props, especie, { enlace = null } = {}) {
  const nombre = especie?.nombre?.comun || 'Especie sin nombre';
  const codigo = props.codigoArbol;
  const { raiz, cuerpo } = armarPopup(
    props.imagen || especie?.imagen,
    codigo ? `Fotografía del árbol ${codigo}` : `Fotografía de ${nombre}`,
    'mapa-popup-de-especie',
  );
  const titulo = crearNodo('p', 'mapa-popup-titulo');
  if (props.color) {
    const punto = crearNodo('span', 'mapa-popup-color');
    punto.style.background = props.color;
    titulo.append(punto);
  }
  titulo.append(document.createTextNode(codigo || nombre));
  cuerpo.append(titulo);
  if (codigo) cuerpo.append(crearNodo('p', 'mapa-popup-subtitulo', nombre));
  if (especie?.nombre?.cientifico) cuerpo.append(crearNodo('p', 'mapa-popup-cientifico', especie.nombre.cientifico));
  if (enlace) agregarEnlace(cuerpo, enlace);
  return raiz;
}

/**
 * El individuo bajo `punto` (píxeles del lienzo), con un margen de `radio` px
 * alrededor para que tocar con el dedo no exija precisión; si hay varios, el
 * más cercano al toque.
 */
export function individuoEn(map, punto, radio = 16) {
  if (!map.getLayer(CAPA_PUNTOS)) return null;
  const caja = [[punto.x - radio, punto.y - radio], [punto.x + radio, punto.y + radio]];
  let mejor = null;
  for (const f of map.queryRenderedFeatures(caja, { layers: [CAPA_PUNTOS] })) {
    const p = map.project(f.geometry.coordinates);
    const d = (p.x - punto.x) ** 2 + (p.y - punto.y) ** 2;
    if (!mejor || d < mejor.d) mejor = { f, d };
  }
  return mejor?.f ?? null;
}

// Durante un setStyle la fuente desaparece unos instantes; sin esta guarda
// setFeatureState lanzaría "source not found".
export function marcar(map, id, seleccionado) {
  if (id && map?.getSource(FUENTE)) map.setFeatureState({ source: FUENTE, id }, { seleccionado });
}

/** Resalta (o no) el individuo bajo el cursor. */
export function resaltar(map, id, activo) {
  if (id && map?.getSource(FUENTE)) map.setFeatureState({ source: FUENTE, id }, { hover: activo });
}

export function mapaEnPantallaCompleta(map) {
  const elementoPantallaCompleta = document.fullscreenElement || document.webkitFullscreenElement;
  return elementoPantallaCompleta === map.getContainer()
    || map.getContainer().classList.contains('maplibregl-pseudo-fullscreen');
}

// Radio base de los puntos por zoom (normal y seleccionado). La animación lo
// multiplica por un factor (entrada) y el halo lo usa para su pulso.
const RADIO = { z14: 4.5, z19: 11, z14Sel: 7, z19Sel: 15 };
const CAPA_HALO = 'individuos-halo';

function radioPuntos(factor = 1, extra = 0) {
  const sel = ['boolean', ['feature-state', 'seleccionado'], false];
  const hover = ['boolean', ['feature-state', 'hover'], false];
  const en = (normal, seleccionado) => ['*', factor, ['+', extra, ['case', sel, seleccionado, hover, normal * 1.3, normal]]];
  return ['interpolate', ['linear'], ['zoom'], 14, en(RADIO.z14, RADIO.z14Sel), 19, en(RADIO.z19, RADIO.z19Sel)];
}

export function agregarCapas(map, datos, base) {
  if (map.getSource(FUENTE)) return;
  const sobreSatelite = base === 'satelite';
  // Sobre la foto aérea el verde bosque se pierde entre la vegetación: se usa
  // menta clara y etiquetas blancas.
  const relleno = sobreSatelite ? '#b7e4c7' : token('--forest-700', '#2d6a4f');
  const texto = sobreSatelite ? '#ffffff' : token('--ink-900', '#1f2a24');
  const halo = sobreSatelite ? 'rgba(15, 22, 18, 0.85)' : token('--surface', '#ffffff');
  const seleccionado = ['boolean', ['feature-state', 'seleccionado'], false];
  // Mapa general: el color de la especie. En la ficha, menta/verde y naranja al
  // seleccionar.
  const color = ['case', ['has', 'color'], ['get', 'color'], seleccionado, token('--clay-500', '#c2653c'), relleno];

  map.addSource(FUENTE, { type: 'geojson', data: datos, promoteId: 'id' });
  // Halo que late alrededor de cada punto (más fuerte en el seleccionado).
  map.addLayer({
    id: CAPA_HALO,
    type: 'circle',
    source: FUENTE,
    paint: {
      'circle-color': color,
      'circle-radius': radioPuntos(1, 4),
      'circle-opacity': ['case', seleccionado, 0.35, 0],
      'circle-pitch-alignment': 'map',
    },
  });
  map.addLayer({
    id: CAPA_PUNTOS,
    type: 'circle',
    source: FUENTE,
    paint: {
      'circle-color': color,
      'circle-radius': radioPuntos(),
      // Borde blanco con una sombra oscura difusa debajo (circle-blur no aplica al
      // borde, así que la sombra la da el halo): se lee sobre foto y sobre calles.
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': ['case', seleccionado, 3.5, 2.5],
      'circle-stroke-opacity': 0.95,
      // Con la cámara inclinada los puntos se ven como discos sobre el suelo.
      'circle-pitch-alignment': 'map',
    },
  });
  map.addLayer({
    id: CAPA_ETIQUETAS,
    type: 'symbol',
    source: FUENTE,
    minzoom: 17.5,
    layout: {
      'text-field': ['get', 'codigoArbol'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-offset': [0, 1.5],
      'text-anchor': 'top',
    },
    paint: { 'text-color': texto, 'text-halo-color': halo, 'text-halo-width': 1.5 },
  });
}

const salidaRebote = (t) => {
  const c = 1.70158;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

/**
 * Anima los puntos: aparecen con un pequeño rebote y un halo late alrededor de
 * cada uno (suave en todos, marcado en el seleccionado). Solo corre mientras el
 * mapa está en pantalla y sin «reducir movimiento». Devuelve la función que la
 * detiene.
 */
export function animarPuntos(map) {
  if (prefiereMenosMovimiento()) return () => {};
  const PERIODO = 2200;
  const ENTRADA = 650;
  let inicio = null;
  let cuadro = 0;
  let ultimo = 0;
  let enPantalla = true;
  let entradaHecha = false;
  const seleccionado = ['boolean', ['feature-state', 'seleccionado'], false];

  const paso = (ahora) => {
    cuadro = requestAnimationFrame(paso);
    if (!enPantalla || ahora - ultimo < 33) return; // ~30 cuadros por segundo
    ultimo = ahora;
    if (!map.getLayer(CAPA_PUNTOS) || !map.getLayer(CAPA_HALO)) return; // cambiando de estilo
    inicio ??= ahora;
    const t = ahora - inicio;
    const entrada = t < ENTRADA ? Math.max(0.01, salidaRebote(t / ENTRADA)) : 1;
    const pulso = (t % PERIODO) / PERIODO;
    if (!entradaHecha) {
      map.setPaintProperty(CAPA_PUNTOS, 'circle-radius', radioPuntos(entrada));
      entradaHecha = entrada === 1;
    }
    map.setPaintProperty(CAPA_HALO, 'circle-radius', radioPuntos(entrada * (1 + pulso * 1.2), 2));
    map.setPaintProperty(CAPA_HALO, 'circle-opacity', ['case', seleccionado, 0.55 * (1 - pulso), 0.28 * (1 - pulso)]);
  };
  cuadro = requestAnimationFrame(paso);

  const observador = 'IntersectionObserver' in window
    ? new IntersectionObserver(([e]) => { enPantalla = e.isIntersecting; })
    : null;
  observador?.observe(map.getContainer());
  // Tras cambiar de estilo las capas son nuevas: se repite la entrada.
  const reiniciar = () => { inicio = null; entradaHecha = false; };
  map.on('style.load', reiniciar);

  return () => {
    cancelAnimationFrame(cuadro);
    observador?.disconnect();
    map.off('style.load', reiniciar);
  };
}

export function aplicarRelieve(map, lib, activo, base) {
  if (!map.getSource(FUENTE)) return; // estilo aún cargando: style.load lo aplicará
  if (activo) {
    if (!map.getSource(FUENTE_TERRENO)) map.addSource(FUENTE_TERRENO, lib.TERRENO);
    map.setTerrain({ source: FUENTE_TERRENO, exaggeration: lib.EXAGERACION_TERRENO });
    map.setSky(lib.CIELO);
    // El sombreado da lectura de volumen al mapa vectorial; sobre la foto aérea
    // solo la oscurecería.
    if (base === 'mapa' && !map.getLayer(CAPA_SOMBRA)) {
      if (!map.getSource(FUENTE_SOMBRA)) map.addSource(FUENTE_SOMBRA, lib.TERRENO);
      map.addLayer({
        id: CAPA_SOMBRA,
        type: 'hillshade',
        source: FUENTE_SOMBRA,
        paint: { 'hillshade-exaggeration': 0.35, 'hillshade-shadow-color': '#173f2f' },
      }, CAPA_HALO);
    }
  } else {
    map.setTerrain(null);
    map.setSky();
    if (map.getLayer(CAPA_SOMBRA)) map.removeLayer(CAPA_SOMBRA);
  }
}
