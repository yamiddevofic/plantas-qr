import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Scroll suave de la página con Lenis. Con `prefers-reduced-motion` Lenis
 * desplaza sin animación por sí solo.
 */
export const lenis = new Lenis({
  autoRaf: true,
  // Las listas y paneles con scroll propio (buscador, menú, formularios) siguen
  // desplazándose de forma nativa en lugar de mover la página.
  allowNestedScroll: true,
  // La rueda sobre un mapa hace zoom en el mapa, no mueve la página.
  prevent: (nodo) => nodo.classList.contains('maplibregl-map'),
});

// En desarrollo, la recarga en caliente crearía una instancia nueva cada vez.
import.meta.hot?.dispose(() => lenis.destroy());

/** Desplaza la página con suavidad hasta el elemento con ese id. */
export function irAElemento(id) {
  const elemento = document.getElementById(id);
  if (elemento) lenis.scrollTo(elemento);
}
