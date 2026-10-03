// Punto único de entrada a MapLibre GL. Se importa con import() dinámico para que
// los ~1 MB de la librería solo se descarguen cuando una ficha tiene mapa.
import { AttributionControl, LngLatBounds, Map, NavigationControl, Popup, ScaleControl, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre 6 ubica su worker relativo a import.meta.url, ruta que deja de existir
// tras el bundle. Vite empaqueta el worker (con su chunk compartido) y da su URL.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);

const env = import.meta.env;

// ── Mapa vectorial ───────────────────────────────────────────────
// Estilos de OpenFreeMap: gratuitos y sin token. Se pueden cambiar por cualquier
// estilo compatible con MapLibre (MapTiler, Stadia, uno propio…).
export const ESTILOS = {
  claro: env.VITE_MAPA_ESTILO_CLARO || 'https://tiles.openfreemap.org/styles/positron',
  oscuro: env.VITE_MAPA_ESTILO_OSCURO || 'https://tiles.openfreemap.org/styles/dark',
};

// ── Satélite ─────────────────────────────────────────────────────
// Esri World Imagery. Sobre Chitagá solo hay imagen hasta z18 (en z19 devuelve
// una tesela "Map data not yet available"), así que se limita la fuente a 18 y
// MapLibre sobreamplía al acercar más.
const SATELITE = {
  tiles: env.VITE_MAPA_SATELITE_TILES || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  maxzoom: Number(env.VITE_MAPA_SATELITE_MAXZOOM) || 18,
  attribution: env.VITE_MAPA_SATELITE_ATRIBUCION
    || 'Imágenes © <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics y la comunidad de usuarios GIS',
};

// Las fuentes tipográficas para las etiquetas CIP-xxx salen de OpenFreeMap,
// porque el estilo satelital se arma aquí y no trae glifos propios.
const GLIFOS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

export function estiloSatelite() {
  return {
    version: 8,
    glyphs: GLIFOS,
    sources: {
      satelite: {
        type: 'raster',
        tiles: [SATELITE.tiles],
        tileSize: 256,
        maxzoom: SATELITE.maxzoom,
        attribution: SATELITE.attribution,
      },
    },
    layers: [
      { id: 'fondo', type: 'background', paint: { 'background-color': '#1f2a24' } },
      { id: 'satelite', type: 'raster', source: 'satelite' },
    ],
  };
}

// ── Terreno 3D ───────────────────────────────────────────────────
// AWS Terrain Tiles (formato Terrarium, datos abiertos SRTM/Copernicus…),
// sin token y con CORS abierto. Resolución útil hasta z15; se sobreamplía.
export const TERRENO = {
  type: 'raster-dem',
  tiles: [env.VITE_MAPA_TERRENO_TILES || 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
  encoding: env.VITE_MAPA_TERRENO_CODIFICACION || 'terrarium',
  tileSize: 256,
  maxzoom: 15,
  attribution: 'Relieve: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">AWS Terrain Tiles</a>',
};

// El valle de Chitagá es estrecho; una exageración leve hace legibles las laderas
// sin deformar la escala del parque.
export const EXAGERACION_TERRENO = 1.4;

export const CIELO = {
  'sky-color': '#7fb4d8',
  'horizon-color': '#d9ebf2',
  'fog-color': '#e7f2ea',
  'sky-horizon-blend': 0.6,
  'horizon-fog-blend': 0.5,
  'fog-ground-blend': 0.6,
  'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 12, 0],
};

export const LOCALE_ES = {
  'AttributionControl.ToggleAttribution': 'Mostrar u ocultar atribución',
  'AttributionControl.MapFeedback': 'Sugerir correcciones al mapa',
  'Map.Title': 'Mapa',
  'Marker.Title': 'Marcador',
  'NavigationControl.ResetBearing': 'Restablecer orientación e inclinación',
  'NavigationControl.ZoomIn': 'Acercar',
  'NavigationControl.ZoomOut': 'Alejar',
  'Popup.Close': 'Cerrar',
  'ScaleControl.Meters': 'm',
  'ScaleControl.Kilometers': 'km',
  'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rueda del ratón para hacer zoom en el mapa',
  'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rueda del ratón para hacer zoom en el mapa',
  'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
};

export { AttributionControl, LngLatBounds, Map, NavigationControl, Popup, ScaleControl };
