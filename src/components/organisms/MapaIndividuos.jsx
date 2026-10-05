import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LuChevronDown, LuX } from 'react-icons/lu';
import { useTema } from '../../tema.js';
import { obtenerVistaMapa } from '../../api';
import {
  CAMARA_3D,
  VISTA_INICIAL,
  POSICION_SELECCION_Y,
  agregarCapas,
  animarPuntos,
  aplicarRelieve,
  colorearPorEspecie,
  contenidoPopup,
  contenidoPopupEspecie,
  individuoEn,
  mapaEnPantallaCompleta,
  marcar,
  prefiereMenosMovimiento,
  resaltar,
} from '../../mapa/capasIndividuos';
import SeccionFicha from '../molecules/SeccionFicha';
import ControlesMapa from '../molecules/ControlesMapa';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import { IconoMapa } from '../atoms/IconosInicio';

/**
 * Mapa de individuos. En la ficha muestra los de una especie (`nombreEspecie`);
 * con `general` muestra los de todas, y el popup de cada árbol enlaza a la ficha
 * de su especie.
 */
export default function MapaIndividuos({ coleccion = null, nombreEspecie = '', general = false, pedido = null, onSeleccion, controlRef = null }) {
  const { tema } = useTema();
  const contenedorRef = useRef(null);
  const seccionRef = useRef(null);
  const mapaRef = useRef(null);
  const libRef = useRef(null);
  const limitesRef = useRef(null);
  const popupRef = useRef(null);
  const seleccionRef = useRef(null);
  const cerrarRef = useRef(null);
  // Vista con la que abre el mapa: la que fijó el administrador para todas las
  // fichas o, mientras llega (o si no hay), la de la app.
  const vistaInicialRef = useRef(VISTA_INICIAL);
  // La persona ya movió el mapa: la vista guardada que llegue tarde no la pisa.
  const movidoRef = useRef(false);
  const [aviso, setAviso] = useState(null);
  // La leyenda del mapa general abre desplegada salvo en pantallas bajas.
  const [leyendaAbierta, setLeyendaAbierta] = useState(() => !window.matchMedia?.('(max-height: 560px)').matches);

  // Cada individuo lleva el color de su especie, igual en el mapa general y en
  // el de la ficha; la leyenda solo se muestra en el general.
  const { coleccion: datos, leyenda } = useMemo(() => {
    const coloreada = colorearPorEspecie(coleccion);
    if (!general) return { coleccion: coloreada.coleccion, leyenda: [] };
    // En el general solo se muestran individuos con especie (el popup enlaza a ella).
    const features = coloreada.coleccion.features.filter((f) => f.properties.color);
    return { coleccion: { ...coloreada.coleccion, features }, leyenda: coloreada.leyenda };
  }, [coleccion, general]);
  const estado = datos?.features?.length ? 'listo' : 'vacio';
  const [visible, setVisible] = useState(false);
  const [mapaListo, setMapaListo] = useState(false);
  const [errorMapa, setErrorMapa] = useState(null);
  // Abre en satélite: se ven los árboles sobre el terreno real, y además funciona sin
  // conexión (el mapa de calles no: sus teselas vectoriales no se guardan). La
  // persona puede pasar a calles con el interruptor del mapa.
  // El mapa general abre en calles; el de la ficha, en satélite.
  const [base, setBase] = useState(general ? 'mapa' : 'satelite');
  const [relieve3D, setRelieve3D] = useState(false);
  // Pantalla completa pedida desde "Ver en el mapa". Se usa el modo pseudo de
  // MapLibre (la API de pantalla completa del navegador exige un gesto reciente
  // y no existe en iPhone) y las clases de maplibregl se tocan con classList
  // porque el contenedor lo gestiona la librería.
  const [pantalla, setPantalla] = useState(false);
  const [pedidoAtendido, setPedidoAtendido] = useState(null);
  // Capa base que había antes de abrir la pantalla completa, para devolverla al cerrar.
  const [baseAntes, setBaseAntes] = useState(null);
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

  useEffect(() => {
    let cancelado = false;
    obtenerVistaMapa().then((vista) => {
      if (cancelado || !vista) return;
      vistaInicialRef.current = vista;
      const map = mapaRef.current;
      if (map && !movidoRef.current && !seleccionRef.current && !vistaRef.current.relieve3D) map.jumpTo(vista);
    });
    return () => { cancelado = true; };
  }, []);

  // El menú de la ficha lee la cámara actual para fijarla como vista de todos los mapas.
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
      setAviso('Listo: todos los mapas de las fichas abrirán con esta vista.');
    },
  }), []);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

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

  // Un pedido nuevo con pantalla completa abre el modo, y en vista satelital: de
  // cerca se distingue el árbol entre la vegetación y los edificios (se ajusta
  // durante el render, que es lo que React recomienda para derivar estado de props).
  if (pedido?.pantallaCompleta && pedido.vez !== pedidoAtendido) {
    setPedidoAtendido(pedido.vez);
    setPantalla(true);
    setBaseAntes(base);
    setBase('satelite');
  }

  // Sale de la pantalla completa. Devuelve la capa base que había, salvo que la
  // persona haya elegido otra con el interruptor del mapa grande (`baseAntes` pasa
  // a null). Si se cierra desde la página, también se retira la entrada que se
  // añadió al historial (para que "atrás" cierre el mapa en vez de salir de la ficha).
  const salirPantalla = (retirarHistorial) => {
    setPantalla(false);
    if (baseAntes) setBase(baseAntes);
    if (retirarHistorial && window.history.state?.plantaqrMapa) window.history.back();
  };
  // El efecto de abajo usa siempre la versión más reciente sin volver a montarse.
  const salirRef = useRef(null);
  useEffect(() => { salirRef.current = salirPantalla; });
  const cerrarPantalla = useCallback(() => salirRef.current?.(true), []);
  const elegirBaseEnPantalla = (id) => {
    setBaseAntes(null);
    setBase(id);
  };

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!pantalla || !contenedor) return undefined;
    contenedor.classList.add('maplibregl-pseudo-fullscreen');
    const cuerpo = document.body;
    const overflowPrevio = cuerpo.style.overflow;
    cuerpo.style.overflow = 'hidden';
    if (!window.history.state?.plantaqrMapa) window.history.pushState({ plantaqrMapa: true }, '');
    const alTeclear = (e) => { if (e.key === 'Escape') cerrarPantalla(); };
    const alVolver = () => { if (!window.history.state?.plantaqrMapa) salirRef.current?.(false); };
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

  const seleccionar = useCallback((elegido, { centrar = false } = {}) => {
    const map = mapaRef.current;
    if (!map || !elegido) return;
    const id = elegido.properties.id;
    // MapLibre entrega las propiedades anidadas (la especie) como texto: se usa la
    // feature original del GeoJSON.
    const feature = datos?.features?.find((f) => f.properties.id === id) ?? elegido;
    const coordenadas = feature.geometry.coordinates;
    const especie = feature.properties.especie;
    const enlace = general && especie?._id ? `#/planta/${especie._id}` : null;
    const contenido = general
      ? contenidoPopupEspecie(feature.properties, especie, { enlace })
      : contenidoPopup(feature.properties, nombreEspecie, { enlace });

    if (seleccionRef.current !== id) marcar(map, seleccionRef.current, false);
    marcar(map, id, true);
    seleccionRef.current = id;
    onSeleccionRef.current?.(id);

    popupRef.current
      .setLngLat(coordenadas)
      .setDOMContent(contenido);
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
  }, [datos, general, nombreEspecie]);

  // 3. Crear el mapa una vez que hay datos y la sección es visible.
  useEffect(() => {
    if (estado !== 'listo' || !cargar || !contenedorRef.current) return undefined;
    let cancelado = false;
    let map;
    let detenerAnimacion = () => {};
    let cancelarCierrePopup = () => {};
    // Popup fijado con un clic: no se cierra al salir el cursor.
    let fijado = false;

    import('../../mapa/maplibre.js')
      .then((lib) => {
        if (cancelado || !contenedorRef.current) return;
        libRef.current = lib;

        const limites = new lib.LngLatBounds();
        for (const f of datos.features) limites.extend(f.geometry.coordinates);
        limitesRef.current = limites;

        const vista = vistaRef.current;
        map = new lib.Map({
          container: contenedorRef.current,
          style: vista.base === 'satelite' ? lib.estiloSatelite() : lib.ESTILOS[vista.tema] || lib.ESTILOS.claro,
          ...vistaInicialRef.current,
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
          offset: 18,
          maxWidth: '260px',
          focusAfterOpen: false,
          autoPan: false,
          // El clic en el mapa lo resuelve el manejador de abajo: con closeOnClick
          // el mismo clic que abre otro árbol cerraba el popup y había que tocar dos veces.
          closeOnClick: false,
        });
        popupRef.current.on('close', () => {
          fijado = false;
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
        // Con ratón el popup se abre al pasar sobre el punto (sin clic) y se cierra
        // al salir, salvo que el cursor pase al popup o la persona haga clic en el
        // punto, que lo deja fijo. En pantallas táctiles se abre con un toque.
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
        // Un toque cerca de un punto lo abre (con margen para el dedo); en el
        // vacío, cierra el popup.
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
          // Sobre el popup el cursor sigue «dentro»: no se programa el cierre.
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
  //    vista inicial (inclinada sobre el parque).
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
    } else {
      map.easeTo({ ...vistaInicialRef.current, duration });
    }
  }, [relieve3D, base]);

  if (estado === 'vacio') return null;

  const titulo = `${total} ${total === 1 ? 'individuo' : 'individuos'} en el parque`;

  return (
    <div ref={seccionRef} className={`detalle-mapa${general ? ' mapa-general' : ''}`}>
      <SeccionFicha
        id={general ? 'galeria-mapa' : 'ficha-mapa'}
        antetitulo={general ? 'Mapa del parque' : 'Mapa'}
        titulo={general ? 'Explora los árboles en el mapa' : 'Encuéntralo en el mapa'}
        icono={IconoMapa}
      >
        <p className="detalle-parrafo detalle-parrafo-suave">
          {general
            ? `${titulo}. Toca un punto para ver el árbol y abrir la ficha de su especie,.`
            : 'Toca un punto para ver el árbol; con relieve 3D ves las montañas que rodean el pueblo.'}
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
            aria-label={`Mapa ${base === 'satelite' ? 'satelital' : 'de calles'}${relieve3D ? ' con relieve 3D' : ''}: ${titulo}${general ? '' : ` de ${nombreEspecie}`}`}
          />
          {!mapaListo && !errorMapa && (
            <div className="mapa-cargando">
              <ArbolitoLoader etiqueta="Cargando mapa" />
            </div>
          )}
          {errorMapa && <p className="mapa-error" role="status">{errorMapa}</p>}
          {aviso && <p className="mapa-aviso" role="status">{aviso}</p>}
          {leyenda.length > 0 && (
            // Recuadro flotante con el color de cada especie; plegable para no tapar el mapa.
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
                <ul id="mapa-leyenda-lista" className="mapa-leyenda-lista" aria-label="Especies en el mapa">
                  {leyenda.map(({ id, nombre, color, total: cuantos }) => (
                    <li key={id}>
                      <a href={`#/planta/${id}`}>
                        <span className="mapa-leyenda-color" style={{ background: color }} aria-hidden="true" />
                        <span className="mapa-leyenda-nombre">{nombre}</span>
                        <span className="mapa-leyenda-total">{cuantos}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {pantalla && (
            <>
              <button ref={cerrarRef} type="button" className="mapa-cerrar-pantalla" onClick={cerrarPantalla}>
                <LuX aria-hidden="true" />
                Cerrar mapa
              </button>
              {/* Mismo interruptor de la página; sin relieve 3D, que recentraría la cámara. */}
              <ControlesMapa
                clase="mapa-controles-flotantes"
                base={base}
                onBase={elegirBaseEnPantalla}
                deshabilitado={Boolean(errorMapa)}
              />
            </>
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
  /** Nombre de la especie (mapa de la ficha). */
  nombreEspecie: PropTypes.string,
  /** Mapa de todas las especies: el popup enlaza a la ficha de cada una. */
  general: PropTypes.bool,
  /** Ref que recibe { camara(), avisar(texto), fijada(vista) } para fijar la vista de todos los mapas. */
  controlRef: PropTypes.shape({ current: PropTypes.any }),
};
