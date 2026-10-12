import { useEffect, useState } from 'react';

export function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  // `?arbol=<id>`: se llegó desde un árbol del mapa general; la ficha usa su foto.
  const match = hash.match(/^#\/planta\/([^/?]+)(?:\?(.*))?/);
  if (match) {
    const arbol = new URLSearchParams(match[2] ?? '').get('arbol');
    return { nombre: 'detalle', id: decodeURIComponent(match[1]), arbol: arbol || null };
  }
  // Mapa del parque: ?especie=<id> muestra solo esa especie y &arbol=<id> abre ese árbol.
  const mapa = hash.match(/^#\/mapa(?:\?(.*))?$/);
  if (mapa) {
    const q = new URLSearchParams(mapa[1] ?? '');
    return { nombre: 'mapa', especie: q.get('especie') || null, arbol: q.get('arbol') || null };
  }
  // #/especies-fotos era la ruta anterior del módulo; se conserva por los enlaces guardados.
  if (hash.startsWith('#/especies')) {
    return { nombre: 'especies' };
  }
  if (hash.startsWith('#/individuos')) {
    return { nombre: 'individuos' };
  }
  if (hash.startsWith('#/galeria')) {
    return { nombre: 'galeria' };
  }
  return { nombre: 'inicio' };
}