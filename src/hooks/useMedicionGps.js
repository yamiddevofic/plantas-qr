import { useCallback, useEffect, useRef, useState } from 'react';
import { combinarLecturas } from '../individuos';

const DURACION_MAXIMA_S = 45;
// Sin internet el teléfono no recibe la ayuda de las antenas (A-GPS) y tarda más en
// encontrar los satélites la primera vez.
const DURACION_SIN_CONEXION_S = 90;
// Se termina antes si hay suficientes lecturas muy precisas.
const PRECISION_OBJETIVO_M = 5;
const LECTURAS_OBJETIVO = 5;

/**
 * Mide la ubicación con el GPS durante varios segundos (watchPosition) en vez de
 * aceptar la primera lectura. `onEstimacion` recibe la mejor estimación cada vez
 * que mejora; `onFin` se llama al terminar (sola o con `terminar()`).
 */
export default function useMedicionGps({ onEstimacion, onFin }) {
  const [midiendo, setMidiendo] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [ultima, setUltima] = useState(null); // precisión de la última lectura
  const [estimacion, setEstimacion] = useState(null);
  const [error, setError] = useState(null);
  const [duracionMaxima, setDuracionMaxima] = useState(DURACION_MAXIMA_S);

  const lecturasRef = useRef([]);
  const vigiaRef = useRef(null);
  const relojRef = useRef(null);
  const estimacionRef = useRef(null);
  const callbacksRef = useRef({ onEstimacion, onFin });
  useEffect(() => {
    callbacksRef.current = { onEstimacion, onFin };
  }, [onEstimacion, onFin]);

  const limpiar = () => {
    if (vigiaRef.current != null) navigator.geolocation?.clearWatch(vigiaRef.current);
    if (relojRef.current) clearInterval(relojRef.current);
    vigiaRef.current = null;
    relojRef.current = null;
  };

  const terminar = useCallback(() => {
    if (vigiaRef.current == null && !relojRef.current) return;
    limpiar();
    setMidiendo(false);
    callbacksRef.current.onFin?.(estimacionRef.current);
  }, []);

  const cancelar = useCallback(() => {
    limpiar();
    setMidiendo(false);
  }, []);

  const iniciar = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu navegador no ofrece geolocalización.');
      return;
    }
    limpiar();
    lecturasRef.current = [];
    estimacionRef.current = null;
    setEstimacion(null);
    setUltima(null);
    setError(null);
    setSegundos(0);
    setMidiendo(true);
    const limite = navigator.onLine ? DURACION_MAXIMA_S : DURACION_SIN_CONEXION_S;
    setDuracionMaxima(limite);

    const inicio = Date.now();
    relojRef.current = setInterval(() => {
      const s = Math.round((Date.now() - inicio) / 1000);
      setSegundos(s);
      if (s >= limite) terminar();
    }, 1000);

    vigiaRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        lecturasRef.current.push({
          latitud: coords.latitude,
          longitud: coords.longitude,
          precision: coords.accuracy,
          altitud: coords.altitude,
        });
        setUltima(coords.accuracy);
        const nueva = combinarLecturas(lecturasRef.current);
        if (nueva) {
          estimacionRef.current = nueva;
          setEstimacion(nueva);
          callbacksRef.current.onEstimacion?.(nueva);
        }
        const precisas = lecturasRef.current.filter((l) => l.precision <= PRECISION_OBJETIVO_M).length;
        if (precisas >= LECTURAS_OBJETIVO) terminar();
      },
      (e) => {
        // Un timeout aislado no detiene la medición; permiso denegado sí.
        if (e.code === 1) {
          setError('No diste permiso para usar tu ubicación. Actívalo en los ajustes del navegador.');
          cancelar();
        } else if (!lecturasRef.current.length && e.code === 2) {
          setError('El teléfono no encuentra señal GPS. Activa la ubicación y sal a cielo abierto.');
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  }, [terminar, cancelar]);

  useEffect(() => limpiar, []);

  return { midiendo, segundos, ultima, estimacion, error, iniciar, terminar, cancelar, duracionMaxima, sinConexion: duracionMaxima === DURACION_SIN_CONEXION_S };
}
