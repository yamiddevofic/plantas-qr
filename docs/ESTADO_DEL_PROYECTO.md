# PlantaQR · Estado actual del proyecto

> Corte: **14 de octubre de 2026** · rama `main` · último commit `b322542`
>
> Documento en dos partes: **A) estado técnico** de la aplicación y **B) caracterización e identificación** de la flora del Parque Principal de Chitagá.
>
> **Fuente de las cifras.** El catálogo y los árboles salen de la **API pública de producción** (`/api/plantas` y `/api/individuos`, consultadas el 14/10/2026); la parte técnica, del código y de `git log`. Los archivos de datos del repositorio (`parque-chitaga-platas.json`, `server/datos/especies-keep.json`) son la **historia** de cómo se armó el catálogo, no su estado actual.

---

## 1. Resumen ejecutivo

PlantaQR es una aplicación web de **educación ambiental** que permite conocer los árboles del Parque Principal de Chitagá (Norte de Santander, 2.345 m s. n. m.) escaneando el **código QR** pegado a cada especie. Es un trabajo de formación SENA.

| Aspecto | Estado |
|---|---|
| Aplicación pública (inicio, galería, ficha, mapa) | Funcional |
| QR por especie | Funcional (los ya impresos siguen vigentes) |
| Administración (especies, individuos, fotos) | Funcional, protegida con contraseña |
| Uso sin conexión (PWA) | Funcional |
| Compartir por enlace (Open Graph, sitemap) | Funcional |
| Pruebas automáticas | **No hay** (solo ESLint) |
| Catálogo botánico | **28 fichas · 27 especies · 19 familias** (una ficha por especie, salvo el arrayán, que tiene dos; ver §B.3) |
| Árboles georreferenciados | **62 puntos en el mapa que representan 210 árboles**, en 25 de las 28 fichas (ver §B.5) |

Tamaño aproximado del código: ~15.200 líneas de JS/JSX y ~10.500 de CSS; 137 commits desde el 10 de agosto de 2026.

---

# PARTE A · Estado técnico

## A.1 Arquitectura

```
Navegador (React 19 + Vite 8, PWA)
   │  hash-router (#/…)            ┌────────────────────────────┐
   ├────────────────────────────►  │ Vercel: estáticos + rewrites│
   │                               └──────────────┬─────────────┘
   │   /api/*, /planta/:id, /sitemap.xml          │ reenvía
   │                                              ▼
   │                               ┌────────────────────────────┐
   └──────────────────────────────►│ Render: Express 5 (Node)   │
                                   │  API REST + Swagger        │
                                   └──────────────┬─────────────┘
                                                  ▼
                                      MongoDB Atlas (Mongoose 9)
```

- **Frontend** en Vercel; **backend** en Render (`vercel.json` reenvía `/api`, `/planta/:id`, `/sitemap.xml` y los paneles `depurar-*`).
- En producción local, Express sirve el build (`dist/`) y la API en un solo puerto.
- Las fotos del catálogo viajan **versionadas** en `public/uploads/` (437 archivos `.webp`); las subidas desde la app se guardan **en MongoDB** (el disco de Render se borra en cada despliegue).

## A.2 Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 8, CSS nativo (sin librerías de UI), `react-icons` |
| Mapa | MapLibre GL 6 (carga diferida), teselas OpenFreeMap / Esri World Imagery, relieve AWS Terrain |
| Backend | Node.js + Express 5 |
| Datos | MongoDB Atlas, Mongoose 9 |
| QR | `qrcode` (PNG como Data URL) |
| Imágenes | `multer` + `sharp` (WebP, máx. 1600 px, variantes 400/800 px para `srcset`) |
| Docs API | `swagger-jsdoc` + `swagger-ui-express` en `/api-docs` |
| Calidad | ESLint 10 (sin pruebas automatizadas) |

## A.3 Rutas de la aplicación (hash)

| Ruta | Pantalla | Acceso |
|---|---|---|
| `#/` | Inicio: hero con fotos del parque, «Cómo funciona», parque y proyecto | Público |
| `#/galeria` | Catálogo con búsqueda y filtros (familia, tipo, estado) | Público |
| `#/planta/:id` | Ficha de la especie (galería, datos, mapa de individuos) | Público (destino del QR) |
| `#/mapa?especie=&arbol=` | Mapa del parque con filtro por especie | Público |
| `#/especies` | Gestión de especies (crear, editar, eliminar, fotos) | Contraseña de administrador |
| `#/individuos` | Gestión de individuos (árbol, GPS, foto) | Contraseña de administrador |

Rutas del servidor fuera de la SPA: `/planta/:id` (HTML con Open Graph y JSON-LD para WhatsApp/Facebook/X), `/sitemap.xml` (una entrada por especie), `/api/qr/ver/:id` (ficha HTML de respaldo de los QR antiguos), `/depurar-imagenes` y `/depurar-plantas` (paneles de mantenimiento).

## A.4 Funcionalidades implementadas

**Visitante**
- Ficha por QR: nombre común y científico, familia, origen, altura, descripción, hojas, flores, frutos, tronco, hábitat, usos, curiosidades, cuidados, especies similares y estado de conservación.
- Buscador del inicio con sugerencias; galería con filtros (cliente, sin recargar).
- Escala «termómetro» de conservación con colores tipo IUCN y leyenda.
- Mapa con relieve 3D opcional, satélite/calles y puntos que agrupan varios árboles de una misma especie (campo `cantidad`).
- Fotos de día y de noche; fotos fijas de hoja, tallo y fruto con **crédito de fuente** cuando no son propias.
- Botón «Copiar enlace» que entrega la URL compartible `/planta/:id`.
- Modo claro/oscuro (desde el menú lateral), diseño responsivo móvil-first, accesibilidad WCAG 2.2 AA (contraste, foco, teclado, objetivos táctiles ≥ 44 px).

**Administrador**
- CRUD de especies con varias fotos, y edición de fotos por especie (portada, noche, hoja, tallo, fruto) con cámara o galería.
- Generación/regeneración de QR (individual o masiva) y descarga en PNG.
- CRUD de individuos con mapa satelital, GPS promediado (hasta 45 s; 90 s sin conexión; precisión, altitud, círculo de error) y código sugerido (`CIP-011`).
- Contraseña verificada contra el servidor la primera vez; después el dispositivo guarda solo una huella PBKDF2 (nunca la contraseña) para entrar sin conexión.

**Sin conexión (PWA instalable)**
- Service worker: app precacheada, API «red primero (4 s) y copia guardada», fotos y teselas al primer uso.
- Cola local de cambios de individuos y de especies (datos en `localStorage`, fotos en IndexedDB, sin contraseñas); se envía al recuperar conexión.
- Teselas satelitales del parque descargadas para uso en campo (~100 teselas, z14–z18, renovación cada 60 días).
- No funciona sin conexión: subir fotos de especies ni generar QR.

## A.5 Modelo de datos

- **Planta** (colección de fichas): nombre común/científico, familia, origen, tipo, descripción (general, hojas), altura, usos, impacto, estado de conservación (+ detalle), ubicación, imágenes (principal, galería, noche, hoja, tallo, fruto, créditos), datos ampliados (nombres alternos, flores, frutos, tronco, hábitat, curiosidades, cuidados, similares), `ejemplaresEnParque` y un bloque interno **`identificacion`** (confianza y observaciones; no se muestra en la ficha).
- **Individuo**: `codigoArbol` único, `especieId`, parque, GeoJSON `Point` con índice `2dsphere`, `cantidad` (1–1000), altitud, precisión GPS y tres fotos opcionales (vertical, escritorio, noche) guardadas como binario con `select: false`.
- **QR**: código por especie. **Configuracion**: ajustes (p. ej. vista inicial del mapa). **Imagen**: fotos subidas desde la app.
- En producción queda **una ficha por especie** (las fichas históricas duplicadas ya se fusionaron). El código conserva la agrupación de fichas por nombre científico por si vuelve a haber varias.

## A.6 API y seguridad

- API REST en `/api/plantas`, `/api/individuos`, `/api/imagenes`, `/api/qr`, `/api/configuracion`; documentación en `/api-docs`.
- Las escrituras exigen `password` igual a `ADMIN_PASSWORD` (comparación *timing-safe*); si la variable no existe, esas rutas responden `503` (fallo seguro).
- Variables de entorno: `PORT`, `MONGODB_URI`, `ADMIN_PASSWORD`, `PUBLIC_URL` y opcionales `VITE_MAPA_*` para cambiar proveedores de teselas.
- `.env` está fuera de control de versiones.

## A.7 Scripts de mantenimiento

| Script | Función |
|---|---|
| `importar-keep` | Integra las especies de las notas de campo (Google Keep): actualiza o crea fichas, agrega fotos y registra individuos con GPS; idempotente (`--aplicar` para escribir) |
| `cargar-individuos-cipres` | Carga/actualiza los 10 cipreses geolocalizados |
| `optimizar-imagenes`, `normalizar-imagenes`, `generar-variantes`, `verificar-imagenes` | Cadena de imágenes: WebP, rutas en Mongo, `srcset`, comprobación de 404 |
| `capturar-og`, `generar-iconos` | Imagen de vista previa y iconos PWA |
| `importarPlantas`, `fusionarDuplicados`, `vincularImagenUbicaciones` | Carga inicial y depuración del catálogo |

## A.8 Cambios recientes (octubre 2026)

- **Inicio:** el hero pasó del paisaje dibujado en SVG a **fotos reales del parque**: carrusel automático (vista aérea, plaza, paisaje) en pantallas anchas y una sola foto vertical en móvil, con velo oscuro para dar contraste al texto. Se quitaron el árbol animado y el botón «PlantaQR» del hero; el árbol queda solo en la pantalla de carga.
- **Gestión de especies y de individuos:** se eliminó el hero; las páginas abren directo con pestañas, buscador y listado. «Agregar» pasó a la fila del contador.
- Integración de las especies de las notas de campo; módulo de gestión de especies con pestaña de individuos; fotos de hoja, tallo y fruto con créditos; enlaces compartibles por especie.
- Se corrigió el nombre visible a «PlantasQR» en algunos textos (commit `d831425`).
- **Conteo del inicio** («Especies registradas»): antes contaba fichas; ahora cuenta especies distintas por binomio (`src/taxonomia.js`), ver §B.3.

## A.9 Deuda técnica y riesgos

| # | Tema | Detalle |
|---|---|---|
| 1 | **Sin pruebas automáticas** | Ni unitarias ni E2E; la regresión depende de revisión manual. Candidatos: utilidades puras (`individuos.js`, agrupación de especies, cola offline). |
| 2 | **Zips de Keep (>100 MB)** | `keep-notes/*.zip` están en `.gitignore` porque GitHub rechaza archivos de ese tamaño; no hay copia de respaldo versionada. |
| 3 | **Fotos de baja resolución en el hero** | `parque-1.jpeg/.jpg` miden 540–700 px; se ven blandas en pantallas grandes. |
| 4 | **Aviso de React** | `fetchpriority` en `ImagenPlanta.jsx` debería escribirse `fetchPriority`. |
| 5 | **Campos de uso interno expuestos** | `identificacion` (confianza y observaciones) se describe como interno, pero `/api/plantas` lo devuelve al público. No es sensible, pero conviene decidir si se oculta. |
| 6 | **Dependencia de terceros** | Teselas (Esri, OpenFreeMap, AWS) y Render con arranque en frío; el backend gratuito puede tardar en responder. |
| 7 | **Archivos pesados en `docs/`** | Documentos del proyecto (docx, pdf, pptx) sin versionar en el repositorio. |
| 8 | **Chunk grande en el build** | Aviso de Vite por chunks > 500 kB (MapLibre ya va aparte). |

## A.10 Cómo ejecutarlo

```bash
npm install
npm run server   # API en http://localhost:3000
npm run dev      # Frontend en http://localhost:5173 (proxy a /api)
npm run build    # Producción (dist/)
npm run lint
```

---

# PARTE B · Caracterización e identificación

## B.1 Contexto del sitio

- **Lugar:** Parque Principal de Chitagá, Norte de Santander, Colombia.
- **Extensión registrada:** los 62 puntos caen entre 7,13794° y 7,13857° N y entre 72,66509° y 72,66455° O, un área de unos 70 × 60 m.
- **Altitud:** 2.329–2.359 m s. n. m. según el GPS de los puntos (referencia del parque: 2.345 m).
- **Entorno:** plaza urbana con zonas verdes, senderos, jardineras y setos, rodeada de montaña.
- **Composición:** mezcla de especies **nativas andinas** (arrayán, cajeto, cajeto de monte, pino romerón, palma de cera, capulí) y **ornamentales introducidas** (eugenia, fotinia, ficus, tuya, calistemo, liquidámbar, roble australiano, araucaria).

## B.2 Método de identificación

**Fuentes, en orden de llegada:**

| Fuente | Aporte |
|---|---|
| Catálogo inicial (`parque-chitaga-platas.json`) | Primeras fichas, varias por especie (una por QR impreso). Hoy fusionadas: queda **una ficha por especie** (salvo el arrayán y su forma de hoja redonda). |
| Notas de campo (Google Keep → `especies-keep.json`) | 25 especies con ficha completa, fotos y conteo; integradas con `npm run importar-keep`. |
| Registro en la app (`#/individuos`) | Puntos con GPS, cantidad de árboles y foto, tomados en el parque. |

**Cómo se identifica.** Por **morfología observada en las fotos de campo**: porte, corteza, disposición de las hojas (opuestas o alternas), forma, textura y nervadura del limbo, glándulas, brotes jóvenes, flores y frutos. Cada ficha guarda, en el bloque interno `identificacion`, una **confianza** y una **observación** que justifica el diagnóstico.

**Nivel de confianza (28 fichas):**

| Confianza | Fichas | Cuáles |
|---|--:|---|
| Alta | 24 | Las 25 especies de las notas de campo, menos una |
| Medio-alta | 1 | Guanaminí (*Syzygium cumini*) |
| Sin registro | 3 | Palma de cera, palma canaria y ciprés (vienen del catálogo inicial) |

El ciprés está identificado solo **hasta género** (*Cupressus* sp., «probablemente *C. lusitanica*»).

## B.3 Criterio de conteo de especies

El inicio muestra «Especies registradas» y «Familias botánicas». Se cuentan según las convenciones de nomenclatura botánica (ICN), no por número de fichas (`src/taxonomia.js`):

- Una especie es su **binomio** (género + epíteto). Las anotaciones entre paréntesis no cuentan.
- **Variedades, subespecies, formas y cultivares** no suman como especie aparte (*Prunus serotina* var. *capuli* → *Prunus serotina*).
- Los **híbridos** cuentan como un taxón (*Photinia × fraseri*).
- Un **«Género sp.»** suma solo si ese género no tiene otra especie determinada.
- Lo **no determinado** no se cuenta.

**Resultado:** 28 fichas → **27 especies** y **19 familias**. La diferencia es *Arrayán* y *Arrayán guayabito*: ambos son *Myrcia popayanensis* (el segundo, una forma de hoja redonda), así que cuentan como una especie.

## B.4 Catálogo actual (28 fichas)

| # | Nombre común | Nombre científico | Familia | Tipo | Estado de conservación | Conf. | Conteo de campo | En el mapa (árboles / puntos) |
|--:|---|---|---|---|---|---|--:|--:|
| 1 | Arrayán | *Myrcia popayanensis* | Myrtaceae | árbol / arbusto según poda | LC | alta | 12 | 9 / 9 |
| 2 | Arrayán guayabito | *Myrcia popayanensis* (forma de hoja redonda) | Myrtaceae | árbol / arbusto según poda | LC | alta | 5 | 4 / 4 |
| 3 | Eugenia | *Syzygium paniculatum* | Myrtaceae | arbusto | EN ¹ | alta | 45 | 34 / 1 |
| 4 | Calistemo llorón | *Melaleuca viminalis* | Myrtaceae | árbol | LC | alta | 2 | 2 / 2 |
| 5 | Guanaminí | *Syzygium cumini* | Myrtaceae | árbol / arbusto según poda | LC | **medio-alta** | 1 | **0** |
| 6 | Fotinia | *Photinia × fraseri* | Rosaceae | arbusto | NE | alta | 117 | 118 / 3 |
| 7 | Fotinia glabra | *Photinia glabra* | Rosaceae | árbol / arbusto según poda | NE | alta | 1 | **0** |
| 8 | Níspero | *Eriobotrya japonica* | Rosaceae | árbol | LC | alta | 1 | 1 / 1 |
| 9 | Capulí | *Prunus serotina* var. *capuli* | Rosaceae | árbol | LC | alta | 1 | 1 / 1 |
| 10 | Palma de cera del Quindío | *Ceroxylon quindiuense* | Arecaceae | palma | VU ² | — | 10 | 10 / 10 |
| 11 | Palma canaria | *Phoenix canariensis* | Arecaceae | palma | no amenazada | — | — | 1 / 1 |
| 12 | Ciprés | *Cupressus* sp. (prob. *C. lusitanica*) | Cupressaceae | árbol / arbusto según poda | no amenazada | — | 11 | 11 / 11 |
| 13 | Tuya | *Platycladus orientalis* | Cupressaceae | árbol (conífera) | NT ¹ | alta | 1 | 1 / 1 |
| 14 | Araucaria excelsa | *Araucaria heterophylla* | Araucariaceae | árbol (conífera) | VU ¹ | alta | 1 | 1 / 1 |
| 15 | Pino pátula | *Pinus patula* | Pinaceae | árbol (conífera) | LC | alta | 1 | 1 / 1 |
| 16 | Pino romerón | *Retrophyllum rospigliosii* | Podocarpaceae | árbol (conífera) | LC ³ | alta | 1 | 1 / 1 |
| 17 | Cajeto | *Citharexylum subflavescens* | Verbenaceae | árbol | LC | alta | 5 | 2 / 2 |
| 18 | Cajeto de monte | *Rhamnus goudotiana* | Rhamnaceae | árbol / arbusto según poda | NE ³ | alta | 1 | 1 / 1 |
| 19 | Velero | *Senna spectabilis* | Fabaceae | árbol | LC | alta | 1 | **0** |
| 20 | Roble australiano | *Grevillea robusta* | Proteaceae | árbol | LC | alta | 2 | 2 / 2 |
| 21 | Ficus benjamina | *Ficus benjamina* | Moraceae | árbol | LC | alta | 2 | 2 / 2 |
| 22 | Aguacate | *Persea americana* | Lauraceae | árbol | LC | alta | 2 | 2 / 2 |
| 23 | Siete cueros | *Tibouchina mutabilis* | Melastomataceae | árbol / arbusto según poda | LC | alta | 1 | 1 / 1 |
| 24 | Magnolio | *Magnolia grandiflora* | Magnoliaceae | árbol | LC | alta | 1 | 1 / 1 |
| 25 | San Joaquín variegado | *Hibiscus rosa-sinensis* (variedad) | Malvaceae | arbusto | NE | alta | 1 | 1 / 1 |
| 26 | Chicalá | *Tecoma stans* | Bignoniaceae | árbol | LC | alta | 1 | 1 / 1 |
| 27 | Liquidámbar | *Liquidambar styraciflua* | Altingiaceae | árbol | LC | alta | 1 | 1 / 1 |
| 28 | Pitosporo | *Pittosporum undulatum* | Pittosporaceae | árbol | LC | alta | 1 | 1 / 1 |

Abreviaturas UICN: **LC** preocupación menor · **NT** casi amenazado · **VU** vulnerable · **EN** en peligro · **NE** no evaluado (en la base figura como «no determinado»).

¹ Estado de la especie **en su hábitat silvestre de origen** (Australia, isla Norfolk, Asia), no en Chitagá; son ornamentales muy cultivadas.
² La ficha lo marca «vulnerable (según catálogo PlantaQR del parque)», sin fuente UICN citada. La palma de cera es árbol nacional de Colombia.
³ Según su ficha, con protección local en ecosistemas andinos o reservas colombianas.

«Conteo de campo» es `ejemplaresEnParque` (árboles contados en el recorrido). «En el mapa» suma la `cantidad` de los puntos registrados: un seto o una hilera de la misma especie es **un punto con varios árboles** (por eso la eugenia tiene 34 árboles en 1 punto).

## B.5 Síntesis

**Estado de conservación (28 fichas)**

| Estado | Fichas |
|---|--:|
| Preocupación menor (LC) | 18 |
| No evaluado / no determinado (NE) | 4 |
| No amenazada (sin categoría UICN) | 2 |
| Vulnerable (VU) | 2 |
| En peligro (EN) | 1 |
| Casi amenazado (NT) | 1 |

**Tipo de planta:** 12 árboles · 7 árbol / arbusto según poda · 4 coníferas · 3 arbustos · 2 palmas.

**Familias (19):** Myrtaceae (5 fichas, 4 especies), Rosaceae (4), Arecaceae (2), Cupressaceae (2) y 15 familias con una sola especie.

**Árboles**

| Indicador | Valor |
|---|--:|
| Árboles contados en campo (`ejemplaresEnParque`) | 229 |
| Árboles ubicados en el mapa | 210 |
| Puntos GPS | 62 |
| Puntos con foto propia | 36 de 62 |
| Precisión GPS de los puntos | 1,0 – 9,4 m |
| Fichas con al menos un punto | 25 de 28 |

- **Setos dominantes:** la fotinia (118) y la eugenia (34) son el **72 %** de los árboles del mapa (152 de 210).
- **Especies más registradas por punto:** ciprés (11), palma de cera (10) y arrayán (9).

**Fotos de la ficha:** las 28 fichas tienen foto de **hoja** y de **tallo**; 7 tienen foto de **fruto** (calistemo, eugenia, siete cueros, San Joaquín, arrayán guayabito, cajeto de monte y fotinia glabra); ninguna tiene aún **portada de noche**.

## B.6 Brechas

| Brecha | Detalle | Acción sugerida |
|---|---|---|
| Especies sin punto en el mapa | Velero, guanaminí y fotinia glabra (1 árbol cada una) | Ubicarlas con GPS desde `#/individuos` |
| Conteo de campo ≠ mapa | 229 contados vs. 210 ubicados. Faltan 11 eugenias, 3 arrayanes, 3 cajetos, 1 arrayán guayabito y los 3 árboles de arriba; la fotinia tiene 1 más en el mapa y la palma canaria no tiene conteo | Revisar el seto de eugenia y completar los demás; anotar el conteo de la palma canaria |
| Identificación incompleta | Ciprés solo a género; guanaminí con confianza medio-alta; palma de cera, palma canaria y ciprés sin registro de confianza | Validar con botánico o herbario regional y completar `identificacion` |
| Estado de la palma de cera | «Vulnerable» sin fuente UICN citada | Verificar la categoría vigente y citar la fuente |
| Estados globales vs. locales | EN, VU y NT se refieren al hábitat de origen | Aclararlo en la ficha para no confundir al visitante |
| Fotos | 26 puntos sin foto; 21 fichas sin foto de fruto; ninguna portada de noche | Completar en campo (la app indica qué falta) |
| Arrayán y arrayán guayabito | Dos fichas para una misma especie | Decidir si la forma de hoja redonda merece ficha propia o se fusiona |

## B.7 Recomendaciones

1. **Cerrar el censo**: ubicar las 3 especies sin punto y conciliar conteo de campo y mapa, empezando por la eugenia.
2. **Validación botánica** de las identificaciones de confianza no alta, del ciprés (a nivel de especie) y del estado de la palma de cera.
3. **Verificar los QR** de las 28 fichas e imprimir los que falten.
4. **Completar fotos**: fruto (21 fichas), noche (28) y puntos sin foto (26).
5. **Agregar pruebas** a las utilidades críticas (conteo taxonómico, agrupación, cola sin conexión).
6. **Respaldar las notas de campo** (zips de Keep) fuera de GitHub.

---

*Actualizado el 14/10/2026 con datos de producción (`/api/plantas`, `/api/individuos`). Para refrescar las cifras basta volver a consultar esos dos endpoints.*
