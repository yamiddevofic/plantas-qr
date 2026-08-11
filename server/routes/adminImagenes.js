import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Planta from '../models/Planta.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS = path.join(__dirname, '..', 'uploads');

const router = express.Router();

const SOLO_ARCHIVOS = /^[\w\-\.]+$/;

async function referencias() {
  const plantas = await Planta.find().lean();
  const mapa = new Map();
  const buscar = (ref, planta) => {
    if (!ref) return;
    mapa.set(ref, [...(mapa.get(ref) || []), planta.nombre.comun]);
  };
  for (const p of plantas) {
    buscar(p.imagen, p);
    for (const img of p.imagenes || []) buscar(img, p);
  }
  return mapa;
}

router.get('/depurar-imagenes', async (_req, res) => {
  const refs = await referencias();
  const archivos = fs
    .readdirSync(UPLOADS)
    .filter((f) => f !== '.gitkeep' && SOLO_ARCHIVOS.test(f))
    .map((f) => {
      const stats = fs.statSync(path.join(UPLOADS, f));
      return {
        nombre: f,
        tamano: stats.size,
        modificado: stats.mtime,
        usadaPor: refs.get(`/uploads/${f}`) || [],
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const usadas = archivos.filter((a) => a.usadaPor.length > 0);
  const sinUsar = archivos.filter((a) => a.usadaPor.length === 0);

  const tarjeta = (a) => `
    <figure class="tarjeta" data-nombre="${a.nombre}">
      <img src="/uploads/${a.nombre}" alt="${a.nombre}" loading="lazy" />
      <figcaption>
        <strong>${a.nombre}</strong>
        <span class="meta">${(a.tamano / 1024).toFixed(0)} KB · ${a.modificado.toLocaleDateString('es')}</span>
        ${
          a.usadaPor.length > 0
            ? `<span class="badge usada">Usada por: ${a.usadaPor.join(', ')}</span>`
            : '<span class="badge libre">Sin referencia en la BD</span>'
        }
        <button class="borrar" onclick="borrar('${a.nombre}')">Eliminar</button>
      </figcaption>
    </figure>`;

  res.send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Depurar imágenes de especies</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #f3f7f4; color: #17332a; }
  h1 { font-size: 1.2rem; margin-bottom: 4px; }
  .sub { color: #5f6f66; font-size: .85rem; margin-bottom: 20px; }
  .resumen { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
  .resumen span { background: #fff; border: 1px solid #d8e4dc; border-radius: 10px; padding: 8px 12px; font-size: .85rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
  .tarjeta { background: #fff; border-radius: 12px; overflow: hidden; margin: 0; border: 1px solid #e2ebe5; display: flex; flex-direction: column; }
  .tarjeta img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; background: #e7f2ea; }
  .tarjeta figcaption { padding: 10px; display: flex; flex-direction: column; gap: 6px; font-size: .78rem; }
  .tarjeta strong { word-break: break-all; font-size: .82rem; }
  .meta { color: #5f6f66; }
  .badge { padding: 3px 8px; border-radius: 999px; font-size: .68rem; font-weight: 600; }
  .usada { background: #e7f2ea; color: #2d6a4f; }
  .libre { background: #fdf3f2; color: #b03a2e; }
  .borrar { margin-top: 4px; border: none; background: #b03a2e; color: #fff; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: .75rem; font-weight: 700; }
  .borrar:hover { background: #8f2d24; }
  h2 { font-size: .9rem; margin: 26px 0 12px; }
  .aviso { background: #fff8e6; border: 1px solid #eedfae; color: #6b5410; padding: 10px 14px; border-radius: 10px; font-size: .82rem; margin-bottom: 18px; }
</style>
</head>
<body>
  <h1>Depurar imágenes de especies</h1>
  <p class="sub">Archivos en server/uploads. Las marcadas en verde están en uso por alguna especie; las rojas no se usan. Eliminar una en verde dejará sin foto a esa especie.</p>
  <div class="resumen">
    <span>Total: ${archivos.length}</span>
    <span>En uso: ${usadas.length}</span>
    <span>Sin uso: ${sinUsar.length}</span>
  </div>
  <h2>Sin referencia en la BD (candidatas a eliminar)</h2>
  <div class="grid">${sinUsar.map(tarjeta).join('') || '<p class="sub">Ninguna.</p>'}</div>
  <h2>En uso por especies</h2>
  <div class="grid">${usadas.map(tarjeta).join('') || '<p class="sub">Ninguna.</p>'}</div>
  <script>
    async function borrar(nombre) {
      if (!confirm('¿Eliminar ' + nombre + ' del servidor?')) return;
      const res = await fetch('/depurar-imagenes/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivo: nombre }),
      });
      const data = await res.json();
      if (data.ok) {
        document.querySelector('[data-nombre="' + nombre + '"]')?.remove();
      } else {
        alert(data.error || 'No se pudo eliminar');
      }
    }
  </script>
</body>
</html>`);
});

router.post('/depurar-imagenes/eliminar', async (req, res) => {
  const { archivo } = req.body || {};
  if (!archivo || !SOLO_ARCHIVOS.test(archivo) || path.basename(archivo) !== archivo) {
    return res.status(400).json({ ok: false, error: 'Nombre de archivo no válido' });
  }
  const ruta = path.join(UPLOADS, archivo);
  if (!fs.existsSync(ruta)) {
    return res.status(404).json({ ok: false, error: 'El archivo no existe' });
  }

  const refs = await referencias();
  if (refs.has(`/uploads/${archivo}`)) {
    return res.status(409).json({
      ok: false,
      error: `Ese archivo está en uso por: ${refs.get(`/uploads/${archivo}`).join(', ')}. Quítalo primero de la especie o cancela.`,
    });
  }

  fs.unlinkSync(ruta);
  res.json({ ok: true, archivo });
});

function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

router.get('/depurar-plantas', async (_req, res) => {
  const [plantas, refs] = await Promise.all([Planta.find().lean(), referencias()]);
  const archivos = fs
    .readdirSync(UPLOADS)
    .filter((f) => f !== '.gitkeep' && SOLO_ARCHIVOS.test(f))
    .sort((a, b) => a.localeCompare(b, 'es'));

  const opciones = archivos
    .map((f) => `<option value="/uploads/${escapar(f)}">${escapar(f)}</option>`)
    .join('');

  const tarjeta = (p) => {
    const actuales = [p.imagen, ...(p.imagenes || [])].filter(Boolean);
    const previsualizacion = actuales
      .map(
        (ref) => `
        <div class="foto" data-ref="${escapar(ref)}">
          <img src="${escapar(ref)}" alt="" loading="lazy" />
          <span class="foto-nombre">${escapar(ref.replace('/uploads/', ''))}</span>
          <button type="button" class="quitar" onclick="quitarFoto(this)">✕</button>
        </div>`,
      )
      .join('');
    return `
    <article class="planta" data-id="${escapar(String(p._id))}">
      <header>
        <strong>${escapar(p.nombre.comun)}</strong>
        <span class="sub">${escapar(p.nombre.cientifico || '')}</span>
        <span class="id">${escapar(String(p._id))}</span>
      </header>
      <div class="fotos">${previsualizacion || '<p class="sub">Sin imágenes.</p>'}</div>
      <div class="agregar">
        <select>${opciones}</select>
        <button type="button" class="anyadir" onclick="anyadirFoto(this)">Añadir foto</button>
      </div>
      <button type="button" class="guardar" onclick="guardar(this)">Guardar cambios</button>
      <span class="estado" aria-live="polite"></span>
    </article>`;
  };

  res.send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Editar fotos por especie</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #f3f7f4; color: #17332a; }
  h1 { font-size: 1.2rem; margin-bottom: 4px; }
  .sub { color: #5f6f66; font-size: .82rem; margin-bottom: 18px; }
  .planta { background: #fff; border: 1px solid #e2ebe5; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .planta header { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
  .planta header strong { font-size: 1rem; }
  .id { font-family: ui-monospace, monospace; font-size: .7rem; color: #5f6f66; word-break: break-all; }
  .fotos { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
  .foto { position: relative; width: 110px; }
  .foto img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; background: #e7f2ea; display: block; }
  .foto .foto-nombre { display: block; font-size: .65rem; color: #5f6f66; word-break: break-all; margin-top: 3px; }
  .foto .quitar { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border: none; border-radius: 50%; background: rgba(176,58,46,.9); color: #fff; cursor: pointer; font-size: .7rem; }
  .agregar { display: flex; gap: 8px; margin-bottom: 10px; }
  .agregar select { flex: 1; padding: 6px 8px; border-radius: 8px; border: 1px solid #d8e4dc; }
  .anyadir, .guardar { border: none; border-radius: 8px; padding: 7px 14px; font-weight: 700; font-size: .78rem; cursor: pointer; }
  .anyadir { background: #e7f2ea; color: #2d6a4f; }
  .guardar { background: #2d6a4f; color: #fff; }
  .guardar:disabled { opacity: .5; cursor: default; }
  .estado { font-size: .78rem; margin-left: 8px; }
  .ok { color: #2d6a4f; }
  .err { color: #b03a2e; }
</style>
</head>
<body>
  <h1>Editar fotos de cada especie</h1>
  <p class="sub">Asigna qué archivo usa cada planta (la primera foto es la principal de la tarjeta y la ficha). Los cambios se guardan en la BD.</p>
  ${plantas.map(tarjeta).join('')}
  <script>
    const nombreArchivo = (ref) => ref.replace('/uploads/', '');

    function quitarFoto(boton) {
      boton.closest('.foto').remove();
    }

    function anyadirFoto(boton) {
      const caja = boton.closest('.planta');
      const select = caja.querySelector('.agregar select');
      const ref = select.value;
      if (!ref || caja.querySelector('.foto[data-ref="' + ref + '"]')) return;
      const div = document.createElement('div');
      div.className = 'foto';
      div.dataset.ref = ref;
      div.innerHTML = '<img src="' + ref + '" alt="" loading="lazy" /><span class="foto-nombre">' + nombreArchivo(ref) + '</span><button type="button" class="quitar" onclick="quitarFoto(this)">✕</button>';
      caja.querySelector('.fotos').appendChild(div);
    }

    async function guardar(boton) {
      const caja = boton.closest('.planta');
      const id = caja.dataset.id;
      const refs = [...caja.querySelectorAll('.foto')].map((f) => f.dataset.ref);
      const estado = caja.querySelector('.estado');
      boton.disabled = true;
      estado.className = 'estado';
      estado.textContent = 'Guardando…';
      try {
        const res = await fetch('/depurar-plantas/guardar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, refs }),
        });
        const tipo = (res.headers.get('Content-Type') || '').toLowerCase();
        if (!tipo.includes('application/json')) {
          throw new Error('El servidor respondió con una página en vez de JSON. Reinícialo para que cargue los últimos cambios del modelo (node server/index.js).');
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error');
        estado.className = 'estado ok';
        estado.textContent = 'Guardado ✓';
      } catch (e) {
        estado.className = 'estado err';
        estado.textContent = e.message;
      }
      boton.disabled = false;
    }
  </script>
</body>
</html>`);
});

router.post('/depurar-plantas/guardar', async (req, res) => {
  const { id, refs } = req.body || {};
  if (!id || !Array.isArray(refs)) {
    return res.status(400).json({ ok: false, error: 'Datos inválidos' });
  }
  const limpias = refs
    .filter((r) => typeof r === 'string' && /^\/uploads\/[\w\-\.]+$/.test(r))
    .map((r) => {
      const nombre = r.replace('/uploads/', '');
      return fs.existsSync(path.join(UPLOADS, nombre)) ? r : null;
    })
    .filter(Boolean);

  const plant = await Planta.findById(id);
  if (!plant) return res.status(404).json({ ok: false, error: 'No existe esa especie' });

  plant.imagen = limpias[0] ?? '';
  plant.imagenes = limpias.slice(1);
  await plant.save();
  res.json({ ok: true, id, imagenes: limpias });
});

export default router;