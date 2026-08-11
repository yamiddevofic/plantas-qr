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
  const [actualizando, setActualizando] = useState(false);
  const [mensajeQR, setMensajeQR] = useState(null);
  const [filtroFamilia, setFiltroFamilia] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [qrDialogoAbierto, setQrDialogoAbierto] = useState(false);
  const [qrDialogoError, setQrDialogoError] = useState(null);

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

  const actualizarCatalogo = async () => {
    setMensajeQR(null);
    setActualizando(true);
    try {
      const [plantasData, qrsData] = await Promise.all([
        fetchPlantas(),
        fetchQRs(),
      ]);
      const qrsMap = {};
      qrsData.forEach((qr) => {
        qrsMap[qr.plantaId._id || qr.plantaId] = qr;
      });
      setPlantas(plantasData);
      setQrs(qrsMap);
      setMensajeQR(`Catálogo actualizado (${plantasData.length} especies).`);
    } catch (e) {
      setMensajeQR(`Error al actualizar el catálogo: ${e.message}`);
    }
    setActualizando(false);
  };

  const handleQRsRegenerados = async (password) => {
    setQrsGenerando(true);
    setMensajeQR(null);
    try {
      const resultado = await generarTodosQRs(password);
      const mapa = { ...qrs };
      resultado.resultados.forEach((qr) => {
        mapa[String(qr.plantaId._id || qr.plantaId)] = qr;
      });
      setQrs(mapa);
      const partes = [`${resultado.actualizados} actualizados`];
      if (resultado.creados > 0) partes.unshift(`${resultado.creados} creados`);
      if (resultado.errores > 0) partes.push(`${resultado.errores} con error`);
      setMensajeQR(`QRs regenerados (${partes.join(', ')}) de ${resultado.total} plantas.`);
      setQrDialogoAbierto(false);
    } catch (e) {
      setQrDialogoError(e.message);
      setMensajeQR(`Error al regenerar los QRs: ${e.message}`);
    }
    setQrsGenerando(false);
  };

  const abrirDialogoQR = () => {
    setQrDialogoError(null);
    setQrDialogoAbierto(true);
  };

  const abrirCrear = () => setFormulario({ modo: 'crear', planta: null });
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

  const filtrosActivos = Boolean(filtroFamilia || filtroTipo);

  const plantasFiltradas = useMemo(() => {
    return plantas.filter((p) => {
      const coincideFamilia = !filtroFamilia || p.familia === filtroFamilia;
      const coincideTipo = !filtroTipo || p.tipo === filtroTipo;
      return coincideFamilia && coincideTipo;
    });
  }, [plantas, filtroFamilia, filtroTipo]);

  const limpiarFiltros = () => {
    setFiltroFamilia('');
    setFiltroTipo('');
  };

  const sinResultados = plantas.length > 0 && plantasFiltradas.length === 0;

  return (
    <>
      <PlantillaListado
        cargando={cargando}
        error={error}
        onReintentar={() => setRecargar((n) => n + 1)}
        filtros={{
          familias,
          tipos,
          filtroFamilia,
          setFiltroFamilia,
          filtroTipo,
          setFiltroTipo,
          activos: filtrosActivos,
          onLimpiar: limpiarFiltros,
        }}
        contador={{ total: plantas.length, filtrados: plantasFiltradas.length, activos: filtrosActivos }}
        generando={qrsGenerando}
        actualizando={actualizando}
        puedeGenerar={plantas.length > 0}
        onCrear={abrirCrear}
        onRegenerarTodos={abrirDialogoQR}
        onActualizar={actualizarCatalogo}
        mensajeQR={mensajeQR}
        sinResultados={sinResultados}
        plantas={plantasFiltradas}
        todasLasPlantas={plantas}
        formularioAbierto={Boolean(formulario)}
        qrDialogo={{
          abierto: qrDialogoAbierto,
          error: qrDialogoError,
          onCerrar: () => setQrDialogoAbierto(false),
          alConfirmar: handleQRsRegenerados,
        }}
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