import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LuArrowLeft, LuPlus, LuSearch } from 'react-icons/lu';
import {
  actualizarIndividuo,
  crearIndividuo,
  eliminarIndividuo,
  fetchIndividuos,
  fetchPlantas,
  subirFotoIndividuo,
} from '../../api';
import useAccionProtegida from '../../hooks/useAccionProtegida';
import useEnLinea from '../../hooks/useEnLinea';
import { agruparEspecies, parqueMasUsado } from '../../individuos';
import {
  aplicarCola,
  descartar,
  descartarOperacion,
  encolarCrear,
  encolarEditar,
  encolarEliminar,
  encolarFoto,
  esIdLocal,
  guardarCola,
  leerCola,
  marcarError,
  marcarErrorOperacion,
  nuevoIdLocal,
  reasignarId,
} from '../../offline/cola';
import { borrarFoto, guardarFoto, leerFoto, moverFoto } from '../../offline/fotos';
import { aplicarSeo } from '../../seo';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import Boton from '../atoms/Boton';
import EstadoBox from '../atoms/EstadoBox';
import PiePagina from '../molecules/PiePagina';
import BannerSincronizacion from '../organisms/BannerSincronizacion';
import FormularioIndividuo from '../organisms/FormularioIndividuo';
import TarjetaIndividuo from '../organisms/TarjetaIndividuo';

const sinTildes = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function PaginaIndividuos() {
  const [individuos, setIndividuos] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recargar, setRecargar] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEspecie, setFiltroEspecie] = useState('');
  const [formulario, setFormulario] = useState(null); // { individuo: feature | null }
  const [aviso, setAviso] = useState(null);
  const [cola, setCola] = useState(leerCola);
  const [sincronizando, setSincronizando] = useState(false);
  const enLinea = useEnLinea();
  const colaRef = useRef(cola);
  const sincronizandoRef = useRef(false);
  const autoIntentadoRef = useRef(false);
  const { ejecutar, dialogo } = useAccionProtegida();

  // La cola vive en el dispositivo para sobrevivir a cerrar la página sin conexión.
  useEffect(() => {
    colaRef.current = cola;
    guardarCola(cola);
  }, [cola]);

  useEffect(() => {
    aplicarSeo({
      titulo: 'Gestión de individuos · PlantaQR',
      descripcion: 'Registra, edita y elimina los árboles geolocalizados del Parque principal de Chitagá.',
      ruta: '/#/individuos',
    });
  }, []);

  useEffect(() => {
    const control = new AbortController();
    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const [coleccion, listaPlantas] = await Promise.all([
          fetchIndividuos(undefined, { signal: control.signal }),
          fetchPlantas(),
        ]);
        setIndividuos(coleccion.features);
        setPlantas(listaPlantas);
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message);
      }
      if (!control.signal.aborted) setCargando(false);
    }
    cargar();
    return () => control.abort();
  }, [recargar]);

  // Fotos aún sin subir, guardadas en el teléfono: id → URL temporal para mostrarlas.
  const [fotosLocales, setFotosLocales] = useState({});
  const idsConFoto = cola.filter((op) => op.tipo === 'foto').map((op) => op.id).sort().join('|');
  useEffect(() => {
    let cancelado = false;
    const urls = {};
    (async () => {
      for (const id of idsConFoto ? idsConFoto.split('|') : []) {
        try {
          const blob = await leerFoto(id);
          if (blob) urls[id] = URL.createObjectURL(blob);
        } catch {
          // Sin IndexedDB no hay vista previa; la operación sigue en la cola.
        }
      }
      if (cancelado) Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
      else setFotosLocales(urls);
    })();
    return () => {
      cancelado = true;
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [idsConFoto]);

  const especies = useMemo(() => agruparEspecies(plantas), [plantas]);
  // Lo guardado en el servidor más los cambios aún sin enviar.
  const vista = useMemo(() => {
    const conCambios = aplicarCola(individuos, cola, plantas);
    if (!Object.keys(fotosLocales).length) return conCambios;
    return conCambios.map((f) => {
      const local = fotosLocales[f.properties.id];
      if (!local) return f;
      return { ...f, properties: { ...f.properties, imagen: local, pendiente: f.properties.pendiente ?? 'foto' } };
    });
  }, [individuos, cola, plantas, fotosLocales]);

  // Individuo → especie agrupada, para filtrar sin importar qué ficha hermana tenga.
  const grupoPorFicha = useMemo(() => {
    const mapa = new Map();
    for (const e of especies) for (const id of e.ids) mapa.set(id, e.id);
    return mapa;
  }, [especies]);

  const visibles = useMemo(() => {
    const texto = sinTildes(busqueda.trim());
    return vista.filter((f) => {
      const { codigoArbol, parque, especie } = f.properties;
      if (filtroEspecie && grupoPorFicha.get(especie?._id) !== filtroEspecie) return false;
      if (!texto) return true;
      return sinTildes(`${codigoArbol} ${parque} ${especie?.nombre?.comun} ${especie?.nombre?.cientifico}`).includes(texto);
    });
  }, [vista, busqueda, filtroEspecie, grupoPorFicha]);

  // Actualiza la lista desde el servidor sin pantalla de carga; tras cada cambio
  // también deja al día la copia que usa el service worker sin conexión.
  const refrescar = useCallback(async () => {
    try {
      const coleccion = await fetchIndividuos();
      setIndividuos(coleccion.features);
    } catch {
      // Sin red: se conserva lo que ya hay en pantalla.
    }
  }, []);

  // Guarda en la cola (y la foto en el teléfono) para enviarlo con conexión.
  const ponerEnCola = useCallback(async ({ editarId, datos, foto, codigoArbol }) => {
    const id = editarId ?? (datos ? nuevoIdLocal() : null);
    if (foto) await guardarFoto(id, foto);
    setCola((c) => {
      let siguiente = c;
      if (datos) siguiente = editarId ? encolarEditar(siguiente, id, datos) : encolarCrear(siguiente, datos, id);
      if (foto) siguiente = encolarFoto(siguiente, id, codigoArbol ?? datos?.codigoArbol);
      return siguiente;
    });
  }, []);

  const guardar = useCallback(async (datos, foto) => {
    const editando = formulario?.individuo;
    const id = editando?.properties.id;
    const enCola = () => ponerEnCola({ editarId: id, datos, foto }).then(() => {
      setAviso({
        tipo: 'ok',
        texto: `${datos.codigoArbol}${foto ? ' y su foto' : ''} guardado en este dispositivo; se enviará cuando haya conexión.`,
      });
      setFormulario(null);
    });

    // Sin red, o sobre algo que aún está en la cola, el cambio se suma a la cola.
    if (!enLinea || (id && cola.some((op) => op.id === id))) {
      await enCola();
      return;
    }

    const descripcion = editando
      ? `Para guardar los cambios de ${editando.properties.codigoArbol} necesitas la contraseña de administrador.`
      : `Para registrar ${datos.codigoArbol} necesitas la contraseña de administrador.`;
    let resultado;
    try {
      resultado = await ejecutar(async (password) => {
        const feature = editando
          ? await actualizarIndividuo(id, datos, password)
          : await crearIndividuo(datos, password);
        if (!foto) return { feature };
        // El individuo ya quedó guardado: si la foto falla no se debe repetir todo.
        try {
          return { feature: await subirFotoIndividuo(feature.properties.id, foto, password) };
        } catch (e) {
          return { feature, errorFoto: e };
        }
      }, descripcion);
    } catch (e) {
      if (e.sinRed) {
        await enCola();
        return;
      }
      throw e;
    }

    const { feature, errorFoto } = resultado;
    setIndividuos((prev) => [...prev.filter((f) => f.properties.id !== feature.properties.id), feature]);
    let texto = `${feature.properties.codigoArbol} ${editando ? 'actualizado' : 'registrado'} correctamente.`;
    if (errorFoto?.sinRed) {
      await ponerEnCola({ editarId: feature.properties.id, foto, codigoArbol: feature.properties.codigoArbol });
      texto += ' La foto se subirá cuando haya conexión.';
    } else if (errorFoto) {
      texto += ` No se pudo subir la foto: ${errorFoto.message}`;
    }
    setAviso({ tipo: errorFoto && !errorFoto.sinRed ? 'error' : 'ok', texto });
    setFormulario(null);
    refrescar();
  }, [ejecutar, formulario, enLinea, cola, refrescar, ponerEnCola]);

  const eliminar = useCallback(async (feature) => {
    const { id, codigoArbol } = feature.properties;
    setAviso(null);

    const eliminarEnCola = () => {
      setCola((c) => encolarEliminar(c, id));
      borrarFoto(id).catch(() => {});
      setAviso({
        tipo: 'ok',
        texto: esIdLocal(id)
          ? `${codigoArbol} descartado.`
          : `${codigoArbol} se eliminará cuando haya conexión.`,
      });
    };

    // Sin red no se puede validar la contraseña (se pedirá al sincronizar), así
    // que la confirmación es local.
    if (!enLinea || cola.some((op) => op.id === id)) {
      if (window.confirm(`¿Eliminar el individuo ${codigoArbol}? Se aplicará al sincronizar.`)) eliminarEnCola();
      return;
    }

    try {
      await ejecutar(
        (password) => eliminarIndividuo(id, password),
        `Vas a eliminar el individuo ${codigoArbol} y su ubicación. Esta acción no se puede deshacer; confirma con la contraseña de administrador.`,
        { confirmar: true },
      );
      setIndividuos((prev) => prev.filter((f) => f.properties.id !== id));
      setAviso({ tipo: 'ok', texto: `${codigoArbol} eliminado.` });
      refrescar();
    } catch (e) {
      if (e.sinRed) eliminarEnCola();
      else if (!e.cancelado) setAviso({ tipo: 'error', texto: e.message });
    }
  }, [ejecutar, enLinea, cola, refrescar]);

  // Envía la cola en orden. Un rechazo del servidor (código repetido, datos
  // inválidos…) marca esa operación y sigue con las demás; si falta la red o la
  // contraseña es incorrecta se detiene y lo gestiona quien llama.
  const sincronizar = useCallback(async () => {
    if (sincronizandoRef.current) return;
    sincronizandoRef.current = true;
    setSincronizando(true);
    try {
      const pendientes = colaRef.current.filter((op) => !op.error).length;
      if (!pendientes) return;
      const { enviados, rechazados } = await ejecutar(async (password) => {
        let restante = colaRef.current;
        let ok = 0;
        let rechazadas = 0;
        // Se toma siempre la siguiente operación sin error de la cola actual: al
        // crear un individuo, su foto pasa del id local al real y sigue en la cola.
        for (let op = restante.find((o) => !o.error); op; op = restante.find((o) => !o.error)) {
          try {
            if (op.tipo === 'crear') {
              const creado = await crearIndividuo(op.datos, password);
              restante = descartarOperacion(restante, op);
              const idReal = creado.properties.id;
              if (restante.some((o) => o.id === op.id)) {
                await moverFoto(op.id, idReal);
                restante = reasignarId(restante, op.id, idReal);
              }
            } else if (op.tipo === 'editar') {
              await actualizarIndividuo(op.id, op.datos, password);
              restante = descartarOperacion(restante, op);
            } else if (op.tipo === 'foto') {
              const foto = await leerFoto(op.id);
              if (foto) await subirFotoIndividuo(op.id, foto, password);
              restante = descartarOperacion(restante, op);
              await borrarFoto(op.id);
            } else {
              await eliminarIndividuo(op.id, password);
              restante = descartarOperacion(restante, op);
            }
            ok += 1;
          } catch (e) {
            if (e.sinRed || /contraseña/i.test(e.message)) throw e;
            // Eliminar algo que ya no existe es, a efectos prácticos, un éxito.
            if (op.tipo === 'eliminar' && /no existe/i.test(e.message)) {
              restante = descartarOperacion(restante, op);
              ok += 1;
            } else {
              // Si falla la creación, su foto tampoco puede subirse: se marcan ambas.
              restante = op.tipo === 'crear'
                ? marcarError(restante, op.id, e.message)
                : marcarErrorOperacion(restante, op, e.message);
              rechazadas += 1;
            }
          }
          colaRef.current = restante;
          guardarCola(restante);
          setCola(restante);
        }
        return { enviados: ok, rechazados: rechazadas };
      }, `Hay ${pendientes} ${pendientes === 1 ? 'cambio guardado' : 'cambios guardados'} sin conexión. Ingresa la contraseña de administrador para enviarlos.`);
      await refrescar();
      setAviso({
        tipo: rechazados ? 'error' : 'ok',
        texto: `${enviados} ${enviados === 1 ? 'cambio enviado' : 'cambios enviados'}${rechazados ? `; ${rechazados} rechazado${rechazados === 1 ? '' : 's'} por el servidor (revísalos abajo)` : ''}.`,
      });
    } catch (e) {
      if (e.sinRed) setAviso({ tipo: 'error', texto: 'Se perdió la conexión; los cambios siguen guardados y se enviarán después.' });
      else if (!e.cancelado) setAviso({ tipo: 'error', texto: e.message });
    } finally {
      sincronizandoRef.current = false;
      setSincronizando(false);
    }
  }, [ejecutar, refrescar]);

  // Al volver la conexión (o al abrir la página con ella) se ofrece enviar lo pendiente.
  const hayPorEnviar = cola.some((op) => !op.error);
  useEffect(() => {
    if (!enLinea) {
      autoIntentadoRef.current = false;
    } else if (hayPorEnviar && !cargando && !formulario && !autoIntentadoRef.current) {
      autoIntentadoRef.current = true;
      sincronizar();
    }
  }, [enLinea, hayPorEnviar, cargando, formulario, sincronizar]);

  const descartarPendiente = (id) => {
    setCola((c) => descartar(c, id));
    borrarFoto(id).catch(() => {});
  };

  const abrirFormulario = (individuo = null) => {
    setAviso(null);
    setFormulario({ individuo });
  };

  const hayFiltros = Boolean(busqueda || filtroEspecie);

  return (
    <div className="app">
      <a className="skip-link" href="#app-main">Saltar al contenido</a>

      <header className="individuos-cabecera">
        <a className="individuos-volver" href="#/galeria">
          <LuArrowLeft aria-hidden="true" />
          Catálogo
        </a>
      </header>

      <main id="app-main" className="individuos-main" aria-labelledby="individuos-titulo">
        <div className="individuos-titular">
          <div>
            <h1 id="individuos-titulo" className="individuos-titulo">Individuos</h1>
            <p className="individuos-intro">
              Árboles del parque con su código y ubicación GPS.
            </p>
          </div>
          {!cargando && !error && (
            <Boton variante="primary" clase="individuos-agregar" onClick={() => abrirFormulario()} disabled={especies.length === 0}>
              <LuPlus aria-hidden="true" />
              Agregar
            </Boton>
          )}
        </div>

        {cargando ? (
          <div className="cargando-central"><ArbolitoLoader etiqueta="Cargando individuos" /></div>
        ) : error ? (
          <EstadoBox icono="⚠️" titulo="No pudimos cargar los individuos" texto={error} clase="error-box" alerta>
            <Boton variante="retry" onClick={() => setRecargar((n) => n + 1)}>Reintentar</Boton>
          </EstadoBox>
        ) : (
          <section className="individuos-panel">
            <div className="individuos-filtros">
              <label className="individuos-busqueda">
                <LuSearch aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Buscar código, especie o parque"
                  aria-label="Buscar individuos"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </label>
              <select
                className="individuos-select"
                aria-label="Filtrar por especie"
                value={filtroEspecie}
                onChange={(e) => setFiltroEspecie(e.target.value)}
              >
                <option value="">Todas las especies</option>
                {especies.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>

            <BannerSincronizacion
              enLinea={enLinea}
              cola={cola}
              sincronizando={sincronizando}
              onSincronizar={sincronizar}
              onDescartar={descartarPendiente}
            />

            <p className="individuos-conteo" role="status" aria-live="polite">
              {visibles.length} de {vista.length} {vista.length === 1 ? 'individuo' : 'individuos'}
            </p>

            {aviso && (
              <p
                className={aviso.tipo === 'error' ? 'toolbar-note toolbar-note-error' : 'toolbar-note'}
                role={aviso.tipo === 'error' ? 'alert' : 'status'}
              >
                {aviso.texto}
              </p>
            )}

            {vista.length === 0 ? (
              <EstadoBox
                icono="🌱"
                titulo="Aún no hay individuos registrados"
                texto="Agrega el primero para que aparezca en el mapa de su especie."
              />
            ) : visibles.length === 0 && hayFiltros ? (
              <EstadoBox icono="🔎" titulo="Ningún individuo coincide" texto="Prueba con otro código, especie o parque.">
                <Boton variante="primary" onClick={() => { setBusqueda(''); setFiltroEspecie(''); }}>
                  Limpiar filtros
                </Boton>
              </EstadoBox>
            ) : (
              <ul className="individuos-lista">
                {visibles.map((feature) => (
                  <TarjetaIndividuo
                    key={feature.properties.id}
                    feature={feature}
                    onEditar={abrirFormulario}
                    onEliminar={eliminar}
                  />
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      <PiePagina />

      {formulario && (
        <FormularioIndividuo
          individuo={formulario.individuo}
          especies={especies}
          individuos={vista}
          parquePorDefecto={parqueMasUsado(vista)}
          onClose={() => setFormulario(null)}
          onGuardar={guardar}
        />
      )}
      {dialogo}
    </div>
  );
}
