import { useCallback, useEffect, useRef, useState } from 'react';
import { LuCircleCheck, LuDownload, LuWifiOff } from 'react-icons/lu';
import useEnLinea from '../../hooks/useEnLinea';
import { descargarCatalogo, leerEstadoCatalogo } from '../../offline/catalogo';

const DIAS_PARA_ACTUALIZAR = 7;
const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });
const mb = (bytes) => `${(bytes / 1048576).toFixed(1).replace('.', ',')} MB`;

/** Con datos móviles o ahorro de datos no se descarga solo: pesa unos 30 MB. */
const conexionLigera = () => {
  const c = navigator.connection;
  return !c?.saveData && c?.type !== 'cellular';
};

/**
 * Estado del catálogo guardado en el teléfono. Con conexión (y sin datos móviles)
 * lo descarga solo la primera vez y lo renueva cada semana; también hay botón.
 */
export default function CatalogoSinConexion() {
  const enLinea = useEnLinea();
  const [estado, setEstado] = useState(leerEstadoCatalogo);
  const [progreso, setProgreso] = useState(null); // { hechas, total }
  const [error, setError] = useState(null);
  const autoRef = useRef(false);

  const descargar = useCallback(async () => {
    setError(null);
    setProgreso({ hechas: 0, total: 0 });
    try {
      await descargarCatalogo((hechas, total) => setProgreso({ hechas, total }));
      setEstado(leerEstadoCatalogo());
    } catch (e) {
      setError(e.message === 'Failed to fetch'
        ? 'No se pudo descargar el catálogo. Inténtalo de nuevo con una conexión estable.'
        : e.message);
    }
    setProgreso(null);
  }, []);

  useEffect(() => {
    if (!enLinea || autoRef.current || !conexionLigera()) return;
    const viejo = estado && Date.now() - new Date(estado.fecha).getTime() > DIAS_PARA_ACTUALIZAR * 864e5;
    if (estado && !viejo) return;
    autoRef.current = true;
    const t = setTimeout(descargar, 2500);
    return () => clearTimeout(t);
  }, [enLinea, estado, descargar]);

  if (progreso) {
    const pct = progreso.total ? Math.round((progreso.hechas / progreso.total) * 100) : 0;
    return (
      <div className="mapa-offline catalogo-offline" role="status" aria-live="polite">
        <LuDownload aria-hidden="true" />
        <span>Guardando el catálogo para verlo sin conexión… {pct} %</span>
      </div>
    );
  }

  if (estado) {
    return (
      <div className="mapa-offline mapa-offline-listo catalogo-offline">
        <LuCircleCheck aria-hidden="true" />
        <span>
          Catálogo guardado: puedes verlo sin conexión
          <span className="mapa-offline-meta"> · {fecha.format(new Date(estado.fecha))}{estado.bytes ? ` · ${mb(estado.bytes)}` : ''}</span>
          {error && <span className="mapa-offline-error"> {error}</span>}
        </span>
        {enLinea && (
          <button type="button" className="mapa-offline-boton" onClick={descargar}>Actualizar</button>
        )}
      </div>
    );
  }

  return (
    <div className="mapa-offline catalogo-offline">
      <LuWifiOff aria-hidden="true" />
      <span>
        {enLinea
          ? 'Guarda el catálogo (fichas y fotos, unos 30 MB) para verlo sin conexión.'
          : 'Sin conexión: solo se ven las especies que ya abriste. Conéctate una vez para guardar todo el catálogo.'}
        {error && <span className="mapa-offline-error"> {error}</span>}
      </span>
      {enLinea && (
        <button type="button" className="mapa-offline-boton" onClick={descargar}>Guardar catálogo</button>
      )}
    </div>
  );
}
