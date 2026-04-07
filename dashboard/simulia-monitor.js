'use strict';
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cron = require('node-cron');

const STATE_FILE = path.join(__dirname, 'state.json');

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[Monitor] WARNING: ANTHROPIC_API_KEY no configurada — las llamadas a Claude fallarán silenciosamente');
}

let monitorRunning = false;

const SOURCES = [
  // ── MINISTERIO DE SANIDAD ──────────────────────────────────
  {
    name: 'Sanidad Exterior',
    url: 'https://www.sanidad.gob.es/areas/sanidadExterior/laSaludTambienViaja/notasInformativas/home.htm',
    itemSelector: 'a',
    baseUrl: 'https://www.sanidad.gob.es'
  },
  {
    name: 'Alertas Emergencias Sanitarias',
    url: 'https://www.sanidad.gob.es/areas/alertasEmergenciasSanitarias/alertasActuales/home.htm',
    itemSelector: 'a',
    baseUrl: 'https://www.sanidad.gob.es'
  },
  {
    name: 'Seguridad del Paciente',
    url: 'https://seguridaddelpaciente.sanidad.gob.es/informacion/publicaciones/home.htm',
    itemSelector: 'a',
    baseUrl: 'https://seguridaddelpaciente.sanidad.gob.es'
  },

  // ── GUÍAS CLÍNICAS ─────────────────────────────────────────
  {
    name: 'GuíaSalud',
    url: 'https://portal.guiasalud.es/',
    itemSelector: 'a',
    baseUrl: 'https://portal.guiasalud.es'
  },
  {
    name: 'OncoGuías SEGO',
    url: 'https://oncosego.sego.es/oncoguias-sego',
    itemSelector: 'a',
    baseUrl: 'https://oncosego.sego.es'
  },
  {
    name: 'Fisterra Guías Clínicas',
    url: 'https://www.fisterra.com/guias-clinicas/',
    itemSelector: 'a',
    baseUrl: 'https://www.fisterra.com'
  },

  // ── SEGURIDAD DEL MEDICAMENTO ──────────────────────────────
  {
    name: 'ISMP España',
    url: 'https://www.ismp-espana.org/ficheros/index/3',
    itemSelector: 'a',
    baseUrl: 'https://www.ismp-espana.org'
  },
  {
    name: 'AEMPS Alertas',
    url: 'https://www.aemps.gob.es/informa/notasInformativas/medicamentosUsoHumano/home.htm',
    itemSelector: 'a',
    baseUrl: 'https://www.aemps.gob.es'
  },
  {
    name: 'AEMPS Notas de Seguridad',
    url: 'https://www.aemps.gob.es/informa/notasSeguridadMedicamentos/home.htm',
    itemSelector: 'a',
    baseUrl: 'https://www.aemps.gob.es'
  },

  // ── CRÍTICOS Y URGENCIAS ───────────────────────────────────
  {
    name: 'SEMICYUC',
    url: 'https://www.semicyuc.org/temas/profesionales/recomendaciones-guias',
    itemSelector: 'a',
    baseUrl: 'https://www.semicyuc.org'
  },
  {
    name: 'Critical Care Medicine (LWW)',
    url: 'https://journals.lww.com/ccmjournal/pages/default.aspx',
    itemSelector: 'a',
    baseUrl: 'https://journals.lww.com'
  },
  {
    name: 'SEMES',
    url: 'https://www.semes.org/publicaciones/guias/',
    itemSelector: 'a',
    baseUrl: 'https://www.semes.org'
  },

  // ── INFECCIOSAS Y MICROBIOLOGÍA ────────────────────────────
  {
    name: 'SEIMC Guías Clínicas',
    url: 'https://www.seimc.org/contenidos/ccs/revisionestematicas/index.php',
    itemSelector: 'a',
    baseUrl: 'https://www.seimc.org'
  },
  {
    name: 'ECDC Noticias',
    url: 'https://www.ecdc.europa.eu/en/news-events/news',
    itemSelector: 'a',
    baseUrl: 'https://www.ecdc.europa.eu'
  },

  // ── CARDIOLOGÍA Y CARDIOVASCULAR ──────────────────────────
  {
    name: 'SEC Publicaciones',
    url: 'https://www.secardiologia.es/publicaciones',
    itemSelector: 'a',
    baseUrl: 'https://www.secardiologia.es'
  },

  // ── RESPIRATORIO ──────────────────────────────────────────
  {
    name: 'SEPAR Publicaciones',
    url: 'https://www.separ.es/doc/',
    itemSelector: 'a',
    baseUrl: 'https://www.separ.es'
  },

  // ── ENDOCRINOLOGÍA Y DIABETES ─────────────────────────────
  {
    name: 'SEEN Guías',
    url: 'https://www.seen.es/portal/el-area-de-conocimiento-de-la-seen/guias-de-la-seen/',
    itemSelector: 'a',
    baseUrl: 'https://www.seen.es'
  },

  // ── GERIATRÍA ─────────────────────────────────────────────
  {
    name: 'SEGG Guías',
    url: 'https://www.segg.es/profesionales/publicaciones/guias-de-practica-clinica/',
    itemSelector: 'a',
    baseUrl: 'https://www.segg.es'
  },

  // ── NEFROLOGÍA ────────────────────────────────────────────
  {
    name: 'SEN Guías',
    url: 'https://www.senefro.org/modules.php?name=webstructure&idwebstructure=155',
    itemSelector: 'a',
    baseUrl: 'https://www.senefro.org'
  },

  // ── ENFERMERÍA ────────────────────────────────────────────
  {
    name: 'Enfermería Clínica (Elsevier)',
    url: 'https://www.elsevier.es/es-revista-enfermeria-clinica-35-articulos-recientes',
    itemSelector: 'a',
    baseUrl: 'https://www.elsevier.es'
  },

  // ── OMS / ORGANISMOS INTERNACIONALES ─────────────────────
  {
    name: 'OMS Noticias',
    url: 'https://www.who.int/es/news-room/headlines',
    itemSelector: 'a',
    baseUrl: 'https://www.who.int'
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
async function generateContent(title, url, source, guiaFormato) {
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
  if (monitorRunning) {
    console.log('[Monitor] Ya en ejecución — saltando para evitar duplicados.');
    return 0;
  }
  monitorRunning = true;

  try {
    console.log('[Monitor] Iniciando revisión de fuentes...', new Date().toISOString());

    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.simuliaAlerts = state.simuliaAlerts || { lastRun: null, seenUrls: [], alerts: [] };
    const seenUrls = new Set(state.simuliaAlerts.seenUrls || []);

    const guiaPath = path.join(__dirname, '..', 'simulia', 'scripts', 'GUIA-FORMATO.md');
    const guiaFormato = fs.existsSync(guiaPath) ? fs.readFileSync(guiaPath, 'utf8') : '';

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
        const { summary, script } = await generateContent(item.title, item.url, item.source, guiaFormato);

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
    const cappedSeenUrls = [...seenUrls].slice(-2000);
    freshState.simuliaAlerts.seenUrls = cappedSeenUrls;
    freshState.simuliaAlerts.alerts = [...newAlerts, ...(freshState.simuliaAlerts.alerts || [])].slice(0, 100);
    fs.writeFileSync(STATE_FILE, JSON.stringify(freshState, null, 2));

    console.log(`[Monitor] Completado. ${newAlerts.length} nuevas alertas.`);
    return newAlerts.length;
  } finally {
    monitorRunning = false;
  }
}

// Cron: cada día a las 8:00 (Europe/Madrid)
cron.schedule('0 8 * * *', () => {
  console.log('[Monitor] Cron 8:00 — iniciando revisión automática...');
  runMonitor();
}, { timezone: 'Europe/Madrid' });

module.exports = { runMonitor };
