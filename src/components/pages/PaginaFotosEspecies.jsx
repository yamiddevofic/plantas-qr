import { useCallback, useEffect, useMemo, useState } from 'react';
import { actualizarFotosPlanta, fetchPlantas } from '../../api';
import useAccionProtegida from '../../hooks/useAccionProtegida';
import useEnLinea from '../../hooks/useEnLinea';
import { listaImagenes } from '../../constantes';
import { aplicarSeo } from '../../seo';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import Boton from '../atoms/Boton';
import EstadoBox from '../atoms/EstadoBox';
import { IconoCamara, IconoFicha, IconoHoja, IconoLupa } from '../atoms/IconosInicio';
import EditorFotosEspecie from '../organisms/EditorFotosEspecie';
import TarjetaFotosEspecie from '../organisms/TarjetaFotosEspecie';
import PlantillaGestion from '../templates/PlantillaGestion';

const sinTildes = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

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

  const cifras = useMemo(() => {
    if (cargando || error || !plantas.length) return null;
    const conteos = plantas.map((p) => listaImagenes(p).length);
    const total = conteos.reduce((a, n) => a + n, 0);
    const sinFoto = conteos.filter((n) => n === 0).length;
    return [
      { Icono: IconoHoja, valor: plantas.length, etiqueta: plantas.length === 1 ? 'ficha' : 'fichas' },
      { Icono: IconoCamara, valor: total, etiqueta: total === 1 ? 'foto' : 'fotos' },
      ...(sinFoto ? [{ Icono: IconoFicha, valor: sinFoto, etiqueta: 'sin foto' }] : []),
    ];
  }, [plantas, cargando, error]);

  return (
    <PlantillaGestion
      hero={{
        id: 'fotos-especies-titulo',
        titulo: 'Fotos de',
        acento: 'especies',
        texto: 'Elige la foto principal de cada especie, quita las que sobran o agrega nuevas.',
        cifras,
        compacto: true,
      }}
      extras={(
        <>
          {editando && (
            <EditorFotosEspecie
              planta={editando}
              enLinea={enLinea}
              onClose={() => setEditando(null)}
              onGuardar={guardar}
            />
          )}
          {dialogo}
        </>
      )}
    >
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

          {aviso && <p className="toolbar-note" role="status">{aviso}</p>}

          {visibles.length === 0 ? (
            <EstadoBox icono="🔎" titulo="Ninguna especie coincide" texto="Prueba con otro nombre o familia.">
              <Boton variante="primary" onClick={() => setBusqueda('')}>Limpiar búsqueda</Boton>
            </EstadoBox>
          ) : (
            <ul className="gestion-lista">
              {visibles.map((planta, i) => (
                <TarjetaFotosEspecie
                  key={planta._id}
                  planta={planta}
                  indice={i}
                  onEditar={(p) => { setAviso(null); setEditando(p); }}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </PlantillaGestion>
  );
}
