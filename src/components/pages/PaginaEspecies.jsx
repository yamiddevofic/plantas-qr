import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { actualizarFotosPlanta, actualizarPlanta, crearPlanta, eliminarPlanta, fetchPlantas } from '../../api';
import useAccionProtegida from '../../hooks/useAccionProtegida';
import useEnLinea from '../../hooks/useEnLinea';
import { listaImagenes } from '../../constantes';
import {
  aplicarColaEspecies,
  borrarFotosDeOperacion,
  claveFotoEspecie,
  claveFotoUnica,
  clavesDeFotos,
  descartar,
  descartarOperacion,
  encolarCrear,
  encolarEditar,
  encolarEliminar,
  encolarFotos,
  esIdLocal,
  guardarColaEspecies,
  leerColaEspecies,
  marcarErrorOperacion,
  nuevoIdLocal,
  reasignarId,
} from '../../offline/colaEspecies';
import { comprimirFoto, guardarFoto, leerFoto } from '../../offline/fotos';
import { aplicarSeo } from '../../seo';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import Boton from '../atoms/Boton';
import EstadoBox from '../atoms/EstadoBox';
import { IconoCamara, IconoFicha, IconoHoja, IconoLupa, IconoMas } from '../atoms/IconosInicio';
import PestanasGestion from '../molecules/PestanasGestion';
import BannerSincronizacion from '../organisms/BannerSincronizacion';
import EditorFotosEspecie from '../organisms/EditorFotosEspecie';
import FormularioPlanta from '../organisms/FormularioPlanta';
import TarjetaEspecie from '../organisms/TarjetaEspecie';
import PlantillaGestion from '../templates/PlantillaGestion';

const sinTildes = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const ETIQUETAS = { crear: 'Nueva', editar: 'Cambio', fotos: 'Fotos', eliminar: 'Eliminación' };
const TEXTO_SIN_CONEXION = 'Puedes seguir agregando, editando y eliminando especies y organizando sus fotos: se guardan en este dispositivo y se envían cuando vuelva internet.';

/**
 * Gestión de especies: agregar, editar los datos, ordenar las fotos y eliminar
 * las especies del catálogo. Comparte módulo (pestañas) con Gestión de individuos
 * y, como ella, funciona sin conexión: los cambios se guardan en el dispositivo
 * (offline/colaEspecies.js) y se envían, con la contraseña, cuando vuelve internet.
 */
export default function PaginaEspecies() {
  const [plantas, setPlantas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recargar, setRecargar] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  // { modo: 'datos' | 'fotos', planta, iniciales? } — null si no hay nada abierto.
  const [abierto, setAbierto] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [cola, setCola] = useState(leerColaEspecies);
  const [sincronizando, setSincronizando] = useState(false);
  // Fotos aún sin enviar, guardadas en el dispositivo: clave de IndexedDB → URL temporal.
  const [fotosLocales, setFotosLocales] = useState({});
  const enLinea = useEnLinea();
  const colaRef = useRef(cola);
  const sincronizandoRef = useRef(false);
  const autoIntentadoRef = useRef(false);
  const { ejecutar, dialogo } = useAccionProtegida();

  // La cola vive en el dispositivo para sobrevivir a cerrar la página sin conexión.
  useEffect(() => {
    colaRef.current = cola;
    guardarColaEspecies(cola);
  }, [cola]);

  useEffect(() => {
    aplicarSeo({
      titulo: 'Gestión de especies · PlantaQR',
      descripcion: 'Agrega, edita o elimina las especies del catálogo del Parque principal de Chitagá y organiza sus fotos.',
      ruta: '/#/especies',
    });
  }, []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCargando(true);
      setError(null);
      try {
        const lista = await fetchPlantas();
        if (!cancelado) setPlantas(lista);
      } catch (e) {
        if (!cancelado) setError(e.message);
      }
      if (!cancelado) setCargando(false);
    })();
    return () => { cancelado = true; };
  }, [recargar]);

  const clavesFotos = cola.flatMap(clavesDeFotos).sort().join('|');
  useEffect(() => {
    let cancelado = false;
    const urls = {};
    (async () => {
      for (const clave of clavesFotos ? clavesFotos.split('|') : []) {
        try {
          const blob = await leerFoto(clave);
          if (blob) urls[clave] = URL.createObjectURL(blob);
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
  }, [clavesFotos]);

  // Lo guardado en el servidor más los cambios aún sin enviar.
  const vista = useMemo(() => aplicarColaEspecies(plantas, cola, fotosLocales), [plantas, cola, fotosLocales]);

  const visibles = useMemo(() => {
    const texto = sinTildes(busqueda.trim());
    return [...vista]
      .sort((a, b) => a.nombre.comun.localeCompare(b.nombre.comun, 'es'))
      .filter((p) => !texto || sinTildes(`${p.nombre.comun} ${p.nombre.cientifico} ${p.familia}`).includes(texto));
  }, [vista, busqueda]);

  const reemplazar = useCallback((planta) => setPlantas((prev) => {
    const indice = prev.findIndex((p) => p._id === planta._id);
    if (indice === -1) return [planta, ...prev];
    const copia = [...prev];
    copia[indice] = planta;
    return copia;
  }), []);

  // Actualiza la lista desde el servidor sin pantalla de carga.
  const refrescar = useCallback(async () => {
    try {
      setPlantas(await fetchPlantas());
    } catch {
      // Sin red: se conserva lo que ya hay en pantalla.
    }
  }, []);

  const abrir = (modo, planta = null) => {
    setAviso(null);
    setAbierto({ modo, planta });
  };

  // Si la especie ya tiene un cambio de fotos sin enviar, el editor arranca desde él
  // (las fotos nuevas salen del dispositivo).
  const abrirFotos = async (planta) => {
    setAviso(null);
    const op = cola.find((o) => o.tipo === 'fotos' && o.id === planta._id);
    if (!op) {
      setAbierto({ modo: 'fotos', planta, iniciales: null, unicasIniciales: null });
      return;
    }
    const iniciales = [];
    for (const ref of op.orden) {
      const nueva = /^nueva:(\d+)$/.exec(ref);
      if (!nueva) {
        iniciales.push({ clave: ref, ref });
        continue;
      }
      const blob = await leerFoto(claveFotoEspecie(op.id, Number(nueva[1]))).catch(() => null);
      if (blob) iniciales.push({ clave: `guardada-${op.id}-${nueva[1]}`, archivo: blob });
    }
    // Fotos de un solo uso pendientes: la nueva (del dispositivo) o null si se iba a quitar.
    const unicasIniciales = {};
    for (const [clave, accion] of Object.entries(op.unicas ?? {})) {
      if (accion === 'quitar') unicasIniciales[clave] = null;
      else {
        const blob = await leerFoto(claveFotoUnica(op.id, clave)).catch(() => null);
        if (blob) unicasIniciales[clave] = blob;
      }
    }
    setAbierto({ modo: 'fotos', planta, iniciales, unicasIniciales });
  };

  const soltarFotosPendientes = (id) => {
    colaRef.current.filter((op) => op.id === id).forEach((op) => borrarFotosDeOperacion(op));
  };

  // ── Fotos ──────────────────────────────────────────────────────

  // `unicas`: fotos de un solo uso que cambian ({ noche|hoja|fruto: Blob | null }).
  const guardarFotos = useCallback(async (orden, archivos, unicas = {}) => {
    const { planta } = abierto;
    const nombre = planta.nombre.comun;

    // Sin conexión (o si se corta al enviar): quedan en el dispositivo hasta poder enviarlas.
    const guardarEnCola = async () => {
      const previa = colaRef.current.find((op) => op.tipo === 'fotos' && op.id === planta._id);
      if (previa) await borrarFotosDeOperacion(previa);
      for (const [i, archivo] of archivos.entries()) await guardarFoto(claveFotoEspecie(planta._id, i), archivo);
      const acciones = {};
      for (const [clave, blob] of Object.entries(unicas)) {
        if (blob) await guardarFoto(claveFotoUnica(planta._id, clave), blob);
        acciones[clave] = blob ? 'nueva' : 'quitar';
      }
      setCola((c) => encolarFotos(c, planta._id, nombre, orden, archivos.length, acciones));
      setAviso({ tipo: 'ok', texto: `Fotos de ${nombre} guardadas en este dispositivo; se enviarán cuando haya conexión.` });
      setAbierto(null);
    };

    if (!enLinea) {
      await guardarEnCola();
      return;
    }
    let actualizada;
    try {
      actualizada = await ejecutar(
        (password) => actualizarFotosPlanta(planta._id, orden, archivos, password, unicas),
        `Para guardar las fotos de ${nombre} necesitas la contraseña de administrador.`,
      );
    } catch (e) {
      if (e.sinRed) {
        await guardarEnCola();
        return;
      }
      throw e;
    }
    // Si había un cambio de fotos sin enviar, este lo reemplaza.
    const previa = colaRef.current.find((op) => op.tipo === 'fotos' && op.id === planta._id);
    if (previa) {
      await borrarFotosDeOperacion(previa);
      setCola((c) => descartarOperacion(c, previa));
    }
    reemplazar(actualizada);
    setAviso({ tipo: 'ok', texto: `Fotos de ${actualizada.nombre.comun} guardadas.` });
    setAbierto(null);
  }, [abierto, enLinea, ejecutar, reemplazar]);

  // ── Datos de la especie ────────────────────────────────────────

  const datosGuardados = (planta) => {
    const nueva = !plantas.some((p) => p._id === planta._id);
    reemplazar(planta);
    setAviso({ tipo: 'ok', texto: `${planta.nombre.comun} ${nueva ? 'agregada al catálogo' : 'actualizada'}.` });
    setAbierto(null);
  };

  // Sin conexión (o red caída al enviar): el formulario entrega aquí lo escrito.
  const encolarDatos = useCallback(async ({ datos, planta }) => {
    const { imagenFile, ...sinFoto } = datos;
    delete sinFoto.password;
    const esNueva = !planta;
    const id = planta?._id ?? nuevoIdLocal();
    const aunSinEnviar = esNueva || esIdLocal(id);
    let foto;
    if (imagenFile && aunSinEnviar) {
      await guardarFoto(claveFotoEspecie(id, 'principal'), await comprimirFoto(imagenFile));
      foto = true;
    }
    setCola((c) => (esNueva ? encolarCrear(c, id, sinFoto, foto === true) : encolarEditar(c, id, sinFoto, foto)));
    const omitida = Boolean(imagenFile) && !aunSinEnviar;
    setAviso({
      tipo: 'ok',
      texto: `${sinFoto.nombreComun} guardada en este dispositivo; se enviará cuando haya conexión.${omitida ? ' La foto nueva no se guardó: agrégala con «Fotos».' : ''}`,
    });
    setAbierto(null);
  }, []);

  // ── Eliminar ───────────────────────────────────────────────────

  const eliminar = async (planta) => {
    setAviso(null);
    const nombre = planta.nombre.comun;
    const eliminarEnCola = () => {
      soltarFotosPendientes(planta._id);
      setCola((c) => encolarEliminar(c, planta._id, nombre));
      setAviso({
        tipo: 'ok',
        texto: esIdLocal(planta._id) ? `${nombre} descartada.` : `${nombre} se eliminará cuando haya conexión.`,
      });
    };

    // Sin red no se puede validar la contraseña (se pedirá al sincronizar), así que
    // la confirmación es local. Lo mismo si la especie tiene cambios sin enviar.
    const pendiente = cola.some((op) => op.id === planta._id);
    if (!enLinea || pendiente) {
      const texto = esIdLocal(planta._id)
        ? `¿Descartar ${nombre}? Aún no se había enviado.`
        : `¿Eliminar ${nombre} del catálogo? Se aplicará al sincronizar.`;
      if (window.confirm(texto)) eliminarEnCola();
      return;
    }

    try {
      await ejecutar(
        (password) => eliminarPlanta(planta._id, password),
        `Vas a eliminar ${nombre} del catálogo, con sus fotos y su código QR. Esta acción no se puede deshacer; confirma con la contraseña de administrador.`,
        { confirmar: true },
      );
      setPlantas((prev) => prev.filter((p) => p._id !== planta._id));
      setAviso({ tipo: 'ok', texto: `${nombre} eliminada del catálogo.` });
    } catch (e) {
      if (e.sinRed) eliminarEnCola();
      else if (!e.cancelado) setAviso({ tipo: 'error', texto: e.message });
    }
  };

  // ── Sincronizar ────────────────────────────────────────────────

  // Envía la cola en orden. Un rechazo del servidor (400, 409: la especie tiene
  // árboles…) marca esa operación y sigue con las demás; si falta la red o la
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
        for (let op = restante.find((o) => !o.error); op; op = restante.find((o) => !o.error)) {
          try {
            if (op.tipo === 'crear') {
              const foto = op.foto ? await leerFoto(claveFotoEspecie(op.id, 'principal')) : null;
              const creada = await crearPlanta({ ...op.datos, imagenFile: foto, password });
              restante = reasignarId(descartarOperacion(restante, op), op.id, creada._id);
              setPlantas((prev) => [creada, ...prev.filter((p) => p._id !== creada._id)]);
            } else if (op.tipo === 'editar') {
              reemplazar(await actualizarPlanta(op.id, { ...op.datos, password }));
              restante = descartarOperacion(restante, op);
            } else if (op.tipo === 'fotos') {
              const archivos = [];
              for (let i = 0; i < (op.nuevas ?? 0); i += 1) {
                const blob = await leerFoto(claveFotoEspecie(op.id, i));
                if (!blob) throw new Error('Falta una foto guardada en este dispositivo.');
                archivos.push(blob);
              }
              const unicas = {};
              for (const [clave, accion] of Object.entries(op.unicas ?? {})) {
                if (accion === 'quitar') {
                  unicas[clave] = null;
                  continue;
                }
                const blob = await leerFoto(claveFotoUnica(op.id, clave));
                if (!blob) throw new Error('Falta una foto guardada en este dispositivo.');
                unicas[clave] = blob;
              }
              reemplazar(await actualizarFotosPlanta(op.id, op.orden, archivos, password, unicas));
              restante = descartarOperacion(restante, op);
            } else {
              await eliminarPlanta(op.id, password);
              setPlantas((prev) => prev.filter((p) => p._id !== op.id));
              restante = descartarOperacion(restante, op);
            }
            await borrarFotosDeOperacion(op);
            ok += 1;
          } catch (e) {
            if (e.sinRed || /contraseña/i.test(e.message)) throw e;
            // Eliminar algo que ya no existe es, a efectos prácticos, un éxito.
            if (op.tipo === 'eliminar' && /no encontrada/i.test(e.message)) {
              restante = descartarOperacion(restante, op);
              ok += 1;
            } else {
              restante = marcarErrorOperacion(restante, op, e.message);
              rechazadas += 1;
            }
          }
          colaRef.current = restante;
          guardarColaEspecies(restante);
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
  }, [ejecutar, refrescar, reemplazar]);

  // Al volver la conexión (o al abrir la página con ella) se ofrece enviar lo pendiente.
  const hayPorEnviar = cola.some((op) => !op.error);
  useEffect(() => {
    if (!enLinea) {
      autoIntentadoRef.current = false;
    } else if (hayPorEnviar && !cargando && !abierto && !autoIntentadoRef.current) {
      autoIntentadoRef.current = true;
      sincronizar();
    }
  }, [enLinea, hayPorEnviar, cargando, abierto, sincronizar]);

  const descartarPendiente = (id) => {
    soltarFotosPendientes(id);
    setCola((c) => descartar(c, id));
  };

  const cifras = useMemo(() => {
    if (cargando || error || !vista.length) return null;
    const conteos = vista.map((p) => listaImagenes(p).length);
    const total = conteos.reduce((a, n) => a + n, 0);
    const sinFoto = conteos.filter((n) => n === 0).length;
    // El catálogo antiguo tiene varias fichas por especie: se cuentan especies distintas.
    const especies = new Set(vista.map((p) => sinTildes(p.nombre.cientifico).trim())).size;
    return [
      { Icono: IconoHoja, valor: especies, etiqueta: especies === 1 ? 'especie' : 'especies' },
      { Icono: IconoCamara, valor: total, etiqueta: total === 1 ? 'foto' : 'fotos' },
      ...(sinFoto ? [{ Icono: IconoFicha, valor: sinFoto, etiqueta: 'sin foto' }] : []),
    ];
  }, [vista, cargando, error]);

  return (
    <PlantillaGestion
      hero={{
        id: 'especies-titulo',
        titulo: 'Gestión de',
        acento: 'especies',
        texto: 'Agrega, edita o elimina las especies del catálogo y organiza sus fotos.',
        cifras,
        bajar: true,
        accion: !cargando && !error && (
          <Boton variante="primary" clase="gestion-agregar" onClick={() => abrir('datos')}>
            <IconoMas />
            Agregar especie
          </Boton>
        ),
      }}
      extras={(
        <>
          {abierto?.modo === 'fotos' && (
            <EditorFotosEspecie
              planta={abierto.planta}
              iniciales={abierto.iniciales}
              unicasIniciales={abierto.unicasIniciales}
              enLinea={enLinea}
              onClose={() => setAbierto(null)}
              onGuardar={guardarFotos}
            />
          )}
          {abierto?.modo === 'datos' && (
            <FormularioPlanta
              planta={abierto.planta}
              // Una especie creada sin conexión aún no existe en el servidor: se edita en la cola.
              enLinea={enLinea && !esIdLocal(abierto.planta?._id)}
              onEncolar={encolarDatos}
              onClose={() => setAbierto(null)}
              onGuardado={datosGuardados}
            />
          )}
          {dialogo}
        </>
      )}
    >
      <PestanasGestion actual="especies" />

      {cargando ? (
        <div className="cargando-central"><ArbolitoLoader etiqueta="Cargando especies" /></div>
      ) : error ? (
        <EstadoBox icono="⚠️" titulo="No pudimos cargar las especies" texto={error} clase="error-box" alerta>
          <Boton variante="retry" onClick={() => setRecargar((n) => n + 1)}>Reintentar</Boton>
        </EstadoBox>
      ) : (
        <section className="gestion-panel" aria-label="Especies del catálogo">
          <div className="gestion-filtros">
            <label className="gestion-busqueda">
              <IconoLupa />
              <input
                type="search"
                placeholder="Buscar especie o familia"
                aria-label="Buscar especies"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </label>
          </div>

          <BannerSincronizacion
            enLinea={enLinea}
            cola={cola}
            sincronizando={sincronizando}
            onSincronizar={sincronizar}
            onDescartar={descartarPendiente}
            etiquetas={ETIQUETAS}
            textoSinConexion={TEXTO_SIN_CONEXION}
          />

          <div className="gestion-resumen">
            <p className="gestion-conteo" role="status" aria-live="polite">
              <strong>{visibles.length}</strong> de {vista.length} {vista.length === 1 ? 'ficha' : 'fichas'}
            </p>
          </div>

          {aviso && (
            <p
              className={aviso.tipo === 'error' ? 'toolbar-note toolbar-note-error' : 'toolbar-note'}
              role={aviso.tipo === 'error' ? 'alert' : 'status'}
            >
              {aviso.texto}
            </p>
          )}

          {vista.length === 0 ? (
            <EstadoBox icono="🌱" titulo="Aún no hay especies" texto="Agrega la primera para que aparezca en el catálogo.">
              <Boton variante="primary" onClick={() => abrir('datos')}>Agregar especie</Boton>
            </EstadoBox>
          ) : visibles.length === 0 ? (
            <EstadoBox icono="🔎" titulo="Ninguna especie coincide" texto="Prueba con otro nombre o familia.">
              <Boton variante="primary" onClick={() => setBusqueda('')}>Limpiar búsqueda</Boton>
            </EstadoBox>
          ) : (
            <ul className="gestion-lista">
              {visibles.map((planta, i) => (
                <TarjetaEspecie
                  key={planta._id}
                  planta={planta}
                  indice={i}
                  onEditar={(p) => abrir('datos', p)}
                  onFotos={abrirFotos}
                  onEliminar={eliminar}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </PlantillaGestion>
  );
}
