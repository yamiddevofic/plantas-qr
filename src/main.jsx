import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import TemaProvider from './TemaProvider.jsx'
import { aplicarTemaInicial } from './tema.js'

aplicarTemaInicial();

// Service worker: permite abrir la app y ver lo ya visitado sin conexión.
// Solo en producción; en desarrollo estorbaría con la recarga en caliente.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('No se pudo registrar el service worker:', error);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TemaProvider>
      <App />
    </TemaProvider>
  </StrictMode>,
)