// Fuentes de teselas compartidas por el mapa (maplibre.js) y la descarga del mapa
// del parque para usarlo sin conexión (offline/mapaParque.js). Va aparte para que
// la descarga no arrastre los ~1 MB de MapLibre.

const env = import.meta.env;

// ── Satélite ─────────────────────────────────────────────────────
// Esri World Imagery. Sobre Chitagá solo hay imagen hasta z18 (en z19 devuelve
// una tesela "Map data not yet available"), así que se limita la fuente a 18 y
// MapLibre sobreamplía al acercar más.
export const SATELITE = {
  tiles: env.VITE_MAPA_SATELITE_TILES || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  maxzoom: Number(env.VITE_MAPA_SATELITE_MAXZOOM) || 18,
  attribution: env.VITE_MAPA_SATELITE_ATRIBUCION
    || 'Imágenes © <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics y la comunidad de usuarios GIS',
};

export const urlTeselaSatelite = (z, x, y) => SATELITE.tiles.replace('{z}', z).replace('{x}', x).replace('{y}', y);
