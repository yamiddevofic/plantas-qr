# 🌿 PlantaQR — Árboles del Parque Principal de Chitagá

Aplicación web de **educación ambiental** que permite identificar y conocer los árboles del Parque Principal de Chitagá (Norte de Santander, Colombia) mediante **códigos QR**.

Cada especie tiene una ficha con nombre común, nombre científico, familia botánica, origen, altura, descripción, usos, importancia ambiental y estado de conservación. El visitante escanea el código pegado al árbol y llega directo a la ficha de esa especie; docentes, estudiantes y administradores pueden gestionar el catálogo desde la misma aplicación.

Proyecto desarrollado como trabajo de formación SENA.

---

## ✨ Características

- **Ficha por especie accesible por QR** — cada QR apunta a una ruta propia de la aplicación (`#/planta/:id`); la ruta antigua `/api/qr/ver/:id` se conserva como ficha HTML de respaldo.
- **Buscador en el inicio** — barra "Busca rápidamente una planta" que sugiere tres especies (el arrayán primero) y filtra al escribir por nombre, familia o categoría; sin repetir especies con varias fichas.
- **Página de inicio** — hero con identidad del parque, sección "Nuestro parque" (conteo de especies y familias), acordeón del proyecto y sección de contacto.
- **Galería con búsqueda y filtros** (`#/galeria`) — busca por nombre común, científico o ID, y filtra por familia, tipo y estado de conservación (todo en cliente, sin recargar).
- **Escala termómetro de conservación** — cada estado (extinto → preocupación menor) tiene su propio color, tipo categorías IUCN, con ventana de leyenda explicativa.
- **Gestión de códigos QR** — generar/regenerar por especie, **regenerar todos** en un clic, descargar como PNG y eliminar especies desde las tarjetas.
- **Catálogo gestionable desde la UI** — crear, editar y eliminar especies desde un modal de formulario; soporta **múltiples imágenes por especie** (galería y carrusel en la ficha).
- **Fotos de día y de noche** — cada especie puede tener una portada de noche y cada árbol una foto de noche (vertical 4:5); en modo oscuro las usan solo las vistas previas (tarjetas del catálogo y miniaturas de la galería de árboles). Lo demás muestra la foto de día.
- **Foto de la hoja, del tallo y del fruto** — se cargan en «Fotos» de cada especie (con la cámara del celular o desde la galería, comprimidas antes de subir) y aparecen en la ficha junto a su descripción. Gestión de especies indica qué fotos fijas faltan por tomar.
- **Modo claro/oscuro** — tema persistente en `localStorage`, con menú lateral de navegación.
- **Imágenes optimizadas** — las subidas se convierten a **WebP** (máx. 1600px, calidad 80) con `sharp`, y se sirven con caché inmutable.
- **Acceso administrativo con contraseña** — las acciones sensibles (crear/editar plantas, generar QRs) requieren `ADMIN_PASSWORD`.
- **Diseño responsivo y minimalista** — móvil-first (320px+), ficha de dos columnas en escritorio.
- **Arquitectura atómica** — componentes en `atoms`, `molecules`, `organisms`, `templates` y `pages`.
- **Accesibilidad WCAG 2.2 (AA)** — contraste verificado, foco visible, navegación por teclado, `lang="es"`, targets táctiles ≥ 44px, estados de carga/error/vacío comunicados.
- **API REST documentada con Swagger** en `/api-docs`.

---

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 (CSS nativo, sin librerías de UI, iconos con `react-icons`) |
| Backend | Node.js + Express 5 |
| Base de datos | MongoDB (Mongoose 9, MongoDB Atlas) |
| QRs | Librería `qrcode` (genera PNG como Data URL) |
| Imágenes | `multer` + `sharp` (subida local en `server/uploads`, conversión a WebP) |
| Docs | `swagger-jsdoc` + `swagger-ui-express` |

---

## 📁 Estructura

```
plantas-qr/
├── src/                      # Frontend React
│   ├── App.jsx               # Enrutador de páginas (hash)
│   ├── router.js             # Rutas hash: #/planta/:id, #/galeria, #/individuos
│   ├── api.js                # Cliente de la API
│   ├── constantes.js         # Estados de conservación y placeholder
│   ├── tema.js               # Tema claro/oscuro (contexto + localStorage)
│   ├── index.css             # Solo @import de styles/ (el orden es la cascada)
│   ├── styles/               # Hojas por sección: tokens, tema-oscuro, base, menu-lateral,
│   │                         #   tarjeta-planta, detalle, mapa, individuos, utilidades...
│   ├── hooks/                # useModal (foco/scroll/Esc), useAccionProtegida (contraseña)
│   ├── individuos.js         # Utilidades puras: sugerir código, agrupar especies
│   ├── mapa/                 # maplibre.js (carga diferida) y capasIndividuos.js
│   ├── offline/              # sw.js (service worker) y cola.js (cambios sin conexión)
│   └── components/           # Arquitectura atómica (Atomic Design)
│       ├── atoms/            # Boton, Insignia, ImagenPlanta, Spinner, Chip,
│       │                     #   PuntoEscala, EstadoBox, BotonMenu, ItemMenu,
│       │                     #   ArbolitoLoader, BrandMark, IconoLupa
│       ├── molecules/        # CampoFormulario, Busqueda, SelectorFiltro,
│       │                     #   DialogoPassword, EstadoConservacion,
│       │                     #   LeyendaEstados, PiePagina, PopoverContacto,
│       │                     #   SeccionContacto, GrupoMenu, AccionesTarjeta...
│       ├── organisms/        # BarraFiltros, TarjetaPlanta, ListaPlantas,
│       │                     #   CarruselImagenes, GaleriaFotos, FormularioPlanta,
│       │                     #   EncabezadoApp, HeroInicio, Hero, MenuLateral,
│       │                     #   MenuHerramientas, SeccionParque, SplashCarga...
│       ├── templates/        # PlantillaListado/Galeria, PlantillaDetalle
│       └── pages/            # PaginaInicio, PaginaGaleria, PaginaDetalle, PaginaIndividuos
├── server/                   # Backend Express
│   ├── index.js              # Servidor, Swagger, SPA estática, fix DNS Atlas
│   ├── controllers/          # plantaController, qrController
│   ├── models/               # Planta, Individuo, QR
│   ├── routes/               # /api/plantas, /api/individuos, /api/qr, adminImagenes
│   ├── middleware/qrAuth.js  # Protección por ADMIN_PASSWORD (timing-safe)
│   ├── config/upload.js      # multer + optimización WebP con sharp
│   ├── scripts/              # importarPlantas, cargarIndividuosCipres, optimizarImagenes,
│   │                         #   normalizarImagenes,
│   │                         #   fusionarDuplicados, vincularImagenUbicaciones
│   ├── uploads/              # Taller local: originales jpg + webp (fuera de git)
│   └── views/fichaTemplate.js# Ficha HTML del visitante (fallback QR antiguo)
├── public/                   # favicon, iconos
│   └── uploads/              # Catálogo webp versionado que viaja con el build
├── parque-chitaga-platas.json# Datos de las especies (fuente del import)
├── docs/DESIGN.md            # Notas de diseño del proyecto
└── dist/                     # Build de producción (servido por Express)
```

---

## 🚀 Puesta en marcha

### Requisitos

- Node.js 18+
- MongoDB (local o Atlas)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz (no lo subas a control de versiones; ya está en `.gitignore`):

```env
PORT=3000
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@cluster.mongodb.net/plantas-qr?retryWrites=true&w=majority
ADMIN_PASSWORD=una-contraseña-segura
PUBLIC_URL=http://IP-O-DOMINIO:3000
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto `3000`) |
| `MONGODB_URI` | Cadena de conexión a MongoDB (Atlas o local) |
| `ADMIN_PASSWORD` | Contraseña de administrador; protege creación/edición de plantas, generación de QRs y paneles admin. Si no existe, esas rutas responden `503` (fallo seguro) |
| `PUBLIC_URL` | URL base que se incrusta en los QR. Si está vacía, se detecta automáticamente la IP de la red desde la que se consulta el servidor |

### 3. Desarrollo (API + frontend con recarga en caliente)

```bash
npm run server   # API en http://localhost:3000
npm run dev      # Frontend en http://localhost:5173 (proxy a /api)
```

### 4. Producción (un solo puerto)

```bash
npm run build
npm run server
```

Express sirve el frontend construido (`dist/`) y la API en el mismo origen: `http://IP:3000`. Los códigos QR generados apuntan a este origen (o a `PUBLIC_URL` si está configurada) con la ruta hash `/#/planta/:id`.

### Scripts

```bash
npm run dev                  # Vite (frontend)
npm run server               # API Express
npm run build                # Build de producción (dist/)
npm run preview              # Previsualiza el build
npm run lint                 # ESLint
npm run cargar-individuos-cipres # Upsert de los 10 individuos Ciprés en MongoDB
npm run optimizar-imagenes   # Convierte jpg/png de server/uploads a WebP
npm run normalizar-imagenes  # Corrige las rutas de imagen guardadas en Mongo
npm run generar-variantes    # Recortes -400/-800 para srcset + manifiesto
npm run verificar-imagenes   # Comprueba que el srcset no anuncie 404 (tras build)
npm run capturar-og          # Rehace public/og.jpg desde la landing (servidor arriba)
```

### Imágenes del catálogo

Las fotos que ve el visitante viven versionadas en `public/uploads/`, así que Vite las
copia a `dist/` y viajan con el despliegue. `server/uploads/` es el taller local
(originales pesados y lo que se sube desde el panel admin) y está fuera de git: en
producción llega vacío, por eso el catálogo no puede depender de él.

Express monta `/uploads` dos veces —primero `server/uploads/`, luego
`public/uploads/`— para que en local siga ganando lo recién subido y en producción
se sirva el catálogo del build.

Para incorporar fotos nuevas:

```bash
npm run optimizar-imagenes   # genera los .webp en server/uploads
npm run normalizar-imagenes  # deja las rutas de Mongo en /uploads/*.webp
```

Después copia a `public/uploads/` los `.webp` que estén referenciados y corre
`npm run generar-variantes` antes de hacer commit.
`normalizar-imagenes` acepta `--simulacion` para ver los cambios sin aplicarlos y
`--purgar-rotas` para quitar de las fichas las referencias sin archivo. Siempre deja
un respaldo de la colección en `tmp/respaldo-plantas-AAAA-MM-DD.json`.

### SEO

Los valores estáticos del `<head>` viven en `index.html` y apuntan a
`https://plantas-qr.vercel.app`. `src/seo.js` los reescribe al cambiar de vista:
título, descripción, canónica, Open Graph y un bloque JSON-LD por especie.

Los rastreadores de WhatsApp, Facebook y X **no ejecutan JavaScript** y los buscadores
descartan el fragmento de la URL, así que `/#/planta/:id` no sirve para compartir ni
indexar. Por eso existe `/planta/:id` (`server/routes/compartir.js`): devuelve, para cada
especie, un HTML con sus etiquetas Open Graph y JSON-LD y, en un navegador, lleva a la
ficha real. `vercel.json` la reenvía al servidor, igual que `/sitemap.xml`, que ahora se
genera con una entrada por especie. El botón «Copiar enlace» de la ficha entrega esa URL.
Los QR ya impresos (`/#/planta/:id`) siguen funcionando sin cambios.

La imagen de vista previa (`public/og.jpg`) es un pantallazo del hero de la
landing, generado por `npm run capturar-og` con el Chrome o Edge del sistema —no
instala nada—. El script necesita el servidor levantado, aísla el hero midiéndolo
sobre la propia captura y aborta sin tocar `og.jpg` si la página no pintó bien.
Al rehacerla, WhatsApp seguirá mostrando la anterior hasta que Meta vuelva a leer
la página: su caché de vistas previas es por URL y dura días. Se fuerza desde
developers.facebook.com/tools/debug con *Scrape Again*, que es la misma
infraestructura que usa WhatsApp.

### Tamaños responsivos

`generar-variantes` produce un recorte de 400px y otro de 800px por foto y escribe
`src/variantesImagenes.json` con los recortes que existen y el ancho real de cada
original. No todas tienen los dos: una foto que ya nace angosta no genera el de
800px, y anunciarlo igual daría 404. Por eso `npm run verificar-imagenes` (después
de `npm run build`) comprueba que cada candidato del srcset exista en `dist/`. `ImagenPlanta` arma el
`srcset` solo para esas fotos: una imagen subida desde el panel admin no tiene
recortes, y pedir uno inexistente daría 404 sin que el navegador reintente con el
original. Por eso el manifiesto, y por eso hay que correr el script al agregar fotos.

Los carruseles apilan sus fotos con `position: absolute`, así que el navegador las
considera visibles y `loading="lazy"` no las frena. Montan solo la foto visible y,
cuando esa termina de cargar, sus dos vecinas para el fundido y la precarga.

### Importar datos

Con la BD conectada y el archivo `parque-chitaga-platas.json` en la raíz:

```bash
node server/scripts/importarPlantas.js
```

### Individuos geolocalizados

La ficha `Planta` conserva los metadatos botánicos compartidos. Los árboles físicos se
guardan en la colección `individuos`, vinculados mediante `especieId` y con geometría
GeoJSON `Point` (`coordinates: [longitud, latitud]`) e índice `2dsphere`.

Con el catálogo Ciprés ya importado y `MONGODB_URI` configurada, carga o actualiza sus
10 individuos de forma idempotente:

```bash
npm run cargar-individuos-cipres
```

El script actualiza la primera ficha Ciprés como referencia canónica y no elimina las
fichas/IDs históricos, para no invalidar códigos QR ya impresos. `GET /api/individuos`
entrega un GeoJSON `FeatureCollection` y admite filtros opcionales `especieId` y `parque`.
Al filtrar por `especieId` se incluyen los individuos de todas las fichas con el mismo
nombre científico, así cualquier QR de Ciprés muestra los 10 árboles.

### Fotos de especies (`#/especies-fotos`)

Menú de la galería → **Editar imágenes de especies**. Lista cada ficha con su foto
principal; al editar se puede elegir la principal (la de la galería y la portada de la
ficha), quitar fotos y agregar nuevas con **Tomar foto** o **Elegir de la galería**. Las
fotos nuevas se guardan en MongoDB (`/api/imagenes/:id`) igual que las del formulario de
especies, porque el disco de Render se borra en cada despliegue y Vercel no reenvía
`/uploads`; las del catálogo versionado en `public/uploads/` siguen funcionando igual.
Requiere conexión.

### Acceso de administrador

**Gestión de individuos** y **Fotos de especies** piden la contraseña de administrador
al entrar. La primera vez se verifica con el servidor; después el dispositivo guarda una
huella PBKDF2 (nunca la contraseña) para poder entrar también sin conexión. La
contraseña queda en memoria mientras la app esté abierta, así que no se vuelve a pedir
en cada acción (eliminar sí pide confirmarla).

### Gestión de individuos (`#/individuos`)

Módulo de administración para registrar, editar y eliminar árboles y su ubicación sin
tocar la base de datos. Se abre desde el menú de la galería → **Gestionar individuos**.

- **Listado** con búsqueda (código, especie, parque) y filtro por especie. Las fichas
  históricas de una misma especie se agrupan por nombre científico.
- **Formulario** con la ubicación elegida en un mapa satelital (toque o marcador
  arrastrable), coordenadas numéricas, o **Usar mi ubicación**. El GPS se mide hasta
  45 s (`watchPosition`): se muestra la precisión en vivo, se descartan las lecturas
  lejanas a la mejor y se promedian las buenas (peso 1/precisión²); termina solo con 5
  lecturas de ±5 m o menos. El margen de error se dibuja como círculo y, si queda en más
  de ±15 m, se pide ajustar el marcador a mano. Rellena también precisión y altitud. Los demás individuos se ven como puntos de
  referencia. Al elegir la especie se sugiere el siguiente código libre (`CIP-011`).
- **Contraseña de administrador:** se pide al entrar (ver *Acceso de administrador*).
  **Eliminar** siempre pide confirmarla.
- **Foto** (opcional, al agregar o editar): **Tomar foto** abre la cámara del
  teléfono y **Elegir de la galería** usa una existente. Se reduce en el teléfono a
  ≤1600 px antes de guardarla o enviarla; el servidor la convierte a WebP (≤1280 px) y
  la guarda en MongoDB, no en disco, porque el disco de Render se borra en cada
  despliegue. Si un individuo no tiene foto se usa `public/uploads/individuos/CÓDIGO.webp`
  cuando existe.

### Uso sin conexión

La app es instalable (PWA) y funciona sin internet con lo que ya se haya visto con conexión:

- **Service worker** (`src/offline/sw.js`; `vite.config.js` lo genera como `dist/sw.js`
  con la lista de archivos del build). Solo se registra en producción (`npm run build`).
  - App (HTML, JS, CSS, iconos): se guarda al instalar, así abre sin red.
  - `GET /api/...`: red primero (máx. 4 s) y, si no hay, la última copia guardada.
  - Fotos de `/uploads`, teselas del mapa y tipografías: se guardan al verlas por primera vez.
- **Individuos sin conexión:** crear, editar, eliminar y las fotos se guardan en una
  cola en el dispositivo (`localStorage` para los datos, IndexedDB para las fotos; sin
  contraseñas) y la tarjeta muestra *Sin enviar*. Al
  volver la conexión, con la página de individuos abierta, se pide la contraseña y se
  envían en orden. Si el servidor rechaza alguno (p. ej. código repetido) queda listado
  para revisarlo o descartarlo; el resto se envía igual.
- **Mapa satelital del parque sin conexión:** al abrir *Gestión de individuos* con
  internet, la app guarda en el teléfono las teselas satelitales del parque y sus
  alrededores (`src/offline/mapaParque.js`, ~100 teselas de z14 a z18, unos MB) en una
  caché que el service worker no recorta; se renueva cada 60 días o con *Actualizar*.
  Fuera de esa zona solo se ve lo ya visitado. El mapa de calles no se guarda: sin
  conexión la ficha abre en satélite.
- **GPS sin conexión:** funciona (no usa internet), pero sin la ayuda de las antenas
  tarda más en encontrar satélites; la medición se extiende a 90 s.
- No funciona sin conexión: crear/editar especies, subir fotos de especies ni generar QR.
- **App de escritorio:** el manifiesto pide `window-controls-overlay`; en Chrome/Edge la
  app dibuja su propia barra de título del color de la página (botón ⌃ de la barra para
  activarlo). El color de la barra sigue al tema claro u oscuro.

### Mapa de individuos (MapLibre GL)

La ficha de cada especie muestra la sección **"¿Dónde encontrarlo?"** con un mapa
[MapLibre GL JS](https://maplibre.org/) (motor open source que no requiere token de
Mapbox) cuando la especie tiene individuos registrados; si no tiene, la sección no
aparece. Las fuentes de teselas sí pueden tener condiciones y límites propios.

- **Carga diferida:** MapLibre (~280 KB gzip) va en un chunk aparte
  (`src/mapa/maplibre.js`) que solo se descarga cuando la sección se acerca a la pantalla.
- **Capas:** calles de [OpenFreeMap](https://openfreemap.org/) (`positron` en claro, `dark`
  en oscuro), que es la vista inicial de la ficha, y vista satelital de Esri World Imagery
  (cobertura hasta z18; es la del selector de ubicación del formulario de individuos).
  Las dos respetan la selección del visitante; el mapa de calles sigue el
  tema de la app.
- **Relieve 3D:** botón opcional que inclina la cámara y muestra el terreno SRTM de
  [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (formato Terrarium),
  sin token. El sombreado topográfico se aplica sobre el mapa vectorial.
- **Atribuciones:** el mapa muestra los créditos correspondientes a Esri/Maxar,
  OpenFreeMap/OpenMapTiles/OpenStreetMap y AWS Terrain Tiles.
- **Individuos en la ficha:** en *Datos rápidos* se listan los individuos registrados
  (reemplazan las ubicaciones escritas, que solo se muestran si aún no hay ninguno);
  tocar uno baja al mapa, lo centra y abre su popup. Bajo el mapa no hay lista.
- **Accesible:** la lista de individuos son botones (teclado/lector de pantalla); gestos cooperativos para no secuestrar el scroll en
  móvil; control para ampliar el mapa a pantalla completa; respeta `prefers-reduced-motion`.
- **Fotos por individuo:** cada árbol puede tener su propia imagen, visible en la lista
  y el popup del mapa; no sustituye la foto general de la especie.

Para asociar fotos propias en producción, coloca los archivos como
`public/uploads/individuos/CIP-001.webp` (también admite `.jpg`, `.jpeg` y `.png`) y
ejecuta el build para publicarlos junto al frontend. La API detecta automáticamente el
archivo cuyo nombre coincide con el código si el campo `imagen` aún está vacío. También
puedes asociar una ruta o URL HTTPS explícitamente mediante el endpoint protegido de abajo.

Fotos ya cargadas: `CIP-001.webp` (origen `11_Cipres`), `CIP-002.webp` (origen
`07_Cipres`), `CIP-008.webp` (origen `16_Cipres`) y `CIP-010.webp` (origen `08_Cipres`).
El script `npm run cargar-individuos-cipres` las vincula automáticamente al ejecutarse;
la API también detecta archivos por código cuando `imagen` aún está vacío.

Para cambiar proveedor o estilo, define en `.env` (las variables `VITE_*` se incorporan
al build de Vite; vuelve a construir el frontend después de cambiarlas):

```env
VITE_MAPA_ESTILO_CLARO=https://.../style.json
VITE_MAPA_ESTILO_OSCURO=https://.../style.json
VITE_MAPA_SATELITE_TILES=https://.../{z}/{y}/{x}
VITE_MAPA_SATELITE_MAXZOOM=18
VITE_MAPA_SATELITE_ATRIBUCION=© proveedor de imágenes
VITE_MAPA_TERRENO_TILES=https://.../{z}/{x}/{y}.png
VITE_MAPA_TERRENO_CODIFICACION=terrarium
```

Los estilos deben ser compatibles con MapLibre; las URLs `mapbox://` requieren Mapbox GL JS
y token. Los proveedores de teselas pueden tener sus propios términos de uso, límites y
requisitos de atribución; se deben respetar al sustituir los valores predeterminados.

---

## 🔌 API REST

Documentación interactiva en **`/api-docs`** (Swagger UI).

> **Autenticación:** los endpoints de escritura (`POST`/`PUT`) y los de QR exigen el campo `password` en el cuerpo de la petición, igual a `ADMIN_PASSWORD` del servidor.

### Plantas — `/api/plantas`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Listar todas las especies |
| `POST` | `/` | Crear especie (`multipart/form-data`, imagen + hasta 10 imágenes extra, requiere `password`) |
| `GET` | `/:id` | Obtener especie por ID |
| `PUT` | `/:id` | Actualizar especie (requiere `password`) |
| `DELETE` | `/:id` | Eliminar especie |
| `GET` | `/buscar/nombre?nombre=` | Buscar por nombre común o científico |
| `GET` | `/buscar/origen?origen=` | Buscar por origen |
| `GET` | `/buscar/tipo?tipo=` | Buscar por tipo |
| `GET` | `/buscar/familia?familia=` | Buscar por familia |

### Individuos — `/api/individuos`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Obtener individuos como GeoJSON; filtros opcionales `especieId` y `parque` |
| `GET` | `/:id` | Un individuo como Feature GeoJSON |
| `POST` | `/` | Registrar un individuo: `codigoArbol`, `especieId`, `parque`, `latitud`, `longitud`, opcionales `altitudMsnm`, `precisionGpsM`, `imagen` (requiere `password`) |
| `PUT` | `/:id` | Editar solo los campos enviados; `null` en `altitudMsnm`/`precisionGpsM` los borra (requiere `password`) |
| `DELETE` | `/:id` | Eliminar un individuo (requiere `password` en el cuerpo JSON) |
| `POST` | `/:id/foto` | Subir o reemplazar la foto (`multipart/form-data`: `foto`, `password`) |
| `GET` | `/:id/foto` | Foto del individuo en WebP (caché larga; la URL lleva `?v=`) |
| `PUT` | `/:codigoArbol/imagen` | Asociar una ruta `/uploads/...` o URL HTTPS a un individuo (requiere `password`) |

Ejemplo para vincular una foto local versionada:

```bash
curl -X PUT https://plantas-qr.vercel.app/api/individuos/CIP-001/imagen \
  -H 'Content-Type: application/json' \
  -d "{\"imagen\":\"/uploads/individuos/CIP-001.webp\",\"password\":\"$ADMIN_PASSWORD\"}"
```

El campo `imagen` queda incluido en las propiedades de cada Feature GeoJSON.

Errores: `400` datos inválidos, `401` contraseña faltante o incorrecta, `404` individuo o especie inexistente, `409` código de árbol ya usado.

### QRs — `/api/qr`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Listar QRs (con planta poblada) |
| `GET` | `/:plantaId` | QR de una especie |
| `POST` | `/generar/:plantaId` | Crear o regenerar el QR de una especie (requiere `password`) |
| `POST` | `/generar-todos` | Regenerar los QRs de todas las especies (requiere `password`) |
| `GET` | `/ver/:plantaId` | Ficha de la especie (HTML para navegadores, JSON para API) |

Otros: `/uploads/*` (imágenes subidas, caché inmutable), `/` (index de la SPA o estado de la API).

### Paneles administrativos

| Ruta | Descripción |
|---|---|
| `GET /depurar-imagenes` | Inventario visual de los archivos en `server/uploads` (en uso vs. huérfanos) con opción de eliminar los que no se referencian |
| `GET /depurar-plantas` | Asignar qué fotos usa cada especie (primera = principal); guarda en la BD |
| `POST /depurar-verificar` | Verifica una contraseña de administrador (lo usa la UI para desbloquear acciones) |

Todas las acciones de escritura de estos paneles exigen `ADMIN_PASSWORD`.

---

## 🧬 Modelo de datos (Planta)

```js
{
  nombre:       { comun, cientifico },        // requeridos
  familia:      String,                       // requerido
  origen:       String,                       // requerido
  tipo:         enum [árbol, arbusto, hierba, piedra, planta acuática,
                       cactus, otro, palma, árbol (conífera),
                       árbol / arbusto según poda, arbusto / arbolito,
                       arbusto bajo],
  descripcion:  { general, hojas },           // requeridos
  altura:       String,                       // requerido
  usos:         [String],
  impacto:      String,                       // requerido
  estadoConservacion: enum [en peligro, vulnerable, casi amenazado,
                       preocupación menor, datos insuficientes,
                       extinto en estado silvestre, extinto,
                       no amenazada, no amenazada (cultivada), no determinado,
                       y variantes usadas en el catálogo del parque],
  ubicacion:    { latitud, longitud, descripcion },
  imagen:       String,                       // imagen principal (/uploads/... o Data URL)
  imagenes:     [String],                     // imágenes adicionales de la galería
  ubicaciones:  [String],                     // referencias de ubicación
  ejemplares:   [{ imagen, ubicacion }],      // ejemplares individuales del parque
}
```

El QR almacena `{ plantaId, url, imagen }`.

---

## 🎨 Diseño

Sistema de diseño propio con tokens CSS (`src/styles/tokens.css`; `src/index.css` solo importa las hojas en orden) y notas en `docs/DESIGN.md`:

- **Paleta botánica**: verdes bosque, salvia y menta sobre tonos tierra y neutros; sin colores saturados.
- **Temas claro y oscuro** conmutables, persistiendo en `localStorage` (`data-tema` en `<html>`).
- **Escala termómetro de conservación**: rojo intenso (crítico) → naranja → ámbar → verde menta (estable), gris para "sin datos". Aplicada en tarjetas, ficha y leyenda.
- **Tipografía nativa**: sans para interfaz y serif itálica para nombres científicos.
- **Sin dependencias de UI**: componentes y estilos propios, animaciones mínimas y `prefers-reduced-motion` respetado.

---

## 🔒 Seguridad

- Las credenciales viven solo en `.env` (no versionar; el archivo ya está en `.gitignore`).
- Las rutas de escritura y de QR se protegen con `ADMIN_PASSWORD` comparada de forma **timing-safe** (`crypto.timingSafeEqual`); si la variable no existe, fallan con `503` en lugar de abrirse.
- Los datos mostrados en la ficha HTML del servidor y en los paneles admin se escapan para prevenir inyección (XSS).
- Subida de imágenes limitada en tamaño (10 MB) y formato por `multer`; se renombran en el servidor y se convierten a WebP (ver `server/config/upload.js`).
- El servidor fuerza resolvers DNS públicos (`8.8.8.8`, `1.1.1.1`) para resolver clústeres de MongoDB Atlas sin depender del DNS del sistema.
