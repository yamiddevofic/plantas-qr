import { useEffect, useMemo, useState } from 'react';
import { fetchPlantas, fetchQRs, generarTodosQRs, verificarAdmin } from '../../api';
import { aplicarSeo } from '../../seo';
import PlantillaGaleria from '../templates/PlantillaGaleria';
import FormularioPlanta from '../organisms/FormularioPlanta';
import LeyendaEstados from '../molecules/LeyendaEstados';

export default function PaginaGaleria() {
  const [plantas, setPlantas] = useState([]);
  const [qrs, setQrs] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recargar, setRecargar] = useState(0);
  const [qrsGenerando, setQrsGenerando] = useState(false);
  const [mensajeQR, setMensajeQR] = useState(null);
  const [filtroFamilia, setFiltroFamilia] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [qrDialogoAbierto, setQrDialogoAbierto] = useState(false);
  const [qrDialogoError, setQrDialogoError] = useState(null);
  const [puertaAdmin, setPuertaAdmin] = useState(null);
  const [puertaAdminCargando, setPuertaAdminCargando] = useState(false);
  const [puertaAdminError, setPuertaAdminError] = useState(null);
  const [leyendaAbierta, setLeyendaAbierta] = useState(false);

  useEffect(() => {
    aplicarSeo({
      titulo: 'Catálogo de especies · PlantaQR',
      descripcion:
        'Las especies inventariadas del Parque principal de Chitagá: nombre científico, familia, origen, usos y estado de conservación de cada árbol.',
      ruta: '/#/galeria',
    });
  }, []);

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

  useEffect(() => {
    const alVisibilizar = () => {
      if (document.visibilityState === 'visible') {
        setRecargar((n) => n + 1);
      }
    };
    document.addEventListener('visibilitychange', alVisibilizar);
    return () => document.removeEventListener('visibilitychange', alVisibilizar);
  }, []);

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

  const abrirPuerta = (destino) => () => {
    setPuertaAdminError(null);
    setPuertaAdmin(destino);
  };
  const cerrarPuerta = () => {
    setPuertaAdmin(null);
    setPuertaAdminCargando(false);
    setPuertaAdminError(null);
  };
  const confirmarPuerta = async (password) => {
    setPuertaAdminCargando(true);
    setPuertaAdminError(null);
    try {
      await verificarAdmin(password);
      window.open(puertaAdmin.url, '_blank', 'noopener');
      cerrarPuerta();
    } catch (e) {
      setPuertaAdminError(e.message);
    }
    setPuertaAdminCargando(false);
  };

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
      <PlantillaGaleria
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
        generando={qrsGenerando}
        puedeGenerar={plantas.length > 0}
        onCrear={abrirCrear}
        onRegenerarTodos={abrirDialogoQR}
        onEditarImagenes={abrirPuerta({ url: '/depurar-plantas' })}
        onArchivos={abrirPuerta({ url: '/depurar-imagenes' })}
        onVerEstados={() => setLeyendaAbierta(true)}
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
        puertaAdmin={{
          abierto: Boolean(puertaAdmin),
          cargando: puertaAdminCargando,
          error: puertaAdminError,
          onCerrar: cerrarPuerta,
          alConfirmar: confirmarPuerta,
        }}
      />
      {formulario && (
        <FormularioPlanta
          planta={formulario.planta}
          onClose={cerrarFormulario}
          onGuardado={handleGuardado}
        />
      )}
      {leyendaAbierta && <LeyendaEstados onCerrar={() => setLeyendaAbierta(false)} />}
    </>
  );
}