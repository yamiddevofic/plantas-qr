import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LuArrowLeft, LuBookOpen, LuPin } from 'react-icons/lu';
import { fetchIndividuos, guardarVistaMapa, obtenerPlanta } from '../../api';
import { colorearPorEspecie } from '../../mapa/capasIndividuos';
import { aplicarSeo } from '../../seo';
import useAccionProtegida from '../../hooks/useAccionProtegida';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import BuscadorBarra from '../organisms/BuscadorBarra';
import MapaParque from '../organisms/MapaParque';

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Página «Mapa del parque» (#/mapa): todos los árboles, o los de una especie con
 * `?especie=<id>` (así abre desde la ficha). `&arbol=<id>` abre ese árbol. La
 * especie se cambia con el selector o tocando la leyenda; la dirección se
 * actualiza sin recargar, para poder compartirla.
 */
export default function PaginaMapa({ especieId = null, arbolId = null }) {
  const [coleccion, setColeccion] = useState(null);
  const [error, setError] = useState(null);
  // Especie elegida en la página (nombre científico; null = todas). Mientras no se
  // elija, vale la de la dirección.
  const [elegido, setElegido] = useState(undefined);
  // Especie de la dirección que no tiene árboles propios (ficha hermana): su
  // nombre científico se pregunta al servidor.
  const [remoto, setRemoto] = useState({ listo: false, cientifico: null });
  const controlRef = useRef(null);
  const { ejecutar, dialogo } = useAccionProtegida();

  useEffect(() => {
    const control = new AbortController();
    fetchIndividuos(undefined, { signal: control.signal })
      .then(setColeccion)
      .catch((e) => {
        if (e.name !== 'AbortError') setError('No se pudieron cargar los árboles del parque.');
      });
    return () => control.abort();
  }, []);

  // Cada árbol con el color de su especie; solo los que tienen especie.
  const { coloreada, leyenda } = useMemo(() => {
    if (!coleccion) return { coloreada: null, leyenda: [] };
    const r = colorearPorEspecie(coleccion);
    const features = r.coleccion.features.filter((f) => f.properties.color);
    return { coloreada: { ...r.coleccion, features }, leyenda: r.leyenda };
  }, [coleccion]);

  // La especie de la dirección se busca entre los árboles (por su ficha) y, si
  // es una ficha hermana sin árboles propios, por su nombre científico.
  const directa = especieId ? leyenda.find((e) => e.id === especieId) : null;
  useEffect(() => {
    if (!especieId || !coleccion || directa) return undefined;
    let cancelado = false;
    obtenerPlanta(especieId)
      .then((p) => { if (!cancelado) setRemoto({ listo: true, cientifico: p?.nombre?.cientifico ?? null }); })
      .catch(() => { if (!cancelado) setRemoto({ listo: true, cientifico: null }); });
    return () => { cancelado = true; };
  }, [especieId, coleccion, directa]);

  const filtro = elegido !== undefined ? elegido : (directa?.cientifico ?? remoto.cientifico ?? null);
  const filtroResuelto = !especieId || Boolean(directa) || remoto.listo || elegido !== undefined;

  const entrada = leyenda.find((e) => e.cientifico === filtro) ?? null;

  // Cambia la especie y la dirección (sin recargar la página).
  const elegir = (cientifico) => {
    setElegido(cientifico);
    const id = leyenda.find((e) => e.cientifico === cientifico)?.id;
    window.history.replaceState(window.history.state, '', id ? `#/mapa?especie=${encodeURIComponent(id)}` : '#/mapa');
  };

  useEffect(() => {
    aplicarSeo({
      titulo: entrada ? `${entrada.nombre} en el mapa · PlantaQR` : 'Mapa del parque · PlantaQR',
      descripcion: 'Mapa de los árboles del Parque principal de Chitagá: dónde está cada uno y a qué especie pertenece.',
      ruta: '/#/mapa',
    });
  }, [entrada]);

  // Totales de lo que se ve: árboles (un punto de grupo cuenta varios) y puntos.
  const visibles = (coloreada?.features ?? []).filter((f) => !filtro || f.properties.especie?.nombre?.cientifico === filtro);
  const arboles = visibles.reduce((s, f) => s + (f.properties.cantidad ?? 1), 0);
  const puntos = visibles.length;

  // Volver a donde se vino: la ficha (si abrió con una especie) o el catálogo.
  const volver = especieId ? `#/planta/${especieId}` : '#/galeria';

  async function fijarVista() {
    const camara = controlRef.current?.camara();
    if (!camara) return;
    try {
      const vista = await ejecutar(
        (password) => guardarVistaMapa(camara, password),
        'El mapa abrirá con la posición, el zoom, la rotación y la inclinación que tiene ahora. Se requiere la contraseña de administrador.',
      );
      controlRef.current?.fijada(vista);
    } catch (e) {
      if (!e.cancelado) controlRef.current?.avisar(e.message);
    }
  }

  const listo = coloreada && filtroResuelto;

  return (
    <div className="mapa-pagina">
      <header className="mapa-pagina-barra">
        <a className="mapa-pagina-volver" href={volver} aria-label={especieId ? 'Volver a la ficha' : 'Volver al catálogo'}>
          <LuArrowLeft aria-hidden="true" />
        </a>
        <div className="mapa-pagina-titulo">
          <h1>{entrada ? entrada.nombre : 'Árboles del parque'}</h1>
          {listo && (
            <p className="mapa-pagina-resumen">
              {plural(arboles, 'árbol', 'árboles')}
              {puntos !== arboles && ` · ${plural(puntos, 'punto', 'puntos')}`}
            </p>
          )}
        </div>
        <BuscadorBarra />
        {leyenda.length > 0 && (
          <label className="mapa-pagina-filtro">
            <span className="sr-only">Especie que se muestra</span>
            <select value={filtro ?? ''} onChange={(e) => elegir(e.target.value || null)}>
              <option value="">Todas las especies ({leyenda.reduce((s, e) => s + e.total, 0)})</option>
              {leyenda.map((e) => (
                <option key={e.id} value={e.cientifico}>{e.nombre} ({e.total})</option>
              ))}
            </select>
          </label>
        )}
        <div className="mapa-pagina-acciones">
          {entrada && (
            <a className="mapa-pagina-boton" href={`#/planta/${entrada.id}`} title="Ver ficha de la especie">
              <LuBookOpen aria-hidden="true" />
              <span>Ver ficha</span>
            </a>
          )}
          <button
            type="button"
            className="mapa-pagina-boton solo-icono"
            onClick={fijarVista}
            disabled={!listo}
            aria-label="Fijar esta vista como inicial (administrador)"
            title="Fijar esta vista como inicial (administrador)"
          >
            <LuPin aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="mapa-pagina-mapa" id="app-main">
        {error && <p className="mapa-error" role="alert">{error}</p>}
        {!error && !listo && (
          <div className="mapa-cargando">
            <ArbolitoLoader etiqueta="Cargando mapa" />
          </div>
        )}
        {!error && listo && coloreada.features.length === 0 && (
          <p className="mapa-error" role="status">Aún no hay árboles registrados en el mapa.</p>
        )}
        {!error && listo && coloreada.features.length > 0 && (
          <MapaParque
            coleccion={coloreada}
            leyenda={leyenda}
            filtro={filtro}
            arbolId={arbolId}
            onFiltro={elegir}
            controlRef={controlRef}
          />
        )}
      </main>
      {dialogo}
    </div>
  );
}

PaginaMapa.propTypes = {
  /** Ficha de la especie con la que abre (de ?especie=). */
  especieId: PropTypes.string,
  /** Árbol que se abre al cargar (de ?arbol=). */
  arbolId: PropTypes.string,
};
