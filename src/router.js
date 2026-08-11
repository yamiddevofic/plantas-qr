import { useEffect, useState } from 'react';

export function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const match = hash.match(/^#\/planta\/([^/?]+)/);
  if (match) {
    return { nombre: 'detalle', id: decodeURIComponent(match[1]) };
  }
  if (hash.startsWith('#/galeria')) {
    return { nombre: 'galeria' };
  }
  return { nombre: 'inicio' };
}