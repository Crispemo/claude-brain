# Simulia — Plan de Acción
> Objetivo: pasar de producto invisible a plataforma posicionada y con captación orgánica en 90 días

---

## FASE 1 — Fundamentos técnicos (Semana 1-2) 🔴 URGENTE

Estas acciones son el prerrequisito de todo lo demás. Sin esto, nada del SEO funciona.

### Tarea 1.1 — Auditoría de indexación actual
- [ ] Buscar en Google: `site:simulia.es` → ver cuántas páginas están indexadas y cómo aparecen
- [ ] Acceder a Google Search Console → comprobar errores de cobertura, Core Web Vitals
- [ ] Si no está en GSC: dar de alta y verificar propiedad del dominio
- [ ] Revisar robots.txt en `simulia.es/robots.txt`
- [ ] Revisar sitemap en `simulia.es/sitemap.xml`

### Tarea 1.2 — Resolver el problema de renderizado (CRÍTICO)
**El problema:** Simulia es una React SPA. Google la ve vacía.
- [ ] Evaluar opción de migración a Next.js (recomendado a medio plazo)
- [ ] Implementar solución rápida: react-helmet para metadata + prerenderizado estático para rutas principales
- [ ] Como mínimo: asegurarse de que el `index.html` tiene title y meta description base

### Tarea 1.3 — Metadata básica en todas las rutas
- [ ] Añadir react-helmet (o @tanstack/react-head) al proyecto
- [ ] Definir title + meta description únicos para cada ruta principal:
  - Home
  - Registro / Login
  - Dashboard / Test
  - Landing pública (si existe)
- [ ] Formato de title: `[Beneficio principal] | Simulia`
- [ ] Meta descriptions: 150-160 caracteres, con llamada a la acción

### Tarea 1.4 — Sitemap y robots
- [ ] Generar sitemap.xml con todas las URLs públicas
- [ ] Enviar sitemap a Google Search Console
- [ ] Verificar que robots.txt no bloquea nada importante

---

## FASE 2 — Contenido y palabras clave (Semana 3-6)

### Tarea 2.1 — Investigación de palabras clave (hacer en Claude)
Usar el siguiente prompt en una nueva conversación:
```
Actúa como SEO specialist especializado en educación sanitaria en España.
Necesito una lista de 30 palabras clave para simulia.es, una plataforma de
preparación de oposiciones de enfermería. Organízalas en:
1. Transaccionales (alta intención)
2. Informacionales (captación de tráfico frío)
3. Long tail (fácil de posicionar al principio)
Para cada keyword indica: intención de búsqueda, nivel de competencia estimado
(bajo/medio/alto) y prioridad (1-3).
```

### Tarea 2.2 — Crear estructura de blog
- [ ] Añadir sección /blog a Simulia (puede ser una ruta separada con contenido estático o un CMS headless)
- [ ] Alternativa rápida: usar un subdominio blog.simulia.es con WordPress o Ghost
- [ ] Estructura recomendada de categorías:
  - Guías de oposiciones (por comunidad autónoma)
  - Tips de estudio y preparación
  - Novedades OPE enfermería
  - Casos de éxito de usuarios

### Tarea 2.3 — Primeros 4 artículos (mes 1)
Redactar con Claude, optimizados para SEO:

| Artículo | Keyword objetivo | Tipo |
|---|---|---|
| "Cómo preparar las oposiciones de enfermería en 2025: guía completa" | "preparar oposiciones enfermería" | Pilar |
| "OPE enfermería [comunidad]: temario, fechas y consejos" | "OPE enfermería [comunidad]" | Local |
| "Test tipo OPE de enfermería: qué son y cómo practicar" | "test OPE enfermería" | Transaccional |
| "Diferencias entre EIR y OPE de enfermería: cuál elegir" | "diferencias EIR OPE enfermería" | Informacional |

---

## FASE 3 — Redes sociales y comunidad (Semana 4-8)

### Tarea 3.1 — Análisis de competencia en RRSS
- [ ] Identificar 5 competidores principales (academias, apps, creadores)
- [ ] Analizar con Claude qué funciona en el nicho
- [ ] Identificar huecos de contenido sin cubrir

### Tarea 3.2 — Estrategia de contenido en RRSS
- [ ] Definir 1-2 plataformas principales (Instagram + TikTok recomendado para este nicho)
- [ ] Generar calendario editorial mensual con Claude
- [ ] Formatos prioritarios:
  - Tips rápidos de preparación (carruseles / Reels cortos)
  - "Pregunta del día" (interacción + hábito)
  - Testimonios de usuarios que aprobaron
  - Noticias de convocatorias OPE por comunidad

### Tarea 3.3 — Perfil de autoridad
- [ ] Asegurarse de que los perfiles de RRSS enlazan a simulia.es
- [ ] Conseguir primeras menciones/backlinks: foros de oposiciones, grupos de Facebook, Reddit enfermería

---

## FASE 4 — Publicidad de pago (Mes 3+)

**Activar solo cuando:**
- Haya al menos 4 artículos de blog publicados
- El SEO técnico esté resuelto (renderizado + metadata)
- Haya tracción orgánica mínima (>50 visitas/semana orgánicas)

### Tarea 4.1 — Google Ads
- [ ] Campaña de búsqueda para keywords transaccionales
- [ ] Presupuesto mínimo inicial: 5-10€/día para testear
- [ ] Keywords: "app oposiciones enfermería", "preparar OPE enfermería online"

### Tarea 4.2 — Meta Ads
- [ ] Audiencia: enfermeros en activo, recién graduados en enfermería, grupos de estudio oposiciones
- [ ] Formato inicial: Lead Gen o conversión a registro
- [ ] Creatividades: Claude puede generar los textos de anuncios en una sesión dedicada

---

## Métricas de seguimiento

| Métrica | Situación actual | Objetivo 30 días | Objetivo 90 días |
|---|---|---|---|
| Páginas indexadas (site:simulia.es) | Por verificar | >5 | >20 |
| Visitas orgánicas/mes | Por verificar | >100 | >500 |
| Palabras clave posicionadas | Por verificar | >10 | >50 |
| Artículos de blog publicados | 0 | 2 | 8 |
| Registros desde SEO | 0 | Primeros | >20/mes |

---

## Recursos y herramientas recomendadas (gratuitas para empezar)
- Google Search Console — obligatorio, gratis
- Google Analytics (ya instalado) — verificar que recoge datos correctamente
- Google Keyword Planner — estimaciones de volumen de búsqueda
- Ubersuggest (plan gratuito) — análisis de keywords y competidores
- Screaming Frog (gratuito hasta 500 URLs) — auditoría técnica SEO
