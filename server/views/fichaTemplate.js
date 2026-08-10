export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ESTADO_CLASE = {
  extinto: 'extinto',
  'extinto en estado silvestre': 'silvestre',
  'en peligro': 'peligro',
  vulnerable: 'vulnerable',
  'casi amenazado': 'amenazado',
  'preocupación menor': 'bien',
  'datos insuficientes': 'info',
  'vulnerable (según catálogo plantaqr del parque)': 'vulnerable',
  'no amenazada': 'bien',
  'no amenazada (cultivada)': 'cultivada',
  'no amenazada, aunque cada vez más escasa en áreas urbanas': 'escasa',
  'no determinado': 'info',
};

const TIPO_ICONO = {  árbol: '🌳',
  arbusto: '🌿',
  hierba: '🌱',
  'planta acuática': '🪷',
  cactus: '🌵',
  piedra: '🪨',
};

function numeroCoordenada(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(6) : null;
}

export function renderFichaHTML(planta) {
  const comun = planta.nombre.comun;
  const cientifico = planta.nombre.cientifico;
  const tipo = planta.tipo || 'planta';
  const tipoIcono = TIPO_ICONO[tipo] || '🌿';
  const estado = planta.estadoConservacion || 'sin información';
  const estadoClase = ESTADO_CLASE[estado] || 'info';

  const hechos = [
    planta.familia && { icono: '🌱', etiqueta: 'Familia', valor: `Familia ${planta.familia}` },
    planta.origen && { icono: '🌎', etiqueta: 'Origen', valor: planta.origen },
    planta.altura && { icono: '📏', etiqueta: 'Altura', valor: planta.altura },
    planta.ubicacion?.descripcion && { icono: '📍', etiqueta: 'Ubicación', valor: planta.ubicacion.descripcion },
  ].filter(Boolean);

  const lat = numeroCoordenada(planta.ubicacion?.latitud);
  const lng = numeroCoordenada(planta.ubicacion?.longitud);

  const usos = Array.isArray(planta.usos) ? planta.usos.filter(Boolean) : [];
  const hasInfo = !!(planta.descripcion?.general || planta.descripcion?.hojas || planta.impacto);

  const ejemplaresRaw = Array.isArray(planta.ejemplares)
    ? planta.ejemplares.filter((e) => e && e.imagen)
    : [];
  const galeria = ejemplaresRaw.length > 1;
  const badgeTipo = `<span class="badge">${tipoIcono} ${esc(tipo)}</span>`;
  const badgeEstado = `<span class="badge estado ${estadoClase}">${esc(estado)}</span>`;
  const heroMedia = galeria
    ? `
      <div class="hero-media galeria" data-galeria>
        ${ejemplaresRaw.map((e, i) => `<img
          src="${esc(e.imagen)}"
          alt="Fotografía de ${esc(comun)} (${i + 1} de ${ejemplaresRaw.length})"
          data-caption="${esc(e.ubicacion || '')}"
          class="${i === 0 ? 'on' : ''}"
          onerror="this.style.visibility='hidden'"
          loading="lazy"
        />`).join('')}
        <div class="hero-badges">${badgeTipo}${badgeEstado}</div>
        <button type="button" class="g-btn g-prev" aria-label="Imagen anterior">‹</button>
        <button type="button" class="g-btn g-next" aria-label="Imagen siguiente">›</button>
        <div class="g-dots" aria-hidden="true"></div>
        <p class="g-caption">📍 ${esc(ejemplaresRaw[0]?.ubicacion || '')}</p>
      </div>`
    : `
      <div class="hero-media">
        <img
          src="${esc(planta.imagen || '')}"
          alt="Fotografía de ${esc(comun)}"
          width="1600"
          height="1000"
          loading="eager"
          fetchpriority="high"
          decoding="async"
          onerror="this.style.visibility='hidden'"
        />
        <div class="hero-badges">${badgeTipo}${badgeEstado}</div>
        ${ejemplaresRaw[0]?.ubicacion ? `<p class="g-caption">📍 ${esc(ejemplaresRaw[0].ubicacion)}</p>` : ''}
      </div>`;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="#173F2F" />
<meta name="description" content="Ficha de ${esc(comun)} (${esc(cientifico)}) en el Parque principal de Chitagá." />
<title>${esc(comun)} · Parque de Chitagá</title>
<style>
  :root {
    --forest-900: #173f2f; --forest-700: #2d6a4f; --forest-600: #35765a;
    --leaf-500: #45906c; --sage-300: #b7e4c7; --sage-200: #d3eeda;
    --mint-100: #e7f2ea; --mint-50: #f4f9f5; --earth-600: #8a5a33;
    --ink-900: #1f2a24; --ink-700: #3c4d43; --ink-500: #5f6f66;
    --ink-300: #93a49a; --line-200: #e2e9e4; --line-100: #eef3ef;
    --white: #fff; --danger-700: #9f2b30; --warning-700: #8f5a09;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif;
    background: var(--mint-50);
    background-image: radial-gradient(circle at 12% -8%, rgba(183,228,199,.35), transparent 42%);
    color: var(--ink-900);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  img { max-width: 100%; display: block; }
  a:focus-visible, button:focus-visible { outline: 3px solid rgba(45,106,79,.35); outline-offset: 2px; }

  .layout { max-width: 760px; margin: 0 auto; padding: 0 18px 64px; }

  .hero {
    border-radius: 24px;
    overflow: hidden;
    margin-top: 18px;
    background: var(--white);
    box-shadow: 0 12px 32px rgba(23,63,47,.14);
    border: 1px solid var(--line-200);
  }
  .hero-media { position: relative; }
  .hero-media img { width: 100%; height: 280px; object-fit: cover; background: linear-gradient(140deg, var(--mint-100), var(--sage-200)); }
  @media (min-width: 640px) { .hero-media img { height: 360px; } }
  .hero-media.galeria { height: 280px; }
  @media (min-width: 640px) { .hero-media.galeria { height: 360px; } }
  .hero-media.galeria img { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; transition: opacity .6s ease; }
  .hero-media.galeria img.on { opacity: 1; }
  .g-btn { position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; width: 40px; height: 40px; border: none; border-radius: 50%; background: rgba(23,63,47,.55); color: #fff; font-size: 1.5rem; line-height: 1; cursor: pointer; }
  .g-prev { left: 10px; }
  .g-next { right: 10px; }
  .g-btn:hover { background: rgba(23,63,47,.8); }
  .g-dots { position: absolute; bottom: 46px; left: 50%; transform: translateX(-50%); z-index: 2; display: flex; gap: 7px; padding: 6px 10px; border-radius: 999px; background: rgba(23,63,47,.55); }
  .g-dot { width: 8px; height: 8px; border: none; border-radius: 50%; padding: 0; background: rgba(255,255,255,.45); cursor: pointer; transition: transform .3s ease; }
  .g-dot.on { background: #fff; transform: scale(1.25); }
  .g-caption { position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; margin: 0; padding: 26px 18px 12px; background: linear-gradient(transparent, rgba(23,63,47,.82)); color: #fff; font-size: 13px; font-weight: 600; line-height: 1.4; text-align: center; }
  .hero-badges { position: absolute; top: 14px; left: 14px; right: 14px; display: flex; gap: 8px; justify-content: space-between; }
  .badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 700; letter-spacing: .06em;
    padding: 7px 12px; border-radius: 999px; color: var(--white);
    background: rgba(23,63,47,.85); backdrop-filter: blur(4px);
  }
  .badge.estado { text-transform: capitalize; letter-spacing: .02em; }
  /* Escala termómetro de conservación (estilos IUCN) */
  .badge.extinto { background: #3b0d0d; color: #fff; }
  .badge.silvestre { background: #6b1515; color: #fff; }
  .badge.peligro { background: #c1272d; color: #fff; }
  .badge.vulnerable { background: #f97316; color: #3c1a05; }
  .badge.amenazado { background: #fbbf24; color: #451a03; }
  .badge.bien { background: #cfe8d8; color: #173f2f; border: 1px solid #a9d5b8; }
  .badge.cultivada { background: #d7efdf; color: #1e5631; border: 1px solid #9fd0ae; }
  .badge.escasa { background: #fef3c7; color: #713f12; border: 1px solid #f6d78e; }
  .badge.info { background: #d6dde0; color: #374151; }

  .hero-body { padding: 22px 22px 26px; }
  .eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    color: var(--forest-600); margin-bottom: 8px;
  }
  h1 { font-size: clamp(1.7rem, 4vw, 2.4rem); font-weight: 800; letter-spacing: -.02em; color: var(--forest-900); line-height: 1.15; }
  .cientifico { font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 1.05rem; color: var(--leaf-500); margin-top: 6px; }

  section { margin-top: 28px; }
  h2 {
    display: flex; align-items: center; gap: 10px;
    font-size: .85rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;
    color: var(--forest-600); margin-bottom: 14px;
  }
  .divider { flex: 1; height: 1px; background: var(--line-200); }

  .facts { display: grid; grid-template-columns: 1fr; gap: 12px; }
  @media (min-width: 520px) { .facts { grid-template-columns: 1fr 1fr; } }
  .fact {
    display: flex; gap: 12px; align-items: flex-start;
    background: var(--white); border: 1px solid var(--line-200);
    border-radius: 14px; padding: 14px 16px;
  }
  .fact-icon { font-size: 1.3rem; line-height: 1.3; }
  .fact-label { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-300); }
  .fact-value { font-weight: 600; color: var(--ink-900); font-size: .98rem; }

  .text-card {
    background: var(--white); border: 1px solid var(--line-200);
    border-radius: 14px; padding: 18px;
  }
  .text-card p:not(:last-child), .text-card ul:not(:last-child) { margin-bottom: 12px; }
  .text-card p { color: var(--ink-700); }

  .usos { display: flex; flex-wrap: wrap; gap: 8px; }
  .uso {
    background: var(--mint-100); border: 1px solid var(--line-200);
    border-radius: 999px; padding: 7px 13px; font-size: .85rem; font-weight: 600; color: var(--ink-700);
  }
  .sin-dato { color: var(--ink-300); font-style: italic; }

  .coords { font-size: .8rem; color: var(--ink-500); margin-top: 8px; }

  .impacto {
    display: flex; gap: 12px;
    background: var(--mint-100); border: 1px solid var(--sage-300);
    border-left: 4px solid var(--forest-700);
    border-radius: 14px; padding: 16px 18px; color: var(--ink-700);
  }

  .footer {
    margin-top: 44px; padding-top: 22px;
    border-top: 1px solid var(--line-200);
    text-align: center; color: var(--ink-300); font-size: .78rem;
  }
  .footer strong { color: var(--forest-600); font-weight: 700; }
</style>
</head>
<body>
  <main class="layout">
    <article class="hero">
      ${heroMedia}
      <div class="hero-body">
        <p class="eyebrow">Parque principal de Chitagá</p>
        <h1>${esc(comun)}</h1>
        <p class="cientifico">${esc(cientifico)}</p>
      </div>
    </article>

    ${hechos.length ? `
    <section aria-labelledby="t-facts">
      <h2 id="t-facts">Datos rápidos<span class="divider"></span></h2>
      <div class="facts">
        ${hechos.map((f) => `
        <div class="fact">
          <span class="fact-icon" aria-hidden="true">${f.icono}</span>
          <div>
            <p class="fact-label">${f.etiqueta}</p>
            <p class="fact-value">${esc(f.valor)}</p>
          </div>
        </div>`).join('')}
        ${lat && lng ? `
        <div class="fact">
          <span class="fact-icon" aria-hidden="true">🧭</span>
          <div>
            <p class="fact-label">Coordenadas</p>
            <p class="fact-value">${lat}, ${lng}</p>
          </div>
        </div>` : ''}
      </div>
    </section>` : ''}

    ${hasInfo ? `
    <section aria-labelledby="t-info">
      <h2 id="t-info">Conoce este árbol<span class="divider"></span></h2>
      ${planta.descripcion?.general ? `
      <div class="text-card">
        <p>${esc(planta.descripcion.general)}</p>
        ${planta.descripcion?.hojas ? `<p><strong>Hojas:</strong> ${esc(planta.descripcion.hojas)}</p>` : ''}
      </div>` : planta.descripcion?.hojas ? `
      <div class="text-card">
        <p><strong>Hojas:</strong> ${esc(planta.descripcion.hojas)}</p>
      </div>` : ''}
      ${planta.impacto ? `
      <div class="impacto">
        <span aria-hidden="true">💚</span>
        <p><strong>Importancia ambiental:</strong> ${esc(planta.impacto)}</p>
      </div>` : ''}
    </section>` : ''}

    ${usos.length ? `
    <section aria-labelledby="t-usos">
      <h2 id="t-usos">Usos tradicionales<span class="divider"></span></h2>
      <div class="usos">
        ${usos.map((u) => `<span class="uso">${esc(u)}</span>`).join('')}
      </div>
    </section>` : ''}

    <footer class="footer">
      <p><strong>PlantaQR</strong> · Educación ambiental del Parque principal de Chitagá</p>
      <p>Proyecto SENA · Identificación de especies mediante códigos QR</p>
    </footer>
  </main>
  <script>
    (function () {
      var galeria = document.querySelector('[data-galeria]');
      if (!galeria) return;
      var ims = galeria.querySelectorAll('img');
      var dotsEl = galeria.querySelector('.g-dots');
      var capEl = galeria.querySelector('.g-caption');
      var i = 0;
      var timer;
      function show(n) {
        i = (n + ims.length) % ims.length;
        ims.forEach(function (im, k) { im.classList.toggle('on', k === i); });
        var dots = dotsEl.children;
        for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('on', k === i);
        if (capEl) capEl.textContent = '📍 ' + (ims[i].getAttribute('data-caption') || '');
      }
      function restart() {
        clearInterval(timer);
        timer = setInterval(function () { show(i + 1); }, 4500);
      }
      for (var k = 0; k < ims.length; k++) {
        (function (k) {
          var d = document.createElement('button');
          d.type = 'button';
          d.className = 'g-dot';
          d.setAttribute('aria-label', 'Ver imagen ' + (k + 1));
          d.addEventListener('click', function () { show(k); restart(); });
          dotsEl.appendChild(d);
        })(k);
      }
      galeria.querySelector('.g-prev').addEventListener('click', function () { show(i - 1); restart(); });
      galeria.querySelector('.g-next').addEventListener('click', function () { show(i + 1); restart(); });
      show(0);
      timer = setInterval(function () { show(i + 1); }, 4500);
    })();
  </script>
</body>
</html>`;
}

export function renderNotFoundFichaHTML() {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Árbol no encontrado · Parque de Chitagá</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif;
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #f4f9f5; color: #1f2a24; padding: 24px; text-align: center;
  }
  .card {
    background: #fff; border: 1px solid #e2e9e4; border-radius: 20px;
    box-shadow: 0 12px 32px rgba(23,63,47,.14); padding: 40px 28px; max-width: 420px;
  }
  .icon { font-size: 3rem; margin-bottom: 14px; }
  h1 { font-size: 1.5rem; color: #173f2f; margin-bottom: 8px; }
  p { color: #5f6f66; margin-bottom: 20px; }
  a { color: #2d6a4f; font-weight: 700; text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>
</head>
<body>
  <main class="card">
    <p class="icon" aria-hidden="true">🍂</p>
    <h1>Este ficha no existe o fue retirada</h1>
    <p>Puede que el código haya cambiado o que la especie haya sido eliminada del parque.</p>
    <p><a href="/">Volver a PlantaQR</a></p>
  </main>
</body>
</html>`;
}