import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LuMap, LuMountainSnow, LuSatellite } from 'react-icons/lu';
import { fetchIndividuos } from '../../api';
import { useTema } from '../../tema.js';
import SeccionFicha from '../molecules/SeccionFicha';
import ArbolitoLoader from '../atoms/ArbolitoLoader';

const FUENTE = 'individuos';
const FUENTE_TERRENO = 'terreno';
// MapLibre recomienda no compartir la fuente DEM entre terreno y sombreado.
const FUENTE_SOMBRA = 'terreno-sombra';
const CAPA_SOMBRA = 'terreno-sombreado';
const CAPA_PUNTOS = 'individuos-puntos';
const CAPA_ETIQUETAS = 'individuos-etiquetas';
const ZOOM_INICIAL_MAX = 17;
const POSICION_SELECCION_Y = 0.45;

const BASES = [
  { id: 'satelite', etiqueta: 'Satélite', Icono: LuSatellite },
  { id: 'mapa', etiqueta: 'Mapa', Icono: LuMap },
];

// Cámara al activar el relieve: algo más lejos e inclinada para que entren las
// laderas que rodean el casco urbano.
const CAMARA_3D = { pitch: 65, bearing: -25, zoomMax: 16.2 };

const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

function prefiereMenosMovimiento() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// Las capas de MapLibre no entienden var(--x): se leen los tokens al pintar para
// que los puntos sigan la paleta del tema activo.
function token(nombre, alternativo) {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim() || alternativo;
}

function detalleIndividuo({ altitudMsnm, precisionGpsM }) {
  const partes = [];
  if (altitudMsnm != null) partes.push(`${numero.format(altitudMsnm)} msnm`);
  if (precisionGpsM != null) partes.push(`precisión GPS ±${numero.format(precisionGpsM)} m`);
  return partes.join(' · ');
}

// Contenido del popup con nodos DOM (textContent), nunca HTML interpolado.
function contenidoPopup(props, nombreEspecie) {
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
function marcar(map, id, seleccionado) {
  if (id && map?.getSource(FUENTE)) map.setFeatureState({ source: FUENTE, id }, { seleccionado });
}

function mapaEnPantallaCompleta(map) {
  const elementoPantallaCompleta = document.fullscreenElement || document.webkitFullscreenElement;
  return elementoPantallaCompleta === map.getContainer()
    || map.getContainer().classList.contains('maplibregl-pseudo-fullscreen');
}

function agregarCapas(map, datos, base) {
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

function aplicarRelieve(map, lib, activo, base) {
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

export default function MapaIndividuos({ especieId, nombreEspecie }) {
  const { tema } = useTema();
  const contenedorRef = useRef(null);
  const seccionRef = useRef(null);
  const mapaRef = useRef(null);
  const libRef = useRef(null);
  const limitesRef = useRef(null);
  const popupRef = useRef(null);
  const seleccionRef = useRef(null);

  const [datos, setDatos] = useState(null);
  const [estado, setEstado] = useState('cargando');
  const [visible, setVisible] = useState(false);
  const [mapaListo, setMapaListo] = useState(false);
  const [errorMapa, setErrorMapa] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const [base, setBase] = useState('satelite');
  const [relieve3D, setRelieve3D] = useState(false);

  // Los manejadores de MapLibre viven fuera del ciclo de React: leen de refs.
  const vistaRef = useRef({ base, tema, relieve3D });
  useEffect(() => {
    vistaRef.current = { base, tema, relieve3D };
  }, [base, tema, relieve3D]);

  const total = datos?.features?.length ?? 0;

  // 1. Datos: GeoJSON de los individuos de esta especie.
  useEffect(() => {
    const control = new AbortController();
    fetchIndividuos(especieId, { signal: control.signal })
      .then((coleccion) => {
        setDatos(coleccion);
        setEstado(coleccion?.features?.length ? 'listo' : 'vacio');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        // La sección es complementaria: si la API falla, la ficha sigue sin mapa.
        console.warn('Mapa de individuos no disponible:', error.message);
        setEstado('error');
      });
    return () => control.abort();
  }, [especieId]);

  // 2. Solo se descarga MapLibre cuando la sección se acerca al viewport.
  useEffect(() => {
    if (estado !== 'listo' || visible) return undefined;
    const nodo = seccionRef.current;
    if (!nodo || !('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }
    const observador = new IntersectionObserver(
      ([entrada]) => { if (entrada.isIntersecting) setVisible(true); },
      { rootMargin: '300px 0px' }
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [estado, visible]);

  const seleccionar = useCallback((feature, { centrar = false } = {}) => {
    const map = mapaRef.current;
    if (!map || !feature) return;
    const id = feature.properties.id;
    const coordenadas = feature.geometry.coordinates;

    if (seleccionRef.current !== id) marcar(map, seleccionRef.current, false);
    marcar(map, id, true);
    seleccionRef.current = id;
    setSeleccionado(id);

    popupRef.current
      .setLngLat(coordenadas)
      .setDOMContent(contenidoPopup(feature.properties, nombreEspecie));
    if (!popupRef.current.isOpen()) popupRef.current.addTo(map);

    if (centrar && !mapaEnPantallaCompleta(map)) {
      map.easeTo({
        center: coordenadas,
        // Un offset positivo hacia abajo coloca el punto más bajo en pantalla
        // (la cámara desplaza el mapa hacia arriba) y reserva espacio para el popup.
        offset: [0, map.getContainer().clientHeight * POSICION_SELECCION_Y],
        zoom: Math.max(map.getZoom(), 18.5),
        duration: prefiereMenosMovimiento() ? 0 : 600,
      });
    }
  }, [nombreEspecie]);

  // 3. Crear el mapa una vez que hay datos y la sección es visible.
  useEffect(() => {
    if (estado !== 'listo' || !visible || !contenedorRef.current) return undefined;
    let cancelado = false;
    let map;

    import('../../mapa/maplibre.js')
      .then((lib) => {
        if (cancelado || !contenedorRef.current) return;
        libRef.current = lib;

        const limites = new lib.LngLatBounds();
        for (const f of datos.features) limites.extend(f.geometry.coordinates);
        limitesRef.current = limites;

        const vista = vistaRef.current;
        const offsetInicialY = -contenedorRef.current.clientHeight * 0.05;
        map = new lib.Map({
          container: contenedorRef.current,
          style: vista.base === 'satelite' ? lib.estiloSatelite() : lib.ESTILOS[vista.tema] || lib.ESTILOS.claro,
          bounds: limites,
          bearing: 90,
          fitBoundsOptions: {
            padding: 48,
            maxZoom: ZOOM_INICIAL_MAX,
            bearing: 90,
            offset: [0, offsetInicialY],
          },
          maxZoom: 20,
          maxPitch: 75,
          cooperativeGestures: true,
          attributionControl: false,
          locale: lib.LOCALE_ES,
        });
        mapaRef.current = map;
        // anchor bottom ubica la punta del popup en la coordenada y el contenido
        // queda por encima del marcador.
        popupRef.current = new lib.Popup({
          anchor: 'bottom',
          offset: 14,
          maxWidth: '260px',
          focusAfterOpen: false,
          autoPan: false,
        });
        popupRef.current.on('close', () => {
          marcar(map, seleccionRef.current, false);
          seleccionRef.current = null;
          setSeleccionado(null);
        });

        // visualizePitch: la brújula muestra la inclinación y la restablece al pulsarla.
        map.addControl(new lib.NavigationControl({ visualizePitch: true }), 'top-right');
        map.addControl(new lib.FullscreenControl(), 'top-right');
        map.addControl(new lib.ScaleControl({ unit: 'metric' }), 'bottom-left');
        map.addControl(new lib.AttributionControl({ compact: true }), 'bottom-right');

        // style.load se dispara también tras cada setStyle (cambio de base o tema):
        // se vuelven a montar capas, terreno y selección.
        map.on('style.load', () => {
          const { base: baseActual, relieve3D: con3D } = vistaRef.current;
          agregarCapas(map, datos, baseActual);
          aplicarRelieve(map, lib, con3D, baseActual);
          marcar(map, seleccionRef.current, true);
          setMapaListo(true);
        });
        map.on('click', CAPA_PUNTOS, (e) => seleccionar(e.features?.[0], { centrar: true }));
        map.on('mouseenter', CAPA_PUNTOS, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', CAPA_PUNTOS, () => { map.getCanvas().style.cursor = ''; });
        map.on('error', (e) => console.warn('MapLibre:', e.error?.message || e));
      })
      .catch((error) => {
        if (cancelado) return;
        console.error('No se pudo iniciar el mapa:', error);
        setErrorMapa('Tu navegador no pudo mostrar el mapa interactivo (requiere WebGL).');
      });

    return () => {
      cancelado = true;
      popupRef.current?.remove();
      popupRef.current = null;
      map?.remove();
      mapaRef.current = null;
      seleccionRef.current = null;
      setMapaListo(false);
    };
  }, [estado, visible, datos, seleccionar]);

  // 4. Cambio de capa base o de tema → otro estilo. El tema solo afecta al
  //    mapa vectorial; el satélite es igual de día y de noche.
  const estiloPrevioRef = useRef(null);
  useEffect(() => {
    const clave = base === 'satelite' ? 'satelite' : `mapa-${tema}`;
    const previo = estiloPrevioRef.current;
    estiloPrevioRef.current = clave;
    const map = mapaRef.current;
    const lib = libRef.current;
    if (!map || !lib || previo === null || previo === clave) return;
    setMapaListo(false);
    map.setStyle(base === 'satelite' ? lib.estiloSatelite() : lib.ESTILOS[tema] || lib.ESTILOS.claro, { diff: false });
  }, [base, tema]);

  // 5. Relieve 3D: terreno + cielo y cámara inclinada; al apagarlo, vuelta a la
  //    vista cenital encuadrando los individuos.
  const relievePrevioRef = useRef(relieve3D);
  useEffect(() => {
    const map = mapaRef.current;
    const lib = libRef.current;
    if (relievePrevioRef.current === relieve3D) return;
    relievePrevioRef.current = relieve3D;
    if (!map || !lib) return;
    aplicarRelieve(map, lib, relieve3D, base);
    const duration = prefiereMenosMovimiento() ? 0 : 1400;
    if (relieve3D) {
      map.easeTo({
        pitch: CAMARA_3D.pitch,
        bearing: CAMARA_3D.bearing,
        zoom: Math.min(map.getZoom(), CAMARA_3D.zoomMax),
        center: limitesRef.current?.getCenter(),
        duration,
      });
    } else if (limitesRef.current) {
      map.fitBounds(limitesRef.current, {
        padding: 48,
        maxZoom: ZOOM_INICIAL_MAX,
        pitch: 0,
        bearing: 90,
        offset: [0, -map.getContainer().clientHeight * 0.05],
        duration,
      });
    }
  }, [relieve3D, base]);

  if (estado === 'vacio' || estado === 'error') return null;

  const titulo = estado === 'listo'
    ? `${total} ${total === 1 ? 'individuo' : 'individuos'} en el parque`
    : 'Individuos en el parque';

  return (
    <div ref={seccionRef} className="detalle-mapa">
      <SeccionFicha id="ficha-mapa" titulo="¿Dónde encontrarlo?">
        <p className="detalle-parrafo">
          Ubicación GPS de cada árbol de esta especie registrado en el Parque principal de Chitagá.
          Toca un punto o un código de la lista para ver sus datos; activa el relieve 3D para ver
          las montañas que rodean el pueblo.
        </p>

        <div className="mapa-controles">
          <div className="mapa-segmentado" role="group" aria-label="Tipo de mapa">
            {BASES.map(({ id, etiqueta, Icono }) => (
              <button
                key={id}
                type="button"
                className="mapa-control"
                aria-pressed={base === id}
                disabled={Boolean(errorMapa)}
                onClick={() => setBase(id)}
              >
                <Icono aria-hidden="true" />
                {etiqueta}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mapa-control mapa-control-relieve"
            aria-pressed={relieve3D}
            disabled={Boolean(errorMapa)}
            onClick={() => setRelieve3D((v) => !v)}
          >
            <LuMountainSnow aria-hidden="true" />
            Relieve 3D
          </button>
        </div>

        <div className="mapa-marco">
          <div
            ref={contenedorRef}
            className="mapa-lienzo"
            role="region"
            aria-label={`Mapa ${base === 'satelite' ? 'satelital' : 'de calles'}${relieve3D ? ' con relieve 3D' : ''}: ${titulo} de ${nombreEspecie}`}
          />
          {!mapaListo && !errorMapa && (
            <div className="mapa-cargando">
              <ArbolitoLoader etiqueta="Cargando mapa" />
            </div>
          )}
          {errorMapa && <p className="mapa-error" role="status">{errorMapa}</p>}
        </div>

        {estado === 'listo' && (
          <>
            <p className="mapa-lista-titulo" id="mapa-lista-titulo">{titulo}</p>
            <ul className="mapa-lista" aria-labelledby="mapa-lista-titulo">
              {datos.features.map((feature) => {
                const { id, codigoArbol } = feature.properties;
                const activo = seleccionado === id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`mapa-lista-item${activo ? ' activo' : ''}`}
                      aria-pressed={activo}
                      disabled={!mapaListo}
                      onClick={() => seleccionar(feature, { centrar: true })}
                    >
                      {feature.properties.imagen && (
                        <img
                          className="mapa-lista-imagen"
                          src={feature.properties.imagen}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          onError={(event) => { event.currentTarget.hidden = true; }}
                        />
                      )}
                      <span className="mapa-lista-codigo">{codigoArbol}</span>
                      <span className="mapa-lista-detalle">{detalleIndividuo(feature.properties)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </SeccionFicha>
    </div>
  );
}

MapaIndividuos.propTypes = {
  especieId: PropTypes.string.isRequired,
  nombreEspecie: PropTypes.string.isRequired,
};
