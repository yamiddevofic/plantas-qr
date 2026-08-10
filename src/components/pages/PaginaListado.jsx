import { useEffect, useMemo, useState } from 'react';
import { fetchPlantas, fetchQRs, generarTodosQRs } from '../../api';
import PlantillaListado from '../templates/PlantillaListado';
import FormularioPlanta from '../organisms/FormularioPlanta';

export default function PaginaListado() {
  const [plantas, setPlantas] = useState([]);
  const [qrs, setQrs] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recargar, setRecargar] = useState(0);
  const [qrsGenerando, setQrsGenerando] = useState(false);
  const [mensajeQR, setMensajeQR] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroFamilia, setFiltroFamilia] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [formulario, setFormulario] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const [plantasData, qrsData] = await Promise.all([
          fetchPlantas(),
          fetchQRs(),
        ]);
        if (cancelado) return;
        const qrsMap = {};
        qrsData.forEach((qr) => {
          qrsMap[qr.plantaId._id || qr.plantaId] = qr;
        });
        setPlantas(plantasData);
        setQrs(qrsMap);
      } catch (e) {
        if (!cancelado) setError(e.message);
      }
      if (!cancelado) setCargando(false);
    }

    cargar();
    return () => { cancelado = true; };
  }, [recargar]);

  const handleDeleted = (id) => {
    setPlantas((prev) => prev.filter((p) => p._id !== id));
    setQrs((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleQRRegenerated = (id, nuevoQR) => {
    setQrs((prev) => ({ ...prev, [id]: nuevoQR }));
  };

  const handleQRsRegenerados = async () => {
    if (!confirm(`¿Regenerar los códigos QR de las ${plantas.length} plantas?`)) return;
    setQrsGenerando(true);
    setMensajeQR(null);
    try {
      const resultado = await generarTodosQRs();
      const mapa = { ...qrs };
      resultado.resultados.forEach((qr) => {
        mapa[String(qr.plantaId._id || qr.plantaId)] = qr;
      });
      setQrs(mapa);
      const partes = [`${resultado.actualizados} actualizados`];
      if (resultado.creados > 0) partes.unshift(`${resultado.creados} creados`);
      if (resultado.errores > 0) partes.push(`${resultado.errores} con error`);
      setMensajeQR(`QRs regenerados (${partes.join(', ')}) de ${resultado.total} plantas.`);
    } catch (e) {
      setMensajeQR(`Error al regenerar los QRs: ${e.message}`);
    }
    setQrsGenerando(false);
  };

  const abrirCrear = () => setFormulario({ modo: 'crear', planta: null });
  const abrirEditar = (planta) => setFormulario({ modo: 'editar', planta });
  const cerrarFormulario = () => setFormulario(null);

  const handleGuardado = (plantaGuardada) => {
    setPlantas((prev) => {
      const indice = prev.findIndex((p) => p._id === plantaGuardada._id);
      if (indice === -1) return [plantaGuardada, ...prev];
      const copia = [...prev];
      copia[indice] = plantaGuardada;
      return copia;
    });
    cerrarFormulario();
  };

  const familias = useMemo(
    () => [...new Set(plantas.map((p) => p.familia).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [plantas],
  );
  const tipos = useMemo(
    () => [...new Set(plantas.map((p) => p.tipo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [plantas],
  );
  const estados = useMemo(
    () => [...new Set(plantas.map((p) => p.estadoConservacion).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [plantas],
  );

  const filtrosActivos = Boolean(busqueda.trim() || filtroFamilia || filtroTipo || filtroEstado);

  const plantasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return plantas.filter((p) => {
      const coincideBusqueda =
        !q ||
        p.nombre.comun.toLowerCase().includes(q) ||
        (p.nombre.cientifico || '').toLowerCase().includes(q) ||
        String(p._id).toLowerCase().includes(q);
      const coincideFamilia = !filtroFamilia || p.familia === filtroFamilia;
      const coincideTipo = !filtroTipo || p.tipo === filtroTipo;
      const coincideEstado = !filtroEstado || p.estadoConservacion === filtroEstado;
      return coincideBusqueda && coincideFamilia && coincideTipo && coincideEstado;
    });
  }, [plantas, busqueda, filtroFamilia, filtroTipo, filtroEstado]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroFamilia('');
    setFiltroTipo('');
    setFiltroEstado('');
  };

  const sinResultados = plantas.length > 0 && plantasFiltradas.length === 0;

  return (
    <>
      <PlantillaListado
        cargando={cargando}
        error={error}
        onReintentar={() => setRecargar((n) => n + 1)}
        filtros={{
          busqueda,
          setBusqueda,
          familias,
          tipos,
          estados,
          filtroFamilia,
          setFiltroFamilia,
          filtroTipo,
          setFiltroTipo,
          filtroEstado,
          setFiltroEstado,
          activos: filtrosActivos,
          onLimpiar: limpiarFiltros,
        }}
        contador={{ total: plantas.length, filtrados: plantasFiltradas.length, activos: filtrosActivos }}
        generando={qrsGenerando}
        puedeGenerar={plantas.length > 0}
        onCrear={abrirCrear}
        onRegenerarTodos={handleQRsRegenerados}
        onActualizar={() => setRecargar((n) => n + 1)}
        mensajeQR={mensajeQR}
        sinResultados={sinResultados}
        plantas={plantasFiltradas}
        qrs={qrs}
        onDeleted={handleDeleted}
        onQRRegenerated={handleQRRegenerated}
        onEdit={abrirEditar}
      />
      {formulario && (
        <FormularioPlanta
          planta={formulario.planta}
          onClose={cerrarFormulario}
          onGuardado={handleGuardado}
        />
      )}
    </>
  );
}