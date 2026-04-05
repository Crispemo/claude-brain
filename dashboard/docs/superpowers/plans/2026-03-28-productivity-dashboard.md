# Productivity Dashboard + OS Personal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un dashboard web personal con 7 bloques (ritual de inicio, mapa de proyectos, tareas semanales, métricas, chat Claude, captura de ideas, mentalidad), un Productivity OS en claude-brain, e integración con APIs de YouTube, Stripe e Instagram.

**Architecture:** Un servidor Express mínimo (`server.js`) actúa de proxy seguro para las APIs sensibles y gestiona escrituras a `state.json`. El frontend (`index.html`) es HTML/CSS/JS puro que consume los endpoints del servidor local. El estado persiste en `localStorage` como primera capa y se sincroniza a `state.json` como segunda. Las APIs se integran en la última fase — el dashboard es 100% funcional con datos mock antes de conectar ninguna API.

**Tech Stack:** Node.js + Express (servidor), HTML/CSS/JS vanilla (frontend), dotenv (gestión de keys), node-fetch (llamadas a APIs externas desde servidor).

**Spec de referencia:** `docs/superpowers/specs/2026-03-28-productivity-dashboard-design.md`

---

## Archivos a crear/modificar

```
claude-brain/
├── CLAUDE.md                              ✅ actualizado con auto-carga de contexto OS
├── simulia/
│   └── marketing-context.md               ✅ creado
├── agencia/
│   └── marketing-context.md               ✅ creado
└── dashboard/
    ├── os/                                ✅ movido aquí (antes en raíz)
    │   ├── goals.md                       ✅ OKRs Simulia + Agencia
    │   ├── weekly-agenda.md               ✅ tareas semana actual
    │   └── feedback-log.md                ✅ historial semanal
    ├── .env.example                        ✅ creado
    ├── .env                                ✅ creado (gitignored) — keys reales
    ├── package.json                        ✅ creado
    ├── server.js                           ✅ Express proxy + state API + habits + scripts + Claude
    ├── state.json                          ✅ estado completo (proyectos, tareas, lifeGoals, habitLog, scripts, goals)
    ├── favicon.png                         ✅ favicon para iPhone/web
    ├── tunnel-setup.sh                     ✅ script túnel permanente dash.simulia.es
    └── index.html                          ✅ dashboard completo con navegación por tabs
```

---

## FASE 1 — Productivity OS

### Task 1: Archivos OS y CLAUDE.md

**Files:**
- Create: `os/goals.md`
- Create: `os/weekly-agenda.md`
- Create: `os/feedback-log.md`
- Modify: `CLAUDE.md`

- [x] **Step 1.1: Crear `os/goals.md`**

```markdown
# Objetivos — Q2 2026

## SIMULIA — Objetivo: 1.000€ MRR
- **Actual:** 347€ MRR (34%)
- **Fecha límite:** 30 junio 2026
- **Métricas clave:**
  - Usuarios activos: 23 → objetivo 60
  - Nuevos/mes: 4 → objetivo 12
  - Churn mensual: < 5%
- **Palancas:** SEO orgánico, contenido oposiciones, optimización conversión

## AGENCIA — Objetivo: 5 clientes/mes
- **Actual:** 0 clientes (en validación)
- **Fecha límite:** 30 junio 2026
- **Métricas clave:**
  - Clientes captados/mes: objetivo 5
  - YouTube subs: 17 (canal de captación, no de volumen)
  - Vídeos publicados/mes: objetivo 4
- **Palancas:** YouTube como demostración de competencia, ICP = dueños tiendas Shopify

## MOCCA — PAUSADO
- Sin objetivos activos hasta tener presupuesto
- Retomar cuando Simulia supere 800€ MRR
```

- [x] **Step 1.2: Crear `os/weekly-agenda.md`**

```markdown
# Agenda Semana 14 — 28 mar 2026

## FOCO DE LA SEMANA
Captación orgánica Simulia + Guión #10 Agencia

## SIMULIA
- [ ] Publicar post SEO "oposiciones enfermería 2026" (alta prioridad)
- [ ] Optimizar meta descriptions home + 3 categorías principales
- [ ] Revisar analytics — qué páginas tienen más tiempo de sesión

## AGENCIA
- [ ] Grabar guión #10 — Bot WhatsApp Shopify
- [ ] Publicar carrusel Instagram (ya creado)
- [ ] Responder comentarios YouTube últimos 3 vídeos

## REVISIÓN DEL VIERNES
- ¿Qué funcionó esta semana?
- ¿Qué repetir la semana que viene?
- Actualizar estado de proyectos en state.json
```

- [x] **Step 1.3: Crear `os/feedback-log.md`**

```markdown
# Feedback Log — Historial semanal

## Semana 14 (28 mar 2026)
- **Qué hice:**
- **Qué funcionó:**
- **Qué repetir:**
- **Qué dejar:**
- **Métricas finales:** MRR: ___ | Subs YT: ___ | ER IG: ___
```

- [x] **Step 1.4: Modificar `CLAUDE.md`** — añadir bloque de auto-carga al inicio del archivo existente

Si no existe `CLAUDE.md`, crearlo. Añadir o actualizar con:

```markdown
# Claude Brain — Contexto automático

Al iniciar cada sesión, lee estos archivos para tener contexto completo:

- `dashboard/os/goals.md` — objetivos actuales de los proyectos
- `dashboard/os/weekly-agenda.md` — tareas y foco de la semana
- `dashboard/os/feedback-log.md` — qué ha funcionado, historial

## Perfil del usuario
- Cris, 26 años, enfermero reconvertido a tecnología (año 1 de transición)
- Dirige 3 proyectos: Simulia (activo, prioritario), Agencia (activo), Mocca (pausado)
- Referentes de mentalidad: Ilia Topuria, Brian Tracy, Bob Proctor, Jim Rohn
- Espera respuestas directas, accionables, sin relleno

## Proyectos
- **Simulia** (simulia.es): plataforma oposiciones enfermería. Fase captación. KPI: MRR.
- **Agencia**: creador contenido IA+ecom en español. KPI: suscriptores YouTube.
- **Mocca**: ecommerce perros, pausado sin presupuesto.

## Instrucciones
- Actúa como el especialista que se necesite (SEO, copywriter, estratega, coach)
- Ancla siempre las recomendaciones al contexto específico del proyecto
- Cuando el usuario mencione algo personal o un bloqueo, responde como guía, no solo como herramienta
```

- [x] **Step 1.5: Verificar**

Abre una sesión nueva de Claude Code en `claude-brain/`. Confirma que Claude tiene contexto de goals y agenda sin que el usuario lo tenga que pegar.

- [x] **Step 1.6: Commit**

```bash
git add os/ CLAUDE.md
git commit -m "feat: add productivity OS — goals, weekly agenda, feedback log, CLAUDE.md context"
```

---

### Task 2: Marketing context files para skills

**Files:**
- Create: `simulia/marketing-context.md`
- Create: `agencia/marketing-context.md`

- [x] **Step 2.1: Crear `simulia/marketing-context.md`**

```markdown
# Marketing Context — Simulia

## Producto
Plataforma digital de preparación de oposiciones de enfermería en España.
URL: simulia.es
Estado: activo, con usuarios reales.

## Audiencia objetivo
- Enfermeros/as preparando OPE (Oferta Pública de Empleo) en España
- Recién graduados en enfermería buscando plaza pública
- Enfermeros en activo que quieren consolidar plaza
- Edad: 22-40 años
- Frustración principal: cantidad enorme de temario, falta de tiempo, test poco realistas

## Propuesta de valor
Tests tipo OPE reales, explicaciones detalladas, estadísticas de rendimiento personal.

## Competidores principales
- Academias presenciales (Ntraining, Enfermería de Urgencias)
- Apps genéricas de test (Mededge)
- Grupos de Telegram con PDFs

## Palabras clave objetivo
- "oposiciones enfermería [comunidad autónoma]"
- "test OPE enfermería"
- "preparar oposiciones enfermería online"
- "simulacros enfermería OPE"

## Objetivos de marketing
- Aumentar tráfico orgánico via SEO de contenido
- Posicionar en AI search (ChatGPT, Perplexity)
- Convertir visitantes en usuarios de prueba gratuita
- MRR objetivo Q2 2026: 1.000€

## Canales actuales
- SEO orgánico (principal)
- Sin ads activos de momento
```

- [x] **Step 2.2: Crear `agencia/marketing-context.md`**

```markdown
# Marketing Context — Agencia (Canal IA+Ecom)

## Canal
Creador de contenido en YouTube e Instagram sobre IA aplicada a ecommerce.
Mercado: España y habla hispana.

## Audiencia
- Emprendedores con tiendas online (Shopify, WooCommerce)
- Personas que quieren monetizar con IA
- Freelancers en marketing digital
- Edad: 25-45 años
- Motivación: ahorrar tiempo, aumentar ventas, no quedarse atrás con la IA

## Propuesta de valor del canal
Tutoriales prácticos de IA aplicada a ecommerce real, sin teoría innecesaria.
Cada vídeo = una herramienta o sistema que el espectador puede implementar ese mismo día.

## Formatos que funcionan
- Tutoriales paso a paso con herramientas reales
- Comparativas (X vs Y)
- "Cómo hice X en Y minutos con IA"
- Casos reales con datos

## Objetivos
- 5 clientes/mes (actual: 0, en validación)
- YouTube: captación de clientes, no volumen (actual: 17 subs)
- 4 vídeos/mes mínimo

## Tono
Directo, útil, sin relleno. Como un amigo que sabe mucho y te lo explica sin complicarlo.
```

- [x] **Step 2.3: Commit**

```bash
git add simulia/marketing-context.md agencia/marketing-context.md
git commit -m "feat: add marketing-context files for skills auto-loading"
```

---

### Task 3: Instalar skills

> **Nota:** Los comandos `/plugin` dependen de tu versión de Claude Code y del marketplace configurado. Si no funcionan, el método alternativo es añadir las instrucciones de cada skill directamente en `CLAUDE.md` (ver Step 3.5).

- [x] **Step 3.1: Intentar añadir skills repo al marketplace**

En Claude Code (terminal integrado o chat):
```
/plugin marketplace add alirezarezvani/claude-skills
```

Si da error "command not found" o similar → saltar al Step 3.5 (método alternativo).

- [x] **Step 3.2: Instalar marketing skills pack** (si Step 3.1 funcionó)

```
/plugin install marketing-skills
/plugin install c-level-advisor
```

Skills que se activan: `ai-seo`, `seo-audit`, `content-strategy`, `content-production`, `social-media-manager`, `social-content`, `competitive-teardown`, `launch-strategy`, `email-sequence`, `paid-ads`, `chief-of-staff`, `founder-coach`, `cmo-advisor`.

- [x] **Step 3.5: Método alternativo — skills vía CLAUDE.md** (si /plugin no está disponible)

Añadir al final de `CLAUDE.md`:

```markdown
## Skills disponibles (contexto de uso)

Cuando el usuario pida trabajo relacionado con SEO → actúa como especialista en AI SEO (GEO): optimización para ser citado por ChatGPT, Perplexity, Google AI Overviews.

Cuando el usuario pida estrategia de contenido → actúa como content strategist: topic clusters, calendarios editoriales, keyword research orientado a captación.

Cuando el usuario pida análisis de redes sociales → actúa como social media manager senior: estrategia multiplataforma, métricas de crecimiento, formatos por plataforma.

Cuando el usuario pida priorización de proyectos o agenda → actúa como chief-of-staff: priorización basada en impacto/esfuerzo, agenda semanal estructurada.

Cuando el usuario tenga una decisión difícil → actúa como founder-coach: marco de decisión, pros/contras, implicaciones a largo plazo.

Cuando el usuario pida análisis de métricas SaaS → actúa como SaaS metrics coach: interpretar MRR, churn, LTV, CAC en el contexto de Simulia.

Cuando el usuario pida escribir contenido → actúa como content production specialist: brief, borrador, optimización SEO, adaptación por formato y plataforma.
```

- [x] **Step 3.6: Verificar que el contexto funciona**

En el chat de Claude Code escribe:
```
Dame la priorización de tareas para esta semana como chief-of-staff
```

Esperado: Claude lee `os/goals.md` + `os/weekly-agenda.md` y da respuesta estructurada con priorización por impacto.

---

## FASE 2 — Dashboard UI con datos mock

### Task 4: Proyecto Node + server.js base

**Files:**
- Create: `dashboard/package.json`
- Create: `dashboard/server.js`
- Create: `dashboard/.env.example`
- Create: `dashboard/.env`
- Create: `dashboard/state.json`

- [x] **Step 4.1: Crear `dashboard/package.json`**

```json
{
  "name": "productivity-dashboard",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "node-fetch": "^2.7.0",
    "cors": "^2.8.5"
  }
}
```

- [x] **Step 4.2: Instalar dependencias**

```bash
cd dashboard && npm install
```

Esperado: `node_modules/` creado, sin errores.

- [x] **Step 4.3: Añadir `dashboard/` a `.gitignore`**

Verificar que `claude-brain/.gitignore` incluya:
```
dashboard/node_modules/
dashboard/.env
```

Si no existe `.gitignore`, crearlo con esas líneas.

- [x] **Step 4.4: Crear `dashboard/.env.example`**

```bash
# YouTube Data API v3
YOUTUBE_API_KEY=tu_api_key_aqui
YOUTUBE_CHANNEL_ID=tu_channel_id_aqui

# YouTube Analytics API (OAuth)
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=

# Meta Graph API (Instagram)
INSTAGRAM_ACCESS_TOKEN=tu_token_aqui
INSTAGRAM_ACCOUNT_ID=tu_account_id_aqui

# Stripe API
STRIPE_SECRET_KEY=sk_live_xxxx

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-xxxx

# Servidor
PORT=3001
```

- [x] **Step 4.5: Crear `dashboard/.env`** (copiar de .env.example, dejar keys vacías por ahora)

```bash
cp dashboard/.env.example dashboard/.env
```

- [x] **Step 4.6: Crear `dashboard/state.json`** con tus datos reales actuales

```json
{
  "week": "2026-W14",
  "weekFocus": "Captación orgánica Simulia + Guión #10 Agencia",
  "lastUpdated": "2026-03-28",
  "projects": {
    "simulia": {
      "status": "active",
      "color": "yellow",
      "objective": "1.000€ MRR",
      "objectiveValue": 1000,
      "current": "347€ MRR",
      "currentValue": 347,
      "unit": "€ MRR",
      "progress": 34,
      "velocityWeeks": null,
      "velocityDate": null,
      "tasks": [
        { "id": "s1", "text": "Publicar post SEO oposiciones enfermería 2026", "done": false, "priority": "high" },
        { "id": "s2", "text": "Optimizar meta descriptions home + categorías", "done": false, "priority": "medium" },
        { "id": "s3", "text": "Revisar analytics — páginas con más tiempo de sesión", "done": false, "priority": "low" }
      ]
    },
    "agencia": {
      "status": "active",
      "color": "agencia",
      "objective": "5 clientes/mes",
      "objectiveValue": 5,
      "current": "0 clientes",
      "currentValue": 0,
      "unit": "clientes",
      "progress": 0,
      "velocityWeeks": null,
      "velocityDate": null,
      "tasks": [
        { "id": "a1", "text": "Grabar vídeo largo YT #1", "done": false, "priority": "high" }
      ]
    },
    "mocca": {
      "status": "paused",
      "color": "grey",
      "objective": "100 reservas pre-lanzamiento",
      "objectiveValue": 100,
      "current": "pausado",
      "currentValue": 0,
      "unit": "reservas",
      "progress": 0,
      "velocityWeeks": null,
      "velocityDate": null,
      "tasks": []
    }
  },
  "mindset": {
    "weekPrinciple": "Actuar a pesar del miedo",
    "weekPrincipleContext": "Cada post que publicas sin saber si funcionará es un rep mental. Eso es lo que te diferencia.",
    "weeklyWin": "",
    "ritualCompletedToday": false,
    "ritualLastDate": ""
  },
  "ideas": []
}
```

- [x] **Step 4.7: Crear `dashboard/server.js`** — servidor base que sirve estáticos y gestiona state

```javascript
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const STATE_FILE = path.join(__dirname, 'state.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// GET /api/state — devuelve state.json completo
app.get('/api/state', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    res.json(state);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo leer state.json' });
  }
});

// POST /api/state — actualiza state.json completo
app.post('/api/state', (req, res) => {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo escribir state.json' });
  }
});

// PATCH /api/task — marca tarea como hecha/no hecha
app.patch('/api/task', (req, res) => {
  try {
    const { project, taskId, done } = req.body;
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const task = state.projects[project].tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    task.done = done;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, task });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/idea — añade idea al state.json Y al banco-de-ideas.md del proyecto
app.post('/api/idea', (req, res) => {
  try {
    const { text, project } = req.body;
    const date = new Date().toISOString().split('T')[0];

    // 1. Guardar en state.json
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const idea = { id: Date.now(), text, project, date, status: 'nueva' };
    state.ideas = state.ideas || [];
    state.ideas.push(idea);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    // 2. Añadir al banco-de-ideas.md del proyecto (en la carpeta del proyecto)
    const ideasFile = path.join(__dirname, '..', project, 'banco-de-ideas.md');
    const entry = `\n- [ ] ${date} — ${text}\n`;
    if (!fs.existsSync(ideasFile)) {
      fs.writeFileSync(ideasFile, `# Banco de ideas — ${project}\n`);
    }
    fs.appendFileSync(ideasFile, entry);

    res.json({ ok: true, idea });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard servidor corriendo en http://localhost:${PORT}`);
});
```

- [x] **Step 4.8: Verificar que el servidor arranca**

```bash
cd dashboard && npm start
```

Esperado en terminal:
```
Dashboard servidor corriendo en http://localhost:3001
```

Abrir `http://localhost:3001/api/state` en el browser. Debe devolver el JSON de state.json.

- [x] **Step 4.9: Commit**

```bash
git add dashboard/package.json dashboard/server.js dashboard/.env.example dashboard/state.json
git commit -m "feat: add dashboard server — Express proxy + state API"
```

---

### Task 5: Dashboard HTML — estructura base + estilos

**Files:**
- Create: `dashboard/index.html` (estructura inicial con CSS)

- [x] **Step 5.1: Crear `dashboard/index.html`** — esqueleto con CSS completo

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Dashboard — Cris</title>
  <style>
    :root {
      --bg: #0f0f0f;
      --surface: #1a1a1a;
      --surface2: #242424;
      --border: #2e2e2e;
      --text: #f0f0f0;
      --text-muted: #888;
      --green: #22c55e;
      --yellow: #eab308;
      --red: #ef4444;
      --blue: #3b82f6;
      --purple: #a855f7;
      --grey: #555;
      --radius: 12px;
      --gap: 16px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: var(--gap);
      max-width: 480px;
      margin: 0 auto;
    }
    @media (min-width: 768px) {
      body { max-width: 900px; padding: 24px; }
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: var(--gap);
      margin-bottom: var(--gap);
    }
    .label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .progress-bar {
      height: 6px;
      background: var(--border);
      border-radius: 3px;
      overflow: hidden;
      margin: 8px 0;
    }
    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.6s ease;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: opacity 0.15s;
    }
    .btn:active { opacity: 0.7; }
    .btn-primary { background: var(--blue); color: white; }
    .btn-ghost { background: var(--surface2); color: var(--text); }
    .btn-full { width: 100%; justify-content: center; }
    .hidden { display: none !important; }
    .flex { display: flex; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .gap-8 { gap: 8px; }
    .mt-8 { margin-top: 8px; }
    .mt-16 { margin-top: 16px; }
    .text-sm { font-size: 13px; }
    .text-muted { color: var(--text-muted); }
    .text-green { color: var(--green); }
    .text-yellow { color: var(--yellow); }
    .text-red { color: var(--red); }
    .text-grey { color: var(--grey); }
    h1 { font-size: 22px; font-weight: 700; }
    h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
    h3 { font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>

  <!-- Los bloques se insertan aquí en las siguientes tareas -->
  <div id="app">
    <p style="color: var(--text-muted); text-align: center; margin-top: 40px;">Cargando dashboard...</p>
  </div>

  <script>
    const SERVER = 'http://localhost:3001';
    let STATE = {};

    async function loadState() {
      try {
        const res = await fetch(`${SERVER}/api/state`);
        STATE = await res.json();
      } catch (e) {
        // Fallback a localStorage si servidor no disponible
        const cached = localStorage.getItem('dashboard_state');
        STATE = cached ? JSON.parse(cached) : {};
      }
      localStorage.setItem('dashboard_state', JSON.stringify(STATE));
      renderApp();
    }

    function renderApp() {
      document.getElementById('app').innerHTML = '<p style="color: #888; text-align:center; margin-top:40px">Bloques en construcción...</p>';
    }

    loadState();
  </script>
</body>
</html>
```

- [x] **Step 5.2: Verificar en browser**

Con el servidor corriendo (`npm start` en `dashboard/`):
Abrir `http://localhost:3001` → debe mostrar "Bloques en construcción..."

- [x] **Step 5.3: Verificar en iPhone** (misma WiFi)

Ir a Ajustes > WiFi > ver IP del Mac (ej: 192.168.1.x).
Abrir `http://192.168.1.x:3001` en Safari iPhone → debe cargar.

- [x] **Step 5.4: Commit**

```bash
git add dashboard/index.html
git commit -m "feat: dashboard HTML skeleton with dark theme CSS"
```

---

### Task 6: Bloque 0 — Ritual de inicio de día

- [x] **Step 6.1: Añadir HTML del ritual** — reemplazar `renderApp()` en index.html

Añadir dentro de `<style>`:
```css
/* RITUAL */
#ritual-screen {
  position: fixed; inset: 0; background: var(--bg);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  z-index: 100; padding: 24px; text-align: center;
}
.ritual-phase { width: 100%; max-width: 360px; }
.breath-circle {
  width: 120px; height: 120px; border-radius: 50%;
  background: radial-gradient(circle, #3b82f620, #3b82f605);
  border: 2px solid var(--blue);
  margin: 24px auto;
  transition: transform 4s ease-in-out;
}
.breath-circle.expand { transform: scale(1.4); }
.timer-text { font-size: 48px; font-weight: 700; color: var(--blue); }
.visualization-text {
  font-size: 16px; line-height: 1.7;
  color: var(--text-muted); max-width: 340px;
  margin: 0 auto; font-style: italic;
}
```

Reemplazar la función `renderApp()` completa con:
```javascript
function checkRitual() {
  const today = new Date().toISOString().split('T')[0];
  const ritualDone = STATE.mindset?.ritualLastDate === today;
  if (ritualDone) {
    renderDashboard();
  } else {
    renderRitual();
  }
}

function renderRitual() {
  document.getElementById('app').innerHTML = `
    <div id="ritual-screen">
      <div id="ritual-phase-1" class="ritual-phase">
        <p class="label">Inicio de jornada</p>
        <h1 style="margin: 16px 0">Buenos días 🌅</h1>
        <p class="text-muted" style="margin-bottom: 24px">Antes de empezar, 2 minutos para ti.</p>
        <div class="breath-circle" id="breath-circle"></div>
        <div class="timer-text" id="breath-timer">2:00</div>
        <p class="text-muted mt-8" id="breath-instruction">Inhala 4s — retén 4s — exhala 4s</p>
        <button class="btn btn-ghost mt-16" onclick="skipMeditation()">Saltar →</button>
      </div>
      <div id="ritual-phase-2" class="ritual-phase hidden">
        <p class="label">Visualización</p>
        <h2 style="margin: 16px 0">Cierra los ojos un momento</h2>
        <p class="visualization-text" id="viz-text">${getVisualizationText()}</p>
        <button class="btn btn-primary btn-full mt-16" style="margin-top: 32px" onclick="finishRitual()">
          Estoy listo. A trabajar. →
        </button>
      </div>
    </div>`;
  startBreathTimer();
}

function getVisualizationText() {
  const s = STATE.projects?.simulia;
  const a = STATE.projects?.agencia;
  if (!s || !a) return "Visualiza el día que tienes por delante. Cada acción que tomes hoy es un voto por la persona en que te estás convirtiendo.";
  const mrrLeft = s.objectiveValue - s.currentValue;
  const subsLeft = a.objectiveValue - a.currentValue;
  return `Estás a ${mrrLeft}€ de tu objetivo de MRR en Simulia. Visualiza ese momento: la notificación de Stripe, el número cruzando los 1.000€. Es posible. A ${subsLeft} suscriptores de los 5.000 en YouTube. Cada vídeo que publicas acerca ese número. Hoy tienes tareas concretas que mueven esas dos cifras. Eso es lo que importa.`;
}

let breathInterval;
function startBreathTimer() {
  let seconds = 120;
  let expanding = true;
  const circle = document.getElementById('breath-circle');
  const timerEl = document.getElementById('breath-timer');

  breathInterval = setInterval(() => {
    seconds--;
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${m}:${s}`;
    // Pulso cada 12 segundos (ciclo de respiración)
    if (seconds % 12 === 0 && circle) {
      expanding = !expanding;
      circle.classList.toggle('expand', expanding);
    }
    if (seconds <= 0) {
      clearInterval(breathInterval);
      showVisualization();
    }
  }, 1000);
}

function skipMeditation() {
  clearInterval(breathInterval);
  showVisualization();
}

function showVisualization() {
  document.getElementById('ritual-phase-1').classList.add('hidden');
  document.getElementById('ritual-phase-2').classList.remove('hidden');
}

async function finishRitual() {
  const today = new Date().toISOString().split('T')[0];
  STATE.mindset.ritualLastDate = today;
  STATE.mindset.ritualCompletedToday = true;
  await saveState();
  renderDashboard();
}

function renderDashboard() {
  document.getElementById('app').innerHTML = '<p style="color:#888;text-align:center;margin-top:40px">Dashboard cargando...</p>';
  // Se completa en tareas siguientes
}

async function saveState() {
  localStorage.setItem('dashboard_state', JSON.stringify(STATE));
  try {
    await fetch(`${SERVER}/api/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(STATE)
    });
  } catch (e) { /* Falla silenciosamente — localStorage ya guardó */ }
}
```

Cambiar la última línea del script de `loadState()` para que llame `checkRitual()` en vez de `renderApp()`:
```javascript
STATE = ...
localStorage.setItem('dashboard_state', JSON.stringify(STATE));
checkRitual(); // ← cambiar renderApp() por checkRitual()
```

- [x] **Step 6.2: Verificar el ritual**

1. Abrir `http://localhost:3001` → debe aparecer pantalla de ritual
2. Verificar que el timer cuenta desde 2:00
3. Verificar que el círculo pulsa
4. Pulsar "Saltar" → debe aparecer texto de visualización con tus métricas reales
5. Pulsar "Estoy listo" → debe mostrar "Dashboard cargando..."
6. Recargar página → no debe mostrar el ritual de nuevo (ya completado hoy)
7. En `state.json` o localStorage verificar que `ritualLastDate` tiene la fecha de hoy

- [x] **Step 6.3: Commit**

```bash
git add dashboard/index.html
git commit -m "feat: add morning ritual — breath timer + personalized visualization"
```

---

### Task 7: Bloques 1 y 2 — Cabecera + mapa de proyectos

- [x] **Step 7.1: Añadir CSS de cards y cabecera** dentro de `<style>`:

```css
/* CARDS DE PROYECTOS */
.projects-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--gap);
}
@media (min-width: 768px) {
  .projects-grid { grid-template-columns: 1fr 1fr 1fr; }
}
.project-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--gap);
}
.project-card.paused { opacity: 0.45; }
.semaphore {
  display: inline-block;
  width: 10px; height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}
.semaphore.green { background: var(--green); }
.semaphore.yellow { background: var(--yellow); }
.semaphore.red { background: var(--red); }
.semaphore.grey { background: var(--grey); }
.velocity {
  font-size: 12px;
  color: var(--green);
  margin-top: 6px;
}
```

- [x] **Step 7.2: Reemplazar `renderDashboard()`** con la versión que pinta bloques 1 y 2:

```javascript
function renderDashboard() {
  const s = STATE.projects?.simulia;
  const a = STATE.projects?.agencia;
  const m = STATE.projects?.mocca;

  const globalProgress = Math.round(
    ([s, a].filter(p => p?.status === 'active').reduce((acc, p) => acc + p.progress, 0)) /
    [s, a].filter(p => p?.status === 'active').length
  );

  document.getElementById('app').innerHTML = `
    ${renderHeader(globalProgress)}
    ${renderProjects(s, a, m)}
    ${renderTasks(s, a)}
    ${renderMetrics()}
    ${renderChat()}
    ${renderMindset()}
    ${renderIdeaButton()}
  `;
  bindTaskEvents();
}

function renderHeader(globalProgress) {
  const date = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return `
    <div class="card">
      <div class="flex-between">
        <div>
          <p class="label">Semana ${getWeekNumber()}</p>
          <h1>${capitalizeFirst(date)}</h1>
          <p class="text-muted text-sm mt-8">📌 ${STATE.weekFocus || 'Sin foco definido'}</p>
        </div>
        <div style="text-align:right">
          <div class="timer-text" style="font-size:28px;color:var(--text)">${globalProgress}%</div>
          <p class="text-muted text-sm">progreso global</p>
        </div>
      </div>
      <div class="progress-bar mt-8">
        <div class="progress-fill" style="width:${globalProgress}%;background:var(--blue)"></div>
      </div>
    </div>`;
}

function renderProjects(s, a, m) {
  return `
    <div class="projects-grid">
      ${renderProjectCard('simulia', s)}
      ${renderProjectCard('agencia', a)}
      ${renderProjectCard('mocca', m)}
    </div>`;
}

function renderProjectCard(key, p) {
  if (!p) return '';
  const isPaused = p.status === 'paused';
  const colorMap = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)', grey: 'var(--grey)' };
  const fillColor = colorMap[p.color] || 'var(--grey)';
  const names = { simulia: 'Simulia', agencia: 'Agencia', mocca: 'Mocca' };

  const velocity = p.velocityWeeks
    ? `<p class="velocity">📈 Objetivo en ~${p.velocityWeeks} sem (${p.velocityDate})</p>`
    : '';

  return `
    <div class="project-card ${isPaused ? 'paused' : ''}">
      <div class="flex-between">
        <h3><span class="semaphore ${p.color}"></span>${names[key]}</h3>
        ${isPaused ? '<span class="text-sm text-muted">pausado</span>' : ''}
      </div>
      <p class="text-sm text-muted mt-8">${p.objective}</p>
      <p class="mt-8"><strong>${p.current}</strong></p>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${p.progress}%;background:${fillColor}"></div>
      </div>
      <p class="text-sm text-muted">${p.progress}% completado</p>
      ${velocity}
    </div>`;
}

function getWeekNumber() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
function capitalizeFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
```

- [x] **Step 7.3: Verificar**

Recargar dashboard (tras pasar el ritual o con `ritualLastDate` = hoy en state.json).
Deben verse: cabecera con fecha + foco + progreso global, y 3 cards de proyectos.

- [x] **Step 7.4: Commit**

```bash
git add dashboard/index.html
git commit -m "feat: add header block and project cards with progress + semaphores"
```

---

### Task 8: Bloque 3 — Tareas de la semana

- [x] **Step 8.1: Añadir CSS de tareas** en `<style>`:

```css
.task-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}
.task-item:last-child { border-bottom: none; }
.task-item.done .task-text { text-decoration: line-through; color: var(--text-muted); }
.task-checkbox {
  width: 20px; height: 20px; min-width: 20px;
  border-radius: 4px; border: 2px solid var(--border);
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.task-checkbox.checked { background: var(--green); border-color: var(--green); }
.priority-dot {
  width: 6px; height: 6px; border-radius: 50%; margin-top: 7px; min-width: 6px;
}
.priority-high { background: var(--red); }
.priority-medium { background: var(--yellow); }
.priority-low { background: var(--grey); }
.project-tag {
  font-size: 10px; padding: 2px 6px; border-radius: 4px;
  background: var(--surface2); color: var(--text-muted);
  white-space: nowrap;
}
```

- [x] **Step 8.2: Añadir `renderTasks()`** al script:

```javascript
function renderTasks(s, a) {
  const allTasks = [
    ...(s?.tasks || []).map(t => ({ ...t, project: 'simulia' })),
    ...(a?.tasks || []).map(t => ({ ...t, project: 'agencia' }))
  ].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  const done = allTasks.filter(t => t.done).length;
  const total = allTasks.length;

  const taskItems = allTasks.map(t => `
    <div class="task-item ${t.done ? 'done' : ''}" data-project="${t.project}" data-id="${t.id}">
      <div class="task-checkbox ${t.done ? 'checked' : ''}">${t.done ? '✓' : ''}</div>
      <span class="priority-dot priority-${t.priority}"></span>
      <span class="task-text" style="flex:1;font-size:14px">${t.text}</span>
      <span class="project-tag">${t.project}</span>
    </div>`).join('');

  return `
    <div class="card">
      <div class="flex-between">
        <h2>📋 Esta semana</h2>
        <span class="text-sm text-muted">${done}/${total} hechas</span>
      </div>
      <div class="progress-bar" style="margin-bottom:12px">
        <div class="progress-fill" style="width:${total ? Math.round(done/total*100) : 0}%;background:var(--green)"></div>
      </div>
      ${taskItems || '<p class="text-muted text-sm">No hay tareas esta semana</p>'}
    </div>`;
}

function bindTaskEvents() {
  document.querySelectorAll('.task-item').forEach(el => {
    el.addEventListener('click', async () => {
      const project = el.dataset.project;
      const id = el.dataset.id;
      const task = STATE.projects[project].tasks.find(t => t.id === id);
      if (!task) return;
      task.done = !task.done;
      await saveState();
      renderDashboard();
    });
  });
}
```

- [x] **Step 8.3: Verificar**

- Debe verse la lista de tareas con indicadores de prioridad y proyecto
- Hacer clic en una tarea → se tacha + checkbox se pone verde
- Recargar página → la tarea sigue tachada (localStorage persistió)
- En `state.json` verificar que `done: true` se escribió

- [x] **Step 8.4: Commit**

```bash
git add dashboard/index.html
git commit -m "feat: add weekly tasks block with checkbox persistence"
```

---

### Task 9: Bloque 4 — Métricas placeholder + Bloque 5b — Captura de ideas

- [x] **Step 9.1: Añadir CSS de métricas y floating button**:

```css
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.metric-item {
  background: var(--surface2);
  border-radius: 8px;
  padding: 12px;
}
.metric-value { font-size: 22px; font-weight: 700; }
.metric-delta { font-size: 12px; margin-top: 4px; }
.metric-delta.up { color: var(--green); }
.metric-delta.down { color: var(--red); }
/* Floating button */
#idea-btn {
  position: fixed; bottom: 24px; right: 24px;
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--purple); color: white;
  border: none; font-size: 22px; cursor: pointer;
  box-shadow: 0 4px 20px rgba(168,85,247,0.4);
  z-index: 50;
}
#idea-modal {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8);
  display: flex; align-items: flex-end;
  z-index: 60; padding: 16px;
}
.idea-modal-content {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 20px;
  width: 100%;
}
.idea-modal-content textarea {
  width: 100%; background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px; color: var(--text);
  padding: 12px; font-size: 15px;
  resize: none; margin: 12px 0;
}
.idea-modal-content select {
  width: 100%; background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px; color: var(--text);
  padding: 10px; font-size: 14px; margin-bottom: 12px;
}
```

- [x] **Step 9.2: Añadir `renderMetrics()`, `renderIdeaButton()` y funciones al script**:

```javascript
function renderMetrics() {
  return `
    <div class="card">
      <h2>📊 Métricas</h2>
      <div class="metrics-grid">
        <div class="metric-item">
          <p class="label">YouTube</p>
          <div class="metric-value" id="yt-subs">—</div>
          <p class="metric-delta" id="yt-delta">cargando...</p>
        </div>
        <div class="metric-item">
          <p class="label">Instagram</p>
          <div class="metric-value" id="ig-followers">—</div>
          <p class="metric-delta" id="ig-er">cargando...</p>
        </div>
        <div class="metric-item">
          <p class="label">MRR Simulia</p>
          <div class="metric-value" id="stripe-mrr">—</div>
          <p class="metric-delta" id="stripe-users">cargando...</p>
        </div>
        <div class="metric-item">
          <p class="label">Usuarios activos</p>
          <div class="metric-value" id="stripe-active">—</div>
          <p class="metric-delta" id="stripe-new">cargando...</p>
        </div>
      </div>
      <p class="text-sm text-muted mt-8" style="text-align:right">
        <span id="metrics-updated">APIs no conectadas aún</span>
      </p>
    </div>`;
}

function renderIdeaButton() {
  return `
    <button id="idea-btn" onclick="openIdeaModal()" title="Capturar idea">💡</button>
    <div id="idea-modal" class="hidden" onclick="closeIdeaModal(event)">
      <div class="idea-modal-content">
        <h3>💡 Nueva idea</h3>
        <textarea id="idea-text" rows="3" placeholder="Describe tu idea..."></textarea>
        <select id="idea-project">
          <option value="simulia">Simulia</option>
          <option value="agencia">Agencia</option>
          <option value="mocca">Mocca</option>
        </select>
        <div class="flex gap-8">
          <button class="btn btn-ghost" style="flex:1" onclick="document.getElementById('idea-modal').classList.add('hidden')">Cancelar</button>
          <button class="btn btn-primary" style="flex:1" onclick="saveIdea()">Guardar idea</button>
        </div>
      </div>
    </div>`;
}

function openIdeaModal() {
  document.getElementById('idea-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('idea-text').focus(), 100);
}

function closeIdeaModal(e) {
  if (e.target.id === 'idea-modal') {
    document.getElementById('idea-modal').classList.add('hidden');
  }
}

async function saveIdea() {
  const text = document.getElementById('idea-text').value.trim();
  const project = document.getElementById('idea-project').value;
  if (!text) return;
  try {
    await fetch(`${SERVER}/api/idea`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, project })
    });
    document.getElementById('idea-text').value = '';
    document.getElementById('idea-modal').classList.add('hidden');
    // Mini confirmación visual
    const btn = document.getElementById('idea-btn');
    btn.textContent = '✓';
    setTimeout(() => { btn.textContent = '💡'; }, 1500);
  } catch (e) {
    alert('Error guardando idea. ¿Está el servidor corriendo?');
  }
}
```

- [x] **Step 9.3: Verificar**

- Bloque de métricas visible con "cargando..." (se conectará con APIs en Fase 4)
- Botón 💡 visible en esquina inferior derecha
- Pulsar 💡 → abre modal
- Escribir idea, seleccionar proyecto, guardar → confirmación visual ✓
- Verificar en `state.json` que la idea se añadió en el array `ideas`

- [x] **Step 9.4: Commit**

```bash
git add dashboard/index.html
git commit -m "feat: add metrics placeholder block + quick idea capture button"
```

---

### Task 10: Bloques 5 y 6 — Chat placeholder + Mentalidad

- [x] **Step 10.1: Añadir CSS de chat y mentalidad**:

```css
.chat-messages {
  min-height: 80px; max-height: 300px; overflow-y: auto;
  margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px;
}
.msg { padding: 10px 14px; border-radius: 10px; font-size: 14px; max-width: 85%; line-height: 1.5; }
.msg.user { background: var(--blue); color: white; align-self: flex-end; }
.msg.claude { background: var(--surface2); color: var(--text); align-self: flex-start; }
.chat-input-row { display: flex; gap: 8px; }
.chat-input-row input {
  flex: 1; background: var(--surface2); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text); padding: 10px 14px; font-size: 15px;
}
.mindset-state-btns { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.state-btn {
  flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--surface2); color: var(--text);
  cursor: pointer; font-size: 13px; text-align: center; min-width: 100px;
}
.state-btn:active { background: var(--purple); border-color: var(--purple); }
.win-input {
  width: 100%; background: var(--surface2); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text); padding: 10px; font-size: 14px; margin-top: 8px;
}
```

- [x] **Step 10.2: Añadir `renderChat()`, `renderMindset()` y funciones al script**:

```javascript
const QUOTES = [
  { text: "No pidas que sea más fácil, pide ser mejor.", author: "Jim Rohn" },
  { text: "La disciplina es el puente entre metas y logros.", author: "Jim Rohn" },
  { text: "Actúa como si fuera imposible fallar.", author: "Brian Tracy" },
  { text: "No cuentes los días, haz que los días cuenten.", author: "Brian Tracy" },
  { text: "La única manera de predecir el futuro es creándolo.", author: "Bob Proctor" },
  { text: "Tú te conviertes en lo que piensas la mayor parte del tiempo.", author: "Bob Proctor" },
  { text: "No importa cuántas veces caigas, lo que importa es cuántas veces te levantes.", author: "Ilia Topuria" },
  { text: "Stay hard.", author: "David Goggins" },
  { text: "Cada acción que tomas es un voto por la persona que quieres ser.", author: "James Clear" },
  { text: "El dolor que sientes hoy es la fuerza que sentirás mañana.", author: "Anónimo" },
  { text: "El éxito no llega a los que esperan. Llega a los que trabajan.", author: "Brian Tracy" },
  { text: "No busques que las condiciones sean perfectas. Empieza.", author: "Ilia Topuria" }
];

function getDailyQuote() {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

function renderChat() {
  return `
    <div class="card">
      <h2>💬 Chat con Claude</h2>
      <div class="chat-messages" id="chat-messages">
        <div class="msg claude">Hola. Tengo tu contexto completo cargado: Simulia al ${STATE.projects?.simulia?.progress}%, Agencia al ${STATE.projects?.agencia?.progress}%. ¿Qué analizamos hoy?</div>
      </div>
      <div class="chat-input-row">
        <input type="text" id="chat-input" placeholder="Escribe aquí..." onkeydown="if(event.key==='Enter') sendChat()">
        <button class="btn btn-primary" onclick="sendChat()">→</button>
      </div>
    </div>`;
}

function renderMindset() {
  const q = getDailyQuote();
  const principle = STATE.mindset?.weekPrinciple || '—';
  const principleCtx = STATE.mindset?.weekPrincipleContext || '';
  const weeklyWin = STATE.mindset?.weeklyWin || '';

  return `
    <div class="card" style="margin-bottom: 80px">
      <h2>🧠 Mentalidad</h2>
      <div style="background:var(--surface2);border-radius:8px;padding:16px;margin-bottom:16px">
        <p style="font-size:16px;font-style:italic;line-height:1.6">"${q.text}"</p>
        <p class="text-muted text-sm mt-8">— ${q.author}</p>
      </div>
      <p class="label">Principio de la semana</p>
      <p style="font-size:15px;font-weight:600">${principle}</p>
      <p class="text-muted text-sm mt-8">${principleCtx}</p>
      <p class="label mt-16">¿Cómo estás hoy?</p>
      <div class="mindset-state-btns">
        <button class="state-btn" onclick="mindsetState('energia')">⚡ Con energía</button>
        <button class="state-btn" onclick="mindsetState('dudas')">🌫️ Dudando</button>
        <button class="state-btn" onclick="mindsetState('empuje')">🔥 Necesito empuje</button>
      </div>
      <div id="mindset-response" style="margin-top:12px"></div>
      <p class="label mt-16">Logro de la semana</p>
      <input class="win-input" type="text" placeholder="¿Qué conseguiste esta semana?"
        value="${weeklyWin}"
        onblur="saveWeeklyWin(this.value)" />
    </div>`;
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  const messages = document.getElementById('chat-messages');
  messages.innerHTML += `<div class="msg user">${msg}</div>`;
  messages.innerHTML += `<div class="msg claude" id="typing">...</div>`;
  messages.scrollTop = messages.scrollHeight;
  // Placeholder — se conecta Claude API en Fase 3
  setTimeout(() => {
    const typing = document.getElementById('typing');
    if (typing) typing.textContent = 'Claude API se conectará en Fase 3. Por ahora el chat está listo para integrar.';
    messages.scrollTop = messages.scrollHeight;
  }, 800);
}

const MINDSET_RESPONSES = {
  energia: `¡Eso es! Aprovecha este estado. Empieza por la tarea de mayor impacto — no la más fácil, la que más mueve el marcador. Tienes energía, úsala donde más cuente.`,
  dudas: `Normal. Topuria no ganó el cinturón sin pasar por momentos de duda. La diferencia es que actuó de todas formas. Elige UNA tarea pequeña, hazla, y verás cómo el estado cambia.`,
  empuje: `Recuerda por qué empezaste. Llevas un año apostando por algo que la mayoría no se atreve ni a intentar. Enfermero reconvertido a tecnólogo, con 3 proyectos en marcha. Eso no es poco. Es mucho. Ahora a por la siguiente tarea.`
};

function mindsetState(state) {
  const el = document.getElementById('mindset-response');
  el.innerHTML = `<div class="msg claude" style="align-self:stretch;max-width:100%">${MINDSET_RESPONSES[state]}</div>`;
}

async function saveWeeklyWin(value) {
  STATE.mindset.weeklyWin = value;
  await saveState();
}
```

- [x] **Step 10.3: Verificar**

- Chat muestra mensaje inicial con porcentajes reales
- Escribir en chat → aparece burbuja + respuesta placeholder
- Cita del día visible, diferente cada día
- Principio de la semana visible con contexto
- Pulsar "Con energía" / "Dudando" / "Necesito empuje" → respuesta específica aparece
- Campo "Logro de la semana" → escribir algo, hacer blur → se guarda en state.json

- [x] **Step 10.4: Commit**

```bash
git add dashboard/index.html
git commit -m "feat: add chat UI, mindset block with quotes + state responses"
```

---

## FASE 3 — Chat real con Claude API

### Task 11: Integrar Claude API en chat y ritual

**Files:**
- Modify: `dashboard/server.js` — añadir endpoint `/api/chat`
- Modify: `dashboard/index.html` — conectar `sendChat()` al endpoint real

- [x] **Step 11.1: Añadir API key de Claude al `.env`**

En `dashboard/.env`:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

Obtener en: https://console.anthropic.com

- [x] **Step 11.2: Añadir endpoint `/api/chat` a `server.js`**

Añadir antes de `app.listen(...)`:
```javascript
const fetch = require('node-fetch');

app.post('/api/chat', async (req, res) => {
  try {
    const { message, stateContext } = req.body;
    const systemPrompt = `Eres el asistente personal de Cris, un emprendedor de 26 años que está en su primer año de transición de enfermero a tecnólogo digital. Dirige 3 proyectos:

SIMULIA: plataforma oposiciones enfermería. Estado actual: ${stateContext?.simulia?.current} (${stateContext?.simulia?.progress}% del objetivo ${stateContext?.simulia?.objective}).
AGENCIA: canal YouTube/Instagram IA+ecom. Estado actual: ${stateContext?.agencia?.current} (${stateContext?.agencia?.progress}% del objetivo).
MOCCA: ecommerce perros, pausado por falta de presupuesto.

Foco semanal: ${stateContext?.weekFocus}

Responde en español, de forma directa y accionable. Sin relleno. Como un coach que conoce bien su situación. Máximo 150 palabras.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    });
    const data = await response.json();
    res.json({ reply: data.content?.[0]?.text || 'Sin respuesta' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

- [x] **Step 11.3: Actualizar `sendChat()` en index.html** para llamar al servidor real

Reemplazar el bloque `sendChat()`:
```javascript
async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  const messages = document.getElementById('chat-messages');
  messages.innerHTML += `<div class="msg user">${msg}</div>`;
  const typingId = 'typing-' + Date.now();
  messages.innerHTML += `<div class="msg claude" id="${typingId}">...</div>`;
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch(`${SERVER}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        stateContext: {
          simulia: STATE.projects?.simulia,
          agencia: STATE.projects?.agencia,
          weekFocus: STATE.weekFocus
        }
      })
    });
    const data = await res.json();
    const el = document.getElementById(typingId);
    if (el) el.textContent = data.reply || data.error;
  } catch (e) {
    const el = document.getElementById(typingId);
    if (el) el.textContent = 'Error conectando con Claude. ¿Está corriendo el servidor?';
  }
  messages.scrollTop = messages.scrollHeight;
}
```

- [x] **Step 11.4: Actualizar `getVisualizationText()` para usar Claude API**

Añadir función `generateVisualization()` en el bloque `<script>`:
```javascript
async function generateVisualization() {
  const el = document.getElementById('viz-text');
  if (!el) return;
  el.textContent = 'Generando tu visualización...';
  try {
    const res = await fetch(`${SERVER}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Genera un párrafo corto de visualización matutina personalizado para mi situación real. Usa los datos de mis proyectos. Evocador, directo, que me motive a empezar. Máximo 80 palabras.',
        stateContext: { simulia: STATE.projects?.simulia, agencia: STATE.projects?.agencia, weekFocus: STATE.weekFocus }
      })
    });
    const data = await res.json();
    if (el) el.textContent = data.reply;
  } catch (e) {
    if (el) el.textContent = getVisualizationText(); // Fallback al texto estático
  }
}
```

Reemplazar el cuerpo de la función `showVisualization()` existente:
```javascript
function showVisualization() {
  document.getElementById('ritual-phase-1').classList.add('hidden');
  document.getElementById('ritual-phase-2').classList.remove('hidden');
  generateVisualization(); // ← añadir esta línea
}
```

- [x] **Step 11.5: Verificar**

1. Reiniciar servidor: `npm start`
2. Enviar mensaje en el chat → Claude debe responder con contexto real de los proyectos
3. Hacer el ritual → la visualización debe ser generada por Claude (no el texto estático)

- [x] **Step 11.6: Commit**

```bash
git add dashboard/server.js dashboard/index.html
git commit -m "feat: integrate Claude API for chat and morning visualization"
```

---

## FASE 4 — APIs de métricas (lo último)

### Task 12: YouTube Data API

- [x] **Step 12.1: Obtener API key de YouTube**

1. Ir a https://console.cloud.google.com
2. Crear proyecto nuevo: "Dashboard Personal"
3. Activar "YouTube Data API v3"
4. Crear credencial → API key
5. Añadir al `.env`: `YOUTUBE_API_KEY=...` y `YOUTUBE_CHANNEL_ID=UCxxxxx` (ID de tu canal)

- [x] **Step 12.2: Añadir endpoint `/api/youtube` a `server.js`**

```javascript
app.get('/api/youtube', async (req, res) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${process.env.YOUTUBE_CHANNEL_ID}&key=${process.env.YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const stats = data.items?.[0]?.statistics;
    if (!stats) return res.status(404).json({ error: 'Canal no encontrado' });
    res.json({
      subscribers: parseInt(stats.subscriberCount),
      totalViews: parseInt(stats.viewCount),
      videoCount: parseInt(stats.videoCount)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

- [x] **Step 12.3: Conectar métricas YouTube en el dashboard**

Añadir llamada en `renderDashboard()` después de pintar:
```javascript
async function loadLiveMetrics() {
  // YouTube
  try {
    const yt = await (await fetch(`${SERVER}/api/youtube`)).json();
    document.getElementById('yt-subs').textContent = yt.subscribers?.toLocaleString('es-ES') || '—';
    document.getElementById('yt-delta').textContent = `${yt.videoCount} vídeos totales`;
    document.getElementById('yt-delta').className = 'metric-delta';
    // Actualizar state con valor real
    STATE.projects.agencia.currentValue = yt.subscribers;
    STATE.projects.agencia.current = `${yt.subscribers.toLocaleString('es-ES')} subs`;
    STATE.projects.agencia.progress = Math.round(yt.subscribers / STATE.projects.agencia.objectiveValue * 100);
  } catch (e) {
    document.getElementById('yt-delta').textContent = '⚠️ No disponible';
  }
  document.getElementById('metrics-updated').textContent = `Actualizado ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
}
```

Llamar `loadLiveMetrics()` al final de `renderDashboard()`.

- [x] **Step 12.4: Verificar**

Recargar dashboard → bloque de métricas debe mostrar suscriptores reales de YouTube.

- [x] **Step 12.5: Commit**

```bash
git add dashboard/server.js dashboard/index.html
git commit -m "feat: integrate YouTube Data API for live subscriber count"
```

---

### Task 13: Stripe API

- [x] **Step 13.1: Obtener Stripe API key**

1. Ir a https://dashboard.stripe.com/apikeys
2. Copiar "Secret key" (modo live)
3. Añadir al `.env`: `STRIPE_SECRET_KEY=sk_live_xxx`

- [x] **Step 13.2: Añadir endpoint `/api/stripe` a `server.js`**

```javascript
app.get('/api/stripe', async (req, res) => {
  try {
    // Obtener suscripciones activas
    const subsRes = await fetch('https://api.stripe.com/v1/subscriptions?status=active&limit=100', {
      headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    });
    const subs = await subsRes.json();

    // Calcular MRR
    let mrr = 0;
    const activeSubs = subs.data || [];
    for (const sub of activeSubs) {
      const amount = sub.plan?.amount || sub.items?.data?.[0]?.plan?.amount || 0;
      const interval = sub.plan?.interval || sub.items?.data?.[0]?.plan?.interval || 'month';
      mrr += interval === 'year' ? (amount / 12) : amount;
    }
    mrr = Math.round(mrr / 100); // de céntimos a euros

    // Nuevos este mes
    const startOfMonth = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000);
    const newThisMonth = activeSubs.filter(s => s.created >= startOfMonth).length;

    res.json({
      mrr,
      activeUsers: activeSubs.length,
      newThisMonth,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

- [x] **Step 13.3: Conectar métricas Stripe en `loadLiveMetrics()`**

Añadir dentro de `loadLiveMetrics()`:
```javascript
  // Stripe
  try {
    const stripe = await (await fetch(`${SERVER}/api/stripe`)).json();
    document.getElementById('stripe-mrr').textContent = `${stripe.mrr}€`;
    document.getElementById('stripe-users').textContent = `${stripe.activeUsers} activos`;
    document.getElementById('stripe-active').textContent = stripe.activeUsers;
    document.getElementById('stripe-new').textContent = `+${stripe.newThisMonth} este mes`;
    document.getElementById('stripe-new').className = 'metric-delta up';
    // Actualizar state con valor real
    STATE.projects.simulia.currentValue = stripe.mrr;
    STATE.projects.simulia.current = `${stripe.mrr}€ MRR`;
    STATE.projects.simulia.progress = Math.round(stripe.mrr / STATE.projects.simulia.objectiveValue * 100);
  } catch (e) {
    document.getElementById('stripe-mrr').textContent = '⚠️';
    document.getElementById('stripe-users').textContent = 'No disponible';
  }
```

- [x] **Step 13.4: Verificar**

MRR y usuarios activos de Stripe deben aparecer en tiempo real.

- [x] **Step 13.5: Commit**

```bash
git add dashboard/server.js dashboard/index.html
git commit -m "feat: integrate Stripe API for live MRR and active users"
```

---

### Task 14: Instagram Meta Graph API

- [x] **Step 14.1: Configurar Meta Graph API**

1. Ir a https://developers.facebook.com → crear app (tipo "Business")
2. Añadir producto "Instagram Graph API"
3. Generar access token de larga duración (60 días)
4. Encontrar tu Instagram Account ID
5. Añadir al `.env`:
   ```
   INSTAGRAM_ACCESS_TOKEN=EAAxxxx
   INSTAGRAM_ACCOUNT_ID=17841xxxxxxx
   ```

- [x] **Step 14.2: Añadir endpoint `/api/instagram` a `server.js`**

```javascript
app.get('/api/instagram', async (req, res) => {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

    // Datos del perfil + últimos 10 posts para calcular ER
    const profileRes = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}?fields=followers_count,media_count,media.limit(10){like_count,comments_count}&access_token=${token}`
    );
    const profile = await profileRes.json();

    // Calcular engagement rate medio de últimos posts
    let er = null;
    const posts = profile.media?.data || [];
    if (posts.length > 0 && profile.followers_count > 0) {
      const totalEngagement = posts.reduce((acc, p) => acc + (p.like_count || 0) + (p.comments_count || 0), 0);
      er = ((totalEngagement / posts.length) / profile.followers_count * 100).toFixed(2);
    }

    // Check expiración del token
    // Nota: debug_token requiere app_id|app_secret como access_token.
    // Si no tienes app_secret, omitir y manejar expiración manualmente.
    let daysLeft = null;
    const appToken = process.env.META_APP_TOKEN; // formato: APP_ID|APP_SECRET
    if (appToken) {
      try {
        const tokenRes = await fetch(
          `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appToken}`
        );
        const tokenInfo = await tokenRes.json();
        const expiresAt = tokenInfo.data?.expires_at;
        daysLeft = expiresAt ? Math.floor((expiresAt * 1000 - Date.now()) / 86400000) : null;
      } catch (e) { /* Ignorar si no hay app token */ }
    }

    res.json({
      followers: profile.followers_count,
      mediaCount: profile.media_count,
      engagementRate: er,
      tokenDaysLeft: daysLeft
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

Añadir al `.env.example`:
```
# META_APP_TOKEN = APP_ID|APP_SECRET (opcional, para check de expiración de token)
META_APP_TOKEN=
```

- [x] **Step 14.3: Conectar Instagram en `loadLiveMetrics()` + alerta de token**

```javascript
  // Instagram
  try {
    const ig = await (await fetch(`${SERVER}/api/instagram`)).json();
    document.getElementById('ig-followers').textContent = ig.followers?.toLocaleString('es-ES') || '—';
    if (ig.engagementRate) {
      document.getElementById('ig-er').textContent = `ER: ${ig.engagementRate}%`;
      document.getElementById('ig-er').className = `metric-delta ${parseFloat(ig.engagementRate) >= 3 ? 'up' : 'down'}`;
    } else {
      document.getElementById('ig-er').textContent = `${ig.mediaCount} publicaciones`;
    }
    if (ig.tokenDaysLeft !== null && ig.tokenDaysLeft < 10) {
      document.getElementById('ig-er').innerHTML = `⚠️ Token expira en ${ig.tokenDaysLeft} días`;
      document.getElementById('ig-er').className = 'metric-delta down';
    }
  } catch (e) {
    document.getElementById('ig-followers').textContent = '⚠️';
    document.getElementById('ig-er').textContent = 'No disponible';
  }
```

- [x] **Step 14.4: Commit final**

```bash
git add dashboard/server.js dashboard/index.html
git commit -m "feat: integrate Instagram Meta API with token expiry alert"
```

---

### Task 15: Acceso remoto (opcional)

- [x] **Step 15.1: Instalar Cloudflare Tunnel** (para acceder desde cualquier sitio, no solo WiFi de casa)

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel --url http://localhost:3001
```

Te dará una URL pública tipo `https://xxx.trycloudflare.com`. Ábrela desde el iPhone con datos móviles.

- [x] **Step 15.2: Añadir a pantalla de inicio iPhone**

Safari → URL del dashboard → Compartir → "Añadir a pantalla de inicio" → nombre "Dashboard"

- [x] **Step 15.3: Commit final del proyecto**

```bash
# Verificar que .env no está incluido antes de añadir
git status  # confirmar que dashboard/.env NO aparece
git add dashboard/server.js dashboard/index.html dashboard/.env.example dashboard/package.json dashboard/state.json
git commit -m "feat: complete productivity dashboard v1.0 — all APIs connected"
```

---

## Resumen de lo que tendrás al final

| Fase | Entregable |
|------|-----------|
| **Fase 1** | Claude tiene contexto completo de tus proyectos. Skills de marketing + estrategia instalados. |
| **Fase 2** | Dashboard funcional con datos mock. Ritual de mañana. Tareas. Ideas. Mentalidad. |
| **Fase 3** | Chat inteligente con Claude real. Visualización personalizada cada día. |
| **Fase 4** | Métricas en vivo: YouTube subs, MRR Stripe, seguidores Instagram. Dashboard 100% vivo. |
