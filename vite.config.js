import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // El worker de MapLibre 6 es un módulo ES (lo crea con { type: 'module' }).
  worker: { format: 'es' },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
      '/depurar-plantas': 'http://localhost:3001',
      '/depurar-imagenes': 'http://localhost:3001',
      '/depurar-verificar': 'http://localhost:3001',
    },
  },
})
