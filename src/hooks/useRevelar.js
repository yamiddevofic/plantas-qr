import { useEffect, useRef, useState } from 'react';

/**
 * Indica si un elemento ya entró en pantalla (una sola vez), para animar su
 * aparición al hacer scroll. Sin IntersectionObserver se muestra de una vez.
 */
export default function useRevelar({ umbral = 0.15 } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const el = ref.current;
    if (visible || !el) return undefined;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { threshold: umbral, rootMargin: '0px 0px -6% 0px' }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, [visible, umbral]);

  return [ref, visible];
}
