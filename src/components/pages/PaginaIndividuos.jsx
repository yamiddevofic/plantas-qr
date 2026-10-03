import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LuArrowLeft, LuCirclePlus, LuTreePine } from 'react-icons/lu';
import {
  actualizarIndividuo,
  crearIndividuo,
  eliminarIndividuo,
  fetchIndividuos,
  fetchPlantas,
} from '../../api';
import useAccionProtegida from '../../hooks/useAccionProtegida';
import useEnLinea from '../../hooks/useEnLinea';
import { agruparEspecies, parqueMasUsado } from '../../individuos';
import {
  aplicarCola,
  descartar,
  encolarCrear,
  encolarEditar,
  encolarEliminar,
  esIdLocal,
  guardarCola,
  leerCola,
  marcarError,
} from '../../offline/cola';
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

  const especies = useMemo(() => agruparEspecies(plantas), [plantas]);
  // Lo guardado en el servidor más los cambios aún sin enviar.
  const vista = useMemo(() => aplicarCola(individuos, cola, plantas), [individuos, cola, plantas]);

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

  const guardar = useCallback(async (datos) => {
    const editando = formulario?.individuo;
    const id = editando?.properties.id;

    const guardarEnCola = () => {
      setCola((c) => (editando ? encolarEditar(c, id, datos) : encolarCrear(c, datos)));
      setAviso({
        tipo: 'ok',
        texto: `${datos.codigoArbol} guardado en este dispositivo; se enviará cuando haya conexión.`,
      });
      setFormulario(null);
    };

    // Sin red, o sobre algo que aún está en la cola, el cambio se suma a la cola.
    if (!enLinea || (id && cola.some((op) => op.id === id))) {
      guardarEnCola();
      return;
    }

    const descripcion = editando
      ? `Para guardar los cambios de ${editando.properties.codigoArbol} necesitas la contraseña de administrador.`
      : `Para registrar ${datos.codigoArbol} necesitas la contraseña de administrador.`;
    let feature;
    try {
      feature = await ejecutar(
        (password) => (editando
          ? actualizarIndividuo(id, datos, password)
          : crearIndividuo(datos, password)),
        descripcion,
      );
    } catch (e) {
      if (e.sinRed) {
        guardarEnCola();
        return;
      }
      throw e;
    }
    setIndividuos((prev) => [...prev.filter((f) => f.properties.id !== feature.properties.id), feature]);
    setAviso({ tipo: 'ok', texto: `${feature.properties.codigoArbol} ${editando ? 'actualizado' : 'registrado'} correctamente.` });
    setFormulario(null);
    refrescar();
  }, [ejecutar, formulario, enLinea, cola, refrescar]);

  const eliminar = useCallback(async (feature) => {
    const { id, codigoArbol } = feature.properties;
    setAviso(null);

    const eliminarEnCola = () => {
      setCola((c) => encolarEliminar(c, id));
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
        for (const op of restante.filter((o) => !o.error)) {
          try {
            if (op.tipo === 'crear') await crearIndividuo(op.datos, password);
            else if (op.tipo === 'editar') await actualizarIndividuo(op.id, op.datos, password);
            else await eliminarIndividuo(op.id, password);
            restante = descartar(restante, op.id);
            ok += 1;
          } catch (e) {
            if (e.sinRed || /contraseña/i.test(e.message)) throw e;
            // Eliminar algo que ya no existe es, a efectos prácticos, un éxito.
            if (op.tipo === 'eliminar' && /no existe/i.test(e.message)) {
              restante = descartar(restante, op.id);
              ok += 1;
            } else {
              restante = marcarError(restante, op.id, e.message);
              rechazadas += 1;
            }
          }
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

  const descartarOperacion = (id) => setCola((c) => descartar(c, id));

  const abrirFormulario = (individuo = null) => {
    setAviso(null);
    setFormulario({ individuo });
  };

  const hayFiltros = Boolean(busqueda || filtroEspecie);

  return (
    <div className="app">
      <a className="skip-link" href="#app-main">Saltar al contenido</a>

      <header className="galeria-header">
        <div className="galeria-header-titulo">
          <LuTreePine aria-hidden="true" className="galeria-header-icono" />
          <h1 id="individuos-titulo" className="galeria-header-texto">Individuos del parque</h1>
        </div>
        <Boton enlace href="#/galeria" variante="ghost">
          <LuArrowLeft aria-hidden="true" className="btn-lupa-icono" />
          Catálogo
        </Boton>
      </header>

      <main id="app-main" className="app-main" aria-labelledby="individuos-titulo">
        {cargando ? (
          <div className="cargando-central"><ArbolitoLoader etiqueta="Cargando individuos" /></div>
        ) : error ? (
          <EstadoBox icono="⚠️" titulo="No pudimos cargar los individuos" texto={error} clase="error-box" alerta>
            <Boton variante="retry" onClick={() => setRecargar((n) => n + 1)}>Reintentar</Boton>
          </EstadoBox>
        ) : (
          <section className="individuos-panel">
            <p className="individuos-intro">
              Cada individuo es un árbol físico del parque con su código y su ubicación GPS; es lo que
              aparece en el mapa de la ficha de cada especie. Agregar, editar o eliminar requiere la
              contraseña de administrador.
            </p>

            <div className="individuos-barra">
              <div className="individuos-filtros">
                <input
                  type="search"
                  className="form-input"
                  placeholder="Buscar por código, especie o parque…"
                  aria-label="Buscar individuos"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                <select
                  className="form-select"
                  aria-label="Filtrar por especie"
                  value={filtroEspecie}
                  onChange={(e) => setFiltroEspecie(e.target.value)}
                >
                  <option value="">Todas las especies</option>
                  {especies.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <Boton variante="primary" onClick={() => abrirFormulario()} disabled={especies.length === 0}>
                <LuCirclePlus aria-hidden="true" className="btn-lupa-icono" />
                Agregar individuo
              </Boton>
            </div>

            <BannerSincronizacion
              enLinea={enLinea}
              cola={cola}
              sincronizando={sincronizando}
              onSincronizar={sincronizar}
              onDescartar={descartarOperacion}
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
