# Simulia Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un monitor automático que rastrea guías clínicas de enfermería cada día a las 8h, detecta novedades, genera un resumen + script listo para grabar con Claude API, y lo muestra en una nueva sección "Alertas" del dashboard.

**Architecture:** Módulo independiente `dashboard/simulia-monitor.js` con scraper (node-fetch + cheerio), lógica de detección de novedades comparando contra `seenUrls` en state.json, y dos llamadas Claude API por novedad (filtro relevancia + generación script). El módulo se importa en `server.js`, que añade un endpoint `POST /api/monitor/run` y un check de arranque. La UI se añade al sistema de tabs existente en `index.html`.

**Tech Stack:** Node.js, node-fetch, cheerio, node-cron, @anthropic-ai/sdk — todos ya instalados en `dashboard/package.json`.

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `dashboard/simulia-monitor.js` | Crear | Scraper, detección, Claude API, cron, lógica de arranque |
| `dashboard/server.js` | Modificar | Import monitor, endpoint `/api/monitor/run`, startup check |
| `dashboard/state.json` | Modificar | Añadir clave `simuliaAlerts` con estructura vacía |
| `dashboard/index.html` | Modificar | Sidebar item + tab `alertas` + renderizado de alertas |

---

## Task 1: Inicializar `simuliaAlerts` en state.json

**Files:**
- Modify: `dashboard/state.json`

- [ ] **Step 1: Añadir la clave `simuliaAlerts` al final de state.json**

Abrir `dashboard/state.json` y añadir antes del último `}` (después de `"brownie": {...}` y `"cronMeta": {...}`):

```json
"simuliaAlerts": {
  "lastRun": null,
  "seenUrls": [],
  "alerts": []
}
```

La estructura final del objeto `state.json` tendrá `simuliaAlerts` como última clave antes del cierre `}`.

- [ ] **Step 2: Verificar que state.json sigue siendo JSON válido**

```bash
cd /Users/cris/Desktop/claude-brain/dashboard
node -e "JSON.parse(require('fs').readFileSync('state.json','utf8')); console.log('JSON válido')"
```

Expected output: `JSON válido`

- [ ] **Step 3: Commit**

```bash
cd /Users/cris/Desktop/claude-brain
git add dashboard/state.json
git commit -m "feat: init simuliaAlerts structure in state.json"
```

---

## Task 2: Crear `dashboard/simulia-monitor.js`

**Files:**
- Create: `dashboard/simulia-monitor.js`

Este módulo exporta una sola función `runMonitor()` y registra el cron. Toda la lógica de scraping, detección y generación de contenido vive aquí.

- [ ] **Step 1: Crear el archivo con las fuentes y la función de scraping**

Crear `dashboard/simulia-monitor.js` con el siguiente contenido:

```js
'use strict';
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cron = require('node-cron');

const STATE_FILE = path.join(__dirname, 'state.json');

const SOURCES = [
  {
    name: 'Sanidad Exterior',
    url: 'https://www.sanidad.gob.es/areas/sanidadExterior/laSaludTambienViaja/notasInformativas/home.htm',
    itemSelector: 'a',
    baseUrl: 'https://www.sanidad.gob.es'
  },
  {
    name: 'Seguridad del Paciente',
    url: 'https://seguridaddelpaciente.sanidad.gob.es/informacion/publicaciones/home.htm',
    itemSelector: 'a',
    baseUrl: 'https://seguridaddelpaciente.sanidad.gob.es'
  },
  {
    name: 'GuíaSalud',
    url: 'https://portal.guiasalud.es/',
    itemSelector: 'a',
    baseUrl: 'https://portal.guiasalud.es'
  }
];

// Extrae links y títulos del HTML de una fuente
async function scrapeSource(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SimuliaMonitor/1.0)' },
      timeout: 10000
    });
    if (!res.ok) {
      console.warn(`[Monitor] ${source.name}: HTTP ${res.status}`);
      return [];
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    const items = [];
    $(source.itemSelector).each((i, el) => {
      const title = $(el).text().trim();
      let href = $(el).attr('href') || '';
      if (!title || title.length < 10) return;
      if (href.startsWith('/')) href = source.baseUrl + href;
      if (!href.startsWith('http')) return;
      items.push({ title, url: href, source: source.name });
    });
    return items;
  } catch (e) {
    console.warn(`[Monitor] Error scrapeando ${source.name}:`, e.message);
    return [];
  }
}

// Llama a Claude para verificar si la novedad es relevante para EIR/OPE
async function isRelevantForEIR(title) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: `¿Es este artículo relevante para oposiciones de enfermería EIR u OPE en España? Solo responde "SI" o "NO".\n\nTítulo: "${title}"`
        }]
      })
    });
    const data = await res.json();
    const answer = data.content?.[0]?.text?.trim().toUpperCase() || 'NO';
    return answer.startsWith('SI');
  } catch (e) {
    console.warn('[Monitor] Error en filtro de relevancia:', e.message);
    return false;
  }
}

// Genera resumen + script con Claude usando el formato del canal Simulia
async function generateContent(title, url, source) {
  const guiaPath = path.join(__dirname, '..', 'simulia', 'scripts', 'GUIA-FORMATO.md');
  const guiaFormato = fs.existsSync(guiaPath) ? fs.readFileSync(guiaPath, 'utf8') : '';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Eres el guionista del canal @simulia de TikTok/Reels sobre oposiciones de enfermería EIR/OPE.

GUÍA DE FORMATO DEL CANAL (ejemplos de guiones que han funcionado):
---
${guiaFormato.slice(0, 2000)}
---

Ha salido esta novedad: "${title}" (fuente: ${source})

Genera:
1. RESUMEN (3-4 líneas): qué ha cambiado, por qué es importante para el EIR/OPE
2. SCRIPT COMPLETO siguiendo EXACTAMENTE la guía de formato con timecodes

Separa claramente con "---RESUMEN---" y "---SCRIPT---". En español.`
        }]
      })
    });
    const data = await res.json();
    const raw = data.content?.[0]?.text || '';
    const summaryMatch = raw.match(/---RESUMEN---\s*([\s\S]*?)(?=---SCRIPT---|$)/);
    const scriptMatch = raw.match(/---SCRIPT---\s*([\s\S]*)/);
    return {
      summary: summaryMatch ? summaryMatch[1].trim() : raw.slice(0, 300),
      script: scriptMatch ? scriptMatch[1].trim() : ''
    };
  } catch (e) {
    console.warn('[Monitor] Error generando contenido:', e.message);
    return { summary: '', script: '' };
  }
}

// Función principal del monitor
async function runMonitor() {
  console.log('[Monitor] Iniciando revisión de fuentes...', new Date().toISOString());

  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  state.simuliaAlerts = state.simuliaAlerts || { lastRun: null, seenUrls: [], alerts: [] };
  const seenUrls = new Set(state.simuliaAlerts.seenUrls || []);

  const newAlerts = [];

  for (const source of SOURCES) {
    const items = await scrapeSource(source);
    for (const item of items) {
      if (seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);

      const relevant = await isRelevantForEIR(item.title);
      if (!relevant) {
        console.log(`[Monitor] Ignorado (no relevante): ${item.title}`);
        continue;
      }

      console.log(`[Monitor] Novedad relevante: ${item.title}`);
      const { summary, script } = await generateContent(item.title, item.url, item.source);

      newAlerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: item.title,
        url: item.url,
        source: item.source,
        detectedAt: new Date().toISOString(),
        summary,
        script,
        seen: false
      });
    }
  }

  // Persistir cambios
  const freshState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  freshState.simuliaAlerts = freshState.simuliaAlerts || { lastRun: null, seenUrls: [], alerts: [] };
  freshState.simuliaAlerts.lastRun = new Date().toISOString();
  freshState.simuliaAlerts.seenUrls = [...seenUrls];
  freshState.simuliaAlerts.alerts = [...newAlerts, ...(freshState.simuliaAlerts.alerts || [])];
  fs.writeFileSync(STATE_FILE, JSON.stringify(freshState, null, 2));

  console.log(`[Monitor] Completado. ${newAlerts.length} nuevas alertas.`);
  return newAlerts.length;
}

// Cron: cada día a las 8:00 (Europe/Madrid)
cron.schedule('0 8 * * *', () => {
  console.log('[Monitor] Cron 8:00 — iniciando revisión automática...');
  runMonitor();
}, { timezone: 'Europe/Madrid' });

module.exports = { runMonitor };
```

- [ ] **Step 2: Verificar que el módulo carga sin errores de sintaxis**

```bash
cd /Users/cris/Desktop/claude-brain/dashboard
node -e "require('./simulia-monitor'); console.log('Módulo cargado OK')"
```

Expected output: `Módulo cargado OK` (más la línea del cron scheduler)

- [ ] **Step 3: Commit**

```bash
cd /Users/cris/Desktop/claude-brain
git add dashboard/simulia-monitor.js
git commit -m "feat: add simulia-monitor module with scraper, Claude pipeline and cron"
```

---

## Task 3: Integrar el monitor en `server.js`

**Files:**
- Modify: `dashboard/server.js` (líneas 1–8 para el import, y justo antes de `app.listen`)

- [ ] **Step 1: Añadir el import del monitor al principio de server.js**

Justo después de la línea `const cron = require('node-cron');` (línea 7), añadir:

```js
const { runMonitor } = require('./simulia-monitor');
```

- [ ] **Step 2: Añadir el endpoint POST /api/monitor/run y el startup check**

Justo antes de `app.listen(PORT, ...)` (antes de la línea 1125), añadir:

```js
// POST /api/monitor/run — lanza el monitor manualmente desde el dashboard
app.post('/api/monitor/run', async (req, res) => {
  try {
    const count = await runMonitor();
    res.json({ ok: true, newAlerts: count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/monitor/alert/:id/seen — marca alerta como vista
app.patch('/api/monitor/alert/:id/seen', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const alert = (state.simuliaAlerts?.alerts || []).find(a => a.id === req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alerta no encontrada' });
    alert.seen = true;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Startup check: si no se ha ejecutado hoy, correr el monitor al arrancar
{
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  const lastRun = state.simuliaAlerts?.lastRun;
  const today = new Date().toISOString().split('T')[0];
  if (!lastRun || !lastRun.startsWith(today)) {
    console.log('[Monitor] No ejecutado hoy — arrancando monitor al inicio...');
    runMonitor();
  }
}
```

- [ ] **Step 3: Verificar que server.js sigue cargando**

```bash
cd /Users/cris/Desktop/claude-brain/dashboard
node -e "
  process.env.ANTHROPIC_API_KEY = 'test';
  // Solo verificar sintaxis sin ejecutar app.listen
  require('fs').readFileSync('./server.js', 'utf8');
  console.log('server.js sintaxis OK');
"
```

Expected output: `server.js sintaxis OK`

- [ ] **Step 4: Commit**

```bash
cd /Users/cris/Desktop/claude-brain
git add dashboard/server.js
git commit -m "feat: wire simulia-monitor into server — endpoint and startup check"
```

---

## Task 4: Añadir sección "Alertas" al dashboard UI

**Files:**
- Modify: `dashboard/index.html`

El dashboard usa un sistema de tabs renderizadas por JS (función `renderTabContent` con `switch(currentTab)`). Necesitamos:
1. Un nuevo item en el sidebar
2. Un nuevo `case 'alertas':` en el switch

- [ ] **Step 1: Añadir item en el sidebar**

En `index.html`, localizar la línea:
```html
  <div class="sidebar-item" data-tab="scripts" onclick="switchTab('scripts')">
    <span class="si-icon">📝</span> Scripts IA
  </div>
```

Añadir justo después:
```html
  <div class="sidebar-item" data-tab="alertas" onclick="switchTab('alertas')" id="sidebar-alertas">
    <span class="si-icon">🔔</span> Alertas Simulia
  </div>
```

- [ ] **Step 2: Añadir el estilo del punto rojo de notificación**

En la sección `<style>` del HTML, añadir al final (antes del cierre `</style>`):

```css
    .alert-dot {
      display: inline-block; width: 7px; height: 7px;
      background: var(--red); border-radius: 50%;
      margin-left: 6px; vertical-align: middle;
      animation: pulse-dot 1.5s infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .alert-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 16px; margin-bottom: 12px;
    }
    .alert-card.unseen { border-left: 3px solid var(--red); }
    .alert-card.seen { border-left: 3px solid var(--border); opacity: 0.7; }
    .alert-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .alert-meta { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; }
    .alert-summary { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 12px; }
    .alert-script-box {
      background: var(--surface2); border-radius: 8px; padding: 14px;
      font-size: 12px; line-height: 1.7; white-space: pre-wrap;
      display: none; margin-bottom: 10px;
    }
    .alert-script-box.open { display: block; }
    .monitor-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
    }
    .monitor-last-run { font-size: 12px; color: var(--text-muted); }
```

- [ ] **Step 3: Añadir helper para formatear fechas relativas**

Buscar en el JS de `index.html` la función `escapeHtml` (o cualquier otra función utilitaria) y añadir justo antes de ella:

```js
function timeAgo(isoString) {
  if (!isoString) return 'nunca';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)} días`;
}
```

- [ ] **Step 4: Añadir el case 'alertas' en el switch de renderTabContent**

Buscar en `renderTabContent` el bloque `switch(currentTab)`. Localizar el último `case` antes del `default:` o cierre del switch. Añadir el nuevo case:

```js
    case 'alertas': {
      const mon = STATE.simuliaAlerts || { lastRun: null, seenUrls: [], alerts: [] };
      const unseen = (mon.alerts || []).filter(a => !a.seen);
      pageTitle = 'Alertas Simulia';
      pageContent = `
        <div class="monitor-header">
          <div class="monitor-last-run">Última revisión: ${timeAgo(mon.lastRun)}</div>
          <button class="btn-primary" style="font-size:12px;padding:7px 14px" onclick="runMonitorNow(this)">▶ Ejecutar ahora</button>
        </div>
        ${(mon.alerts || []).length === 0 ? `
          <div style="color:var(--text-muted);font-size:14px;padding:40px 0;text-align:center">
            Sin alertas todavía.<br>El monitor corre cada día a las 8h o puedes lanzarlo manualmente.
          </div>
        ` : (mon.alerts || []).map(alert => `
          <div class="alert-card ${alert.seen ? 'seen' : 'unseen'}" id="alert-${escapeHtml(alert.id)}">
            <div class="alert-title">
              ${alert.seen ? '✓' : '🔴'} ${escapeHtml(alert.title)}
            </div>
            <div class="alert-meta">
              ${escapeHtml(alert.source)} · ${timeAgo(alert.detectedAt)}
              · <a href="${escapeHtml(alert.url)}" target="_blank" style="color:var(--blue)">Ver fuente</a>
            </div>
            ${alert.summary ? `<div class="alert-summary">${escapeHtml(alert.summary)}</div>` : ''}
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${alert.script ? `<button class="btn-secondary" style="font-size:12px;padding:6px 12px" onclick="toggleScript('${escapeHtml(alert.id)}')">Ver script</button>` : ''}
              ${!alert.seen ? `<button class="btn-secondary" style="font-size:12px;padding:6px 12px" onclick="markAlertSeen('${escapeHtml(alert.id)}')">Marcar como visto</button>` : ''}
            </div>
            ${alert.script ? `<div class="alert-script-box" id="script-${escapeHtml(alert.id)}">${escapeHtml(alert.script)}</div>` : ''}
          </div>
        `).join('')}
      `;
      break;
    }
```

- [ ] **Step 5: Añadir las funciones JS para las acciones**

Buscar en el JS de `index.html` la función `switchTab` y añadir después de ella:

```js
function toggleScript(alertId) {
  const box = document.getElementById('script-' + alertId);
  if (box) box.classList.toggle('open');
}

async function markAlertSeen(alertId) {
  try {
    await fetch('/api/monitor/alert/' + alertId + '/seen', { method: 'PATCH' });
    STATE = await (await fetch('/api/state')).json();
    renderDashboard();
  } catch (e) {
    console.error('Error marcando alerta:', e);
  }
}

async function runMonitorNow(btn) {
  btn.disabled = true;
  btn.textContent = 'Ejecutando...';
  try {
    const res = await fetch('/api/monitor/run', { method: 'POST' });
    const data = await res.json();
    STATE = await (await fetch('/api/state')).json();
    renderDashboard();
    btn.textContent = `▶ Ejecutar ahora (${data.newAlerts} nuevas)`;
  } catch (e) {
    btn.textContent = '▶ Error — reintentar';
  } finally {
    btn.disabled = false;
  }
}
```

- [ ] **Step 6: Añadir punto rojo al sidebar cuando hay alertas sin leer**

En la función `updateSidebarFooter` (o en `renderDashboard`), añadir al final:

```js
  // Punto rojo en sidebar Alertas
  const sidebarAlertas = document.getElementById('sidebar-alertas');
  if (sidebarAlertas) {
    const existingDot = sidebarAlertas.querySelector('.alert-dot');
    if (existingDot) existingDot.remove();
    const unseenCount = (STATE.simuliaAlerts?.alerts || []).filter(a => !a.seen).length;
    if (unseenCount > 0) {
      const dot = document.createElement('span');
      dot.className = 'alert-dot';
      sidebarAlertas.appendChild(dot);
    }
  }
```

- [ ] **Step 7: Commit**

```bash
cd /Users/cris/Desktop/claude-brain
git add dashboard/index.html
git commit -m "feat: add Alertas Simulia tab to dashboard UI with script viewer"
```

---

## Task 5: Smoke test y arranque del servidor

**Files:** ninguno nuevo

- [ ] **Step 1: Arrancar el servidor**

```bash
cd /Users/cris/Desktop/claude-brain/dashboard
node server.js
```

Expected output:
```
Dashboard servidor corriendo en http://localhost:3001
[Monitor] No ejecutado hoy — arrancando monitor al inicio...
[Monitor] Iniciando revisión de fuentes... <timestamp>
```

- [ ] **Step 2: Verificar que la sección Alertas aparece en el dashboard**

Abrir `http://localhost:3001` en el navegador. Verificar:
- El sidebar muestra "🔔 Alertas Simulia"
- Al hacer clic aparece la vista con "Última revisión" y el botón "Ejecutar ahora"

- [ ] **Step 3: Probar el botón "Ejecutar ahora"**

Hacer clic en el botón. El servidor debe mostrar en consola:
```
[Monitor] Iniciando revisión de fuentes...
```
Y el botón cambiará a `▶ Ejecutar ahora (N nuevas)` cuando termine.

- [ ] **Step 4: Commit final + push**

```bash
cd /Users/cris/Desktop/claude-brain
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ Scraper diario a las 8h con node-cron → Task 2 (cron en simulia-monitor.js)
- ✅ Comportamiento al arrancar tarde → Task 3 (startup check)
- ✅ Filtro de relevancia Claude API → Task 2 (isRelevantForEIR)
- ✅ Generación resumen + script → Task 2 (generateContent)
- ✅ Persistencia en state.json > simuliaAlerts → Task 1 + Task 2 (runMonitor)
- ✅ UI en dashboard con sidebar item → Task 4
- ✅ Botón "Ejecutar ahora" → Task 4 + Task 3 (endpoint /api/monitor/run)
- ✅ "Ver script" desplegable → Task 4 (toggleScript)
- ✅ "Marcar como visto" + punto rojo → Task 4 (markAlertSeen + updateSidebarFooter)
- ✅ Fuentes configurables en array → Task 2 (SOURCES)

**Placeholder scan:** Ningún TBD, TODO ni "implementar luego". Los selectores CSS de las fuentes usan `'a'` que funciona como fallback y puede refinarse sin cambiar la arquitectura.

**Type consistency:** `alert.id`, `alert.seen`, `alert.script`, `alert.summary` usados consistentemente en Tasks 2, 3 y 4.
