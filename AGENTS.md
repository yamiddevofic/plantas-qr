# AGENTS.md: patrones UI/UX de la página de inicio

Guía para agentes (y personas) que diseñan o modifican interfaces en este repositorio.
Recoge los patrones de la página de inicio de PlantaQR, que es la más trabajada visualmente,
escritos para que **se puedan llevar a otro proyecto** cambiando solo la marca, la paleta y la ilustración.

- Los estándares generales (tokens, touch targets, WCAG, ergonomía del pulgar) están en
  [`docs/DESIGN.md`](docs/DESIGN.md). Este archivo **no los repite**: describe cómo se aplicaron aquí
  y qué decisiones concretas conviene copiar.
- Cada patrón dice **qué** hacer, **por qué** y **dónde está en este repo** para verlo funcionando.

---

## 0. Cómo adaptarlo a otro proyecto

Los patrones son agnósticos. Lo que cambia de un proyecto a otro es esto:

| Pieza | En PlantaQR | Qué poner en tu proyecto |
|---|---|---|
| Paleta primitiva | Verdes bosque, salvia, tierra (`--forest-*`, `--sage-*`, `--earth-*`) | Las familias de color de tu marca, con la misma escala numérica |
| Escena del hero | Paisaje andino en SVG: cordillera, árboles, sol/luna | Una ilustración por capas de tu dominio (ciudad, mar, laboratorio…) |
| Emblema | Árbol con placa QR animada | El logotipo o símbolo de tu producto, en SVG animable |
| Titular | «Cada árbol, / *una historia*» | Dos líneas cortas: afirmación + remate en serif cursiva |
| Acción principal | «Ver especies» → catálogo | La acción núcleo del producto |
| Buscador | Especies por nombre, familia o tipo | La entidad principal de tu catálogo |
| Idioma del código | Español (`useRevelar`, `PaisajeHero`) | Respeta el idioma que ya use el repo de destino |

Regla al portar: **copia la estructura y los tiempos, no los valores de color.** Recalcula el contraste
de cada par texto/fondo con tu paleta, en claro y en oscuro.

---

## 1. Principios

1. **Una sola escena, dos temas.** El tema oscuro no es otro diseño: es la misma escena con otros
   tokens (día → noche). Nada se duplica en el JSX por culpa del tema.
2. **Mobile first de verdad.** El CSS base es para ~360 px; los `min-width` solo agregan cosas.
   El orden y la ubicación de las acciones se piensan para el pulgar.
3. **Movimiento que cuenta algo.** Las entradas explican la jerarquía (primero el emblema, luego el
   titular palabra por palabra, luego las acciones); lo ambiental (nubes, vaivén) es lento y casi
   subliminal. Con `prefers-reduced-motion` todo queda en su estado final.
4. **Accesible desde el primer commit.** HTML semántico, ARIA solo donde hace falta (combobox),
   decoración con `aria-hidden`, targets ≥ 44/48 px.
5. **Sin dependencias para lo visual.** Ilustración e iconos en SVG inline, animaciones en CSS,
   dos hooks pequeños. El hero no descarga ninguna imagen.

---

## 2. Tokens en tres capas

```
primitivos (paleta)  →  semánticos (superficie, foco, hit)  →  tokens de escena (por componente)
tokens.css              tokens.css                              inicio.css (.hero-inicio, .emblema)
```

- **Primitivos con escala numérica** (`--forest-900 … --leaf-500`, `--ink-900 … --ink-300`,
  `--line-200/100`). Los componentes usan estos nombres, nunca hex sueltos.
- **El modo oscuro redefine los mismos primitivos** bajo `html[data-tema="oscuro"]`
  (`src/styles/tema-oscuro.css`): `--ink-900` pasa a ser casi blanco, `--forest-700` un verde claro,
  `--mint-100` un verde casi negro. Así, cada componente que use tokens funciona en los dos temas
  sin escribir reglas por componente.
  - Consecuencia que hay que cubrir: de noche el primario es **claro**, así que el texto encima va
    **oscuro** (`.btn-primary { color: #0b1a12 }` en oscuro) para mantener el contraste AA.
- **Tokens semánticos**: `--surface`, `--page-bg`, `--focus-ring`, radios (`--radius-sm/md/lg/pill`),
  sombras tintadas con el color de marca (no gris neutro) y escala tipográfica con `clamp()`
  (`--step-0 … --step-4`).
- **`--hit`**: tamaño táctil mínimo. 44 px por defecto y 48 px con `@media (pointer: coarse)`.
  Todo botón de icono usa `width/height: var(--hit)`.
- **Tokens de escena**: la ilustración y el emblema declaran sus propias variables
  (`--cielo-1`, `--capa-1…4`, `--astro`, `--nube-opacidad`, `--estrellas-opacidad`, `--vidrio`…)
  en el contenedor y las redefinen bajo el tema oscuro. Los elementos que solo existen de día o de
  noche (aves, nubes / estrellas, luciérnagas, cráteres) **siempre están en el DOM** y se muestran u
  ocultan con un token de opacidad y `transition: opacity`. Así el cambio de tema se ve como un
  amanecer o un anochecer y no como un salto.

---

## 3. Tema claro/oscuro

- Atributo en la raíz: `document.documentElement.dataset.tema = 'claro' | 'oscuro'`
  (`src/tema.js`). El CSS cuelga de `html[data-tema="oscuro"]`.
- **Se aplica antes del primer render** (`aplicarTemaInicial()` en `main.jsx`) para que no haya
  un parpadeo claro al cargar en oscuro.
- Persiste en `localStorage` **dentro de `try/catch`** (modo privado o almacenamiento bloqueado no
  deben romper la página).
- Actualiza `<meta name="theme-color">` con el fondo de la página, para que la barra del navegador
  y la de la PWA instalada se fundan con ella.
- `color-scheme: dark` en el tema oscuro (scrollbars y controles nativos).
- Dos controles, un solo estado (contexto `TemaProvider`):
  - **Botón rápido** (`BotonTema.jsx`): sol que recoge sus rayos y una sombra que lo convierte en
    luna, con `transform` de 0.5 s. Es un *toggle*: `aria-pressed`, un `aria-label` fijo
    («Modo oscuro») y un `title` que describe la acción.
  - **Opción en el menú lateral** con descripción del estado («Activado: cambiar a modo claro»).

---

## 4. Anatomía del hero

```
┌──────────────────────────────────────────────┐
│ [marca]        [buscador*]     [tema][menú]  │ ← barra flotante de vidrio (absolute)
│                                              │
│                 (emblema)                    │
│          ◉ Lugar · dato contextual           │ ← chip de vidrio
│              Titular línea 1                 │
│            *Titular línea 2*                 │ ← serif cursiva, color de marca
│        Párrafo de valor (≤ 42ch)             │
│            [buscador móvil]                  │
│     [ CTA primario → ] [ secundario ]        │ ← mitad y mitad en móvil
│ ▲▲▲ cordillera ▲▲ lomas 🌲 árboles 🌴 ▲▲▲▲▲ │ ← SVG anclado abajo
│ ~~~~~~~~ prado del color de la página ~~~~~~ │ ← funde el hero con el contenido
│                    ( ↓ )                     │ ← invitación a bajar
└──────────────────────────────────────────────┘
```

- **Alto**: `min-height: 100svh` (con `100vh` como respaldo); en ≥ 768 px,
  `clamp(640px, 100svh, 940px)` para que en monitores muy altos no quede vacío.
- **Ancho completo aunque el layout tenga márgenes**: `width: 100vw; margin: 0 calc(50% - 50vw)`.
- **Fondo en dos SVG** (`PaisajeHero.jsx`):
  - *Cielo* (`preserveAspectRatio="xMidYMid slice"`) cubre todo: degradado de tres paradas,
    resplandor radial del astro, nubes, estrellas y aves.
  - *Tierra* (`xMidYMax slice`) anclada al borde inferior con un alto propio
    (`--alto-paisaje: clamp(...)`). Capas de lejos a cerca, cada una más saturada y oscura
    (perspectiva atmosférica), con una franja de neblina entre medias.
  - La última capa (*prado*) se pinta con `var(--page-bg)`: el hero se funde con la página sin
    corte ni sombra.
  - Las curvas se generan desde puntos (Catmull-Rom → Bézier) y las estrellas con un
    **generador pseudoaleatorio con semilla**: el dibujo es igual en cada render y en SSR.
  - `aria-hidden="true"`, `focusable="false"` y `pointer-events: none` en toda la escena.
- **Sin `overflow: hidden` en el hero** cuando dentro hay paneles flotantes (la lista del
  buscador). El recorte lo hace el contenedor de la escena (`.paisaje`).
- **Vidrio** (`--vidrio` + `backdrop-filter: blur(10–12px)` + borde tintado al 16 %) solo para
  piezas pequeñas que flotan sobre la ilustración: marca, chips, botón secundario, botón de bajar.
  Nunca como fondo de bloques de texto largos.
- **Titular**: `clamp(2.7rem, 1.4rem + 6.2vw, 5.4rem)`, peso 800, `letter-spacing: -0.045em`,
  `line-height: 1`. La segunda línea va en serif cursiva y color de marca, como remate emocional.
- **Acciones**: CTA primario en píldora con sombra tintada y flecha que se desplaza 3 px al hover;
  secundario en vidrio con borde. En móvil comparten la fila (`flex: 1 1 0`) en la zona del pulgar;
  en escritorio toman su ancho natural.
- **Desplazamientos internos con `<button>` + `scrollIntoView`**, no con `<a href="#id">`, porque
  el router usa el *hash* y un ancla se tomaría como cambio de ruta.
- **Escritorio (≥ 1024 px)**: grid `1.25fr / 0.75fr`, texto a la izquierda alineado a la izquierda
  y emblema grande a la derecha. En móvil todo va centrado y en una columna.
- **Pantallas bajas** (`max-height: 640px`, móvil apaisado): se quita la flecha de bajar y se reduce
  el emblema.

---

## 5. Coreografía de movimiento

| Tipo | Duración | Curva | Ejemplo |
|---|---|---|---|
| Microinteracción (hover, foco) | 0.16–0.25 s | `ease` | CTA sube 2 px, flecha avanza |
| Entrada de pieza | 0.6–0.9 s | `cubic-bezier(0.2, 0.7, 0.2, 1)` | `inicioSube`: opacidad + `translateY(14px)` |
| Cambio de tema | 0.5–0.8 s | `ease` | `fill` y opacidad de las capas |
| Gesto de marca | 1–2.4 s | rebote suave `cubic-bezier(0.3, 1.2, 0.5, 1)` | árbol crece, sol sale tras la cordillera |
| Ambiental en bucle | 6–85 s | `ease-in-out`, `alternate` | vaivén de árboles 6–8.5 s, nubes 55–85 s |

- **Escalonado con una variable**: cada pieza recibe `style={{ '--i': n }}` y el CSS calcula
  `animation-delay: calc(base + var(--i) * 0.12s)`. Sirve igual para palabras del titular, pasos y
  cifras.
- **Titular palabra por palabra**: cada palabra en un `inline-block` que entra con
  `translateY(0.35em)` + `blur(8px)` → nítida. Se lee como una frase que «se enfoca».
- **Revelado al hacer scroll** (`useRevelar`): `IntersectionObserver` con umbral 0.15 y
  `rootMargin: '0px 0px -6% 0px'`, **una sola vez** (se desconecta al entrar). Sin
  `IntersectionObserver`, se muestra de inmediato.
- **Iconos que se dibujan**: iconos de línea propios con `pathLength="1"` en cada trazo; al revelarse,
  `stroke-dashoffset: 1 → 0` en 1.3 s y después aparece un relleno suave (`.icono-tinte` al 14 %).
- **Contadores** (`useContador`): de 0 al valor en 1.4 s con *ease-out* cúbico
  (`1 - (1 - t)^3`) y `requestAnimationFrame`; empiezan cuando la sección se revela y usan
  `font-variant-numeric: tabular-nums` para que los dígitos no bailen.
- **Varias velocidades a la vez**: las animaciones en bucle usan duraciones y retrasos distintos
  (y retrasos negativos) para que no se sincronicen y se vea orgánico.
- **Solo se anima `transform`, `opacity` y `filter`** (y `fill` en el cambio de tema). Nada de `top`,
  `width` ni `height`.
- **`prefers-reduced-motion: reduce`**: `animation: none` en todo el inicio, lo oculto por el
  revelado pasa a `opacity: 1` y los trazos quedan dibujados. El hook del contador devuelve el valor
  final directamente.

---

## 6. Secciones bajo el hero

Ritmo de lectura común a todas:

- Contenedor `max-width: 1080px`, separación entre secciones de 56 px (móvil) y 88 px (≥ 768 px).
- Encabezado de tres piezas:
  1. **Eyebrow**: 0.75 rem, mayúsculas, `letter-spacing: 0.14em`, color de marca y una rayita
     de 18×2 px antes (`::before`).
  2. **Título**: `clamp(1.75rem, 1.1rem + 2.4vw, 2.6rem)`, peso 800, `text-wrap: balance`.
  3. **Párrafo**: `max-width: 54ch`, `line-height: 1.65`, `text-wrap: pretty`, color secundario.

Bloques que se reutilizan:

- **Cómo funciona**: `<ol>` de 3 pasos. Cada tarjeta lleva icono propio, número decorativo
  (`aria-hidden`), título y una frase. Una columna en móvil y `repeat(3, minmax(0, 1fr))` desde 768 px.
  Al hover, la tarjeta sube 4 px y el icono gira levemente (`rotate(-6deg) scale(1.06)`).
- **Texto + foto** (el parque): grid `1fr / 1.1fr` desde 900 px. La foto lleva radio de 24 px,
  sombra grande, `aspect-ratio` fijo, zoom lento al hover (1.2 s) y un pie de foto en píldora de
  vidrio oscuro sobre la imagen. Debajo del texto, chips con icono para los datos rápidos.
- **Tarjeta destacada con cifras** (el proyecto): fondo de degradado suave + un brillo radial en una
  esquina, radio de 28 px. Las cifras van en un `<dl>` (dato = `dt`, etiqueta = `dd`) dentro de mini
  tarjetas, y la tarjeta cierra con el CTA. En escritorio usa `grid-template-areas`
  (`'texto datos' 'accion datos'`).
- Los destinos del menú lateral son **ids estables** en las secciones (`acordeon-parque`,
  `acordeon-proyecto`, `como-funciona`).

---

## 7. Buscador del hero (combobox)

`BuscadorInicio.jsx` + `buscador-inicio.css`. Es el patrón más reutilizable del inicio.

- **ARIA combobox completo**: `role="combobox"`, `aria-expanded`, `aria-controls`,
  `aria-autocomplete="list"`, `aria-activedescendant` apuntando a la opción activa, lista con
  `role="listbox"` y opciones con `role="option"` y `aria-selected`. Teclado: ↑ ↓, Enter y Escape.
- **Vacío no es vacío**: al enfocar sin texto muestra *Sugerencias* (3 elementos curados); al
  escribir, *Resultados* (máx. 5). El mensaje de sin resultados dice qué probar y va en
  `role="status"`.
- **Búsqueda tolerante**: se normaliza con `NFD` y se quitan las tildes; busca en varios campos
  (nombre común, científico, familia, tipo, alternos) y se quitan los duplicados por una clave
  canónica.
- **Que el clic no cierre la lista**: `onMouseDown={e => e.preventDefault()}` en el panel y en el
  botón de borrar, así el `blur` del input no la cierra antes del `click`.
- **Una copia por contexto**: en escritorio va en la barra superior y en móvil dentro del hero,
  entre el texto y los CTA. Se alterna con `display` por media query.
- **Móvil, modo foco**: el teclado tapa la mitad baja de la pantalla, así que al enfocar se añade
  `.en-foco`, la barra pasa a `position: fixed` arriba del área visible y la lista ocupa el resto.
  La posición sale de `window.visualViewport` (`--vv-arriba`, `--vv-alto`), que funciona en iOS y
  Android. Un fondo táctil lo cierra. Mientras está en foco, se le quita la animación de entrada al
  contenedor, porque un `transform` heredado anclaría el `fixed` al hero.
- En móvil, sin modo foco, la lista se abre **hacia arriba** (`bottom: calc(100% + 8px)`) porque el
  buscador está en la mitad baja de la pantalla.
- Inputs con `font-size ≥ 16px` en pantallas táctiles, para que iOS no haga zoom al enfocar.

---

## 8. Accesibilidad y ergonomía aplicadas

- *Skip link* «Saltar al contenido» como primer elemento enfocable, hacia `#app-main`.
- Un solo `<h1>` (el titular del hero), `<header>` para el hero y `<main>` para el contenido;
  secciones con `aria-labelledby` apuntando a su `<h2>`.
- Todo lo decorativo (paisaje, emblema, iconos, números de paso) lleva `aria-hidden="true"` y los
  SVG `focusable="false"`.
- Botones de icono con `aria-label`; texto alternativo en las fotos con contenido real.
- Acción primaria en la zona natural del pulgar; tema y menú arriba, porque son de uso ocasional.
- Información que no cabe en móvil estrecho se **omite** (la altitud en < 420 px) en lugar de
  partir la línea de forma fea.
- Contraste comprobado en **los dos temas**, sobre todo el texto encima del vidrio y del cielo.

---

## 9. Responsivo

Breakpoints que se usan (solo donde el diseño lo pide):

| Consulta | Qué cambia |
|---|---|
| `max-width: 419px` | Se omiten datos secundarios del chip |
| `min-width: 768px` | Buscador a la barra superior, paisaje más alto, pasos en 3 columnas |
| `768–1199px` | Se oculta la marca de la barra (choca con el buscador) |
| `min-width: 900px` | Bloques texto/foto y tarjeta destacada en dos columnas |
| `min-width: 1024px` | Hero en grid texto/emblema, CTA con ancho natural |
| `min-width: 1200px` | La marca se centra en la barra superior |
| `max-height: 640px` | Hero compacto (móvil apaisado) |
| `pointer: coarse` | `--hit` 48 px, inputs a 16 px |
| `hover: hover` | Los efectos de hover solo existen donde hay puntero |

Probar siempre en 360, 768, 1024 y 1440 px de ancho, y en un móvil apaisado.

---

## 10. Rendimiento

- El hero no pide ninguna imagen: escena e iconos son SVG inline estilados con tokens.
- Imágenes de contenido con `width`/`height` (o `aspect-ratio`), `loading="lazy"`,
  `decoding="async"`, `srcset`/`sizes` y en WebP. Si una imagen falla, `onError` cambia a un
  *placeholder* en lugar de mostrar el icono roto.
- Los datos del inicio (catálogo, conteos) llegan con `fetch` en un `useEffect` con bandera de
  cancelación. Mientras cargan, las cifras muestran «—» y el buscador no abre la lista.
- `backdrop-filter` solo en piezas pequeñas: en áreas grandes cuesta mucho en móviles de gama baja.

---

## 11. Convenciones de código

- **Atomic Design**: `atoms/` (BotonTema, EmblemaArbolQr, IconosInicio), `molecules/`,
  `organisms/` (HeroInicio, PaisajeHero, BuscadorInicio, ComoFunciona, SeccionParque),
  `templates/`, `pages/` (PaginaInicio).
- **CSS por sección** en `src/styles/`, importado en orden desde `src/index.css`: el orden de los
  `@import` **es** la cascada (tokens → tema oscuro → base → componentes → utilidades).
- Clases en español, en formato bloque-elemento con guiones (`hero-inicio-titulo`,
  `paso-icono`) y estados como clase aparte (`.revelado`, `.en-foco`, `.es-oscuro`, `.activa`).
- Los contenidos fijos (pasos, fauna, palabras del titular) van en **constantes arriba del
  componente**, no escritos en el JSX.
- `PropTypes` en todo componente con props, documentando con `/** */` qué significa `null`
  (normalmente «cargando»).
- Los comentarios explican el **porqué** («Botón y no enlace: un href="#…" cambiaría el hash»),
  no el qué.

---

## 12. Checklist antes de entregar una pantalla tipo inicio

1. ¿Solo usa tokens? ¿Funciona en oscuro sin reglas propias, o con las mínimas para el contraste?
2. ¿El cambio de tema es una transición y no un salto? ¿Los elementos de día/noche se ocultan
   por opacidad?
3. ¿Hay un único `<h1>`, *skip link*, `aria-hidden` en lo decorativo y foco visible?
4. ¿Los targets miden ≥ `var(--hit)` y la acción principal está en la zona del pulgar?
5. ¿Se ve bien en 360 / 768 / 1024 / 1440 px y en un móvil apaisado?
6. ¿Las entradas están escalonadas con `--i` y los bucles son lentos y no sincronizados?
7. ¿Con `prefers-reduced-motion` todo queda visible y quieto?
8. ¿El hero carga sin imágenes, y las imágenes de abajo son lazy, con dimensiones y respaldo?
9. ¿Los buscadores o listas flotantes siguen usables con el teclado del móvil abierto?
10. ¿El `npm run lint` pasa?

---

## Referencia rápida en este repo

| Patrón | Archivo |
|---|---|
| Paleta y tokens | `src/styles/tokens.css`, `src/styles/tema-oscuro.css` |
| Tema (estado, persistencia, theme-color) | `src/tema.js`, `src/TemaProvider.jsx`, `src/components/atoms/BotonTema.jsx` |
| Página | `src/components/pages/PaginaInicio.jsx` |
| Hero y escena | `src/components/organisms/HeroInicio.jsx`, `PaisajeHero.jsx`, `src/styles/inicio.css` |
| Emblema animado | `src/components/atoms/EmblemaArbolQr.jsx` |
| Iconos que se dibujan | `src/components/atoms/IconosInicio.jsx` |
| Revelado y contadores | `src/hooks/useRevelar.js`, `src/hooks/useContador.js` |
| Secciones | `src/components/organisms/ComoFunciona.jsx`, `SeccionParque.jsx` |
| Buscador combobox | `src/components/organisms/BuscadorInicio.jsx`, `src/styles/buscador-inicio.css` |
| Estándares generales | `docs/DESIGN.md` |
