import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuArrowLeft, LuPencil, LuSearch } from 'react-icons/lu';
import { actualizarFotosPlanta, fetchPlantas } from '../../api';
import useAccionProtegida from '../../hooks/useAccionProtegida';
import useEnLinea from '../../hooks/useEnLinea';
import { listaImagenes } from '../../constantes';
import { aplicarSeo } from '../../seo';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import Boton from '../atoms/Boton';
import EstadoBox from '../atoms/EstadoBox';
import PiePagina from '../molecules/PiePagina';
import EditorFotosEspecie from '../organisms/EditorFotosEspecie';

const sinTildes = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Miniatura({ src, alt }) {
  const [rota, setRota] = useState(false);
  if (!src || rota) return <span className="individuo-foto individuo-foto-vacia" aria-hidden="true">🌿</span>;
  return <img className="individuo-foto" src={src} alt={alt} loading="lazy" decoding="async" onError={() => setRota(true)} />;
}

export default function PaginaFotosEspecies() {
  const [plantas, setPlantas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recargar, setRecargar] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState(null);
  const enLinea = useEnLinea();
  const { ejecutar, dialogo } = useAccionProtegida();

  useEffect(() => {
    aplicarSeo({
      titulo: 'Fotos de especies · PlantaQR',
      descripcion: 'Administra las fotos de cada especie del catálogo del Parque principal de Chitagá.',
      ruta: '/#/especies-fotos',
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

  const guardar = useCallback(async (orden, archivos) => {
    const planta = editando;
    const actualizada = await ejecutar(
      (password) => actualizarFotosPlanta(planta._id, orden, archivos, password),
      `Para guardar las fotos de ${planta.nombre.comun} necesitas la contraseña de administrador.`,
    );
    setPlantas((prev) => prev.map((p) => (p._id === actualizada._id ? actualizada : p)));
    setAviso(`Fotos de ${actualizada.nombre.comun} guardadas.`);
    setEditando(null);
  }, [editando, ejecutar]);

  return (
    <div className="app">
      <a className="skip-link" href="#app-main">Saltar al contenido</a>

      <header className="individuos-cabecera">
        <a className="individuos-volver" href="#/galeria">
          <LuArrowLeft aria-hidden="true" />
          Catálogo
        </a>
      </header>

      <main id="app-main" className="individuos-main" aria-labelledby="fotos-especies-titulo">
        <div className="individuos-titular">
          <div>
            <h1 id="fotos-especies-titulo" className="individuos-titulo">Fotos de especies</h1>
            <p className="individuos-intro">Elige la foto principal, quita las que sobran o agrega nuevas.</p>
          </div>
        </div>

        {cargando ? (
          <div className="cargando-central"><ArbolitoLoader etiqueta="Cargando especies" /></div>
        ) : error ? (
          <EstadoBox icono="⚠️" titulo="No pudimos cargar las especies" texto={error} clase="error-box" alerta>
            <Boton variante="retry" onClick={() => setRecargar((n) => n + 1)}>Reintentar</Boton>
          </EstadoBox>
        ) : (
          <section className="individuos-panel">
            <label className="individuos-busqueda">
              <LuSearch aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar especie o familia"
                aria-label="Buscar especies"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </label>

            <p className="individuos-conteo" role="status" aria-live="polite">
              {visibles.length} de {plantas.length} {plantas.length === 1 ? 'ficha' : 'fichas'}
            </p>

            {aviso && <p className="toolbar-note" role="status">{aviso}</p>}

            <ul className="individuos-lista">
              {visibles.map((planta) => {
                const fotos = listaImagenes(planta);
                return (
                  <li key={planta._id} className="individuo-fila">
                    <Miniatura src={fotos[0]} alt={`Foto principal de ${planta.nombre.comun}`} />
                    <div className="individuo-datos">
                      <p className="individuo-codigo">{planta.nombre.comun}</p>
                      <p className="individuo-especie"><em>{planta.nombre.cientifico}</em></p>
                      <p className="individuo-meta">
                        {fotos.length === 0 ? 'Sin fotos' : `${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'}`}
                      </p>
                    </div>
                    <div className="individuo-acciones">
                      <button
                        type="button"
                        className="individuo-accion"
                        onClick={() => { setAviso(null); setEditando(planta); }}
                        aria-label={`Editar fotos de ${planta.nombre.comun}`}
                        title="Editar fotos"
                      >
                        <LuPencil aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>

      <PiePagina />

      {editando && (
        <EditorFotosEspecie
          planta={editando}
          enLinea={enLinea}
          onClose={() => setEditando(null)}
          onGuardar={guardar}
        />
      )}
      {dialogo}
    </div>
  );
}
