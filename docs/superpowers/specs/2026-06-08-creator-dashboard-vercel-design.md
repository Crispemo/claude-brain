# Creator Dashboard — Vercel

**Fecha:** 2026-06-08  
**Proyecto:** Agencia (creador contenido IA+ecom)  
**Objetivo:** Dashboard personal deployado en Vercel para trackear métricas de YouTube, Instagram y leads de Tally en tiempo real.

---

## Resumen

App Next.js 14 deployada en Vercel. URL pública (sin auth). Sidebar lateral con 5 secciones: Dashboard, YouTube, Instagram, Leads, ICP. Botón "Actualizar todo" que extrae datos de todas las fuentes en paralelo vía API Routes server-side. Las tablas de YouTube e Instagram incluyen analytics avanzado por pieza de contenido (multiplicador vs promedio, engagement vs promedio, vistas por día de semana). Una card de "Análisis Claude" genera bajo demanda un análisis en lenguaje natural de toda la data, con recomendaciones de contenido basadas en el ICP definido.

---

## Arquitectura

### Stack
- **Framework:** Next.js 14 (App Router)
- **Estilos:** Tailwind CSS
- **Deploy:** Vercel (repo GitHub conectado, deploy automático en push)
- **Sin base de datos** — todo se trae en vivo al hacer refresh
- **Dependencias nuevas:** `recharts` (gráfico vistas por día de semana), `@anthropic-ai/sdk` (Análisis Claude), `react-markdown` (renderizar el análisis)

### API Routes (server-side)
| Ruta | Fuente | Datos |
|------|--------|-------|
| `/api/youtube` | YouTube Data API v3 + Analytics OAuth | Suscriptores, vistas, watch time, CTR, lista de vídeos |
| `/api/instagram` | Instagram Graph API (Meta) | Seguidores, alcance, engagement, lista de posts/reels |
| `/api/leads` | Google Sheets API (Tally → Sheets) | Respuestas del form con UTM de origen (vídeo fuente) |
| `/api/refresh` | Llama a los tres en paralelo | Devuelve objeto combinado `{ youtube, instagram, leads }` |
| `/api/analyze` | Anthropic API (Claude) | Recibe el payload combinado + métricas calculadas + ICP, devuelve análisis en markdown con recomendaciones de contenido |

### Variables de entorno (Vercel)
```
YOUTUBE_API_KEY
YOUTUBE_CHANNEL_ID
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
YOUTUBE_REFRESH_TOKEN
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_ACCOUNT_ID
GOOGLE_SHEETS_ID
GOOGLE_SERVICE_ACCOUNT_JSON   # JSON completo de la service account
ANTHROPIC_API_KEY
```

---

## Módulos

### YouTube
Solo se trackean **vídeos largos** (duración > 60 segundos). Los Shorts son clips derivados que redirigen al largo — no se muestran por separado.

**KPIs (últimos 30 días):**
- Suscriptores totales + delta vs mes anterior
- Vistas totales del mes (solo vídeos largos)
- Watch time (horas)
- Vídeos largos subidos este mes

**Tabla top vídeos largos:**
- Título, vistas, CTR, duración media de visualización, leads generados (cruzado con Tally UTM)
- **Multiplicador vs promedio:** badge `xN.N` = vistas del vídeo / promedio de vistas de todos los vídeos largos del período
- **Engagement vs promedio:** tasas de likes y comentarios sobre vistas, comparadas con el promedio del período (ej. "2.1% vs 1.4% promedio")
- Tabla ordenable por cualquiera de estas columnas

**Vistas por día de semana:**
- Gráfico de barras: suma de vistas agregada por día de semana de publicación, durante el período

### Instagram
**KPIs:**
- Seguidores totales + delta
- Alcance total del mes
- Impresiones
- Engagement rate
- **Lead velocity:** leads por semana (semana 1→2→3→4 del mes en curso) — mini sparkline o tabla de 4 valores

**Tabla últimos 20 posts/reels:**
- Miniatura (si disponible), likes, comentarios, reach, guardados
- **Multiplicador vs promedio:** badge `xN.N` = reach del post / promedio de reach de los últimos 20 posts
- **Engagement vs promedio:** tasas de likes, guardados, comentarios y compartidos sobre reach, comparadas con el promedio del período
- Tabla ordenable por cualquiera de estas columnas

**Vistas por día de semana:**
- Gráfico de barras: suma de reach agregado por día de semana de publicación, durante el período

**Alerta token:** si el access token de Meta caduca en menos de 7 días, aparece banner de aviso.

### Leads
**Fuente:** Google Sheets con respuestas de Tally. Las URLs de los formularios usan UTM `?utm_source=<slug-video>` para identificar el vídeo origen.

**KPIs:**
- Total leads este mes
- Leads por vídeo fuente (ranking)
- Tasa de conversión vista→lead por vídeo (cuando hay datos de vistas en YouTube)

**Tabla:** fecha, email/nombre, vídeo fuente (UTM), semana

### ICP
Sección estática. Muestra el ICP completo en formato legible:
- Perfil base (facturación, plataforma, ESP, antigüedad)
- Nivel de conciencia
- Síntomas que reconoce
- Métricas que le duelen
- Sistemas que no tiene

Guardado en `/data/icp.json`. Editable directamente en código.

---

## Análisis Claude

Card destacada en el Dashboard general, con botón "🧠 Analizar con Claude". Bajo demanda (no se ejecuta automáticamente en cada "Actualizar todo", para controlar costo de API).

**Input enviado a `/api/analyze`:**
- Payload combinado del último refresh: `{ youtube, instagram, leads }`
- Métricas calculadas: multiplicadores por pieza, engagement vs promedio (YouTube e Instagram), vistas por día de semana, ranking de leads por vídeo (YouTube)
- ICP completo (`/data/icp.json`)
- Alerta de token de Instagram, si aplica

**Output:** texto en markdown con:
- Qué piezas de contenido repetir y por qué (basado en multiplicador y engagement vs promedio)
- Qué formatos/temas evitar
- Mejor día de la semana para publicar (según vistas por día de semana)
- 2-3 ideas concretas de próximo contenido, alineadas con el ICP

**Render:** el markdown se muestra directo en la card, debajo del botón. Se mantiene en memoria de cliente (no persiste entre sesiones — "sin base de datos" sigue aplicando).

---

## Flujo de datos — Refresh

1. Usuario pulsa "↻ Actualizar todo" en el sidebar
2. Cliente llama a `POST /api/refresh`
3. El servidor ejecuta en paralelo: YouTube API, Instagram API, Google Sheets API
4. Devuelve `{ youtube: {...}, instagram: {...}, leads: {...}, updatedAt: "..." }`
5. React actualiza el estado global, todos los módulos re-renderizan
6. Sidebar muestra "Actualizado: hace X minutos"

---

## Estructura de archivos

```
creator-dashboard/
├── app/
│   ├── layout.tsx          # Root layout con sidebar
│   ├── page.tsx            # Dashboard general + card Análisis Claude
│   ├── youtube/page.tsx
│   ├── instagram/page.tsx
│   ├── leads/page.tsx
│   └── icp/page.tsx
├── app/api/
│   ├── youtube/route.ts
│   ├── instagram/route.ts
│   ├── leads/route.ts
│   ├── refresh/route.ts
│   └── analyze/route.ts    # Llama a Claude con el payload + métricas + ICP
├── components/
│   ├── Sidebar.tsx
│   ├── KpiCard.tsx
│   ├── DataTable.tsx       # Incluye columnas multiplicador y engagement vs promedio
│   ├── WeekdayChart.tsx    # Gráfico de barras (recharts)
│   ├── AnalysisCard.tsx    # Card "Análisis Claude"
│   └── TokenAlert.tsx
├── data/
│   └── icp.json            # ICP estático
├── lib/
│   ├── youtube.ts          # Lógica YouTube API + cálculo multiplicador/engagement/día semana
│   ├── instagram.ts        # Lógica Instagram API + cálculo multiplicador/engagement/día semana
│   ├── sheets.ts           # Lógica Google Sheets API
│   └── analysis.ts         # Construye el payload y llama a la Anthropic API
└── .env.local              # Variables locales (no commit)
```

---

## Setup externo requerido

### Google Sheets API (para Tally leads)
1. Google Cloud Console → nuevo proyecto → habilitar Sheets API
2. Crear Service Account → descargar JSON de credenciales
3. Compartir el Google Sheet de Tally con el email de la service account
4. Pegar el JSON completo en `GOOGLE_SERVICE_ACCOUNT_JSON`

### YouTube Analytics OAuth
Las credenciales OAuth ya están en `.env` del proyecto actual. Se trasladan a Vercel env vars.

### Instagram token
Access token ya existe en `.env`. Se renueva cada 60 días (el dashboard avisa).

---

## Fases (scope de esta implementación)

**Fase 1 (esta implementación, hoy):** YouTube + Instagram + Análisis Claude + analytics avanzado (multiplicador, engagement vs promedio, vistas por día de semana) + deploy en Vercel. Leads/ICP se conectan en cuanto el Google Sheet esté compartido con la service account, sin bloquear el resto.

**Fase 2 (futuro):** Análisis IA por video — transcripción (subtítulos de YouTube / Whisper para Instagram), detección de hook/CTA/estructura/promesa, análisis de frames, palabras por minuto, chat "preguntale a la IA por qué funcionó este video"

**Fase 3 (futuro):** Migrar/fusionar con el dashboard Express existente, eliminar secciones obsoletas

---

## Criterios de éxito
- El dashboard abre en la URL de Vercel sin errores
- "Actualizar todo" trae datos reales de YouTube e Instagram en < 10 segundos
- Las tablas de YouTube e Instagram muestran multiplicador vs promedio y engagement vs promedio por pieza, ordenables
- El gráfico de vistas por día de semana se renderiza con datos reales en ambas secciones
- El botón "Analizar con Claude" devuelve un análisis en markdown con al menos 2 ideas de contenido accionables
- La tabla de YouTube muestra la columna "Leads" cruzada con UTM de Tally (en cuanto el Sheet esté conectado)
