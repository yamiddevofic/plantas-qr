# 🌿 PlantaQR — Árboles del Parque Principal de Chitagá

Aplicación web de **educación ambiental** que permite identificar y conocer los árboles del Parque Principal de Chitagá (Norte de Santander, Colombia) mediante **códigos QR**.

Cada especie tiene una ficha con nombre común, nombre científico, familia botánica, origen, altura, descripción, usos, importancia ambiental y estado de conservación. El visitante escanea el código pegado al árbol y llega directo a la ficha de esa especie; docentes, estudiantes y administradores pueden gestionar el catálogo desde la misma aplicación.

Proyecto desarrollado como trabajo de formación SENA.

---

## ✨ Características

- **Ficha por especie accesible por QR** — cada QR apunta a una ruta propia de la aplicación (`#/planta/:id`) que consulta los datos del documento asociado.
- **Catálogo con búsqueda y filtros** — busca por nombre común, nombre científico o ID, y filtra por familia, tipo y estado de conservación (todo en cliente, sin recargar).
- **Escala termómetro de conservación** — cada estado (extinto → preocupación menor) tiene su propio color, tipo categorías IUCN, con leyenda visual.
- **Gestión de códigos QR** — generar/regenerar, descargar como PNG y eliminar especies desde las tarjetas.
- **Catálogo gestionable desde la UI** — agregar nuevas especies, editar una existente y eliminar plantas directamente desde la aplicación (modal de formulario); eliminar también desde las tarjetas.
- **Diseño responsivo y minimalista** — móvil-first (320px+), en escritorio la ficha usa dos columnas aprovechando el espacio sin perder aire visual.
- **Arquitectura atómica** — componentes organizados en `atoms`, `molecules`, `organisms`, `templates` y `pages`, con patrones reutilizables (botones, insignias, imágenes con placeholder, estados de vacío/error, campos de formulario y filtros).
- **Accesibilidad WCAG 2.2 (AA)** — contraste verificado, foco visible, navegación por teclado, `lang="es"`, targets táctiles ≥ 44px, estados de carga/error/vacío comunicados.
- **API REST documentada con Swagger** en `/api-docs`.

---

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 (CSS nativo, sin librerías de UI) |
| Backend | Node.js + Express 5 |
| Base de datos | MongoDB (Mongoose 9, MongoDB Atlas) |
| QRs | Librería `qrcode` (genera PNG como Data URL) |
| Subida de imágenes | `multer` (local en `server/uploads`) |

---

## 📁 Estructura

```
plantas-qr/
├── src/                      # Frontend React
│   ├── App.jsx               # Enrutador de páginas (hash #/planta/:id)
│   ├── router.js             # Enrutador hash (#/planta/:id)
│   ├── api.js                # Cliente de la API
│   ├── constantes.js         # Estados de conservación y placeholder
│   ├── index.css             # Sistema de diseño (tokens, componentes)
│   └── components/           # Arquitectura atómica (Atomic Design)
│       ├── atoms/            # Bloques básicos: Boton, Insignia, ImagenPlanta,
│       │                     #   Spinner, Chip, PuntoEscala, EstadoBox, IconoLupa
│       ├── molecules/        # Combinaciones de átomos: CampoFormulario, Busqueda,
│       │                     #   SelectorFiltro, Hecho, InsigniasPlanta,
│       │                     #   AccionesTarjeta, TarjetaHechos, SeccionFicha
│       ├── organisms/        # Secciones completas: BarraFiltros, TarjetaPlanta,
│       │                     #   ListaPlantas, CarruselImagenes, GaleriaFotos,
│       │                     #   FormularioPlanta, EncabezadoApp, EscalaConservacion
│       ├── templates/        # Layouts por vista: PlantillaListado, PlantillaDetalle
│       └── pages/            # Páginas con estado y datos: PaginaListado, PaginaDetalle
├── server/                   # Backend Express
│   ├── index.js              # Servidor, Swagger, SPA estática
│   ├── controllers/          # plantaController, qrController
│   ├── models/               # Planta, QR
│   ├── routes/               # /api/plantas, /api/qr
│   ├── config/upload.js      # Configuración de multer
│   └── views/fichaTemplate.js# Ficha HTML del visitante (fallback QR antiguo)
├── public/                   # favicon, iconos
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

Crea un archivo `.env` en la raíz (no lo subas a control de versiones) con:

```env
PORT=3000
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@cluster.mongodb.net/plantas-qr?retryWrites=true&w=majority
```

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

Express sirve el frontend construido (`dist/`) y la API en el mismo origen: `http://IP:3000`. Los códigos QR generados apuntan a este origen con la ruta hash `/#/planta/:id`.

> **Nota sobre QRs existentes:** los QR guardados en la base conservan la URL anterior al cambio de ruta. Pulsa **↻ Regenerar QR** en cada tarjeta para actualizarlos. Hasta entonces, siguen abriendo la ficha HTML del servidor (`/api/qr/ver/:id`), que se conserva como respaldo.

### Scripts

```bash
npm run dev      # Vite (frontend)
npm run server   # API Express
npm run build    # Build de producción (dist/)
npm run preview  # Previsualiza el build
npm run lint     # ESLint
```

---

## 🔌 API REST

Documentación interactiva en **`/api-docs`** (Swagger UI).

### Plantas — `/api/plantas`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Listar todas las especies |
| `POST` | `/` | Crear especie (`multipart/form-data`, imagen opcional) |
| `GET` | `/:id` | Obtener especie por ID |
| `PUT` | `/:id` | Actualizar especie |
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
| `POST` | `/generar/:plantaId` | Crear o regenerar el QR de una especie |
| `GET` | `/ver/:plantaId` | Ficha de la especie (HTML para navegadores, JSON para API) |

Otros: `/uploads/*` (imágenes subidas) y `/` (index de la SPA o estado de la API).

---

## 🧬 Modelo de datos (Planta)

```js
{
  nombre:       { comun, cientifico },        // requeridos
  familia:      String,                       // requerido
  origen:       String,                       // requerido
  tipo:         enum [árbol, arbusto, hierba, piedra,
                       planta acuática, cactus, otro],
  descripcion:  { general, hojas },           // requeridos
  altura:       String,                       // requerido
  usos:         [String],
  impacto:      String,                       // requerido
  estadoConservacion: enum [en peligro, vulnerable, casi amenazado,
                      preocupación menor, datos insuficientes,
                      extinto en estado silvestre, extinto],
  ubicacion:    { latitud, longitud, descripcion },
  imagen:       String,                       // URL /uploads/... o Data URL
}
```

El QR almacena `{ plantaId, url, imagen }`.

---

## 🎨 Diseño

Sistema de diseño propio con tokens CSS (`src/index.css`):

- **Paleta botánica**: verdes bosque, salvia y menta sobre tonos tierra y neutros; sin colores saturados.
- **Escala termómetro de conservación**: rojo intenso (crítico) → naranja → ámbar → verde menta (estable), gris para "sin datos". Aplicada en tarjetas, ficha y leyenda.
- **Tipografía nativa**: sans para interfaz y serif itálica para nombres científicos.
- **Sin dependencias de UI**: componentes y estilos propios, animaciones mínimas y `prefers-reduced-motion` respetado.

---

## 🔒 Seguridad

- Las credenciales viven solo en `.env` (no versionar; el archivo ya está en `.gitignore`).
- Los datos mostrados en la ficha HTML del servidor se escapan para prevenir inyección (XSS).
- Subida de imágenes limitada en tamaño y formato por `multer` (ver `server/config/upload.js`).
