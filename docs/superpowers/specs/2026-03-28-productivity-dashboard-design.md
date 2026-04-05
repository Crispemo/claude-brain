# Especificación: Productivity Dashboard + OS Personal

**Fecha:** 2026-03-28
**Estado:** Aprobado por usuario
**Propietario:** Cris

---

## 1. Visión general

Sistema de productividad personal compuesto por dos capas:

1. **Dashboard web** — panel visual accesible desde iPhone y cualquier dispositivo. Métricas en tiempo real, tareas ejecutables, chat con Claude, bloque de mentalidad.
2. **Productivity OS** — archivos estructurados en claude-brain que Claude lee automáticamente en cada sesión para mantener contexto completo de los 3 proyectos.

### Objetivo

Que Cris pueda, desde el sofá con el iPhone, ver en un vistazo el estado de sus proyectos, las acciones de la semana, sus métricas reales de YouTube/Instagram/Stripe, hablar con Claude para analizar y decidir, y recibir guía de mentalidad alineada con su camino personal.

---

## 2. Proyectos en scope

| Proyecto | Estado | Foco |
|----------|--------|------|
| **Simulia** | Activo — prioritario | Captación, SEO, crecimiento MRR |
| **Agencia** | Activo | YouTube + Instagram, contenido IA+ecom |
| **Mocca** | Pausado (sin presupuesto) | Visible en dashboard, sin tareas activas |

---

## 3. Estructura de archivos

```
claude-brain/
├── dashboard/
│   ├── index.html          ← App web completa
│   ├── server.js           ← Mini-servidor Node (proxy APIs sensibles)
│   ├── .env                ← TODAS las API keys (en .gitignore)
│   ├── package.json        ← dependencias: express, dotenv, node-fetch
│   └── state.json          ← Estado proyectos + tareas
├── os/
│   ├── goals.md            ← OKRs medibles por proyecto (trimestral)
│   ├── weekly-agenda.md    ← Tareas de la semana actual
│   └── feedback-log.md     ← Qué funcionó, qué repetir, historial
├── simulia/                ← (ya existe)
├── agencia/                ← (ya existe)
├── mocca/                  ← (ya existe)
└── CLAUDE.md               ← Auto-carga contexto al abrir sesión
```

### state.json — estructura

```json
{
  "week": "2026-W14",
  "weekFocus": "Captación orgánica Simulia + Guión #10 Agencia",
  "projects": {
    "simulia": {
      "status": "active",
      "color": "yellow",
      "objective": "1.000€ MRR",
      "current": "347€ MRR",
      "progress": 34,
      "tasks": [
        { "id": 1, "text": "Publicar post SEO oposiciones enfermería 2026", "done": false, "priority": "high" },
        { "id": 2, "text": "Optimizar meta descriptions home + categorías", "done": false, "priority": "medium" }
      ]
    },
    "agencia": {
      "status": "active",
      "color": "green",
      "objective": "5.000 suscriptores YouTube",
      "current": "3.241 suscriptores",
      "progress": 64,
      "tasks": [
        { "id": 1, "text": "Grabar guión #10 - Bot WhatsApp Shopify", "done": false, "priority": "high" }
      ]
    },
    "mocca": {
      "status": "paused",
      "color": "grey",
      "objective": "100 reservas pre-lanzamiento",
      "current": "pausado",
      "progress": 0,
      "tasks": []
    }
  },
  "weeklyLogEntry": "",
  "mindset": {
    "weekPrinciple": "Actuar a pesar del miedo",
    "weekPrincipleContext": "Cada post que publicas sin saber si funcionará es un rep mental.",
    "weeklyWin": ""
  }
}
```

---

## 4. Dashboard — bloques UI

### Bloque 0: Ritual de inicio de día *(pantalla de entrada)*

Se muestra al abrir el dashboard por primera vez en el día. No se puede saltar — es la puerta de entrada.

**Fase 1 — Respiración/meditación:**
- Timer configurable (2 o 5 min)
- Instrucción simple en pantalla: inhala 4s / retén 4s / exhala 4s
- Animación de círculo pulsante (sin distracciones)

**Fase 2 — Visualización personalizada:**
- Claude genera un párrafo de visualización basado en el estado real de los proyectos
- No genérico: usa los datos de `state.json` ("Estás a 653€ de tu objetivo MRR. Visualiza el momento en que Simulia cruza los 1.000€ y lo que eso significa para ti...")
- El texto cambia cada semana según el progreso real

**Fase 3 — Transición:**
- Botón "Estoy listo. A trabajar." → desbloquea el dashboard completo
- El ritual no vuelve a aparecer hasta el día siguiente

---

### Bloque 1: Cabecera
- Semana actual + fecha
- Frase de foco semanal (extraída de `state.json`)
- Barra de progreso global: media aritmética del campo `progress` de los proyectos con `status === "active"` (Mocca pausada excluida del cálculo)

### Bloque 2: Mapa de proyectos (3 cards)
Cada card muestra:
- Semáforo de color (🟢 bien / 🟡 atención / 🔴 urgente / ⚪ pausado)
- Objetivo principal y valor actual
- Barra de progreso hacia el objetivo
- Botón expandir → muestra tareas del proyecto

**Simulia card (extendida):**
- MRR actual vs objetivo (Stripe)
- Usuarios activos (Stripe)
- Nuevos este mes (Stripe)
- Churn (Stripe)
- **Velocidad:** "📈 A este ritmo: objetivo en ~11 semanas (13 jun)"

**Agencia card:**
- Suscriptores actuales vs objetivo (YouTube)
- **Velocidad:** "📈 A este ritmo: objetivo en ~8 semanas (24 may)"

La velocidad se calcula comparando el progreso de las últimas 4 semanas del `feedback-log` con la distancia restante al objetivo. Si no hay historial aún, no se muestra.

### Bloque 3: Acciones de esta semana
- Lista unificada de tareas de todos los proyectos activos
- Ordenadas por prioridad
- Checkbox para marcar como hecha
- Al marcar → persiste en `localStorage` del browser (instantáneo, sin servidor) + recalcula progreso visualmente
- El mini-servidor Node incluye endpoint `POST /state` para sincronizar `state.json` en disco cuando esté disponible
- Fallback: si el servidor no está corriendo, `localStorage` mantiene el estado hasta sincronizar

### Bloque 4: Métricas en vivo
- **YouTube:** suscriptores, vistas esta semana, variación (▲/▼)
- **Instagram:** seguidores, reach semanal, engagement rate
- Refresh automático al cargar + botón manual
- Mocca: sin métricas (pausado)

### Bloque 5: Chat con Claude
- Input de texto (con teclado iOS optimizado)
- Contexto pre-cargado: resumen de `state.json` + goals + semana actual
- Respuesta de Claude aparece inline
- Casos de uso: analizar canal, pedir consejo, dar feedback, revisar semana

### Bloque 5b: Captura rápida de ideas 💡

- Botón flotante siempre visible (esquina inferior derecha)
- Al pulsarlo: campo de texto + selector de proyecto (Simulia / Agencia / Mocca)
- Al guardar: Claude añade la idea al `banco-de-ideas.md` del proyecto correspondiente con fecha y estado "nueva"
- Funciona sin salir del dashboard, en 5 segundos

---

### Bloque 6: Mentalidad
- Cita del día (rotada de banco curado: Topuria, Tracy, Proctor, Rohn, Goggins)
- Principio de la semana (texto + contexto aplicado a su situación)
- Botones de estado: [Con energía] [Dudando] [Necesito empuje]
  - Cada botón → Claude responde de forma específica, con contexto personal de Cris
- Campo "Logro de la semana" → se guarda en feedback-log

---

## 5. Integraciones API

### YouTube Data API v3 + YouTube Analytics API
- **Coste:** Ambas gratuitas
- **Datos básicos** (sin OAuth): suscriptores totales, vistas totales → `channels.list` con API key
- **Datos semanales** (requiere OAuth con tu cuenta Google): vistas últimos 7 días, watch time, impresiones → YouTube Analytics API (`reports.query`)
- **Auth:** API key para datos públicos. OAuth 2.0 (una sola vez, token guardado) para Analytics
- **Implementación:** Fase 2 empieza con API key (datos básicos). OAuth se añade en Fase 3 para semana/analytics.

### Meta Graph API (Instagram)
- **Coste:** Gratuito
- **Requisito:** Cuenta Business/Creator
- **Datos:** seguidores, reach, impressions, engagement rate
- **Auth:** Access token de larga duración (60 días, renovable)
- **⚠️ Expiración:** El token expira a los 60 días. El dashboard mostrará un aviso visible ("Token Instagram expira en X días") cuando queden menos de 10 días. El mini-servidor incluirá endpoint de renovación automática.

### Stripe API
- **Coste:** Gratuito (acceso a propia cuenta)
- **Datos:** MRR calculado, clientes activos, nuevos este mes, churn, ingresos del mes
- **Auth:** Stripe Secret Key (modo live, read-only recomendado)
- **Cálculo MRR:** suma de subscripciones activas × precio mensual
- **⚠️ Seguridad:** La Stripe Secret Key NO puede ir en `config.js` del browser. Se requiere un mini-servidor local (`server.js`, ~20 líneas Node) que actúe de proxy: el dashboard llama a `localhost:3001/stripe` y el servidor hace la llamada real a Stripe con la key guardada en `.env`. El dashboard no toca la key directamente. El servidor solo corre en local, nunca se expone públicamente.

### Anthropic Claude API
- **Modelo:** claude-haiku-4-5-20251001 (rápido + económico para chat)
- **Contexto enviado en cada llamada:** resumen de state.json + goals.md + semana actual
- **Auth:** API key

---

## 6. Acceso desde iPhone

- Dashboard servido como archivo HTML estático
- Acceso local (misma WiFi): `python3 -m http.server 8080` → `http://[IP-local]:8080/dashboard`
- Acceso desde cualquier sitio: Cloudflare Tunnel (gratuito) → URL pública permanente
- Instalar en iPhone: Safari → Compartir → Añadir a pantalla de inicio

---

## 7. Flujo de datos

```
iPhone abre dashboard
    ↓
index.html carga config.js + state.json
    ↓ (paralelo)
YouTube API ──────────→ suscriptores + vistas
Instagram API ─────────→ reach + ER
Stripe API ────────────→ MRR + usuarios
state.json ────────────→ tareas + objetivos + mentalidad
    ↓
Todo pintado en pantalla (< 3 segundos)
    ↓
Usuario interactúa:
  - Marca tarea → actualiza state.json
  - Chatea → Claude API con contexto completo
  - Toca estado mentalidad → Claude responde personalizado
  - Registra logro → se guarda en feedback-log
```

---

## 8. Productivity OS — archivos de contexto

### CLAUDE.md (raíz de claude-brain)
Auto-carga en cada sesión de Claude Code:
- `os/goals.md` — objetivos actuales
- `os/weekly-agenda.md` — tareas de la semana
- `os/feedback-log.md` — historial de qué funcionó

### goals.md — estructura
OKRs trimestrales por proyecto con métricas medibles.

### weekly-agenda.md — estructura
Tareas priorizadas de la semana + estado + proyecto.

### feedback-log.md — estructura
Entradas semanales: qué se hizo, qué funcionó, qué repetir, qué dejar.

---

## 9. Skills a instalar

**Fuente:** [github.com/alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)
**Instalación:** vía el marketplace de plugins de Claude Code:
```
/plugin marketplace add alirezarezvani/claude-skills
/plugin install marketing-skills
```

Skills del pack de marketing relevantes para Cris:
- `ai-seo` — optimizar Simulia para ChatGPT/Perplexity/Google AI
- `seo-audit` — auditoría técnica periódica
- `content-strategy` — planificación editorial Agencia
- `content-production` — guiones + posts completos
- `social-media-manager` — estrategia YouTube + Instagram
- `social-content` — carruseles, reels, posts
- `competitive-teardown` — análisis academias rivales Simulia
- `paid-ads` — cuando se activen ads
- `launch-strategy` — cuando Mocca reactive
- `email-sequence` — emails para usuarios Simulia

Skills de C-level / estrategia:
- `chief-of-staff` — priorización semanal entre proyectos
- `founder-coach` — decisiones estratégicas difíciles
- `cmo-advisor` — estrategia de marketing global

Skills de business growth:
- `saas-metrics-coach` — interpretar métricas Stripe de Simulia
- `free-tool-strategy` — crecimiento orgánico sin presupuesto

### Archivo marketing-context.md por proyecto
Las skills lo leen automáticamente. Evita re-explicar contexto en cada sesión.
Se crea uno por proyecto: `simulia/marketing-context.md`, `agencia/marketing-context.md`.

---

## 10. Fases de implementación

> **Principio:** UI y funcionalidad primero. APIs al final. Cada fase produce algo usable.

### Fase 1 — Productivity OS (1-2h)
1. Crear `os/goals.md` con OKRs reales de Simulia y Agencia
2. Crear `os/weekly-agenda.md` con tareas de la semana actual
3. Crear `os/feedback-log.md` (vacío, listo para registrar)
4. Actualizar `CLAUDE.md` con auto-carga de los 3 archivos
5. Crear `simulia/marketing-context.md` y `agencia/marketing-context.md`
6. Instalar skills packs

**Resultado:** Claude tiene contexto completo en cada sesión. Skills funcionando.

---

### Fase 2 — Dashboard UI completo con datos mock (3-4h)
1. Crear `dashboard/state.json` con datos realistas (tus números reales, a mano)
2. Crear `dashboard/server.js` básico (sirve el HTML + `state.json`)
3. Crear `dashboard/.env` con estructura de keys (vacías de momento)
4. Construir `dashboard/index.html` completo:
   - Bloque 0: Ritual de inicio (meditación + visualización estática + botón)
   - Bloque 1: Cabecera + progreso global
   - Bloque 2: 3 cards de proyectos con velocidad (calculada desde state.json)
   - Bloque 3: Tareas de la semana + checkboxes (persisten en localStorage)
   - Bloque 4: Métricas placeholder (valores de state.json, sin API aún)
   - Bloque 5: Chat con Claude (texto hardcodeado de prueba)
   - Bloque 5b: Botón flotante captura de ideas
   - Bloque 6: Mentalidad con banco de citas completo
5. Optimizar para móvil (touch targets, scroll, fuentes)

**Resultado:** Dashboard 100% funcional visualmente, sin APIs reales. Usable desde hoy.

---

### Fase 3 — Chat real con Claude (1h)
1. Añadir Anthropic API key al `.env`
2. Endpoint `POST /api/chat` en server.js (contexto de state.json pre-cargado)
3. Conectar el bloque de chat del dashboard a este endpoint
4. Ritual de inicio: visualización generada por Claude en tiempo real

**Resultado:** Chat inteligente funcionando. Visualización personalizada real.

---

### Fase 4 — APIs de métricas (2-3h) ← LO ÚLTIMO
1. **YouTube Data API:** API key en .env → endpoint `/api/youtube` → suscriptores reales
2. **Stripe API:** Secret key en .env → endpoint `/api/stripe` → MRR + usuarios reales
3. **Instagram Meta API:** Access token en .env → endpoint `/api/instagram` → reach real
4. **YouTube Analytics API:** OAuth setup → endpoint `/api/youtube/analytics` → datos semanales
5. Cache en localStorage con timestamp por cada API
6. Estados de error y degradación por API

**Resultado:** Dashboard completamente vivo con datos reales de todas las fuentes.

---

## 11. Banco de citas de mentalidad (muestra)

Curado para el perfil de Cris: joven emprendedor en transición, disciplina y mentalidad de campeón.

- *"No pidas que sea más fácil, pide ser mejor."* — Jim Rohn
- *"El éxito no es el resultado del trabajo espontáneo. Es el resultado de la acción constante."* — Ilia Topuria
- *"Cada acción que tomas es un voto por el tipo de persona que quieres convertirte."* — James Clear
- *"La única manera de predecir el futuro es creándolo."* — Bob Proctor
- *"No cuentes los días, haz que los días cuenten."* — Brian Tracy
- *"Stay hard."* — David Goggins
- *"La disciplina es el puente entre metas y logros."* — Jim Rohn
- *"Actúa como si fuera imposible fallar."* — Brian Tracy

---

## 12. Estados de error y degradación

Si alguna API falla (sin conexión, key caducada, rate limit), el dashboard no se rompe:

| API | Fallo | Comportamiento |
|-----|-------|----------------|
| YouTube | Error/timeout | Muestra último valor cacheado en localStorage + icono ⚠️ |
| Instagram | Token expirado | Badge rojo "Renovar token" + últimos datos cacheados |
| Stripe | Error | Muestra "—" en métricas + icono ⚠️, no bloquea el resto |
| Claude API | Error/sin conexión | "Chat no disponible" — el resto del dashboard funciona |
| Servidor local (Node) | No arrancado | Dashboard carga en modo offline: datos de localStorage, sin Stripe |

Todas las APIs tienen timeout de 5 segundos. Los datos se cachean en localStorage con timestamp para mostrar "actualizado hace X min".

---

## 13. Criterios de éxito

- Dashboard carga en < 3 segundos en iPhone
- Métricas reales visibles (YouTube + Stripe mínimo) en fase inicial
- Claude en el chat responde con contexto real de los proyectos
- Bloque de mentalidad muestra cita + principio semanal
- Tareas se pueden marcar como hechas y persisten
- CLAUDE.md carga contexto automáticamente en cada sesión nueva
