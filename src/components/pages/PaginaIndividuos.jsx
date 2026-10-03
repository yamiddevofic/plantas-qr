import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuArrowLeft, LuCirclePlus, LuTreePine } from 'react-icons/lu';
import {
  actualizarIndividuo,
  crearIndividuo,
  eliminarIndividuo,
  fetchIndividuos,
  fetchPlantas,
} from '../../api';
import useAccionProtegida from '../../hooks/useAccionProtegida';
import { agruparEspecies, parqueMasUsado } from '../../individuos';
import { aplicarSeo } from '../../seo';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import Boton from '../atoms/Boton';
import EstadoBox from '../atoms/EstadoBox';
import PiePagina from '../molecules/PiePagina';
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
  const { ejecutar, dialogo } = useAccionProtegida();

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

  // Individuo → especie agrupada, para filtrar sin importar qué ficha hermana tenga.
  const grupoPorFicha = useMemo(() => {
    const mapa = new Map();
    for (const e of especies) for (const id of e.ids) mapa.set(id, e.id);
    return mapa;
  }, [especies]);

  const visibles = useMemo(() => {
    const texto = sinTildes(busqueda.trim());
    return individuos.filter((f) => {
      const { codigoArbol, parque, especie } = f.properties;
      if (filtroEspecie && grupoPorFicha.get(especie?._id) !== filtroEspecie) return false;
      if (!texto) return true;
      return sinTildes(`${codigoArbol} ${parque} ${especie?.nombre?.comun} ${especie?.nombre?.cientifico}`).includes(texto);
    });
  }, [individuos, busqueda, filtroEspecie, grupoPorFicha]);

  const guardar = useCallback(async (datos) => {
    const editando = formulario?.individuo;
    const descripcion = editando
      ? `Para guardar los cambios de ${editando.properties.codigoArbol} necesitas la contraseña de administrador.`
      : `Para registrar ${datos.codigoArbol} necesitas la contraseña de administrador.`;
    const feature = await ejecutar(
      (password) => (editando
        ? actualizarIndividuo(editando.properties.id, datos, password)
        : crearIndividuo(datos, password)),
      descripcion,
    );
    setIndividuos((prev) => {
      const sinEste = prev.filter((f) => f.properties.id !== feature.properties.id);
      return [...sinEste, feature].sort((a, b) => a.properties.codigoArbol.localeCompare(b.properties.codigoArbol, 'es', { numeric: true }));
    });
    setAviso({ tipo: 'ok', texto: `${feature.properties.codigoArbol} ${editando ? 'actualizado' : 'registrado'} correctamente.` });
    setFormulario(null);
  }, [ejecutar, formulario]);

  const eliminar = useCallback(async (feature) => {
    const { id, codigoArbol } = feature.properties;
    setAviso(null);
    try {
      await ejecutar(
        (password) => eliminarIndividuo(id, password),
        `Vas a eliminar el individuo ${codigoArbol} y su ubicación. Esta acción no se puede deshacer; confirma con la contraseña de administrador.`,
        { confirmar: true },
      );
      setIndividuos((prev) => prev.filter((f) => f.properties.id !== id));
      setAviso({ tipo: 'ok', texto: `${codigoArbol} eliminado.` });
    } catch (e) {
      if (!e.cancelado) setAviso({ tipo: 'error', texto: e.message });
    }
  }, [ejecutar]);

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

            <p className="individuos-conteo" role="status" aria-live="polite">
              {visibles.length} de {individuos.length} {individuos.length === 1 ? 'individuo' : 'individuos'}
            </p>

            {aviso && (
              <p
                className={aviso.tipo === 'error' ? 'toolbar-note toolbar-note-error' : 'toolbar-note'}
                role={aviso.tipo === 'error' ? 'alert' : 'status'}
              >
                {aviso.texto}
              </p>
            )}

            {individuos.length === 0 ? (
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
          individuos={individuos}
          parquePorDefecto={parqueMasUsado(individuos)}
          onClose={() => setFormulario(null)}
          onGuardar={guardar}
        />
      )}
      {dialogo}
    </div>
  );
}
