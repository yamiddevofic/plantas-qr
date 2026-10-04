import { useEffect, useState } from 'react';

const DURACION_MS = 1400;

/**
 * Número que sube de 0 al objetivo con desaceleración cuando `activo` pasa a
 * true. Con "reducir movimiento" (o sin objetivo) devuelve el valor final.
 */
export default function useContador(objetivo, activo) {
  const [valor, setValor] = useState(0);
  const reducir = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!activo || reducir || typeof objetivo !== 'number') return undefined;
    let inicio = null;
    let cuadro = 0;
    const paso = (t) => {
      if (inicio === null) inicio = t;
      const avance = Math.min((t - inicio) / DURACION_MS, 1);
      setValor(Math.round(objetivo * (1 - (1 - avance) ** 3)));
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [objetivo, activo, reducir]);

  if (typeof objetivo !== 'number') return null;
  return reducir ? objetivo : valor;
}
