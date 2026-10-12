import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LuChevronDown } from 'react-icons/lu';
import { useTema } from '../../tema.js';
import { obtenerVistaMapa } from '../../api';
import {
  CAMARA_3D,
  FUENTE,
  VISTA_INICIAL,
  agregarCapas,
  animarPuntos,
  aplicarRelieve,
  contenidoPopupEspecie,
  desplazamientoSeleccion,
  individuoEn,
  marcar,
  prefiereMenosMovimiento,
  resaltar,
} from '../../mapa/capasIndividuos';
import ControlesMapa from '../molecules/ControlesMapa';
import ArbolitoLoader from '../atoms/ArbolitoLoader';

const COLECCION_VACIA = { type: 'FeatureCollection', features: [] };

/** Límites que abarcan todos los puntos de la colección (null si no hay). */
function limitesDe(lib, coleccion) {
  if (!coleccion.features.length) return null;
  const limites = new lib.LngLatBounds();
  for (const f of coleccion.features) limites.extend(f.geometry.coordinates);
  return limites;
}

/**
 * Mapa del parque (página «Mapa»): todos los árboles con el color de su especie
 * o, con `filtro`, solo los de una especie. Cambiar el filtro actualiza los puntos
 * y encuadra los visibles sin recrear el mapa. `arbolId` abre ese árbol al cargar.
 * La ventana de cada árbol enlaza a la ficha de su especie con ese árbol de portada.
 */
export default function MapaParque({
  coleccion, leyenda, filtro = null, arbolId = null, onFiltro, controlRef = null,
}) {
  const { tema } = useTema();
  const contenedorRef = useRef(null);
  const mapaRef = useRef(null);
  const libRef = useRef(null);
  const popupRef = useRef(null);
  const seleccionRef = useRef(null);
  // Vista con la que abre el mapa sin filtro: la que fijó el administrador o,
  // mientras llega (o si no hay), la de la app.
  const vistaInicialRef = useRef(VISTA_INICIAL);
  // La persona ya movió el mapa: la vista guardada que llegue tarde no la pisa.
  const movidoRef = useRef(false);
  const [aviso, setAviso] = useState(null);
  const [mapaListo, setMapaListo] = useState(false);
  const [errorMapa, setErrorMapa] = useState(null);
  // Satélite: se ven los árboles sobre el terreno real y funciona sin conexión.
  const [base, setBase] = useState('satelite');
  const [relieve3D, setRelieve3D] = useState(false);
  // La leyenda abre desplegada en escritorio y plegada en celular.
  const [leyendaAbierta, setLeyendaAbierta] = useState(() => !window.matchMedia?.('(max-width: 767px), (max-height: 560px)').matches);

  // Puntos visibles: los de la especie elegida o todos.
  const datos = useMemo(() => {
    if (!coleccion) return COLECCION_VACIA;
    if (!filtro) return coleccion;
    return { ...coleccion, features: coleccion.features.filter((f) => f.properties.especie?.nombre?.cientifico === filtro) };
  }, [coleccion, filtro]);
  const datosRef = useRef(datos);
  useEffect(() => { datosRef.current = datos; }, [datos]);

  // Los manejadores de MapLibre viven fuera del ciclo de React: leen de refs.
  const vistaRef = useRef({ base, tema, relieve3D });
  useEffect(() => { vistaRef.current = { base, tema, relieve3D }; }, [base, tema, relieve3D]);

  // Con una especie elegida al abrir manda su encuadre, no la vista general.
  const abrioFiltradoRef = useRef(Boolean(filtro));
  useEffect(() => {
    let cancelado = false;
    obtenerVistaMapa().then((vista) => {
      if (cancelado || !vista) return;
      vistaInicialRef.current = vista;
      const map = mapaRef.current;
      const libre = !movidoRef.current && !seleccionRef.current && !vistaRef.current.relieve3D;
      if (map && libre && !abrioFiltradoRef.current) map.jumpTo(vista);
    });
    return () => { cancelado = true; };
  }, []);

  // La página lee la cámara actual para fijarla como vista inicial del mapa.
  useImperativeHandle(controlRef, () => ({
    camara() {
      const map = mapaRef.current;
      if (!map) return null;
      const { lng, lat } = map.getCenter();
      const redondear = (n, d) => Number(n.toFixed(d));
      return {
        center: [redondear(lng, 7), redondear(lat, 7)],
        zoom: redondear(map.getZoom(), 2),
        bearing: redondear(map.getBearing(), 1),
        pitch: redondear(map.getPitch(), 1),
      };
    },
    avisar: setAviso,
    fijada(vista) {
      vistaInicialRef.current = vista;
      setAviso('Listo: el mapa abrirá con esta vista.');
    },
  }), []);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const seleccionar = useCallback((elegido, { centrar = false } = {}) => {
    const map = mapaRef.current;
    if (!map || !elegido) return;
    const id = elegido.properties.id;
    // MapLibre entrega las propiedades anidadas (la especie) como texto: se usa la
    // feature original del GeoJSON.
    const feature = datosRef.current.features.find((f) => f.properties.id === id) ?? elegido;
    const coordenadas = feature.geometry.coordinates;
    const especie = feature.properties.especie;
    // La ficha abre con la foto de este árbol como portada.
    const enlace = especie?._id ? `#/planta/${especie._id}?arbol=${encodeURIComponent(id)}` : null;

    if (seleccionRef.current !== id) marcar(map, seleccionRef.current, false);
    marcar(map, id, true);
    seleccionRef.current = id;
    popupRef.current.setLngLat(coordenadas).setDOMContent(contenidoPopupEspecie(feature.properties, especie, { enlace }));
    if (!popupRef.current.isOpen()) popupRef.current.addTo(map);

    if (centrar) {
      map.easeTo({
        center: coordenadas,
        // El punto baja lo justo para que punto y ventana queden centrados juntos.
        offset: [0, desplazamientoSeleccion(map, popupRef.current)],
        zoom: Math.max(map.getZoom(), 18.5),
        duration: prefiereMenosMovimiento() ? 0 : 600,
      });
    }
  }, []);

  // Encuadra los puntos visibles (al filtrar por especie, o al abrir filtrado).
  const encuadrar = useCallback((animado = true) => {
    const map = mapaRef.current;
    const lib = libRef.current;
    if (!map || !lib) return;
    const limites = limitesDe(lib, datosRef.current);
    if (!limites) return;
    map.fitBounds(limites, {
      padding: { top: 80, bottom: 80, left: 60, right: 60 },
      maxZoom: 19,
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      duration: animado && !prefiereMenosMovimiento() ? 700 : 0,
    });
  }, []);

  // 1. Crear el mapa una sola vez (los datos se actualizan aparte, en el paso 2).
  const hayDatos = Boolean(coleccion);
  useEffect(() => {
    if (!hayDatos || !contenedorRef.current) return undefined;
    let cancelado = false;
    let map;
    let detenerAnimacion = () => {};
    let cancelarCierrePopup = () => {};
    // Ventana fijada con un clic: no se cierra al salir el cursor.
    let fijado = false;

    import('../../mapa/maplibre.js')
      .then((lib) => {
        if (cancelado || !contenedorRef.current) return;
        libRef.current = lib;
        const vista = vistaRef.current;
        map = new lib.Map({
          container: contenedorRef.current,
          style: vista.base === 'satelite' ? lib.estiloSatelite() : lib.ESTILOS[vista.tema] || lib.ESTILOS.claro,
          ...vistaInicialRef.current,
          maxZoom: 20,
          maxPitch: 75,
          attributionControl: false,
          locale: lib.LOCALE_ES,
        });
        mapaRef.current = map;
        // anchor bottom: la punta de la ventana en el punto y el contenido encima.
        popupRef.current = new lib.Popup({
          anchor: 'bottom',
          offset: 18,
          maxWidth: '260px',
          focusAfterOpen: false,
          autoPan: false,
          // El clic en el mapa lo resuelve el manejador de abajo: con closeOnClick
          // el mismo clic que abre otro árbol cerraba la ventana.
          closeOnClick: false,
        });
        popupRef.current.on('close', () => {
          fijado = false;
          marcar(map, seleccionRef.current, false);
          seleccionRef.current = null;
        });

        // visualizePitch: la brújula muestra la inclinación y la restablece al pulsarla.
        map.addControl(new lib.NavigationControl({ visualizePitch: true }), 'top-right');
        map.addControl(new lib.ScaleControl({ unit: 'metric' }), 'bottom-left');
        map.addControl(new lib.AttributionControl({ compact: true }), 'bottom-right');

        // style.load se dispara también tras cada setStyle (cambio de base o tema):
        // se vuelven a montar capas, terreno y selección.
        map.on('style.load', () => {
          const { base: baseActual, relieve3D: con3D } = vistaRef.current;
          agregarCapas(map, datosRef.current, baseActual);
          aplicarRelieve(map, lib, con3D, baseActual);
          marcar(map, seleccionRef.current, true);
          setMapaListo(true);
        });
        // Con ratón la ventana se abre al pasar sobre el punto y se cierra al salir,
        // salvo que el cursor pase a ella o se haga clic en el punto, que la deja
        // fija. En pantallas táctiles se abre con un toque.
        const conRaton = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;
        let cierre = null;
        const cancelarCierre = () => { clearTimeout(cierre); cierre = null; };
        const programarCierre = () => {
          cancelarCierre();
          cierre = setTimeout(() => { if (!fijado) popupRef.current?.remove(); }, 300);
        };
        cancelarCierrePopup = cancelarCierre;
        popupRef.current.on('open', () => {
          const el = popupRef.current.getElement();
          el.addEventListener('mouseenter', cancelarCierre);
          el.addEventListener('mouseleave', () => { if (conRaton) programarCierre(); });
        });
        // Un toque cerca de un punto lo abre (con margen para el dedo); en el vacío
        // cierra la ventana.
        map.on('click', (e) => {
          if (e.originalEvent.target.closest?.('.maplibregl-popup')) return;
          const feature = individuoEn(map, e.point);
          if (feature) {
            fijado = true;
            seleccionar(feature, { centrar: true });
          } else popupRef.current?.remove();
        });
        let resaltado = null;
        map.on('mousemove', (e) => {
          if (e.originalEvent.target.closest?.('.maplibregl-popup')) return;
          const feature = individuoEn(map, e.point, 10);
          const id = feature?.properties.id ?? null;
          if (conRaton) {
            if (feature) {
              cancelarCierre();
              if (id !== seleccionRef.current) seleccionar(feature);
            } else if (seleccionRef.current && !fijado) programarCierre();
          }
          if (id === resaltado) return;
          resaltar(map, resaltado, false);
          resaltar(map, id, true);
          resaltado = id;
          map.getCanvas().style.cursor = id ? 'pointer' : '';
        });
        detenerAnimacion = animarPuntos(map);
        map.on('movestart', (e) => { if (e.originalEvent) movidoRef.current = true; });
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
      detenerAnimacion();
      cancelarCierrePopup();
      map?.remove();
      mapaRef.current = null;
      seleccionRef.current = null;
      setMapaListo(false);
    };
  }, [hayDatos, seleccionar]);

  // 2. Al cambiar los puntos visibles (filtro), se reemplazan en la fuente y se
  //    encuadran. Si el árbol abierto ya no está, se cierra su ventana.
  const filtroPrevioRef = useRef(undefined);
  useEffect(() => {
    const map = mapaRef.current;
    if (!mapaListo || !map) return;
    map.getSource(FUENTE)?.setData(datos);
    const sigue = datos.features.some((f) => f.properties.id === seleccionRef.current);
    if (seleccionRef.current && !sigue) popupRef.current?.remove();
    const primera = filtroPrevioRef.current === undefined;
    const cambio = !primera && filtroPrevioRef.current !== filtro;
    filtroPrevioRef.current = filtro;
    // Al abrir: con especie (y sin árbol pedido) se encuadra; sin especie, vale la
    // vista inicial. Después, cada cambio de especie encuadra lo que queda.
    if ((primera && filtro && !arbolId) || cambio) encuadrar(!primera);
  }, [datos, filtro, mapaListo, arbolId, encuadrar]);

  // 3. Árbol pedido en la dirección (desde la galería de la ficha): se abre y se centra.
  const arbolAtendidoRef = useRef(null);
  useEffect(() => {
    if (!mapaListo || !arbolId || arbolAtendidoRef.current === arbolId) return;
    const feature = datos.features.find((f) => f.properties.id === arbolId);
    if (!feature) return;
    arbolAtendidoRef.current = arbolId;
    seleccionar(feature, { centrar: true });
  }, [mapaListo, arbolId, datos, seleccionar]);

  // 4. Cambio de capa base o de tema → otro estilo. El tema solo afecta al mapa
  //    de calles; el satélite es igual de día y de noche.
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

  // 5. Relieve 3D: terreno y cámara inclinada; al apagarlo, vuelta a la vista
  //    inicial (o al encuadre de la especie elegida).
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
        center: limitesDe(lib, datosRef.current)?.getCenter(),
        duration,
      });
    } else if (filtro) {
      map.easeTo({ pitch: vistaInicialRef.current.pitch ?? 0, bearing: vistaInicialRef.current.bearing ?? 0, duration });
      encuadrar();
    } else {
      map.easeTo({ ...vistaInicialRef.current, duration });
    }
  }, [relieve3D, base, filtro, encuadrar]);

  const nombreFiltro = leyenda.find((e) => e.cientifico === filtro)?.nombre;

  return (
    <div className="mapa-marco mapa-marco-pagina">
      <div
        ref={contenedorRef}
        className="mapa-lienzo"
        role="region"
        aria-label={`Mapa ${base === 'satelite' ? 'satelital' : 'de calles'}${relieve3D ? ' con relieve 3D' : ''}${nombreFiltro ? `: ${nombreFiltro}` : ': árboles del parque'}`}
      />
      {!mapaListo && !errorMapa && (
        <div className="mapa-cargando">
          <ArbolitoLoader etiqueta="Cargando mapa" />
        </div>
      )}
      {errorMapa && <p className="mapa-error" role="status">{errorMapa}</p>}
      {aviso && <p className="mapa-aviso" role="status">{aviso}</p>}

      <ControlesMapa
        clase="mapa-controles-flotantes"
        base={base}
        onBase={setBase}
        relieve3D={relieve3D}
        onRelieve={() => setRelieve3D((v) => !v)}
        deshabilitado={Boolean(errorMapa)}
      />

      {leyenda.length > 0 && (
        // Leyenda flotante: cada especie con su color y cuántos árboles tiene.
        // Tocar una muestra solo esa especie; tocarla de nuevo, todas.
        <div className={`mapa-leyenda${leyendaAbierta ? '' : ' mapa-leyenda-plegada'}`}>
          <button
            type="button"
            className="mapa-leyenda-cabecera"
            aria-expanded={leyendaAbierta}
            aria-controls="mapa-leyenda-lista"
            onClick={() => setLeyendaAbierta((v) => !v)}
          >
            Especies <span className="mapa-leyenda-cuenta">{leyenda.length}</span>
            <LuChevronDown className="mapa-leyenda-flecha" aria-hidden="true" />
          </button>
          {leyendaAbierta && (
            <ul id="mapa-leyenda-lista" className="mapa-leyenda-lista" aria-label="Mostrar en el mapa">
              {leyenda.map(({ id, nombre, cientifico, color, total: cuantos }) => {
                const activa = filtro === cientifico;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`mapa-leyenda-especie${activa ? ' activa' : ''}${filtro && !activa ? ' atenuada' : ''}`}
                      aria-pressed={activa}
                      onClick={() => onFiltro(activa ? null : cientifico)}
                    >
                      <span className="mapa-leyenda-color" style={{ background: color }} aria-hidden="true" />
                      <span className="mapa-leyenda-nombre">{nombre}</span>
                      <span className="mapa-leyenda-total">{cuantos}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

MapaParque.propTypes = {
  /** FeatureCollection de todos los árboles, ya coloreados por especie (null mientras carga). */
  coleccion: PropTypes.object,
  /** Una entrada por especie: { id, nombre, cientifico, color, total }. */
  leyenda: PropTypes.arrayOf(PropTypes.object).isRequired,
  /** Nombre científico de la especie que se muestra (null: todas). */
  filtro: PropTypes.string,
  /** Árbol que se abre al cargar. */
  arbolId: PropTypes.string,
  /** Cambia la especie mostrada (null: todas). */
  onFiltro: PropTypes.func.isRequired,
  /** Ref que recibe { camara(), avisar(texto), fijada(vista) } para fijar la vista inicial. */
  controlRef: PropTypes.shape({ current: PropTypes.any }),
};
