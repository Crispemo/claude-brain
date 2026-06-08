# Creator Dashboard — Vercel

**Fecha:** 2026-06-08  
**Proyecto:** Agencia (creador contenido IA+ecom)  
**Objetivo:** Dashboard personal deployado en Vercel para trackear métricas de YouTube, Instagram y leads de Tally en tiempo real.

---

## Resumen

App Next.js 14 deployada en Vercel. URL pública (sin auth). Sidebar lateral con 4 secciones: YouTube, Instagram, Leads, ICP. Botón "Actualizar todo" que extrae datos de todas las fuentes en paralelo vía API Routes server-side. Los datos se muestran con análisis automático basado en el ICP definido.

---

## Arquitectura

### Stack
- **Framework:** Next.js 14 (App Router)
- **Estilos:** Tailwind CSS
- **Deploy:** Vercel (repo GitHub conectado, deploy automático en push)
- **Sin base de datos** — todo se trae en vivo al hacer refresh

### API Routes (server-side)
| Ruta | Fuente | Datos |
|------|--------|-------|
| `/api/youtube` | YouTube Data API v3 + Analytics OAuth | Suscriptores, vistas, watch time, CTR, lista de vídeos |
| `/api/instagram` | Instagram Graph API (Meta) | Seguidores, alcance, engagement, lista de posts/reels |
| `/api/leads` | Google Sheets API (Tally → Sheets) | Respuestas del form con UTM de origen (vídeo fuente) |
| `/api/refresh` | Llama a los tres en paralelo | Devuelve objeto combinado `{ youtube, instagram, leads }` |

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

### Instagram
**KPIs:**
- Seguidores totales + delta
- Alcance total del mes
- Impresiones
- Engagement rate
- **Lead velocity:** leads por semana (semana 1→2→3→4 del mes en curso) — mini sparkline o tabla de 4 valores

**Tabla últimos 20 posts/reels:**
- Miniatura (si disponible), likes, comentarios, reach, guardados

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

## Análisis ICP (bloque por sección)

Cada sección (YouTube, Instagram, Leads) incluye un bloque "Análisis ICP" al fondo. Lógica determinista — sin llamadas a IA en tiempo real:

| Condición | Mensaje |
|-----------|---------|
| Vídeo genera top 3 leads del mes | "Este vídeo conecta con tu ICP — repite el tema" |
| Vídeo con >2K vistas pero 0 leads | "Alto alcance, bajo ICP fit — revisa el CTA o el tema" |
| Total leads mes < 5 | "Producción insuficiente para generar leads consistentes" |
| Token Instagram < 7 días | "Renueva el access token de Meta esta semana" |
| Lead desde vídeo con CTR > 6% | "CTR alto + leads: formato ganador para tu ICP" |

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
│   ├── page.tsx            # Redirect a /youtube
│   ├── youtube/page.tsx
│   ├── instagram/page.tsx
│   ├── leads/page.tsx
│   └── icp/page.tsx
├── app/api/
│   ├── youtube/route.ts
│   ├── instagram/route.ts
│   ├── leads/route.ts
│   └── refresh/route.ts
├── components/
│   ├── Sidebar.tsx
│   ├── KpiCard.tsx
│   ├── DataTable.tsx
│   ├── IcpInsightBox.tsx
│   └── TokenAlert.tsx
├── data/
│   └── icp.json            # ICP estático
├── lib/
│   ├── youtube.ts          # Lógica YouTube API
│   ├── instagram.ts        # Lógica Instagram API
│   └── sheets.ts           # Lógica Google Sheets API
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

**Fase 1 (esta implementación):** YouTube + Instagram + Leads + ICP + deploy en Vercel  
**Fase 2 (siguiente sesión):** Migrar/fusionar con el dashboard Express existente, eliminar secciones obsoletas

---

## Criterios de éxito
- El dashboard abre en la URL de Vercel sin errores
- "Actualizar todo" trae datos reales de YouTube e Instagram en < 10 segundos
- La tabla de YouTube muestra la columna "Leads" cruzada con UTM de Tally
- El análisis ICP muestra al menos un insight accionable tras el refresh
