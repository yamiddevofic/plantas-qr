import { useCallback, useEffect, useRef, useState } from 'react';
import { LuCircleCheck, LuDownload, LuMap } from 'react-icons/lu';
import useEnLinea from '../../hooks/useEnLinea';
import { descargarMapaParque, leerEstado } from '../../offline/mapaParque';

const DIAS_PARA_ACTUALIZAR = 60;
const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });
const mb = (bytes) => `${(bytes / 1048576).toFixed(1).replace('.', ',')} MB`;

/**
 * Estado del mapa satelital del parque guardado en el teléfono. Con conexión lo
 * descarga solo la primera vez (y lo renueva cada dos meses); también hay botón.
 */
export default function MapaSinConexion() {
  const enLinea = useEnLinea();
  const [estado, setEstado] = useState(leerEstado);
  const [progreso, setProgreso] = useState(null); // { hechas, total }
  const [error, setError] = useState(null);
  const autoRef = useRef(false);

  const descargar = useCallback(async () => {
    setError(null);
    setProgreso({ hechas: 0, total: 0 });
    try {
      const r = await descargarMapaParque((hechas, total) => setProgreso({ hechas, total }));
      if (!r.guardadas) setError('No se pudo descargar el mapa. Inténtalo de nuevo con una conexión estable.');
      else setEstado(leerEstado());
    } catch (e) {
      setError(e.message);
    }
    setProgreso(null);
  }, []);

  // Descarga automática: primera vez con conexión, o si el mapa tiene más de 60 días.
  useEffect(() => {
    if (!enLinea || autoRef.current) return;
    const viejo = estado && Date.now() - new Date(estado.fecha).getTime() > DIAS_PARA_ACTUALIZAR * 864e5;
    if (estado && !viejo) return;
    if (navigator.connection?.saveData) return;
    autoRef.current = true;
    const t = setTimeout(descargar, 1500);
    return () => clearTimeout(t);
  }, [enLinea, estado, descargar]);

  if (progreso) {
    const pct = progreso.total ? Math.round((progreso.hechas / progreso.total) * 100) : 0;
    return (
      <div className="mapa-offline" role="status" aria-live="polite">
        <LuDownload aria-hidden="true" />
        <span>Guardando el mapa satelital del parque para usarlo sin conexión… {pct} %</span>
      </div>
    );
  }

  if (estado?.guardadas) {
    return (
      <div className="mapa-offline mapa-offline-listo">
        <LuCircleCheck aria-hidden="true" />
        <span>
          Mapa satelital del parque guardado para usar sin conexión
          <span className="mapa-offline-meta"> · {fecha.format(new Date(estado.fecha))}{estado.bytes ? ` · ${mb(estado.bytes)}` : ''}</span>
        </span>
        {enLinea && (
          <button type="button" className="mapa-offline-boton" onClick={descargar}>Actualizar</button>
        )}
      </div>
    );
  }

  return (
    <div className="mapa-offline">
      <LuMap aria-hidden="true" />
      <span>
        {enLinea
          ? 'Guarda el mapa satelital del parque para ajustar ubicaciones sin conexión.'
          : 'Sin conexión: el mapa satelital solo muestra las zonas ya vistas. Ábrelo con internet una vez para guardarlo.'}
        {error && <span className="mapa-offline-error"> {error}</span>}
      </span>
      {enLinea && (
        <button type="button" className="mapa-offline-boton" onClick={descargar}>Guardar mapa</button>
      )}
    </div>
  );
}
