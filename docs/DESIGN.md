---
name: ui-ux-modern-interfaces
description: Estándares para diseñar, evaluar o generar código de interfaces (web, móvil, híbridas) modernas, responsivas y ergonómicas. Consulta esto siempre que el usuario pida crear una pantalla, componente, layout, formulario o app; que pida "mejorar el diseño" de algo existente; o que mencione UI, UX, interfaz, mobile-first, accesibilidad, sistema de diseño o design system, aunque no use esas palabras exactas (por ejemplo "hazme una pantalla de login" o "esta app se ve anticuada" también aplican).
---

# Interfaces modernas, responsivas y reutilizables

## Por qué existe esta guía

Un agente que genera UI sin un marco de referencia tiende a repetir tres errores: hardcodear valores en vez de usar un sistema, diseñar para desktop y "encoger" para móvil, y descuidar el uso real con el pulgar en una mano. Esta guía no es una lista de reglas arbitrarias — cada sección explica el problema que previene, para que puedas aplicar el criterio también en casos que no están explícitamente cubiertos aquí.

Aplica esta guía de forma proporcional: un prototipo rápido no necesita el mismo rigor que un componente de producción, pero los puntos marcados como base (tokens, contraste, touch targets) valen la pena incluso en un prototipo porque cuestan lo mismo hacerlos bien desde el inicio que corregirlos después.

## Antes de escribir código

1. Revisa si el proyecto ya tiene un sistema de diseño (tokens de color, tipografía, espaciado) en `tailwind.config`, variables CSS, o un theme file. Si existe, úsalo — no inventes uno paralelo.
2. Si no existe, define uno mínimo (ver "Sistema de tokens" abajo) antes del primer componente. Un componente sin tokens es deuda técnica desde el commit inicial.
3. Identifica el dispositivo/contexto principal de uso. Si es mobile-first (la mayoría de apps de consumo), la ergonomía del pulgar y los touch targets son prioritarios. Si es una herramienta de escritorio densa en datos, prioriza densidad de información y navegación por teclado sobre zonas táctiles.

## Principios que guían cada decisión

- **Claridad sobre espectáculo.** Antes de añadir un elemento visual, pregúntate si ayuda a entender o decidir más rápido. La tendencia dominante en 2026 es reducir la carga cognitiva ("calm UI"); si un efecto no aporta función, quítalo.
- **Mobile-first.** Escribe el CSS base para la pantalla más pequeña y expándelo con `min-width`. Diseñar al revés (desktop primero) casi siempre produce touch targets pequeños y jerarquía visual que colapsa mal.
- **Sistema antes que pantalla.** Ningún componente se crea aislado; todo se apoya en tokens compartidos, para que un cambio de marca o de tema no implique reescribir cada componente.
- **Accesibilidad desde el inicio, no al final.** Retroaplicar accesibilidad a un componente terminado casi siempre implica reescribirlo. Constrúyelo accesible la primera vez.
- **Movimiento con propósito.** Una transición debe comunicar de dónde viene o hacia dónde va un elemento (causa-efecto), no decorar. Respeta siempre `prefers-reduced-motion`.
- **Rendimiento como parte del diseño.** Una interfaz "moderna" que tarda 4 segundos en cargar no es moderna. Imágenes optimizadas, animaciones por CSS/GPU, sin librerías innecesarias.

## Sistema de tokens

Define colores, espaciado y tipografía como variables semánticas, nunca como valores sueltos repetidos en el código.

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f7f7f8;
  --color-text-primary: #14161a;
  --color-text-secondary: #5c6068;
  --color-accent: #4f46e5;
  --color-danger: #dc2626;

  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-6: 24px; --space-8: 32px;

  --font-size-body: clamp(0.95rem, 0.9rem + 0.25vw, 1.05rem);
  --font-size-h1: clamp(1.75rem, 1.4rem + 2vw, 3rem);

  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 20px;
  --motion-fast: 150ms; --motion-base: 250ms;
}

[data-theme="dark"] {
  --color-bg: #0f1115;
  --color-surface: #17191f;
  --color-text-primary: #f4f4f5;
}
```

Si el proyecto usa Tailwind, mapea estos valores en `tailwind.config` (`colors`, `spacing`, `borderRadius`) en vez de usar clases arbitrarias como `bg-[#4f46e5]` repetidas por todo el código — así un cambio de marca es un solo archivo, no un find-and-replace.

## Responsividad

- Escribe el layout base para ~360–400px y añade breakpoints `min-width` (`640px`, `768px`, `1024px`, `1280px`) solo cuando el diseño lo necesite realmente, no como plantilla fija.
- Prefiere Grid/Flexbox con `fr`, `minmax()`, `auto-fit`/`auto-fill` sobre anchos fijos en px — el layout se adapta sin que tengas que escribir un breakpoint por cada caso.
- Usa `clamp()` para tipografía y espaciados grandes en vez de tamaños fijos por breakpoint; es menos código y transiciona sin saltos.
- Antes de dar por terminado un componente, verifica visualmente en al menos tres anchos: 375px, 768px, 1440px.

## Ergonomía del pulgar (mobile)

Cuando el usuario sostiene el teléfono con una mano, no todas las zonas de la pantalla cuestan lo mismo alcanzar. Usa esto para decidir dónde va cada acción, no solo como checklist posterior.

| Zona | Ubicación | Qué poner ahí |
|---|---|---|
| 🟢 Natural | Tercio inferior y centro | CTA principal, navegación inferior, flujo primario |
| 🟡 Estiramiento | Centro-superior | Filtros, controles secundarios, tabs |
| 🔴 Difícil | Esquinas superiores (esp. opuesta a la mano dominante) | Solo acciones destructivas o infrecuentes: "Eliminar cuenta", "Cerrar sesión" |

**Ejemplo**

Input: "Diseña la pantalla de checkout de una app de compras"
Output esperado: botón "Confirmar compra" fijo en el tercio inferior (zona natural); método de pago y dirección en el centro (estiramiento); enlace "Cancelar pedido" en la esquina superior, nunca junto al CTA principal para evitar toques accidentales.

## Touch targets

| Estándar | Medida mínima |
|---|---|
| Física universal | 9×9 mm (ideal 10×10 mm) |
| Apple (iOS/HIG) | 44×44 pt |
| Google (Material Design 3) | 48×48 dp |
| Espaciado entre elementos táctiles | ≥ 8px |

Si un icono debe verse pequeño por diseño, amplía el área táctil con `padding`, no el icono visual:

```html
<button class="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full">
  <svg class="w-5 h-5" aria-hidden="true">...</svg>
</button>
```

## Componentes y reutilización

- **Un componente, una responsabilidad.** Si un componente acumula variantes lógicas no relacionadas, sepáralo — así cada pieza es más fácil de testear y reusar.
- **Variantes explícitas, no condicionales dispersas.** Usa `variant="primary" | "secondary" | "danger"` y `size="sm" | "md" | "lg"` resueltos con un helper (`cva`, `clsx`, `tailwind-variants`) en vez de `if/else` repetidos en el JSX.
- **Composición antes que duplicación.** Antes de crear un componente nuevo, revisa si uno existente puede extenderse vía props o `children`/slots.
- **Nombrado predecible:** `PascalCase` para componentes, `camelCase` para props/funciones.

**Ejemplo**

Input: "Necesito un botón de peligro y uno normal"
Output esperado: un solo componente `<Button variant="danger" | "primary">`, no dos componentes (`DangerButton`, `PrimaryButton`) con JSX casi idéntico.

## Accesibilidad (WCAG 2.2 AA como piso)

Cuesta lo mismo escribir HTML semántico desde el inicio que después reescribirlo para que un lector de pantalla lo entienda — por eso esto no es una fase separada.

- Contraste: texto normal ≥ 4.5:1, texto grande ≥ 3:1.
- `<button>` para acciones, `<a>` para navegación — evita `<div onClick>` como reemplazo de un control interactivo.
- Todo elemento interactivo debe alcanzarse con `Tab` y operarse con `Enter`/`Espacio`; nunca quites `outline`/`:focus-visible` sin poner un reemplazo visible.
- `aria-label` o `<label for>` en cada input/botón sin texto visible.
- `aria-live` para mensajes dinámicos (errores, confirmaciones).
- Nunca bloquees el zoom (`user-scalable=no` está prohibido).

## Microinteracciones

- 150–250ms para hover/focus/estado; 300–400ms para entrada/salida de modales o paneles.
- `ease-out` para elementos que aparecen, `ease-in` para los que desaparecen.
- Respeta siempre la preferencia del usuario:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## Checklist final

Antes de entregar un componente o pantalla, confirma:

1. ¿Usa tokens del sistema y no valores sueltos?
2. ¿Cada target táctil cumple ≥44×44pt / 48×48dp con ≥8px de separación?
3. ¿Las acciones principales están en la zona natural del pulgar?
4. ¿Se ve bien en 375px, 768px y 1440px?
5. ¿El contraste cumple WCAG AA?
6. ¿Es navegable por teclado con foco visible?
7. ¿Las animaciones respetan `prefers-reduced-motion`?
8. ¿El componente es reutilizable (props/variantes) en vez de estar hardcodeado para un solo caso?

## Tendencias 2026 a considerar (con criterio, no por defecto)

| Tendencia | Cuándo aplicarla | Cuándo evitarla |
|---|---|---|
| Interfaces calmadas | Siempre — es la base | — |
| Tipografía fluida (`clamp()`) | Casi siempre | Si la marca exige tallas fijas exactas |
| Bento grids | Dashboards, páginas de resumen con contenido heterogéneo | Flujos lineales (checkout, formularios) |
| Glassmorphism | Overlays/paneles flotantes puntuales, con buen contraste | Como estilo global — daña legibilidad y rendimiento |
| IA transparente en la UI | Si hay sugerencias/autocompletado por IA, explica por qué se sugiere algo y permite desactivarlo | Nunca ocultar que una decisión fue tomada por IA |

## Cuándo pedir más contexto en vez de asumir

Si el usuario no especifica plataforma (web/iOS/Android), framework, o si el proyecto ya tiene un sistema de diseño, pregunta antes de generar código extenso — construir sobre un supuesto equivocado cuesta más que una pregunta de aclaración.