import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ArbolitoLoader from '../atoms/ArbolitoLoader';

// Centro del casco del Parque principal de Chitagá, para cuando aún no hay punto.
const CENTRO_PARQUE = [-72.66495, 7.13825];
const ZOOM_PARQUE = 18;
const FUENTE_REFERENCIAS = 'referencias';
const FUENTE_PRECISION = 'precision-gps';
const VACIO = { type: 'FeatureCollection', features: [] };

/** Círculo (polígono de 64 lados) de `metros` alrededor de [lng, lat]. */
function circulo([lng, lat], metros) {
  const puntos = [];
  const dLat = metros / 111320;
  const dLng = metros / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= 64; i += 1) {
    const a = (i / 64) * 2 * Math.PI;
    puntos.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [puntos] } }] };
}

const redondear = (n) => Number(n.toFixed(7));

function coordenadasValidas(latitud, longitud) {
  if (latitud === '' || longitud === '' || latitud == null || longitud == null) return null;
  const lat = Number(latitud);
  const lng = Number(longitud);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lng, lat];
}

/**
 * Mapa satelital para fijar la ubicación de un individuo: un toque coloca el
 * marcador, que además se puede arrastrar. Los otros individuos se muestran
 * como puntos de referencia. MapLibre se descarga bajo demanda.
 */
export default function SelectorUbicacion({ latitud, longitud, onCambiar, referencias = [], precision = null }) {
  const contenedorRef = useRef(null);
  const mapaRef = useRef(null);
  const marcadorRef = useRef(null);
  const alCambiarRef = useRef(onCambiar);
  const referenciasRef = useRef(referencias);
  const posicionInicialRef = useRef(coordenadasValidas(latitud, longitud));
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    alCambiarRef.current = onCambiar;
  }, [onCambiar]);

  // Crear el mapa una sola vez; los cambios posteriores llegan por props.
  useEffect(() => {
    let cancelado = false;
    let map;

    import('../../mapa/maplibre.js')
      .then((lib) => {
        if (cancelado || !contenedorRef.current) return;
        const inicial = posicionInicialRef.current;
        map = new lib.Map({
          container: contenedorRef.current,
          style: lib.estiloSatelite(),
          center: inicial || CENTRO_PARQUE,
          zoom: ZOOM_PARQUE,
          maxZoom: 20,
          cooperativeGestures: true,
          attributionControl: false,
          locale: lib.LOCALE_ES,
        });
        mapaRef.current = map;
        map.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right');
        map.addControl(new lib.AttributionControl({ compact: true }), 'bottom-right');

        const marcador = new lib.Marker({ draggable: true, color: '#c2653c' })
          .setLngLat(inicial || CENTRO_PARQUE);
        marcadorRef.current = marcador;
        if (inicial) marcador.addTo(map);
        marcador.on('dragend', () => {
          const { lng, lat } = marcador.getLngLat();
          alCambiarRef.current({ latitud: redondear(lat), longitud: redondear(lng) });
        });

        map.on('click', (e) => {
          marcador.setLngLat(e.lngLat).addTo(map);
          alCambiarRef.current({ latitud: redondear(e.lngLat.lat), longitud: redondear(e.lngLat.lng) });
        });

        map.on('style.load', () => {
          // Margen de error del GPS: debajo de los puntos y del marcador.
          map.addSource(FUENTE_PRECISION, { type: 'geojson', data: VACIO });
          map.addLayer({
            id: 'precision-relleno',
            type: 'fill',
            source: FUENTE_PRECISION,
            paint: { 'fill-color': '#b7e4c7', 'fill-opacity': 0.22 },
          });
          map.addLayer({
            id: 'precision-borde',
            type: 'line',
            source: FUENTE_PRECISION,
            paint: { 'line-color': '#b7e4c7', 'line-width': 1.5, 'line-dasharray': [2, 2] },
          });
          map.addSource(FUENTE_REFERENCIAS, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: referenciasRef.current },
          });
          map.addLayer({
            id: 'referencias-puntos',
            type: 'circle',
            source: FUENTE_REFERENCIAS,
            paint: {
              'circle-color': '#b7e4c7',
              'circle-radius': 5,
              'circle-stroke-color': '#173f2f',
              'circle-stroke-width': 1.5,
            },
          });
          setListo(true);
        });
        map.on('error', (e) => console.warn('MapLibre:', e.error?.message || e));
      })
      .catch((e) => {
        if (cancelado) return;
        console.error('No se pudo iniciar el mapa:', e);
        setError('No se pudo cargar el mapa (requiere WebGL). Escribe las coordenadas a mano.');
      });

    return () => {
      cancelado = true;
      map?.remove();
      mapaRef.current = null;
      marcadorRef.current = null;
    };
  }, []);

  // Individuos ya registrados como referencia.
  useEffect(() => {
    referenciasRef.current = referencias;
    mapaRef.current?.getSource?.(FUENTE_REFERENCIAS)?.setData({ type: 'FeatureCollection', features: referencias });
  }, [referencias, listo]);

  // Círculo de precisión del GPS alrededor del punto (si lo hay).
  useEffect(() => {
    const fuente = mapaRef.current?.getSource?.(FUENTE_PRECISION);
    if (!fuente) return;
    const punto = coordenadasValidas(latitud, longitud);
    fuente.setData(punto && precision > 0 ? circulo(punto, precision) : VACIO);
  }, [latitud, longitud, precision, listo]);

  // Las coordenadas escritas a mano (o tomadas del GPS) mueven el marcador.
  useEffect(() => {
    const map = mapaRef.current;
    const marcador = marcadorRef.current;
    if (!map || !marcador) return;
    const punto = coordenadasValidas(latitud, longitud);
    if (!punto) {
      marcador.remove();
      return;
    }
    const actual = marcador.getLngLat();
    const yaEnSitio = Math.abs(actual.lng - punto[0]) < 1e-9 && Math.abs(actual.lat - punto[1]) < 1e-9;
    marcador.setLngLat(punto).addTo(map);
    if (!yaEnSitio && !map.getBounds().contains(punto)) map.easeTo({ center: punto, duration: 400 });
  }, [latitud, longitud, listo]);

  return (
    <div className="selector-ubicacion">
      <div
        ref={contenedorRef}
        className="selector-ubicacion-lienzo"
        role="application"
        aria-label="Mapa para elegir la ubicación del árbol. Toca el mapa o arrastra el marcador."
      />
      {!listo && !error && (
        <div className="mapa-cargando">
          <ArbolitoLoader etiqueta="Cargando mapa" />
        </div>
      )}
      {error && <p className="mapa-error" role="status">{error}</p>}
    </div>
  );
}

SelectorUbicacion.propTypes = {
  latitud: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  longitud: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onCambiar: PropTypes.func.isRequired,
  /** Features GeoJSON de otros individuos, dibujados como puntos de referencia. */
  referencias: PropTypes.arrayOf(PropTypes.object),
  /** Precisión del GPS en metros: se dibuja como círculo alrededor del marcador. */
  precision: PropTypes.number,
};
