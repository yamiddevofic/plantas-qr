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
export const POSICION_SELECCION_Y = 0.45;

// Cámara al activar el relieve: algo más lejos e inclinada para que entren las
// laderas que rodean el casco urbano.
export const CAMARA_3D = { pitch: 65, bearing: -25, zoomMax: 16.2 };

const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

export function prefiereMenosMovimiento() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// Mapa general: un color por especie. Verdes, naranjas, amarillos y azules
// alternados para que especies vecinas en la lista no se parezcan; todos se
// leen sobre la foto aérea con el borde oscuro de los puntos.
export const PALETA_ESPECIES = [
  '#52b788', // verde
  '#f4a261', // naranja
  '#4ea8de', // azul
  '#ffd166', // amarillo
  '#95d5b2', // verde claro
  '#e76f51', // naranja rojizo
  '#90e0ef', // azul claro
  '#f9c74f', // amarillo dorado
  '#2d6a4f', // verde bosque
  '#fb8500', // naranja intenso
  '#3a86ff', // azul intenso
  '#d9ed92', // verde lima
];

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
  leyenda.forEach((e, i) => { e.color = PALETA_ESPECIES[i % PALETA_ESPECIES.length]; });
  const colores = new Map(leyenda.map((e) => [e.id, e.color]));
  return {
    coleccion: {
      ...coleccion,
      features: (coleccion?.features ?? [])
        .filter((f) => colores.has(f.properties.especie?._id))
        .map((f) => ({ ...f, properties: { ...f.properties, color: colores.get(f.properties.especie._id) } })),
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

/** Distancia en metros entre dos puntos [lng, lat] (haversine). */
export function distanciaMetros([lng1, lat1], [lng2, lat2]) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

/** El individuo más cercano a `punto` ([lng, lat]) y su distancia en metros. */
export function masCercano(features, punto) {
  let mejor = null;
  for (const feature of features) {
    const metros = distanciaMetros(punto, feature.geometry.coordinates);
    if (!mejor || metros < mejor.metros) mejor = { feature, metros };
  }
  return mejor;
}

export function textoDistancia(metros) {
  if (metros < 5) return 'Estás junto a este árbol';
  return metros < 1000 ? `A ${Math.round(metros)} m de ti` : `A ${numero.format(metros / 1000)} km de ti`;
}

// Contenido del popup con nodos DOM (textContent), nunca HTML interpolado.
// `enlace` (ficha de la especie) y `distancia` (texto) son opcionales.
export function contenidoPopup(props, nombreEspecie, { enlace = null, distancia = null } = {}) {
  const raiz = document.createElement('div');
  raiz.className = 'mapa-popup';
  if (props.imagen) {
    const imagen = document.createElement('img');
    imagen.className = 'mapa-popup-imagen';
    imagen.src = props.imagen;
    imagen.alt = `Fotografía del árbol ${props.codigoArbol}`;
    imagen.loading = 'eager';
    imagen.decoding = 'async';
    imagen.addEventListener('error', () => imagen.remove(), { once: true });
    raiz.append(imagen);
  }
  const codigo = document.createElement('p');
  codigo.className = 'mapa-popup-codigo';
  codigo.textContent = props.codigoArbol;
  const especie = document.createElement('p');
  especie.className = 'mapa-popup-especie';
  especie.textContent = nombreEspecie;
  raiz.append(codigo, especie);
  if (distancia) agregarTexto(raiz, 'mapa-popup-distancia', distancia);
  const detalle = detalleIndividuo(props);
  if (detalle) agregarTexto(raiz, 'mapa-popup-detalle', detalle);
  if (enlace) agregarEnlace(raiz, enlace);
  return raiz;
}

function agregarTexto(raiz, clase, texto) {
  const p = document.createElement('p');
  p.className = clase;
  p.textContent = texto;
  raiz.append(p);
  return p;
}

function agregarEnlace(raiz, enlace) {
  const ir = document.createElement('a');
  ir.className = 'mapa-popup-enlace';
  ir.href = enlace;
  ir.textContent = 'Ver ficha de la especie →';
  raiz.append(ir);
}

/**
 * Popup del mapa general: presenta la especie (foto, nombres, familia) para
 * entrar a su ficha; el árbol tocado queda como dato secundario.
 */
export function contenidoPopupEspecie(props, especie, { enlace = null, distancia = null } = {}) {
  const raiz = document.createElement('div');
  raiz.className = 'mapa-popup mapa-popup-especie-ficha';
  const foto = especie?.imagen || props.imagen;
  if (foto) {
    const imagen = document.createElement('img');
    imagen.className = 'mapa-popup-imagen';
    imagen.src = foto;
    imagen.alt = `Fotografía de ${especie?.nombre?.comun || 'la especie'}`;
    imagen.loading = 'eager';
    imagen.decoding = 'async';
    imagen.addEventListener('error', () => imagen.remove(), { once: true });
    raiz.append(imagen);
  }
  agregarTexto(raiz, 'mapa-popup-codigo', especie?.nombre?.comun || 'Especie sin nombre');
  if (especie?.nombre?.cientifico) agregarTexto(raiz, 'mapa-popup-cientifico', especie.nombre.cientifico);
  const clasificacion = [especie?.familia, especie?.tipo].filter(Boolean).join(' · ');
  if (clasificacion) agregarTexto(raiz, 'mapa-popup-detalle', clasificacion);
  agregarTexto(raiz, 'mapa-popup-detalle', `Árbol ${props.codigoArbol}`);
  if (distancia) agregarTexto(raiz, 'mapa-popup-distancia', distancia);
  if (enlace) agregarEnlace(raiz, enlace);
  return raiz;
}

// Durante un setStyle la fuente desaparece unos instantes; sin esta guarda
// setFeatureState lanzaría "source not found".
export function marcar(map, id, seleccionado) {
  if (id && map?.getSource(FUENTE)) map.setFeatureState({ source: FUENTE, id }, { seleccionado });
}

export function mapaEnPantallaCompleta(map) {
  const elementoPantallaCompleta = document.fullscreenElement || document.webkitFullscreenElement;
  return elementoPantallaCompleta === map.getContainer()
    || map.getContainer().classList.contains('maplibregl-pseudo-fullscreen');
}

export function agregarCapas(map, datos, base) {
  if (map.getSource(FUENTE)) return;
  const sobreSatelite = base === 'satelite';
  // Sobre la foto aérea el verde bosque se pierde entre la vegetación: se usa
  // menta clara con borde oscuro y etiquetas blancas.
  const relleno = sobreSatelite ? '#b7e4c7' : token('--forest-700', '#2d6a4f');
  const borde = sobreSatelite ? '#173f2f' : token('--surface', '#ffffff');
  const texto = sobreSatelite ? '#ffffff' : token('--ink-900', '#1f2a24');
  const halo = sobreSatelite ? 'rgba(15, 22, 18, 0.85)' : token('--surface', '#ffffff');
  const seleccionado = ['boolean', ['feature-state', 'seleccionado'], false];

  map.addSource(FUENTE, { type: 'geojson', data: datos, promoteId: 'id' });
  map.addLayer({
    id: CAPA_PUNTOS,
    type: 'circle',
    source: FUENTE,
    paint: {
      // Mapa general: el color de la especie, y la selección se marca con un
      // borde blanco grueso (el naranja de selección se confundiría con la paleta).
      'circle-color': ['case', ['has', 'color'], ['get', 'color'], seleccionado, token('--clay-500', '#c2653c'), relleno],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, ['case', seleccionado, 6, 3.5], 19, ['case', seleccionado, 13, 9]],
      'circle-stroke-color': ['case', ['all', ['has', 'color'], seleccionado], '#ffffff', borde],
      'circle-stroke-width': ['case', ['all', ['has', 'color'], seleccionado], 4, 2],
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
      'text-offset': [0, 1.3],
      'text-anchor': 'top',
    },
    paint: { 'text-color': texto, 'text-halo-color': halo, 'text-halo-width': 1.5 },
  });
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
      }, CAPA_PUNTOS);
    }
  } else {
    map.setTerrain(null);
    map.setSky();
    if (map.getLayer(CAPA_SOMBRA)) map.removeLayer(CAPA_SOMBRA);
  }
}
