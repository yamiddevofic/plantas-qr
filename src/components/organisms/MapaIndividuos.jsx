import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LuX } from 'react-icons/lu';
import { useTema } from '../../tema.js';
import {
  CAMARA_3D,
  CAPA_PUNTOS,
  ZOOM_INICIAL_MAX,
  POSICION_SELECCION_Y,
  agregarCapas,
  aplicarRelieve,
  contenidoPopup,
  mapaEnPantallaCompleta,
  marcar,
  prefiereMenosMovimiento,
} from '../../mapa/capasIndividuos';
import SeccionFicha from '../molecules/SeccionFicha';
import ControlesMapa from '../molecules/ControlesMapa';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import { IconoMapa } from '../atoms/IconosInicio';

export default function MapaIndividuos({ coleccion = null, nombreEspecie, pedido = null, onSeleccion }) {
  const { tema } = useTema();
  const contenedorRef = useRef(null);
  const seccionRef = useRef(null);
  const mapaRef = useRef(null);
  const libRef = useRef(null);
  const limitesRef = useRef(null);
  const popupRef = useRef(null);
  const seleccionRef = useRef(null);
  const cerrarRef = useRef(null);

  const datos = coleccion;
  const estado = coleccion?.features?.length ? 'listo' : 'vacio';
  const [visible, setVisible] = useState(false);
  const [mapaListo, setMapaListo] = useState(false);
  const [errorMapa, setErrorMapa] = useState(null);
  // Sin conexión el mapa de calles no carga (sus teselas vectoriales no se guardan);
  // el satélite sí puede estar guardado (mapa del parque o zonas ya vistas).
  const [base, setBase] = useState(() => (navigator.onLine ? 'mapa' : 'satelite'));
  const [relieve3D, setRelieve3D] = useState(false);
  // Pantalla completa pedida desde "Ver en el mapa". Se usa el modo pseudo de
  // MapLibre (la API de pantalla completa del navegador exige un gesto reciente
  // y no existe en iPhone) y las clases de maplibregl se tocan con classList
  // porque el contenedor lo gestiona la librería.
  const [pantalla, setPantalla] = useState(false);
  const [pedidoAtendido, setPedidoAtendido] = useState(null);
  // Cargar el mapa ya, aunque la sección aún no esté cerca de la pantalla.
  const cargar = visible || Boolean(pedido?.pantallaCompleta);

  const onSeleccionRef = useRef(onSeleccion);
  useEffect(() => {
    onSeleccionRef.current = onSeleccion;
  }, [onSeleccion]);

  // Los manejadores de MapLibre viven fuera del ciclo de React: leen de refs.
  const vistaRef = useRef({ base, tema, relieve3D });
  useEffect(() => {
    vistaRef.current = { base, tema, relieve3D };
  }, [base, tema, relieve3D]);

  const total = datos?.features?.length ?? 0;

  // 1. Los datos (GeoJSON de los individuos) llegan de ContenidoFicha, que también
  //    los lista en "Datos rápidos".

  // 2. Solo se descarga MapLibre cuando la sección se acerca al viewport.
  useEffect(() => {
    if (estado !== 'listo' || cargar) return undefined;
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
  }, [estado, cargar]);

  // Un pedido nuevo con pantalla completa abre el modo (se ajusta durante el
  // render, que es lo que React recomienda para derivar estado de props).
  if (pedido?.pantallaCompleta && pedido.vez !== pedidoAtendido) {
    setPedidoAtendido(pedido.vez);
    setPantalla(true);
  }

  // Cierra la pantalla completa; la entrada que se añadió al historial (para que
  // "atrás" cierre el mapa en vez de salir de la ficha) se retira aquí.
  const cerrarPantalla = useCallback(() => {
    setPantalla(false);
    if (window.history.state?.plantaqrMapa) window.history.back();
  }, []);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!pantalla || !contenedor) return undefined;
    contenedor.classList.add('maplibregl-pseudo-fullscreen');
    const cuerpo = document.body;
    const overflowPrevio = cuerpo.style.overflow;
    cuerpo.style.overflow = 'hidden';
    if (!window.history.state?.plantaqrMapa) window.history.pushState({ plantaqrMapa: true }, '');
    const alTeclear = (e) => { if (e.key === 'Escape') cerrarPantalla(); };
    const alVolver = () => { if (!window.history.state?.plantaqrMapa) setPantalla(false); };
    window.addEventListener('keydown', alTeclear);
    window.addEventListener('popstate', alVolver);
    cerrarRef.current?.focus({ preventScroll: true });
    mapaRef.current?.resize();
    return () => {
      contenedor.classList.remove('maplibregl-pseudo-fullscreen');
      cuerpo.style.overflow = overflowPrevio;
      window.removeEventListener('keydown', alTeclear);
      window.removeEventListener('popstate', alVolver);
      mapaRef.current?.resize();
    };
  }, [pantalla, cerrarPantalla]);

  const seleccionar = useCallback((feature, { centrar = false } = {}) => {
    const map = mapaRef.current;
    if (!map || !feature) return;
    const id = feature.properties.id;
    const coordenadas = feature.geometry.coordinates;

    if (seleccionRef.current !== id) marcar(map, seleccionRef.current, false);
    marcar(map, id, true);
    seleccionRef.current = id;
    onSeleccionRef.current?.(id);

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
    if (estado !== 'listo' || !cargar || !contenedorRef.current) return undefined;
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
          onSeleccionRef.current?.(null);
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
  }, [estado, cargar, datos, seleccionar]);

  // Pedido desde la galería de individuos. Con `pantallaCompleta` el mapa ocupa
  // toda la ventana y se centra en ese árbol; si no, quien pide desplaza la página
  // hasta el mapa (lo que dispara su carga). Se atiende cuando el mapa está listo.
  useEffect(() => {
    if (!pedido?.id || !mapaListo) return;
    const feature = datos?.features?.find((f) => f.properties.id === pedido.id);
    if (!feature) return;
    if (pedido.pantallaCompleta) {
      const map = mapaRef.current;
      seleccionar(feature);
      map.resize();
      map.easeTo({
        center: feature.geometry.coordinates,
        // El punto un poco por debajo del centro: la ficha cabe encima de él. Con la
        // ventana entera sobra espacio, así que no hace falta bajarlo tanto como en
        // el mapa pequeño de la página.
        offset: [0, map.getContainer().clientHeight * 0.1],
        zoom: Math.max(map.getZoom(), 18.5),
        duration: prefiereMenosMovimiento() ? 0 : 700,
      });
      return;
    }
    seleccionar(feature, { centrar: true });
    // Se repite el desplazamiento: el primero (desde la lista) puede quedarse corto
    // porque la sección cambia de alto mientras el mapa termina de cargar.
    seccionRef.current?.scrollIntoView({ behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth', block: 'center' });
  }, [pedido, mapaListo, datos, seleccionar]);

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

  if (estado === 'vacio') return null;

  const titulo = `${total} ${total === 1 ? 'individuo' : 'individuos'} en el parque`;

  return (
    <div ref={seccionRef} className="detalle-mapa">
      <SeccionFicha id="ficha-mapa" antetitulo="Mapa" titulo="Encuéntralo en el mapa" icono={IconoMapa}>
        <p className="detalle-parrafo detalle-parrafo-suave">
          Toca un punto para ver el árbol; con relieve 3D ves las montañas que rodean el pueblo.
        </p>

        <ControlesMapa
          base={base}
          onBase={setBase}
          relieve3D={relieve3D}
          onRelieve={() => setRelieve3D((v) => !v)}
          deshabilitado={Boolean(errorMapa)}
        />

        <div className={`mapa-marco${pantalla ? ' mapa-marco-pantalla' : ''}`}>
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
          {pantalla && (
            <button ref={cerrarRef} type="button" className="mapa-cerrar-pantalla" onClick={cerrarPantalla}>
              <LuX aria-hidden="true" />
              Cerrar mapa
            </button>
          )}
        </div>
      </SeccionFicha>
    </div>
  );
}

MapaIndividuos.propTypes = {
  /** FeatureCollection de los individuos de la especie. */
  coleccion: PropTypes.object,
  /** { id, vez, pantallaCompleta }: pide seleccionar y centrar un individuo (vez cambia en cada pedido). */
  pedido: PropTypes.shape({ id: PropTypes.string, vez: PropTypes.number, pantallaCompleta: PropTypes.bool }),
  /** Avisa qué individuo está seleccionado (o null). */
  onSeleccion: PropTypes.func,
  nombreEspecie: PropTypes.string.isRequired,
};
