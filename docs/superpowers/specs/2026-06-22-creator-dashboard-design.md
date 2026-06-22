# Creator Dashboard — Design Spec

## Resumen

Dashboard de creador de contenido que reemplaza el dashboard actual (`dashboard/index.html`). Centraliza la gestión de contenido para los proyectos Agencia (YouTube + Instagram) y Simulia en una sola app desplegada en Vercel.

**Usuario**: Solo Cris (auth simple con env var).
**Proyectos incluidos**: Agencia (principal) + Simulia (secundario, solo métricas).
**Proyectos excluidos**: Mocca y cualquier elemento no relacionado con creación de contenido o Simulia.

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14+ (App Router) |
| UI | Tailwind CSS + shadcn/ui |
| Base de datos | Supabase (PostgreSQL + Auth + Storage) |
| Gráficos | Recharts |
| APIs externas | Instagram Graph API, YouTube Data API v3 |
| Transcripción | OpenAI Whisper API |
| IA (guiones, análisis) | Claude API (Anthropic) |
| Deploy | Vercel |
| Cron jobs | Vercel Cron Functions |

## Diseño Visual

- **Tema**: Light mode limpio. Fondo `#f5f5f0`, tarjetas blancas `#ffffff`, bordes `#e5e5e0`.
- **Acento**: Terracota `#c4704b` como color principal de acción.
- **Tipografía**: System font stack (Inter como fallback web).
- **Layout**: Sidebar izquierdo fijo + área de contenido principal.
- **Mobile**: Sidebar colapsa a bottom navigation con las 4 secciones más usadas.

## Arquitectura

```
creator-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Shell: sidebar + main area
│   │   ├── page.tsx            # Overview
│   │   ├── hooks/page.tsx      # Baúl de Ganchos
│   │   ├── metrics/page.tsx    # Métricas
│   │   ├── competitors/page.tsx # Rastreador de Competencia
│   │   ├── community/page.tsx  # Community Manager
│   │   ├── calendar/page.tsx   # Calendario de Contenido
│   │   ├── trends/page.tsx     # Tendencias
│   │   ├── engine/page.tsx     # Content Engine (wizard)
│   │   ├── simulia/page.tsx    # Simulia (métricas)
│   │   ├── settings/page.tsx   # Ajustes (APIs, perfil)
│   │   └── api/
│   │       ├── cron/
│   │       │   ├── metrics/route.ts      # Sync IG+YT diario
│   │       │   ├── competitors/route.ts  # Scrape semanal domingos
│   │       │   └── trends/route.ts       # Scan fuentes diario 7am
│   │       ├── hooks/route.ts
│   │       ├── scripts/route.ts          # CRUD guiones
│   │       ├── publish/route.ts          # Publicar a IG/TikTok/YT
│   │       ├── analyze/route.ts          # Claude analysis
│   │       └── engine/route.ts           # Content Engine generation
│   ├── components/
│   │   ├── sidebar.tsx
│   │   ├── kpi-card.tsx
│   │   ├── sparkline.tsx
│   │   ├── hook-card.tsx
│   │   ├── calendar-grid.tsx
│   │   ├── script-viewer.tsx
│   │   ├── trend-item.tsx
│   │   └── publish-composer.tsx
│   └── lib/
│       ├── supabase.ts
│       ├── instagram.ts        # IG Graph API client
│       ├── youtube.ts          # YT Data API client
│       ├── claude.ts           # Anthropic SDK client
│       ├── whisper.ts          # Transcription client
│       └── types.ts
├── supabase/
│   └── migrations/             # Schema SQL
├── vercel.json                 # Cron config
├── .env.local
└── package.json
```

## Base de Datos (Supabase)

### Tablas

**hooks** — Baúl de Ganchos
```
id: uuid PK
text: text                    -- Texto del hook
type: enum (pregunta, contraste, cta, historia, shock, afirmacion)
source: text                  -- @creador o "propio"
source_url: text nullable     -- Link al reel original
views: integer                -- Views del reel original
saves: integer                -- Guardados del reel original
engagement_rate: decimal      -- % engagement
transcription: text nullable  -- Transcripción completa del audio
screen_text: text nullable    -- Texto detectado en pantalla (OCR)
tags: text[]                  -- Tags libres
used_count: integer default 0 -- Cuántas veces se usó en guiones
created_at: timestamptz
```

**scripts** — Guiones generados
```
id: uuid PK
session_id: uuid FK nullable  -- Sesión del Content Engine que lo generó
hook_id: uuid FK nullable     -- Hook de origen (si viene del baúl)
trend_id: uuid FK nullable    -- Tendencia de origen (si viene de tendencias)
trial_source_id: uuid FK nullable -- Script original (si es trial reel)
day_of_week: integer          -- 0=lun, 6=dom
time_slot: time               -- 12:00, 20:00, etc.
style: text                   -- POV celular, Talking Head, B-Roll, etc.
platform: text[]              -- ['ig', 'tt', 'yt']
hook_text: text
problem_text: text
solution_text: text
social_proof_text: text
cta_text: text
status: enum (draft, approved, scheduled, published)
is_trial_reel: boolean default false
trial_variation_notes: text nullable -- Qué se cambió respecto al original
scheduled_date: date nullable
published_at: timestamptz nullable
created_at: timestamptz
updated_at: timestamptz
```

**metrics_snapshots** — Métricas diarias IG + YT
```
id: uuid PK
date: date
platform: enum (instagram, youtube)
views: integer
saves: integer
followers_new: integer
followers_total: integer
dms: integer
comments: integer
likes: integer
shares: integer
reach: integer
impressions: integer
engagement_rate: decimal
created_at: timestamptz
```

**reel_metrics** — Métricas por reel/vídeo individual
```
id: uuid PK
script_id: uuid FK nullable   -- Enlace al guion si existe
platform: enum (instagram, youtube, tiktok)
platform_id: text             -- ID del post en la plataforma
url: text
hook_text: text               -- Hook usado
views: integer
likes: integer
comments: integer
saves: integer
shares: integer
engagement_rate: decimal
is_bombazo: boolean default false  -- 2x mediana 30d
bombazo_multiplier: decimal nullable
is_organic: boolean default true
published_at: timestamptz
metrics_updated_at: timestamptz
created_at: timestamptz
```

**competitors** — Cuentas de competencia
```
id: uuid PK
handle: text                  -- @username
platform: enum (instagram, tiktok, youtube)
followers: integer
is_active: boolean default true
created_at: timestamptz
```

**competitor_reels** — Reels scrapeados
```
id: uuid PK
competitor_id: uuid FK
platform_id: text
url: text
hook_text: text nullable      -- Extraído por transcripción
screen_text: text nullable    -- Extraído por OCR
views: integer
likes: integer
comments: integer
saves: integer
shares: integer
engagement_rate: decimal
transcription: text nullable
scraped_at: timestamptz
```

**trends** — Tendencias monitoreadas
```
id: uuid PK
title: text
source: text                  -- "Anthropic Blog", "Shopify Blog", etc.
source_url: text
category: enum (gancho, explicativo, ignorar)
suggested_angle: text nullable -- Ángulo sugerido por Claude
published_at: timestamptz     -- Fecha original de la fuente
scanned_at: timestamptz
```

**calendar_entries** — Entradas del calendario
```
id: uuid PK
script_id: uuid FK nullable
reel_metric_id: uuid FK nullable  -- Enlace a métricas reales post-publicación
date: date
time_slot: time
platform: text[]
style: text
hook_preview: text            -- Primeras palabras del hook
status: enum (draft, video_pending, scheduled, published)
video_url: text nullable      -- URL del vídeo en Supabase Storage
published_url: text nullable  -- URL pública en la plataforma
created_at: timestamptz
updated_at: timestamptz
```

**simulia_metrics** — Métricas mensuales de Simulia
```
id: uuid PK
month: date                   -- Primer día del mes
revenue: decimal              -- Ingresos del mes
new_users: integer
total_users: integer
created_at: timestamptz
```

**syk_sessions** — Sesiones del Content Engine
```
id: uuid PK
step: integer                 -- 1-5
profile_data: jsonb           -- Respuestas del paso 1
bio_result: text nullable     -- Bio generada
feed_calendar: jsonb nullable -- Calendario de feed
stories_calendar: jsonb nullable -- Calendario de stories
scripts_generated: integer default 0
completed_at: timestamptz nullable
created_at: timestamptz
```

## Secciones — Detalle Funcional

### 1. Overview (página principal)

**KPIs en fila**: IG Views 7D, YT Subs, Guardados 7D, Simulia ingresos 30D + nuevos usuarios.
Cada KPI con sparkline (últimos 7 datos) y % cambio vs periodo anterior.

**Widgets**:
- Hooks recientes (últimos 3 del baúl, con botón "Usar →")
- Esta semana (mini-calendario con los próximos 4-6 posts)
- Tendencias hoy (top 3 etiquetadas como gancho/explicativo)
- Competencia (top reel de la semana con hook y views)

**Acciones rápidas**: "+ Nuevo Guion", "Content Engine".

### 2. Baúl de Ganchos

**Grid de tarjetas** con el texto del hook, fuente, tipo (color-coded), views y guardados.

**3 niveles de filtros**:
- Por fuente (creador de origen): pills con nombre de cada creador + "Propios"
- Por tipo: Pregunta, Contraste, CTA, Historia, Shock, Afirmación
- Ordenar: Más vistas, Recientes, Top guardados

**Buscador** de texto libre en hooks.

**Acciones por hook**:
- **Usar →**: manda el hook al Content Engine como base de un guion nuevo. Pre-llena el campo HOOK y sugiere PROBLEMA/SOLUCIÓN basados en el contexto de la Agencia.
- **Analizar**: Claude desglosa por qué funcionó ese hook (estructura, emoción, patrón).
- **+ Agregar**: formulario manual para añadir hooks a mano.
- **Importar**: sincroniza automáticamente desde el Rastreador de Competencia (botón "Al Baúl").

### 3. Métricas

**KPIs grandes** (5 tarjetas): Vistas totales, Guardados, Seguidores nuevos, DMs, YT Views.
Cada una con sparkline y % cambio. Toggle para **7 / 30 / 90 días**.

**Gráficos**:
- Alcance & Visibilidad: barras temporales (Recharts BarChart)
- Engagement: donut chart con Likes, Guardados, Comentarios (Recharts PieChart)

**Bombazos**: grid de tarjetas para reels que duplicaron la mediana de 30 días.
- Multiplicador visual (x1.6, x3.4)
- Engagement desglosado (likes, comentarios, guardados, shares)
- % orgánico
- Link "Ver en IG ↗"
- **"Crear Trial →"**: pre-llena el Content Engine con el guion original + sugerencias de variación de hook/ángulo/formato para llegar a nueva audiencia

**Métricas por vídeo propio**: cada vídeo publicado desde el dashboard tiene sus métricas reales sincronizadas de IG/YT. Visible en la sección Bombazos y también en el Calendario (al hacer clic en un casillero publicado).

### 4. Rastreador de Competencia

**Tabla ranking**: top 5 reels semanales de todas las cuentas seguidas.
Columnas: #, Creador (handle + seguidores), Hook, Views, Engagement %, Shares.
Sortable por cualquier columna.

**Panel expandido** (al hacer clic en "Ver"):
- Transcripción completa del audio (Whisper API)
- Texto en pantalla (OCR)
- Botón "Guardar Gancho al Baúl →"
- Botón "Analizar con Claude"

**Configuración**:
- "+ Agregar Cuenta": formulario para añadir @handles a monitorear
- "Scrapear Ahora": trigger manual del cron
- Cron automático: **domingos 6am**, levanta top 5 reels de cada cuenta

**Scraping pipeline**:
1. Fetch top reels por cuenta (Instagram Graph API o scraping fallback)
2. Transcribir audio con Whisper API
3. Extraer texto en pantalla (OCR via Claude Vision)
4. Clasificar tipo de gancho automáticamente (Claude)
5. Guardar en `competitor_reels`

### 5. Community Manager

**Composer**:
- Subir vídeo (drag & drop o file picker → Supabase Storage)
- Seleccionar guion del calendario (dropdown con próximos posts)
- Elegir plataformas: Instagram, TikTok, YT Shorts (toggles)
- Programar fecha y hora

**Descripciones auto-generadas**:
- Claude genera descripción adaptada por plataforma desde el hook + ángulo + CTA del guion
- IG: versión larga con hashtags
- TikTok: versión corta con hashtags relevantes
- YT Shorts: título + descripción
- Botón "Regenerar ↻" para pedir otra versión

**Cola de publicación**: lista de posts programados con estado (Programado ✓, Pendiente vídeo, Borrador).

**Publicación**: via APIs nativas de cada plataforma donde sea posible (Instagram Content Publishing API, YouTube Data API upload). TikTok requiere manual o integración con herramientas de terceros.

### 6. Calendario de Contenido

**Vista mensual** con grid de 7 columnas (lun-dom). Cada casillero muestra:
- Hora + plataforma (badge de color: IG terracota, YT rojo, TT negro, Shorts púrpura)
- Hook preview (primeras palabras)
- **Estado visual con colorimetría**:
  - 🟢 Verde / tick ✓: **Publicado** (con métricas reales disponibles)
  - 🟡 Amarillo: **Programado** (vídeo subido, esperando fecha)
  - 🔴 Rojo: **Pendiente vídeo** (guion listo, falta grabar/subir)
  - ⚪ Gris: **Borrador** (guion en desarrollo)

**Toggle**: vista Mes / vista Semana.

**Panel lateral** (al hacer clic en un casillero):
- Guion completo: Hook, Problema, Solución, Prueba Social, CTA
- Si está publicado: métricas reales (views, engagement, guardados, shares) sincronizadas de IG/YT
- Indicador de rendimiento: 🔥 si fue bombazo, o comparación con la mediana
- Acciones: Editar, Publicar (→ Community Manager), Mover, Crear Trial Reel
- Si fue bombazo: botón destacado **"Crear Trial →"** para replicar con variación

**Botón "Desde Content Engine"**: llena el calendario con los guiones generados en la última sesión del Content Engine.

### 7. Tendencias

**Lista de noticias** de 12 fuentes monitoreadas diariamente.

**Fuentes**: Anthropic Blog, OpenAI Blog, Shopify Blog, Google AI Blog, X/Listas IA, Hacker News, Product Hunt, TechCrunch, The Verge, Shopify Changelog, Reddit r/ecommerce, YouTube Trending.

**Etiquetado** por Claude:
- **Gancho** (verde): alto potencial viral, urgencia, impacto directo en la audiencia
- **Explicativo** (amarillo): bueno para contenido educativo, YT largo
- **Ignorar** (gris, opacidad reducida): no relevante para el nicho

Cada tendencia muestra:
- Título, fuente, tiempo transcurrido
- Ángulo sugerido por Claude para convertirlo en contenido
- **"Crear Guion →"**: manda al Content Engine con el tema pre-llenado
- **"Guardar"**: guarda para referencia futura

**Filtros**: Todos, Solo Gancho, Solo Explicativo, Ignorar.

**Cron**: diario a las 7am. Scan de RSS/APIs de las 12 fuentes → Claude clasifica y sugiere ángulos.

### 8. Content Engine (metodología SYK)

**Wizard de 5 pasos**:

**Paso 1 — Perfil**: formulario con las 10 preguntas del sistema SYK (audiencia, problema, resultado, facturación, oferta, bio actual, estilos de contenido, frecuencia, restricciones, views de stories). Se guarda en `syk_sessions.profile_data` para reusar en futuras sesiones.

**Paso 2 — Auditoría de Bio**: Claude analiza la bio actual con criterio comercial (no estético). Genera bio optimizada de 3 líneas con emojis. Acciones: "Copiar bio", "Siguiente".

**Paso 3 — Calendario de Feed**: genera calendario semanal lun-dom con los 6 estilos elegidos. Regla estricta: nunca repetir estilo dos veces seguidas ni en el mismo día. Muestra conteo de estilos por semana. Preview del calendario generado.

**Paso 4 — Calendario de Stories**: basado en views promedio de stories:
- < 3.000 views: estructura Hand Raiser + Awareness/Wins
- ≥ 3.000 views: estructura con CTAs + días libres
- Opción de añadir encuesta + caja de preguntas

**Paso 5 — 42 Guiones**: genera guiones completos (HOOK, PROBLEMA, SOLUCIÓN, PRUEBA SOCIAL, CTA) uno por uno, de 7 en 7. Cada guion sigue las reglas SYK:
- Lenguaje directo, como si hablaras con alguien de 16 años
- Un solo concepto central por guion
- Tono picante, emocional, verdad incómoda
- Nunca repetir hook, problema ni CTA entre guiones
- Cada guion se puede: **Aprobar → Calendario**, **Regenerar**, **Editar**

**Trial Reels** (integrado en el flujo):
- Cuando un reel propio es detectado como bombazo (2x mediana 30d), aparece como sugerencia en el Content Engine
- Pre-llena el guion original y sugiere variaciones: cambiar hook manteniendo estructura, cambiar formato (ej: POV → Talking Head), cambiar ángulo (ej: mismo tema para audiencia diferente)
- Marcado como `is_trial_reel = true` con referencia al script original

## Cron Jobs (Vercel)

| Job | Schedule | Descripción |
|-----|----------|-------------|
| `metrics-sync` | Diario 2am | Sincroniza métricas IG + YT → `metrics_snapshots` + `reel_metrics` |
| `competitors-scrape` | Domingos 6am | Scrapea top 5 reels de cada cuenta → `competitor_reels` |
| `trends-scan` | Diario 7am | Scan 12 fuentes RSS → Claude clasifica → `trends` |
| `bombazo-detect` | Diario 3am | Calcula mediana 30d, marca reels con 2x+ como bombazo |

## Auth

Autenticación simple: variable de entorno `DASHBOARD_PASSWORD`. Middleware de Next.js que verifica cookie de sesión. Login page con campo de contraseña único. Sin registro, sin roles.

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
DASHBOARD_PASSWORD=

# APIs
INSTAGRAM_ACCESS_TOKEN=
YOUTUBE_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=          # Para Whisper

# Cron secret
CRON_SECRET=
```

## Simulia (sección secundaria)

Página simple con:
- **Ingresos últimos 30 días** (número grande)
- **Nuevos usuarios últimos 30 días**
- **Histórico mensual** (tabla o gráfico de barras)
- Datos introducidos manualmente o via API de Stripe si Simulia usa Stripe para pagos.
- Sin objetivo, sin MRR, sin progress bar. Solo datos reales del mes.

## Fuera de Scope

- Mocca (proyecto pausado)
- Ritual de respiración del dashboard actual
- Bloque de mindset/quotes del dashboard actual
- Ideas/banco de ideas del dashboard actual
- Chat con Claude del dashboard actual (reemplazado por Content Engine)
- Multi-usuario / roles
- Marketplace o componentes públicos
