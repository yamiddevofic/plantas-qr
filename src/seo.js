/* Actualiza el <head> al cambiar de vista. Sirve para Google —que sí ejecuta
   JavaScript— y para que la pestaña, el historial y los marcadores digan de qué
   especie se trata. Los rastreadores de WhatsApp, Facebook y X no ejecutan JS:
   para ellos siempre valen los valores estáticos de index.html. */

export const SITIO = 'https://plantas-qr.vercel.app';
export const NOMBRE_SITIO = 'PlantaQR';

const DESCRIPCION_BASE =
  'Identifica los árboles del Parque principal de Chitagá escaneando sus códigos QR: familia, origen, usos y estado de conservación de cada especie.';

export const SEO_INICIO = {
  titulo: 'PlantaQR · Árboles del Parque de Chitagá',
  descripcion: DESCRIPCION_BASE,
  ruta: '/',
};

function fijarMeta(selector, atributo, valor) {
  let etiqueta = document.head.querySelector(selector);
  if (!etiqueta) {
    etiqueta = document.createElement('meta');
    const [, clave, nombre] = selector.match(/\[(\w+)="([^"]+)"\]/) || [];
    if (!clave) return;
    etiqueta.setAttribute(clave, nombre);
    document.head.appendChild(etiqueta);
  }
  etiqueta.setAttribute(atributo, valor);
}

function fijarCanonica(url) {
  let enlace = document.head.querySelector('link[rel="canonical"]');
  if (!enlace) {
    enlace = document.createElement('link');
    enlace.setAttribute('rel', 'canonical');
    document.head.appendChild(enlace);
  }
  enlace.setAttribute('href', url);
}

function fijarDatosEstructurados(datos) {
  const id = 'seo-datos-vista';
  document.getElementById(id)?.remove();
  if (!datos) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(datos);
  document.head.appendChild(script);
}

function absoluta(ruta) {
  if (!ruta) return `${SITIO}/og.jpg`;
  return ruta.startsWith('http') ? ruta : `${SITIO}${ruta}`;
}

export function aplicarSeo({ titulo, descripcion, ruta = '/', imagen, tipo = 'website', datos } = {}) {
  const url = `${SITIO}${ruta}`;
  const imagenAbsoluta = absoluta(imagen);

  document.title = titulo;
  fijarMeta('meta[name="description"]', 'content', descripcion);
  fijarCanonica(url);

  fijarMeta('meta[property="og:type"]', 'content', tipo);
  fijarMeta('meta[property="og:title"]', 'content', titulo);
  fijarMeta('meta[property="og:description"]', 'content', descripcion);
  fijarMeta('meta[property="og:url"]', 'content', url);
  fijarMeta('meta[property="og:image"]', 'content', imagenAbsoluta);

  fijarMeta('meta[name="twitter:title"]', 'content', titulo);
  fijarMeta('meta[name="twitter:description"]', 'content', descripcion);
  fijarMeta('meta[name="twitter:image"]', 'content', imagenAbsoluta);

  fijarDatosEstructurados(datos);
}

/* Las fichas todavía no tienen coordenadas reales (están en 0,0 en la base).
   Publicar ese par situaría cada árbol en el golfo de Guinea, así que el geo
   solo se emite cuando hay algo que valga la pena declarar. */
function lugarDe(planta) {
  const lat = Number(planta.ubicacion?.latitud);
  const lon = Number(planta.ubicacion?.longitud);
  const lugar = {
    '@type': 'Place',
    name: 'Parque principal de Chitagá',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Chitagá',
      addressRegion: 'Norte de Santander',
      addressCountry: 'CO',
    },
  };

  if (Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0)) {
    lugar.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lon };
  }
  return lugar;
}

/* Ficha de una especie. Schema.org no tiene un tipo para "árbol del parque",
   así que se usa Thing con las propiedades taxonómicas en additionalProperty:
   es lo que los validadores aceptan sin inventar vocabulario. */
export function seoDePlanta(planta) {
  const { comun, cientifico } = planta.nombre;
  const titulo = `${comun} (${cientifico}) · Árboles del Parque de Chitagá`;
  const general = String(planta.descripcion?.general || '').replace(/\s+/g, ' ').trim();
  const resumen = general.length > 155 ? `${general.slice(0, 152).trimEnd()}…` : general;
  const descripcion =
    resumen || `${comun} (${cientifico}), familia ${planta.familia}, en el Parque principal de Chitagá.`;
  const imagen = planta.imagen || planta.imagenes?.[0];

  return {
    titulo,
    descripcion,
    ruta: `/#/planta/${planta._id}`,
    imagen,
    tipo: 'article',
    datos: {
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: comun,
      alternateName: cientifico,
      description: descripcion,
      image: absoluta(imagen),
      url: `${SITIO}/#/planta/${planta._id}`,
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Nombre científico', value: cientifico },
        { '@type': 'PropertyValue', name: 'Familia', value: planta.familia },
        { '@type': 'PropertyValue', name: 'Origen', value: planta.origen },
        { '@type': 'PropertyValue', name: 'Altura', value: planta.altura },
        { '@type': 'PropertyValue', name: 'Estado de conservación', value: planta.estadoConservacion },
      ].filter((p) => p.value),
      location: lugarDe(planta),
    },
  };
}
