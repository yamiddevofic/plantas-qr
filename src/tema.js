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

export function aplicarTemaInicial() {
  const tema = leerTema();
  document.documentElement.dataset.tema = tema;
  return tema;
}

export function useTema() {
  return useContext(TemaContext);
}