// Enlaces para compartir e indexar: /planta/:id y /sitemap.xml.
//
// La app enruta por hash (/#/planta/:id), y ni los rastreadores de WhatsApp,
// Facebook o X (no ejecutan JS) ni los buscadores (descartan el fragmento) ven
// la ficha. Esta ruta devuelve, para cada especie, un HTML con sus etiquetas
// Open Graph y, para quien sí tiene navegador, lleva a la ficha real. Los QR ya
// impresos (/#/planta/:id) no cambian.
import express from 'express';
import mongoose from 'mongoose';
import Planta from '../models/Planta.js';
import { esc } from '../views/fichaTemplate.js';

const router = express.Router();

const SITIO = (process.env.SITIO_URL || 'https://plantas-qr.vercel.app').replace(/\/+$/, '');
const NOMBRE_SITIO = 'PlantaQR';
const IMAGEN_BASE = `${SITIO}/og.jpg?v=2`;

const absoluta = (ruta) => {
  if (!ruta) return IMAGEN_BASE;
  return /^https?:/.test(ruta) ? ruta : `${SITIO}/${ruta.replace(/^\/+/, '')}`;
};

/** Descripción corta de la especie, igual que la del <head> de la app. */
export function descripcionDe(planta) {
  const { comun, cientifico } = planta.nombre;
  const general = String(planta.descripcion?.general || '').replace(/\s+/g, ' ').trim();
  const resumen = general.length > 155 ? `${general.slice(0, 152).trimEnd()}…` : general;
  return resumen || `${comun} (${cientifico}), familia ${planta.familia}, en el Parque principal de Chitagá.`;
}

export function paginaCompartir(planta) {
  const { comun, cientifico } = planta.nombre;
  const titulo = `${comun} (${cientifico}) · Árboles del Parque de Chitagá`;
  const descripcion = descripcionDe(planta);
  const imagen = absoluta(planta.imagen || planta.imagenes?.[0]);
  const url = `${SITIO}/planta/${planta._id}`;
  const ficha = `${SITIO}/#/planta/${planta._id}`;
  const datos = {
    '@context': 'https://schema.org',
    '@type': 'Thing',
    name: comun,
    alternateName: cientifico,
    description: descripcion,
    image: imagen,
    url,
  };

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}" />
<link rel="canonical" href="${esc(url)}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${NOMBRE_SITIO}" />
<meta property="og:title" content="${esc(titulo)}" />
<meta property="og:description" content="${esc(descripcion)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${esc(imagen)}" />
<meta property="og:image:alt" content="${esc(`Fotografía de ${comun}`)}" />
<meta property="og:locale" content="es_CO" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(titulo)}" />
<meta name="twitter:description" content="${esc(descripcion)}" />
<meta name="twitter:image" content="${esc(imagen)}" />
<script type="application/ld+json">${JSON.stringify(datos).replace(/</g, '\\u003c')}</script>
<script>location.replace(${JSON.stringify(ficha).replace(/</g, '\\u003c')});</script>
</head>
<body>
<h1>${esc(comun)}</h1>
<p><em>${esc(cientifico)}</em></p>
<p>${esc(descripcion)}</p>
<p><a href="${esc(ficha)}">Ver la ficha completa en ${NOMBRE_SITIO}</a></p>
</body>
</html>`;
}

router.get('/planta/:id', async (req, res) => {
  try {
    const planta = mongoose.isValidObjectId(req.params.id) ? await Planta.findById(req.params.id).lean() : null;
    if (!planta) return res.redirect(302, `${SITIO}/#/galeria`);
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    res.type('html').send(paginaCompartir(planta));
  } catch {
    res.status(500).send('No se pudo cargar la ficha');
  }
});

router.get('/sitemap.xml', async (_req, res) => {
  try {
    const plantas = await Planta.find({}, '_id updatedAt').lean();
    const entradas = [
      { loc: `${SITIO}/`, prioridad: '1.0' },
      ...plantas.map((p) => ({
        loc: `${SITIO}/planta/${p._id}`,
        fecha: p.updatedAt ? new Date(p.updatedAt).toISOString().slice(0, 10) : null,
        prioridad: '0.7',
      })),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entradas
    .map((e) => `  <url><loc>${esc(e.loc)}</loc>${e.fecha ? `<lastmod>${e.fecha}</lastmod>` : ''}<priority>${e.prioridad}</priority></url>`)
    .join('\n')}
</urlset>
`;
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    res.type('application/xml').send(xml);
  } catch {
    res.status(500).send('No se pudo generar el sitemap');
  }
});

export default router;
