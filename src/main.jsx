import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import TemaProvider from './TemaProvider.jsx'
import { aplicarTemaInicial } from './tema.js'

aplicarTemaInicial();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TemaProvider>
      <App />
    </TemaProvider>
  </StrictMode>,
)