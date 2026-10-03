import { useSyncExternalStore } from 'react';

function suscribir(avisar) {
  window.addEventListener('online', avisar);
  window.addEventListener('offline', avisar);
  return () => {
    window.removeEventListener('online', avisar);
    window.removeEventListener('offline', avisar);
  };
}

/** `true` mientras el navegador crea tener conexión. */
export default function useEnLinea() {
  return useSyncExternalStore(suscribir, () => navigator.onLine, () => true);
}
