import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Genera dist/sw.js a partir de src/offline/sw.js con la lista de archivos del
// build (nombres con hash) para precargarlos. Las fotos de /uploads no se
// precargan: se guardan a medida que se ven.
function serviceWorker() {
  let outDir = 'dist'
  const recorrer = (carpeta, base = carpeta) => fs.readdirSync(carpeta, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(carpeta, e.name)
    return e.isDirectory() ? recorrer(ruta, base) : [`/${path.relative(base, ruta).split(path.sep).join('/')}`]
  })
  return {
    name: 'plantaqr-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const archivos = recorrer(outDir).filter((f) => (
        !f.startsWith('/uploads/') && f !== '/sw.js' && !/\.(?:map|txt|xml|jpg)$/.test(f)
      ))
      const precache = archivos
      const huella = createHash('sha256')
      for (const f of [...archivos].sort()) huella.update(f).update(fs.readFileSync(path.join(outDir, f)))
      const fuente = fs.readFileSync(path.resolve('src/offline/sw.js'), 'utf8')
        .replace("'__VERSION__'", JSON.stringify(huella.digest('hex').slice(0, 12)))
        .replace("'__PRECACHE__'", JSON.stringify(precache))
      fs.writeFileSync(path.join(outDir, 'sw.js'), fuente)
    },
  }
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
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
