import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
      '/depurar-plantas': 'http://localhost:3001',
      '/depurar-imagenes': 'http://localhost:3001',
    },
  },
})
