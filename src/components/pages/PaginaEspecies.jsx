import { useCallback, useEffect, useMemo, useState } from 'react';
import { actualizarFotosPlanta, eliminarPlanta, fetchPlantas } from '../../api';
import useAccionProtegida from '../../hooks/useAccionProtegida';
import useEnLinea from '../../hooks/useEnLinea';
import { listaImagenes } from '../../constantes';
import { aplicarSeo } from '../../seo';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import Boton from '../atoms/Boton';
import EstadoBox from '../atoms/EstadoBox';
import { IconoCamara, IconoFicha, IconoHoja, IconoLupa, IconoMas } from '../atoms/IconosInicio';
import PestanasGestion from '../molecules/PestanasGestion';
import EditorFotosEspecie from '../organisms/EditorFotosEspecie';
import FormularioPlanta from '../organisms/FormularioPlanta';
import TarjetaEspecie from '../organisms/TarjetaEspecie';
import PlantillaGestion from '../templates/PlantillaGestion';

const sinTildes = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Gestión de especies: agregar, editar los datos, ordenar las fotos y eliminar
 * las especies del catálogo. Comparte módulo (pestañas) con Gestión de individuos.
 */
export default function PaginaEspecies() {
  const [plantas, setPlantas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recargar, setRecargar] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  // { modo: 'datos' | 'fotos', planta } — null si no hay nada abierto.
  const [abierto, setAbierto] = useState(null);
  const [aviso, setAviso] = useState(null);
  const enLinea = useEnLinea();
  const { ejecutar, dialogo } = useAccionProtegida();

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

  const visibles = useMemo(() => {
    const texto = sinTildes(busqueda.trim());
    return [...plantas]
      .sort((a, b) => a.nombre.comun.localeCompare(b.nombre.comun, 'es'))
      .filter((p) => !texto || sinTildes(`${p.nombre.comun} ${p.nombre.cientifico} ${p.familia}`).includes(texto));
  }, [plantas, busqueda]);

  const reemplazar = (planta) => setPlantas((prev) => {
    const indice = prev.findIndex((p) => p._id === planta._id);
    if (indice === -1) return [planta, ...prev];
    const copia = [...prev];
    copia[indice] = planta;
    return copia;
  });

  const abrir = (modo, planta = null) => {
    setAviso(null);
    setAbierto({ modo, planta });
  };

  const guardarFotos = useCallback(async (orden, archivos) => {
    const { planta } = abierto;
    const actualizada = await ejecutar(
      (password) => actualizarFotosPlanta(planta._id, orden, archivos, password),
      `Para guardar las fotos de ${planta.nombre.comun} necesitas la contraseña de administrador.`,
    );
    reemplazar(actualizada);
    setAviso({ tipo: 'ok', texto: `Fotos de ${actualizada.nombre.comun} guardadas.` });
    setAbierto(null);
  }, [abierto, ejecutar]);

  const datosGuardados = (planta) => {
    const nueva = !plantas.some((p) => p._id === planta._id);
    reemplazar(planta);
    setAviso({ tipo: 'ok', texto: `${planta.nombre.comun} ${nueva ? 'agregada al catálogo' : 'actualizada'}.` });
    setAbierto(null);
  };

  const eliminar = async (planta) => {
    setAviso(null);
    try {
      await ejecutar(
        (password) => eliminarPlanta(planta._id, password),
        `Vas a eliminar ${planta.nombre.comun} del catálogo, con sus fotos y su código QR. Esta acción no se puede deshacer; confirma con la contraseña de administrador.`,
        { confirmar: true },
      );
      setPlantas((prev) => prev.filter((p) => p._id !== planta._id));
      setAviso({ tipo: 'ok', texto: `${planta.nombre.comun} eliminada del catálogo.` });
    } catch (e) {
      if (!e.cancelado) setAviso({ tipo: 'error', texto: e.message });
    }
  };

  const cifras = useMemo(() => {
    if (cargando || error || !plantas.length) return null;
    const conteos = plantas.map((p) => listaImagenes(p).length);
    const total = conteos.reduce((a, n) => a + n, 0);
    const sinFoto = conteos.filter((n) => n === 0).length;
    // El catálogo antiguo tiene varias fichas por especie: se cuentan especies distintas.
    const especies = new Set(plantas.map((p) => sinTildes(p.nombre.cientifico).trim())).size;
    return [
      { Icono: IconoHoja, valor: especies, etiqueta: especies === 1 ? 'especie' : 'especies' },
      { Icono: IconoCamara, valor: total, etiqueta: total === 1 ? 'foto' : 'fotos' },
      ...(sinFoto ? [{ Icono: IconoFicha, valor: sinFoto, etiqueta: 'sin foto' }] : []),
    ];
  }, [plantas, cargando, error]);

  return (
    <PlantillaGestion
      hero={{
        id: 'especies-titulo',
        titulo: 'Gestión de',
        acento: 'especies',
        texto: 'Agrega, edita o elimina las especies del catálogo y organiza sus fotos.',
        cifras,
        compacto: true,
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
              enLinea={enLinea}
              onClose={() => setAbierto(null)}
              onGuardar={guardarFotos}
            />
          )}
          {abierto?.modo === 'datos' && (
            <FormularioPlanta
              planta={abierto.planta}
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

          <div className="gestion-resumen">
            <p className="gestion-conteo" role="status" aria-live="polite">
              <strong>{visibles.length}</strong> de {plantas.length} {plantas.length === 1 ? 'ficha' : 'fichas'}
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

          {plantas.length === 0 ? (
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
                  onFotos={(p) => abrir('fotos', p)}
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
