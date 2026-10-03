import { createContext, useContext } from 'react';

export const CLAVE = 'plantaqr-tema';
export const TemaContext = createContext({ tema: 'claro', alternar: () => {} });

export function leerTema() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === 'oscuro' || guardado === 'claro') return guardado;
  } catch {
    /* almacenamiento no disponible */
  }
  return 'claro';
}

// Color de la barra de la ventana (app instalada) y del navegador en móvil:
// el mismo fondo de la página, para que el marco no se vea como un bloque aparte.
const COLOR_VENTANA = { claro: '#ffffff', oscuro: '#0f1612' };

export function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_VENTANA[tema] ?? COLOR_VENTANA.claro);
}

export function aplicarTemaInicial() {
  const tema = leerTema();
  aplicarTema(tema);
  return tema;
}

export function useTema() {
  return useContext(TemaContext);
}