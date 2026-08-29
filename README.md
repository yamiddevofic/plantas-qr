# 🌿 PlantaQR — Árboles del Parque Principal de Chitagá

Aplicación web de **educación ambiental** que permite identificar y conocer los árboles del Parque Principal de Chitagá (Norte de Santander, Colombia) mediante **códigos QR**.

Cada especie tiene una ficha con nombre común, nombre científico, familia botánica, origen, altura, descripción, usos, importancia ambiental y estado de conservación. El visitante escanea el código pegado al árbol y llega directo a la ficha de esa especie; docentes, estudiantes y administradores pueden gestionar el catálogo desde la misma aplicación.

Proyecto desarrollado como trabajo de formación SENA.

---

## ✨ Características

- **Ficha por especie accesible por QR** — cada QR apunta a una ruta propia de la aplicación (`#/planta/:id`); la ruta antigua `/api/qr/ver/:id` se conserva como ficha HTML de respaldo.
- **Página de inicio** — hero con identidad del parque, sección "Nuestro parque" (conteo de especies y familias), acordeón del proyecto y sección de contacto.
- **Galería con búsqueda y filtros** (`#/galeria`) — busca por nombre común, científico o ID, y filtra por familia, tipo y estado de conservación (todo en cliente, sin recargar).
- **Escala termómetro de conservación** — cada estado (extinto → preocupación menor) tiene su propio color, tipo categorías IUCN, con ventana de leyenda explicativa.
- **Gestión de códigos QR** — generar/regenerar por especie, **regenerar todos** en un clic, descargar como PNG y eliminar especies desde las tarjetas.
- **Catálogo gestionable desde la UI** — crear, editar y eliminar especies desde un modal de formulario; soporta **múltiples imágenes por especie** (galería y carrusel en la ficha).
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
│   ├── router.js             # Rutas hash: #/planta/:id, #/galeria
│   ├── api.js                # Cliente de la API
│   ├── constantes.js         # Estados de conservación y placeholder
│   ├── tema.js               # Tema claro/oscuro (contexto + localStorage)
│   ├── index.css             # Sistema de diseño (tokens, componentes)
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
│       └── pages/            # PaginaInicio, PaginaGaleria, PaginaDetalle
├── server/                   # Backend Express
│   ├── index.js              # Servidor, Swagger, SPA estática, fix DNS Atlas
│   ├── controllers/          # plantaController, qrController
│   ├── models/               # Planta, QR
│   ├── routes/               # /api/plantas, /api/qr, adminImagenes
│   ├── middleware/qrAuth.js  # Protección por ADMIN_PASSWORD (timing-safe)
│   ├── config/upload.js      # multer + optimización WebP con sharp
│   ├── scripts/              # importarPlantas, optimizarImagenes, normalizarImagenes,
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
npm run optimizar-imagenes   # Convierte jpg/png de server/uploads a WebP
npm run normalizar-imagenes  # Corrige las rutas de imagen guardadas en Mongo
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

Después copia a `public/uploads/` los `.webp` que estén referenciados y haz commit.
`normalizar-imagenes` acepta `--simulacion` para ver los cambios sin aplicarlos y
`--purgar-rotas` para quitar de las fichas las referencias sin archivo. Siempre deja
un respaldo de la colección en `tmp/respaldo-plantas-AAAA-MM-DD.json`.

### Importar datos

Con la BD conectada y el archivo `parque-chitaga-platas.json` en la raíz:

```bash
node server/scripts/importarPlantas.js
```

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

Sistema de diseño propio con tokens CSS (`src/index.css`) y notas en `docs/DESIGN.md`:

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
