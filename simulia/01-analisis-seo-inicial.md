# Simulia — Análisis SEO Inicial
> Fecha: 24/03/2026 | Estado: CRÍTICO — acción inmediata requerida

---

## Diagnóstico General: ROJO

simulia.es está construida como una SPA (Single Page Application) con React. Esto significa que **Google ve la página prácticamente vacía** hasta que ejecuta el JavaScript. Este es el problema raíz de todos los problemas SEO actuales.

---

## Lo que Google ve al rastrear simulia.es ahora mismo

```
Título: (ninguno detectado)
Meta description: (ninguna)
H1: (ninguno)
Contenido indexable: "You need to enable JavaScript to run this app"
```

**Eso es todo. Un buscador ve una página en blanco con una frase.**

---

## Elementos detectados

| Elemento | Estado |
|---|---|
| Título de página | NO encontrado sin JS |
| Meta description | NO encontrada |
| H1/H2/H3 | NO encontrados |
| Contenido indexable | Prácticamente nulo |
| Renderizado JS | Requerido para ver cualquier contenido |
| Facebook Pixel | SI (ID: 1582659899396296) |
| Google Analytics | SI (ID: G-111W589W3H) |
| Estructura de URLs | Desconocida (SPA suele usar hash routing) |

---

## Problemas identificados (ordenados por impacto)

### PROBLEMA 1 — CRÍTICO: Sin SSR ni prerenderizado
**Qué es:** la web se construye solo en el navegador del usuario (client-side rendering). Los bots de Google pueden renderizar JS, pero lo hacen de forma secundaria, más lenta y menos fiable.

**Impacto:** Google probablemente indexa simulia.es como página vacía o con muy poco contenido. Todo el trabajo de desarrollo no está siendo rastreado ni posicionado.

**Solución:**
- Opción A (ideal): migrar a Next.js con SSR (Server-Side Rendering) o SSG (Static Site Generation)
- Opción B (rápida): implementar prerenderizado con una herramienta como Prerender.io o react-snap
- Opción C (mínima viable): añadir metadata estática en el index.html y asegurarse de que las rutas principales tienen contenido renderizado

### PROBLEMA 2 — CRÍTICO: Sin title ni meta description
**Qué es:** los dos elementos más básicos del SEO on-page no existen o no son visibles para los crawlers.

**Impacto:** incluso si Google indexa la página, no tiene título ni descripción que mostrar. CTR en buscadores prácticamente cero.

**Solución inmediata:** implementar react-helmet o @tanstack/react-head para añadir metadata dinámica por ruta.

Ejemplo de title optimizado:
```
Simulia | Prepara las oposiciones de enfermería con tests adaptativos
```
Ejemplo de meta description:
```
Practica con miles de preguntas tipo test para las oposiciones OPE de enfermería.
Estadísticas personales, modo simulacro y actualizaciones constantes. Empieza gratis.
```

### PROBLEMA 3 — ALTO: Sin estructura de headings rastreable
**Qué es:** los H1, H2, H3 son fundamentales para que Google entienda de qué trata cada página.

**Impacto:** sin headings, Google no puede inferir las palabras clave principales de la página.

**Solución:** cada página/ruta de la app debe tener un H1 claro y relevante. Ejemplo para la home:
```html
<h1>Prepara las oposiciones de enfermería con Simulia</h1>
```

### PROBLEMA 4 — ALTO: Sin blog ni contenido estático indexable
**Qué es:** una SPA de producto sin contenido editorial no puede posicionarse para búsquedas informacionales.

**Impacto:** los opositores buscan cosas como "temario oposiciones enfermería 2025", "cómo preparar la OPE de enfermería", "preguntas tipo test enfermería" — Simulia no puede aparecer en ninguna de esas búsquedas si no tiene páginas de contenido.

**Solución:** crear un blog/sección de contenido con artículos optimizados (ver Plan de Contenidos).

---

## Palabras clave objetivo (primera aproximación)

### Transaccionales (alta intención de compra/registro)
- "preparar oposiciones enfermería online"
- "test oposiciones enfermería"
- "simulacro OPE enfermería"
- "app oposiciones enfermería"
- "academia online oposiciones enfermería"

### Informacionales (captación de tráfico frío)
- "cómo preparar oposiciones enfermería"
- "temario OPE enfermería [comunidad autónoma]"
- "preguntas tipo test enfermería resueltas"
- "cuándo son las oposiciones de enfermería 2025 2026"
- "diferencias EIR y OPE enfermería"

### Long tail (fácil de posicionar al principio)
- "test enfermería OPE Madrid"
- "preguntas resueltas OPE enfermería Andalucía"
- "simulacro examen enfermería SAS"
- "cuántas preguntas tiene la OPE de enfermería"

---

## Próximos pasos inmediatos (ordenados)

1. [ ] Verificar cómo está indexada actualmente en Google: buscar `site:simulia.es`
2. [ ] Implementar SSR o prerenderizado — esta es la prioridad técnica número 1
3. [ ] Añadir title y meta description a todas las rutas con react-helmet
4. [ ] Dar de alta en Google Search Console y verificar errores de cobertura
5. [ ] Dar de alta en Google My Business si aplica
6. [ ] Crear sitemap.xml y enviarlo a Google Search Console
7. [ ] Revisar robots.txt
8. [ ] Arrancar plan de contenidos (blog)

---

## Notas
- Se detectó Facebook Pixel y Google Analytics correctamente instalados — bien para tracking de ads y comportamiento
- El análisis de competencia queda pendiente (ver archivo 03-analisis-competencia.md)
- Las palabras clave con volumen exacto requieren herramientas como Ahrefs, Semrush o Google Keyword Planner
