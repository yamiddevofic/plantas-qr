// Capas, popup y utilidades de MapLibre para el mapa de individuos. No importa
// MapLibre: recibe `map` y `lib` ya cargados para mantener el chunk diferido.

export const FUENTE = 'individuos';
const FUENTE_TERRENO = 'terreno';
// MapLibre recomienda no compartir la fuente DEM entre terreno y sombreado.
const FUENTE_SOMBRA = 'terreno-sombra';
const CAPA_SOMBRA = 'terreno-sombreado';
export const CAPA_PUNTOS = 'individuos-puntos';
const CAPA_ETIQUETAS = 'individuos-etiquetas';
export const ZOOM_INICIAL_MAX = 17;
export const POSICION_SELECCION_Y = 0.45;

// Cámara al activar el relieve: algo más lejos e inclinada para que entren las
// laderas que rodean el casco urbano.
export const CAMARA_3D = { pitch: 65, bearing: -25, zoomMax: 16.2 };

const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

export function prefiereMenosMovimiento() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
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

// Contenido del popup con nodos DOM (textContent), nunca HTML interpolado.
export function contenidoPopup(props, nombreEspecie) {
  const raiz = document.createElement('div');
  raiz.className = 'mapa-popup';
  if (props.imagen) {
    const imagen = document.createElement('img');
    imagen.className = 'mapa-popup-imagen';
    imagen.src = props.imagen;
    imagen.alt = `Fotografía del árbol ${props.codigoArbol}`;
    // El popup solo existe cuando ya se abrió el individuo: cargar de inmediato.
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
  const detalle = detalleIndividuo(props);
  if (detalle) {
    const linea = document.createElement('p');
    linea.className = 'mapa-popup-detalle';
    linea.textContent = detalle;
    raiz.append(linea);
  }
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
      'circle-color': ['case', seleccionado, token('--clay-500', '#c2653c'), relleno],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, ['case', seleccionado, 6, 3.5], 19, ['case', seleccionado, 13, 9]],
      'circle-stroke-color': borde,
      'circle-stroke-width': 2,
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
