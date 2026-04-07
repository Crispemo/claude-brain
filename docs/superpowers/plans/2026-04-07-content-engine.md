# Content Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Express app with two modules — Scripts (URL → adapted script for Agencia) and Video Clipper (two videos → 5-10 vertical HD clips with captions).

**Architecture:** Node.js + Express backend with a single-page HTML frontend (same dark style as dashboard). Scripts module uses yt-dlp/fetch to extract content + Claude API to generate. Video Clipper uses Whisper (local) to transcribe + Claude to select best moments + ffmpeg to compose vertical 9:16 clips with face-cam overlay and karaoke captions.

**Tech Stack:** Node.js 18+, Express, @anthropic-ai/sdk, multer, fluent-ffmpeg, cheerio, node-fetch. External CLI tools: yt-dlp, ffmpeg, whisper (Python).

---

## Prerequisites (run once before starting)

```bash
# Install external CLI tools
brew install yt-dlp ffmpeg
pip install openai-whisper

# Verify
yt-dlp --version
ffmpeg -version
whisper --help
```

---

## File Map

| File | Responsibility |
|------|---------------|
| `content-engine/server.js` | Express app, mounts routes, serves static files |
| `content-engine/index.html` | Single-page UI (Scripts + Video Clipper tabs) |
| `content-engine/package.json` | Dependencies |
| `content-engine/.env.example` | Template for ANTHROPIC_API_KEY |
| `content-engine/prompts/script-agencia.txt` | Full prompt for Scripts module |
| `content-engine/prompts/clip-selector.txt` | Prompt for Claude clip selection |
| `content-engine/services/claude.js` | Claude API calls: generateScript(), selectClips() |
| `content-engine/services/scraper.js` | extractContent(url): yt-dlp for video, fetch+cheerio for articles |
| `content-engine/services/whisper.js` | transcribeAudio(audioPath): runs whisper CLI, returns JSON with word timestamps |
| `content-engine/services/ass-generator.js` | buildAssFile(whisperJson, startOffset): generates .ass subtitle file with karaoke-style highlighting |
| `content-engine/services/composer.js` | renderClip(screenPath, facePath, segment, assPath, outputPath): ffmpeg composition |
| `content-engine/services/jobs.js` | In-memory job queue: create(), update(), get() |
| `content-engine/routes/scripts.js` | POST /api/scripts/generate, GET /api/scripts |
| `content-engine/routes/clips.js` | POST /api/clips/process, GET /api/clips/status/:id, GET /api/clips |
| `content-engine/test/url-detection.test.js` | Unit tests for URL type detection in scraper |
| `content-engine/test/ass-generator.test.js` | Unit tests for ASS file generation |

---

## Task 1: Project scaffold + server

**Files:**
- Create: `content-engine/package.json`
- Create: `content-engine/.env.example`
- Create: `content-engine/server.js`
- Create: `content-engine/scripts/` (empty dir, add `.gitkeep`)
- Create: `content-engine/uploads/` (empty dir, add `.gitkeep`)
- Create: `content-engine/output/` (empty dir, add `.gitkeep`)
- Create: `content-engine/prompts/` (empty dir)

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p content-engine/{scripts,uploads,output,prompts,routes,services,test}
touch content-engine/scripts/.gitkeep content-engine/uploads/.gitkeep content-engine/output/.gitkeep
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "content-engine",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "node --test test/"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.37.0",
    "cheerio": "^1.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "fluent-ffmpeg": "^2.1.3",
    "multer": "^1.4.5-lts.1",
    "node-fetch": "^2.7.0"
  }
}
```

- [ ] **Step 3: Create .env.example**

```bash
cat > content-engine/.env.example << 'EOF'
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
EOF
cp content-engine/.env.example content-engine/.env
```

Add your real API key to `.env` (copy from dashboard's `.env`).

- [ ] **Step 4: Install dependencies**

```bash
cd content-engine && npm install
```

- [ ] **Step 5: Create server.js**

```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use(express.static(__dirname));

app.use('/api/scripts', require('./routes/scripts'));
app.use('/api/clips', require('./routes/clips'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Content Engine running on http://localhost:${PORT}`));
```

- [ ] **Step 6: Create placeholder routes so server boots**

```js
// content-engine/routes/scripts.js
const router = require('express').Router();
router.get('/ping', (req, res) => res.json({ ok: true }));
module.exports = router;
```

```js
// content-engine/routes/clips.js
const router = require('express').Router();
router.get('/ping', (req, res) => res.json({ ok: true }));
module.exports = router;
```

- [ ] **Step 7: Create minimal index.html to verify server**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Content Engine</title>
  <style>body { background: #0f0f0f; color: #f0f0f0; font-family: sans-serif; padding: 40px; }</style>
</head>
<body>
  <h1>Content Engine</h1>
  <p>Servidor OK</p>
</body>
</html>
```

- [ ] **Step 8: Verify server starts**

```bash
cd content-engine && npm start
```

Expected: `Content Engine running on http://localhost:3001`
Open `http://localhost:3001` → page loads. Open `http://localhost:3001/api/scripts/ping` → `{"ok":true}`

- [ ] **Step 9: Commit**

```bash
git add content-engine/
git commit -m "feat: content-engine scaffold and express server"
```

---

## Task 2: Claude service

**Files:**
- Create: `content-engine/services/claude.js`
- Create: `content-engine/prompts/script-agencia.txt`
- Create: `content-engine/prompts/clip-selector.txt`

- [ ] **Step 1: Create script-agencia.txt**

```
Eres un asistente que genera scripts de vídeo para Cris, creador de contenido de IA aplicada a ecommerce en español.

AUDIENCIA: Dueños de tiendas online que ya facturan (mínimo 10k€/mes) y quieren optimizar con IA. No son principiantes. Nivel de consciencia alto — ya saben que tienen problemas, buscan soluciones concretas.

VOZ: Directo, sin relleno, tono de "así lo puedes tener tú". Nunca pedagógico ni de profesor. Primera persona, ejemplos concretos, frases cortas. El gancho siempre desde la empatía: "estoy seguro de que si tienes un ecom te ha pasado esto..."

DOLORES DE REFERENCIA (elige el más relevante al contenido fuente y úsalo como base del gancho):
1. Devoluciones por uso incorrecto o irritación
2. No segmentan por tipo de piel/objetivo/sensibilidad
3. No priorizan VIP vs nuevos vs riesgo de churn
4. No tienen un sistema Loyalty para implementar a VIP
5. No hay sistema de reviews (cuándo pedirlas y cómo responder)
6. No hay guía de rutina (cómo usar / cuándo / con qué combinar)
7. Welcome débil (no pre-educa ni segmenta)
8. Falta de contenido educativo automatizado por fase (día 1–30–60)
9. Soporte saturado por preguntas repetidas (uso/compatibilidad)
10. Mala gestión de incidencias de envío (tracking, retrasos)
11. No capturan "motivo de compra" (acné, manchas, anti-edad…)
12. No miden cohortes (solo miran ventas totales)
13. No saben qué producto genera más LTV (por cohortes)
14. No hay alertas de caídas (deliverability, flows rotos)
15. Carrito abandonado básico y sin personalización
16. No hay lógica para reponer según tamaño/uso (30 vs 60 días)
17. Creatividades prometen de más y aumentan devoluciones
18. No hay segmentación por "nivel de conciencia" (novato vs experto)
19. No hay sistema para recomendaciones (rutina siguiente)
20. No existe "customer health score" (señales de riesgo)
21. Email/SMS list growth flojo (popups sin estrategia, captación pobre)
22. Sin "back in stock" / waitlist (pierden intención caliente cuando se agota un SKU)
23. Packaging / unboxing no se aprovecha (sin QR/guía/postcompra conectada)
24. Cross-sell mal diseñado por compatibilidad (recomiendan productos que no encajan y crean irritación)
25. Cero sistema para "UGC post-compra" (no piden vídeos/fotos cuando el cliente está contento)
26. Falta de SOPs internos (si el marketer se va, se cae todo el sistema)

ESTRUCTURA OBLIGATORIA:
1. INTRO — gancho anclado en el dolor más relevante del contenido. Frase corta, directa, empatía real.
2. CTA TEMPRANO — "escríbeme al WhatsApp / enlace en bio si quieres esto para tu tienda"
3. CONTENIDO — adapta el material fuente a la audiencia. Solución concreta al dolor elegido. Tu voz.
4. CIERRE + CTA — recordatorio de contacto/WhatsApp

INPUT:
{{CONTENT}}

Genera el script completo. Sin explicaciones previas, solo el script con las 4 secciones etiquetadas así:
[INTRO]
...texto...

[CTA TEMPRANO]
...texto...

[CONTENIDO]
...texto...

[CIERRE + CTA]
...texto...
```

- [ ] **Step 2: Create clip-selector.txt**

```
Analiza esta transcripción con timestamps y selecciona entre 5 y 10 segmentos para clips cortos de redes sociales (30-90 segundos cada uno).

Criterios de selección:
- Frases de alto impacto o sorpresa
- Momentos donde se explica algo concreto y accionable
- Cambios de tema claros (buenos puntos de corte)
- Segmentos de mínimo 30 segundos y máximo 90 segundos
- Evitar: saludos, muletillas, frases incompletas al inicio o final

TRANSCRIPCIÓN:
{{TRANSCRIPTION}}

Devuelve SOLO un array JSON válido, sin texto adicional, sin markdown:
[{"start": 12.5, "end": 45.2, "titulo": "Título descriptivo del clip"}, ...]
```

- [ ] **Step 3: Create services/claude.js**

```js
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateScript(content) {
  const promptTemplate = fs.readFileSync(
    path.join(__dirname, '../prompts/script-agencia.txt'), 'utf8'
  );
  const prompt = promptTemplate.replace('{{CONTENT}}', content);

  const msg = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = msg.content[0].text;
  return parseScript(raw);
}

function parseScript(raw) {
  const sections = {};
  const labels = ['INTRO', 'CTA TEMPRANO', 'CONTENIDO', 'CIERRE + CTA'];

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const next = labels[i + 1];
    const startTag = `[${label}]`;
    const start = raw.indexOf(startTag);
    if (start === -1) continue;
    const contentStart = start + startTag.length;
    const end = next ? raw.indexOf(`[${next}]`) : raw.length;
    sections[label] = raw.slice(contentStart, end !== -1 ? end : raw.length).trim();
  }

  return sections;
}

async function selectClips(transcriptionText) {
  const promptTemplate = fs.readFileSync(
    path.join(__dirname, '../prompts/clip-selector.txt'), 'utf8'
  );
  const prompt = promptTemplate.replace('{{TRANSCRIPTION}}', transcriptionText);

  const msg = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = msg.content[0].text.trim();
  return JSON.parse(raw);
}

module.exports = { generateScript, selectClips };
```

- [ ] **Step 4: Quick smoke test — verify Claude responds**

```bash
cd content-engine
node -e "
require('dotenv').config();
const { generateScript } = require('./services/claude');
generateScript('El email marketing para ecom es clave. Las tiendas que más venden usan flujos automáticos de bienvenida, carrito abandonado y winback. La mayoría solo tiene el básico.')
  .then(s => console.log(JSON.stringify(s, null, 2)))
  .catch(console.error);
"
```

Expected: JSON object with keys `INTRO`, `CTA TEMPRANO`, `CONTENIDO`, `CIERRE + CTA`, each with text.

- [ ] **Step 5: Commit**

```bash
git add content-engine/services/claude.js content-engine/prompts/
git commit -m "feat: claude service with generateScript and selectClips"
```

---

## Task 3: URL scraper service

**Files:**
- Create: `content-engine/services/scraper.js`
- Create: `content-engine/test/url-detection.test.js`

- [ ] **Step 1: Write failing tests for URL type detection**

```js
// content-engine/test/url-detection.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');

// Import the internal function — we'll export it for testing
const { detectUrlType } = require('../services/scraper');

test('YouTube watch URL detected as youtube', () => {
  assert.equal(detectUrlType('https://www.youtube.com/watch?v=abc123'), 'youtube');
});

test('YouTube short URL detected as youtube', () => {
  assert.equal(detectUrlType('https://youtu.be/abc123'), 'youtube');
});

test('Instagram reel URL detected as instagram', () => {
  assert.equal(detectUrlType('https://www.instagram.com/reel/abc123/'), 'instagram');
});

test('Instagram post URL detected as instagram', () => {
  assert.equal(detectUrlType('https://www.instagram.com/p/abc123/'), 'instagram');
});

test('Article URL detected as article', () => {
  assert.equal(detectUrlType('https://www.urgenciasyemergen.com/guias-sepsis-2026/'), 'article');
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd content-engine && npm test test/url-detection.test.js
```

Expected: Error — `Cannot find module '../services/scraper'`

- [ ] **Step 3: Create services/scraper.js**

```js
const { execSync, spawnSync } = require('child_process');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const os = require('os');

function detectUrlType(url) {
  if (/youtube\.com\/watch|youtu\.be\//.test(url)) return 'youtube';
  if (/instagram\.com\/(reel|p|tv)\//.test(url)) return 'instagram';
  return 'article';
}

async function extractContent(url) {
  const type = detectUrlType(url);

  if (type === 'youtube' || type === 'instagram') {
    return extractFromVideo(url);
  }
  return extractFromArticle(url);
}

function extractFromVideo(url) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-'));
  const outTemplate = path.join(tmpDir, '%(title)s.%(ext)s');

  // Try to get auto-generated subtitles first (faster, no audio download)
  const result = spawnSync('yt-dlp', [
    '--skip-download',
    '--write-auto-sub',
    '--sub-lang', 'es,en',
    '--convert-subs', 'srt',
    '-o', outTemplate,
    url
  ], { encoding: 'utf8', timeout: 60000 });

  // Find the .srt file written
  const srtFiles = fs.readdirSync(tmpDir).filter(f => f.endsWith('.srt'));
  if (srtFiles.length > 0) {
    const srt = fs.readFileSync(path.join(tmpDir, srtFiles[0]), 'utf8');
    fs.rmSync(tmpDir, { recursive: true });
    return parseSrt(srt);
  }

  // Fallback: download audio and transcribe with whisper
  fs.rmSync(tmpDir, { recursive: true });
  throw new Error('No subtitles found for this URL. Try an article URL or a YouTube video with auto-captions enabled.');
}

function parseSrt(srt) {
  // Remove timecodes and sequence numbers, keep only text lines
  return srt
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed &&
        !/^\d+$/.test(trimmed) &&
        !/\d{2}:\d{2}:\d{2},\d{3} -->/.test(trimmed);
    })
    .join(' ')
    .replace(/<[^>]+>/g, '') // remove HTML tags from auto-subs
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractFromArticle(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; content-engine/1.0)' }
  });
  if (!res.ok) throw new Error(`Failed to fetch article: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove noise elements
  $('nav, header, footer, script, style, aside, .sidebar, .menu, .ad, .cookie').remove();

  // Extract main content — try common article selectors
  const selectors = ['article', 'main', '.post-content', '.entry-content', '.content', 'body'];
  let text = '';
  for (const sel of selectors) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) {
      text = el.text();
      break;
    }
  }

  return text.replace(/\s+/g, ' ').trim().slice(0, 8000); // cap at 8k chars
}

module.exports = { extractContent, detectUrlType };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd content-engine && npm test test/url-detection.test.js
```

Expected: 5 passing tests.

- [ ] **Step 5: Integration test with a real YouTube URL**

```bash
cd content-engine
node -e "
require('dotenv').config();
const { extractContent } = require('./services/scraper');
extractContent('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  .then(t => console.log('OK — chars:', t.length, '\nPreview:', t.slice(0, 200)))
  .catch(console.error);
"
```

Expected: text extracted, length > 100 chars.

- [ ] **Step 6: Commit**

```bash
git add content-engine/services/scraper.js content-engine/test/url-detection.test.js
git commit -m "feat: url scraper service with yt-dlp and article extraction"
```

---

## Task 4: Scripts API route

**Files:**
- Modify: `content-engine/routes/scripts.js`

- [ ] **Step 1: Replace placeholder with full scripts route**

```js
// content-engine/routes/scripts.js
const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const { extractContent } = require('../services/scraper');
const { generateScript } = require('../services/claude');

const SCRIPTS_DIR = path.join(__dirname, '../scripts');

router.post('/generate', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url requerida' });

  try {
    const content = await extractContent(url);
    const script = await generateScript(content);

    const date = new Date().toISOString().slice(0, 10);
    const slug = url.replace(/[^a-z0-9]/gi, '-').slice(0, 40);
    const filename = `${date}-${slug}.json`;
    const saved = { url, date, script, filename };

    fs.writeFileSync(path.join(SCRIPTS_DIR, filename), JSON.stringify(saved, null, 2));

    res.json({ script, filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  const files = fs.readdirSync(SCRIPTS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  const list = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, f), 'utf8'));
    return { filename: f, url: data.url, date: data.date };
  });

  res.json(list);
});

module.exports = router;
```

- [ ] **Step 2: Test scripts API with curl**

```bash
# Start server in background
cd content-engine && npm start &

curl -s -X POST http://localhost:3001/api/scripts/generate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' | jq .
```

Expected: `{"script": {"INTRO": "...", "CTA TEMPRANO": "...", "CONTENIDO": "...", "CIERRE + CTA": "..."}, "filename": "2026-04-07-..."}`

```bash
curl -s http://localhost:3001/api/scripts | jq .
```

Expected: array with 1 item.

- [ ] **Step 3: Stop background server, commit**

```bash
kill %1
git add content-engine/routes/scripts.js
git commit -m "feat: scripts API route - generate and list"
```

---

## Task 5: Scripts UI

**Files:**
- Modify: `content-engine/index.html`

- [ ] **Step 1: Replace index.html with full Scripts UI**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Engine</title>
  <style>
    :root {
      --bg: #0f0f0f; --surface: #1a1a1a; --surface2: #242424;
      --border: #2e2e2e; --text: #f0f0f0; --text-muted: #888;
      --blue: #3b82f6; --yellow: #eab308; --green: #22c55e;
      --red: #ef4444; --radius: 12px; --gap: 16px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; }

    /* Sidebar */
    #sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 220px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; z-index: 100; }
    .sidebar-logo { padding: 20px 16px; font-size: 15px; font-weight: 700; border-bottom: 1px solid var(--border); }
    .sidebar-logo span { color: var(--yellow); }
    .nav-item { display: flex; align-items: center; gap: 9px; padding: 10px 12px; font-size: 13px; color: var(--text-muted); cursor: pointer; border-radius: 6px; margin: 2px 8px; transition: all 0.1s; }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text); }
    .nav-item.active { background: rgba(59,130,246,0.12); color: var(--blue); font-weight: 600; }
    .nav-section { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); padding: 14px 16px 4px; }

    /* Main */
    #main { margin-left: 220px; flex: 1; padding: 32px; max-width: 900px; }
    .page { display: none; }
    .page.active { display: block; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 28px; }

    /* Form */
    .input-row { display: flex; gap: 10px; margin-bottom: 24px; }
    input[type=text], textarea { background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 10px 14px; font-size: 14px; font-family: inherit; outline: none; transition: border 0.1s; }
    input[type=text]:focus, textarea:focus { border-color: var(--blue); }
    input[type=text] { flex: 1; }
    button { background: var(--blue); color: #fff; border: none; border-radius: 8px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.1s; white-space: nowrap; }
    button:hover { opacity: 0.85; }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    button.secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border); font-weight: 400; }

    /* Script output */
    .script-sections { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
    .script-block { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    .script-block-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--surface2); border-bottom: 1px solid var(--border); }
    .script-block-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--yellow); }
    .copy-section-btn { font-size: 11px; padding: 4px 10px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 5px; }
    .copy-section-btn:hover { color: var(--text); }
    textarea.script-text { width: 100%; border: none; border-radius: 0; background: transparent; color: var(--text); padding: 14px; min-height: 80px; resize: vertical; font-size: 14px; line-height: 1.6; }

    .actions-row { display: flex; gap: 10px; margin-bottom: 32px; }

    /* History */
    .section-title { font-size: 14px; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; }
    .history-list { display: flex; flex-direction: column; gap: 8px; }
    .history-item { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: border-color 0.1s; }
    .history-item:hover { border-color: var(--blue); }
    .history-url { font-size: 13px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 500px; }
    .history-date { font-size: 11px; color: var(--text-muted); flex-shrink: 0; }

    /* Status */
    .status { padding: 12px 16px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; display: none; }
    .status.loading { display: block; background: rgba(59,130,246,0.1); color: var(--blue); border: 1px solid rgba(59,130,246,0.2); }
    .status.error { display: block; background: rgba(239,68,68,0.1); color: var(--red); border: 1px solid rgba(239,68,68,0.2); }

    /* Video Clipper */
    .upload-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .upload-zone { border: 2px dashed var(--border); border-radius: 10px; padding: 32px 16px; text-align: center; cursor: pointer; transition: border-color 0.1s, background 0.1s; }
    .upload-zone:hover, .upload-zone.drag-over { border-color: var(--blue); background: rgba(59,130,246,0.04); }
    .upload-zone.has-file { border-color: var(--green); border-style: solid; }
    .upload-zone input { display: none; }
    .upload-icon { font-size: 28px; margin-bottom: 8px; }
    .upload-label { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    .upload-sublabel { font-size: 12px; color: var(--text-muted); }
    .upload-filename { font-size: 12px; color: var(--green); margin-top: 8px; font-weight: 500; }

    /* Progress */
    .progress-bar-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 24px; display: none; }
    .progress-bar-wrap.active { display: block; }
    .progress-label { font-size: 13px; color: var(--text-muted); margin-bottom: 10px; }
    .progress-bar { background: var(--surface2); border-radius: 4px; height: 6px; overflow: hidden; }
    .progress-fill { background: var(--blue); height: 100%; border-radius: 4px; transition: width 0.3s; }

    /* Clips list */
    .clips-list { display: flex; flex-direction: column; gap: 10px; }
    .clip-item { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .clip-info { flex: 1; }
    .clip-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .clip-meta { font-size: 12px; color: var(--text-muted); }
    .clip-download { background: var(--green); color: #000; font-weight: 700; padding: 8px 14px; font-size: 13px; border-radius: 6px; text-decoration: none; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <nav id="sidebar">
    <div class="sidebar-logo">Content <span>Engine</span></div>
    <div class="nav-section">Módulos</div>
    <div class="nav-item active" onclick="showPage('scripts')">📝 Scripts</div>
    <div class="nav-item" onclick="showPage('clips')">🎬 Video Clipper</div>
  </nav>

  <main id="main">
    <!-- SCRIPTS PAGE -->
    <div id="page-scripts" class="page active">
      <h1>Scripts</h1>
      <p class="subtitle">Pega una URL de YouTube, Instagram o un artículo. La IA genera el script adaptado a tu voz.</p>

      <div class="input-row">
        <input type="text" id="script-url" placeholder="https://youtube.com/watch?v=..." />
        <button id="script-btn" onclick="generateScript()">Generar script</button>
      </div>

      <div id="script-status" class="status"></div>

      <div id="script-output" style="display:none">
        <div class="script-sections" id="script-sections"></div>
        <div class="actions-row">
          <button onclick="copyAll()">Copiar todo</button>
          <button class="secondary" onclick="clearScript()">Limpiar</button>
        </div>
      </div>

      <div class="section-title">Guardados</div>
      <div id="history-list" class="history-list"></div>
    </div>

    <!-- CLIPS PAGE -->
    <div id="page-clips" class="page">
      <h1>Video Clipper</h1>
      <p class="subtitle">Sube los dos vídeos. La IA selecciona los mejores momentos y genera clips 9:16 HD con captions.</p>

      <div class="upload-grid">
        <div class="upload-zone" id="zone-screen" onclick="document.getElementById('file-screen').click()" ondragover="dragOver(event,'zone-screen')" ondragleave="dragLeave('zone-screen')" ondrop="fileDrop(event,'file-screen','zone-screen')">
          <input type="file" id="file-screen" accept="video/*" onchange="fileSelected('file-screen','zone-screen','name-screen')">
          <div class="upload-icon">🖥</div>
          <div class="upload-label">Vídeo Pantalla</div>
          <div class="upload-sublabel">Lo que grabaste de la pantalla</div>
          <div class="upload-filename" id="name-screen"></div>
        </div>
        <div class="upload-zone" id="zone-face" onclick="document.getElementById('file-face').click()" ondragover="dragOver(event,'zone-face')" ondragleave="dragLeave('zone-face')" ondrop="fileDrop(event,'file-face','zone-face')">
          <input type="file" id="file-face" accept="video/*" onchange="fileSelected('file-face','zone-face','name-face')">
          <div class="upload-icon">🎥</div>
          <div class="upload-label">Vídeo Cara</div>
          <div class="upload-sublabel">Tu cámara o webcam</div>
          <div class="upload-filename" id="name-face"></div>
        </div>
      </div>

      <button id="clips-btn" onclick="processClips()">Generar clips</button>

      <div id="clips-status" class="status" style="margin-top:16px"></div>

      <div id="progress-wrap" class="progress-bar-wrap" style="margin-top:16px">
        <div class="progress-label" id="progress-label">Procesando...</div>
        <div class="progress-bar"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>
      </div>

      <div id="clips-list" class="clips-list" style="margin-top:24px"></div>
    </div>
  </main>

  <script>
    // ── NAVIGATION ──
    function showPage(name) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.getElementById('page-' + name).classList.add('active');
      event.target.classList.add('active');
      if (name === 'scripts') loadHistory();
      if (name === 'clips') loadClips();
    }

    // ── SCRIPTS ──
    const SECTIONS = ['INTRO', 'CTA TEMPRANO', 'CONTENIDO', 'CIERRE + CTA'];

    async function generateScript() {
      const url = document.getElementById('script-url').value.trim();
      if (!url) return;
      const btn = document.getElementById('script-btn');
      const status = document.getElementById('script-status');
      btn.disabled = true;
      status.className = 'status loading';
      status.textContent = 'Extrayendo contenido y generando script...';
      document.getElementById('script-output').style.display = 'none';

      try {
        const res = await fetch('/api/scripts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        status.className = 'status';
        renderScript(data.script);
        loadHistory();
      } catch (err) {
        status.className = 'status error';
        status.textContent = 'Error: ' + err.message;
      } finally {
        btn.disabled = false;
      }
    }

    function renderScript(script) {
      const container = document.getElementById('script-sections');
      container.innerHTML = '';
      SECTIONS.forEach(label => {
        const text = script[label] || '';
        container.innerHTML += `
          <div class="script-block">
            <div class="script-block-header">
              <span class="script-block-label">${label}</span>
              <button class="copy-section-btn secondary" onclick="copySection('${label}')">Copiar</button>
            </div>
            <textarea class="script-text" id="section-${label.replace(/\s+/g,'-')}">${text}</textarea>
          </div>`;
      });
      document.getElementById('script-output').style.display = 'block';
    }

    function copySection(label) {
      const id = 'section-' + label.replace(/\s+/g, '-');
      navigator.clipboard.writeText(document.getElementById(id).value);
    }

    function copyAll() {
      const all = SECTIONS.map(l => {
        const id = 'section-' + l.replace(/\s+/g, '-');
        const el = document.getElementById(id);
        return el ? `[${l}]\n${el.value}` : '';
      }).join('\n\n');
      navigator.clipboard.writeText(all);
    }

    function clearScript() {
      document.getElementById('script-output').style.display = 'none';
      document.getElementById('script-url').value = '';
    }

    async function loadHistory() {
      const res = await fetch('/api/scripts');
      const list = await res.json();
      const container = document.getElementById('history-list');
      if (!list.length) { container.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Sin scripts guardados aún.</div>'; return; }
      container.innerHTML = list.map(item => `
        <div class="history-item">
          <span class="history-url">${item.url}</span>
          <span class="history-date">${item.date}</span>
        </div>`).join('');
    }

    // ── VIDEO CLIPPER ──
    function dragOver(e, zoneId) { e.preventDefault(); document.getElementById(zoneId).classList.add('drag-over'); }
    function dragLeave(zoneId) { document.getElementById(zoneId).classList.remove('drag-over'); }
    function fileDrop(e, inputId, zoneId) {
      e.preventDefault();
      dragLeave(zoneId);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const input = document.getElementById(inputId);
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    }
    function fileSelected(inputId, zoneId, nameId) {
      const file = document.getElementById(inputId).files[0];
      if (!file) return;
      document.getElementById(zoneId).classList.add('has-file');
      document.getElementById(nameId).textContent = file.name;
    }

    let pollingInterval = null;

    async function processClips() {
      const screenFile = document.getElementById('file-screen').files[0];
      const faceFile = document.getElementById('file-face').files[0];
      if (!screenFile || !faceFile) {
        const s = document.getElementById('clips-status');
        s.className = 'status error'; s.style.display = 'block';
        s.textContent = 'Sube los dos vídeos primero.';
        return;
      }

      const btn = document.getElementById('clips-btn');
      btn.disabled = true;

      const formData = new FormData();
      formData.append('screen', screenFile);
      formData.append('face', faceFile);

      const status = document.getElementById('clips-status');
      status.className = 'status loading'; status.style.display = 'block';
      status.textContent = 'Subiendo vídeos...';

      try {
        const res = await fetch('/api/clips/process', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        document.getElementById('progress-wrap').classList.add('active');
        startPolling(data.jobId);
      } catch (err) {
        status.className = 'status error';
        status.textContent = 'Error: ' + err.message;
        btn.disabled = false;
      }
    }

    function startPolling(jobId) {
      pollingInterval = setInterval(async () => {
        const res = await fetch('/api/clips/status/' + jobId);
        const job = await res.json();

        document.getElementById('progress-label').textContent = job.message || 'Procesando...';
        document.getElementById('progress-fill').style.width = (job.progress || 0) + '%';

        if (job.status === 'done') {
          clearInterval(pollingInterval);
          document.getElementById('progress-wrap').classList.remove('active');
          document.getElementById('clips-status').className = 'status';
          document.getElementById('clips-btn').disabled = false;
          loadClips();
        } else if (job.status === 'error') {
          clearInterval(pollingInterval);
          document.getElementById('clips-status').className = 'status error';
          document.getElementById('clips-status').textContent = 'Error: ' + job.message;
          document.getElementById('clips-btn').disabled = false;
        }
      }, 2000);
    }

    async function loadClips() {
      const res = await fetch('/api/clips');
      const list = await res.json();
      const container = document.getElementById('clips-list');
      if (!list.length) { container.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Sin clips generados aún.</div>'; return; }
      container.innerHTML = list.map(clip => `
        <div class="clip-item">
          <div class="clip-info">
            <div class="clip-title">${clip.titulo}</div>
            <div class="clip-meta">${clip.duration}s · ${clip.date}</div>
          </div>
          <a href="/output/${clip.filename}" download class="clip-download">Descargar</a>
        </div>`).join('');
    }

    // Init
    loadHistory();
  </script>
</body>
</html>
```

- [ ] **Step 2: Start server and verify Scripts UI works end-to-end**

```bash
cd content-engine && npm start
```

1. Abre `http://localhost:3001`
2. Pega una URL de YouTube y pulsa "Generar script"
3. Verifica que aparecen las 4 secciones con texto
4. Verifica que "Copiar" funciona
5. Verifica que aparece en "Guardados"

- [ ] **Step 3: Commit**

```bash
git add content-engine/index.html
git commit -m "feat: scripts UI with 4-section output, copy and history"
```

---

**CHECKPOINT — Módulo Scripts completo y funcional.**
Probar con varias URLs antes de continuar con Video Clipper.

---

## Task 6: Multer upload + Whisper service

**Files:**
- Create: `content-engine/services/whisper.js`
- Create: `content-engine/test/whisper.test.js`

- [ ] **Step 1: Write failing test for Whisper JSON → transcript text conversion**

```js
// content-engine/test/whisper.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { formatTranscriptForClaude } = require('../services/whisper');

test('formats whisper segments into timestamped text', () => {
  const whisperJson = {
    segments: [
      { start: 0.0, end: 3.5, text: ' Hola, bienvenidos al canal.' },
      { start: 3.5, end: 7.2, text: ' Hoy vamos a ver cómo automatizar tu ecom.' },
    ]
  };
  const result = formatTranscriptForClaude(whisperJson);
  assert.ok(result.includes('[0.0-3.5]'));
  assert.ok(result.includes('Hola, bienvenidos al canal.'));
  assert.ok(result.includes('[3.5-7.2]'));
  assert.ok(result.includes('cómo automatizar'));
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd content-engine && npm test test/whisper.test.js
```

Expected: Error — `Cannot find module '../services/whisper'`

- [ ] **Step 3: Create services/whisper.js**

```js
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function transcribeAudio(audioPath) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-whisper-'));

  const result = spawnSync('whisper', [
    audioPath,
    '--model', 'medium',
    '--language', 'es',
    '--output_format', 'json',
    '--word_timestamps', 'True',
    '--output_dir', tmpDir
  ], { encoding: 'utf8', timeout: 600000 }); // 10 min timeout

  if (result.status !== 0) {
    throw new Error(`Whisper failed: ${result.stderr}`);
  }

  const jsonFiles = fs.readdirSync(tmpDir).filter(f => f.endsWith('.json'));
  if (!jsonFiles.length) throw new Error('Whisper produced no JSON output');

  const json = JSON.parse(fs.readFileSync(path.join(tmpDir, jsonFiles[0]), 'utf8'));
  fs.rmSync(tmpDir, { recursive: true });

  return json;
}

function formatTranscriptForClaude(whisperJson) {
  return whisperJson.segments
    .map(seg => `[${seg.start.toFixed(1)}-${seg.end.toFixed(1)}] ${seg.text.trim()}`)
    .join('\n');
}

module.exports = { transcribeAudio, formatTranscriptForClaude };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd content-engine && npm test test/whisper.test.js
```

Expected: 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add content-engine/services/whisper.js content-engine/test/whisper.test.js
git commit -m "feat: whisper transcription service"
```

---

## Task 7: ASS subtitle generator

**Files:**
- Create: `content-engine/services/ass-generator.js`
- Create: `content-engine/test/ass-generator.test.js`

- [ ] **Step 1: Write failing tests**

```js
// content-engine/test/ass-generator.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildAssFile, toAssTime } = require('../services/ass-generator');

test('toAssTime converts seconds to ASS timestamp', () => {
  assert.equal(toAssTime(0), '0:00:00.00');
  assert.equal(toAssTime(61.5), '0:01:01.50');
  assert.equal(toAssTime(3661.25), '1:01:01.25');
});

test('buildAssFile returns string with Script Info header', () => {
  const whisperJson = {
    segments: [{
      start: 1.0, end: 3.0,
      text: ' Hola mundo.',
      words: [
        { word: 'Hola', start: 1.0, end: 2.0 },
        { word: 'mundo.', start: 2.0, end: 3.0 }
      ]
    }]
  };
  const ass = buildAssFile(whisperJson, 0);
  assert.ok(ass.includes('[Script Info]'));
  assert.ok(ass.includes('[Events]'));
  assert.ok(ass.includes('Dialogue:'));
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd content-engine && npm test test/ass-generator.test.js
```

Expected: Error — `Cannot find module '../services/ass-generator'`

- [ ] **Step 3: Create services/ass-generator.js**

```js
function toAssTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

function buildAssFile(whisperJson, startOffset = 0) {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,58,&H00FFFFFF,&H0000FFFF,&H00000000,&H99000000,-1,0,0,0,100,100,0,0,1,3,1,2,20,20,60,1
Style: Highlight,Arial,58,&H0000FFFF,&H00FFFFFF,&H00000000,&H99000000,-1,0,0,0,100,100,0,0,1,3,1,2,20,20,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const dialogues = [];

  for (const seg of whisperJson.segments) {
    const words = seg.words || [];
    if (!words.length) {
      // No word timestamps — use segment as single block
      const start = toAssTime(seg.start - startOffset);
      const end = toAssTime(seg.end - startOffset);
      const text = seg.text.trim();
      dialogues.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`);
      continue;
    }

    // Group words into lines of max 6 words
    const chunkSize = 6;
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize);
      const lineStart = toAssTime(chunk[0].start - startOffset);
      const lineEnd = toAssTime(chunk[chunk.length - 1].end - startOffset);

      // Build karaoke text: each word highlighted while spoken
      let karaokeText = '';
      for (let j = 0; j < chunk.length; j++) {
        const w = chunk[j];
        const duration = Math.round((w.end - w.start) * 100); // centiseconds
        if (j === 0) {
          karaokeText += `{\\kf${duration}}${w.word}`;
        } else {
          karaokeText += ` {\\kf${duration}}${w.word}`;
        }
      }

      dialogues.push(`Dialogue: 0,${lineStart},${lineEnd},Default,,0,0,0,,${karaokeText}`);
    }
  }

  return header + '\n' + dialogues.join('\n');
}

module.exports = { buildAssFile, toAssTime };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd content-engine && npm test test/ass-generator.test.js
```

Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add content-engine/services/ass-generator.js content-engine/test/ass-generator.test.js
git commit -m "feat: ASS subtitle generator with karaoke word highlighting"
```

---

## Task 8: FFmpeg composer service

**Files:**
- Create: `content-engine/services/composer.js`

- [ ] **Step 1: Create services/composer.js**

```js
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { buildAssFile } = require('./ass-generator');

/**
 * Render a single vertical clip.
 * @param {string} screenPath - path to screen recording video
 * @param {string} facePath   - path to face/cam video
 * @param {{start: number, end: number, titulo: string}} segment
 * @param {object} whisperJson - full whisper JSON (for captions)
 * @param {string} outputPath  - where to write the mp4
 * @returns {Promise<void>}
 */
function renderClip(screenPath, facePath, segment, whisperJson, outputPath) {
  return new Promise((resolve, reject) => {
    const { start, end } = segment;
    const duration = end - start;

    // Build ASS subtitle file for this segment only
    // Offset timestamps so they start at 0 for this clip
    const segmentWhisper = {
      segments: whisperJson.segments.filter(s => s.end > start && s.start < end)
    };
    const assContent = buildAssFile(segmentWhisper, start);
    const assPath = outputPath.replace('.mp4', '.ass');
    fs.writeFileSync(assPath, assContent);

    ffmpeg()
      // Input 0: screen video, trimmed
      .input(screenPath)
      .inputOptions([`-ss ${start}`, `-t ${duration}`])
      // Input 1: face video, trimmed
      .input(facePath)
      .inputOptions([`-ss ${start}`, `-t ${duration}`])
      .complexFilter([
        // Scale screen to 1080 wide, crop to top 60% of 1920 = 1152px
        '[0:v]scale=1080:-2,crop=1080:1152:0:0[screen]',
        // Scale face to 1080 wide, crop to bottom 40% = 768px
        '[1:v]scale=1080:-2,crop=1080:768:0:ih-768[face]',
        // Stack vertically
        '[screen][face]vstack=inputs=2[stacked]',
        // Burn subtitles
        `[stacked]subtitles='${assPath.replace(/'/g, "\\'")}':force_style='FontSize=58'[out]`
      ], 'out')
      // Audio from face video
      .outputOptions([
        '-map 1:a',
        '-c:v libx264',
        '-crf 18',
        '-preset fast',  // 'slow' is better quality but very slow for long vids
        '-c:a aac',
        '-b:a 192k',
        '-movflags +faststart',
        `-t ${duration}`
      ])
      .output(outputPath)
      .on('end', () => {
        fs.unlinkSync(assPath); // cleanup
        resolve();
      })
      .on('error', (err) => {
        reject(new Error(`ffmpeg error: ${err.message}`));
      })
      .run();
  });
}

/**
 * Extract audio track from a video file.
 * @param {string} videoPath
 * @param {string} audioPath - output .wav path
 * @returns {Promise<void>}
 */
function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions(['-vn', '-acodec pcm_s16le', '-ar 16000', '-ac 1'])
      .output(audioPath)
      .on('end', resolve)
      .on('error', (err) => reject(new Error(`Audio extraction failed: ${err.message}`)))
      .run();
  });
}

module.exports = { renderClip, extractAudio };
```

- [ ] **Step 2: Smoke test composer loads without error**

```bash
cd content-engine
node -e "const c = require('./services/composer'); console.log('OK', typeof c.renderClip);"
```

Expected: `OK function`

- [ ] **Step 3: Commit**

```bash
git add content-engine/services/composer.js
git commit -m "feat: ffmpeg composer - vertical 9:16 clip rendering with captions"
```

---

## Task 9: Job queue + clips API route

**Files:**
- Create: `content-engine/services/jobs.js`
- Modify: `content-engine/routes/clips.js`

- [ ] **Step 1: Create services/jobs.js**

```js
const { randomUUID } = require('crypto');

const jobs = new Map();

function createJob() {
  const id = randomUUID();
  jobs.set(id, { id, status: 'pending', progress: 0, message: 'Iniciando...', clips: [] });
  return id;
}

function updateJob(id, patch) {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, patch);
}

function getJob(id) {
  return jobs.get(id) || null;
}

module.exports = { createJob, updateJob, getJob };
```

- [ ] **Step 2: Replace placeholder clips route with full implementation**

```js
// content-engine/routes/clips.js
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createJob, updateJob, getJob } = require('../services/jobs');
const { extractAudio } = require('../services/composer');
const { transcribeAudio, formatTranscriptForClaude } = require('../services/whisper');
const { selectClips } = require('../services/claude');
const { renderClip } = require('../services/composer');

const OUTPUT_DIR = path.join(__dirname, '../output');
const UPLOAD_DIR = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024 * 1024 } }); // 4GB max

router.post('/process', upload.fields([
  { name: 'screen', maxCount: 1 },
  { name: 'face', maxCount: 1 }
]), async (req, res) => {
  if (!req.files?.screen || !req.files?.face) {
    return res.status(400).json({ error: 'Se requieren los dos vídeos: screen y face' });
  }

  const jobId = createJob();
  res.json({ jobId });

  const screenPath = req.files.screen[0].path;
  const facePath = req.files.face[0].path;

  // Run pipeline async
  runPipeline(jobId, screenPath, facePath);
});

async function runPipeline(jobId, screenPath, facePath) {
  try {
    updateJob(jobId, { status: 'running', progress: 5, message: 'Extrayendo audio...' });
    const audioPath = facePath.replace(path.extname(facePath), '.wav');
    await extractAudio(facePath, audioPath);

    updateJob(jobId, { progress: 20, message: 'Transcribiendo con Whisper (puede tardar varios minutos)...' });
    const whisperJson = await transcribeAudio(audioPath);
    fs.unlinkSync(audioPath);

    updateJob(jobId, { progress: 50, message: 'Seleccionando mejores momentos con IA...' });
    const transcriptText = formatTranscriptForClaude(whisperJson);
    const segments = await selectClips(transcriptText);

    updateJob(jobId, { progress: 55, message: `Renderizando ${segments.length} clips...` });

    const date = new Date().toISOString().slice(0, 10);
    const clips = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const filename = `${date}-clip-${i + 1}.mp4`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      await renderClip(screenPath, facePath, seg, whisperJson, outputPath);

      const duration = Math.round(seg.end - seg.start);
      clips.push({ filename, titulo: seg.titulo, duration, date });

      const progress = 55 + Math.round(((i + 1) / segments.length) * 40);
      updateJob(jobId, { progress, message: `Clip ${i + 1}/${segments.length} listo` });
    }

    // Cleanup uploads
    fs.unlinkSync(screenPath);
    fs.unlinkSync(facePath);

    // Save clip index
    const indexPath = path.join(OUTPUT_DIR, 'index.json');
    let index = [];
    if (fs.existsSync(indexPath)) index = JSON.parse(fs.readFileSync(indexPath));
    index = [...clips, ...index];
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

    updateJob(jobId, { status: 'done', progress: 100, message: `${clips.length} clips generados`, clips });
  } catch (err) {
    console.error('Pipeline error:', err);
    updateJob(jobId, { status: 'error', message: err.message });
  }
}

router.get('/status/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job no encontrado' });
  res.json(job);
});

router.get('/', (req, res) => {
  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  if (!fs.existsSync(indexPath)) return res.json([]);
  res.json(JSON.parse(fs.readFileSync(indexPath)));
});

module.exports = router;
```

- [ ] **Step 3: Test server starts and clips ping works**

```bash
cd content-engine && npm start &
curl -s http://localhost:3001/api/clips | jq .
```

Expected: `[]`

```bash
kill %1
```

- [ ] **Step 4: Commit**

```bash
git add content-engine/services/jobs.js content-engine/routes/clips.js
git commit -m "feat: job queue and clips pipeline route"
```

---

## Task 10: End-to-end test + final polish

- [ ] **Step 1: Run all unit tests**

```bash
cd content-engine && npm test
```

Expected: All tests passing (url-detection: 5, whisper: 1, ass-generator: 3).

- [ ] **Step 2: Integration test — full scripts flow**

```bash
cd content-engine && npm start
```

1. Abre `http://localhost:3001`
2. Pega `https://www.youtube.com/watch?v=` + cualquier vídeo de YT con captions en español
3. Pulsa "Generar script"
4. Verifica: las 4 secciones aparecen con texto real, el gancho menciona un dolor de ecom
5. Verifica: el script aparece en "Guardados"

- [ ] **Step 3: Integration test — full video clipper flow**

Necesitas dos vídeos de prueba (pueden ser cortos, 2-3 min):
1. Abre `http://localhost:3001` → tab "Video Clipper"
2. Sube un vídeo de pantalla y un vídeo de cara
3. Pulsa "Generar clips"
4. Verifica: la barra de progreso avanza con mensajes reales
5. Verifica: tras completar, aparecen los clips en la lista
6. Descarga uno y verifica en VLC: formato 9:16, pantalla arriba, cara abajo, captions visibles

- [ ] **Step 4: Final commit**

```bash
git add content-engine/
git commit -m "feat: content engine complete - scripts and video clipper modules"
```

---

## Self-Review — Spec Coverage

| Spec requirement | Task que lo implementa |
|-----------------|----------------------|
| App separada en `content-engine/` | Task 1 |
| Módulo Scripts: URL → transcripción yt-dlp | Task 3 |
| Módulo Scripts: artículo → fetch+cheerio | Task 3 |
| Claude genera script con prompt fijo | Task 2, 4 |
| Prompt con 26 dolores de ecom | Task 2 (script-agencia.txt) |
| Estructura INTRO/CTA/CONTENIDO/CIERRE | Task 2, 4 |
| UI Scripts: input URL, 4 secciones, copiar, guardar | Task 5 |
| Lista de scripts guardados | Task 4, 5 |
| Módulo Video Clipper: subir 2 vídeos | Task 9 (multer) |
| Whisper transcribe audio | Task 6 |
| Claude selecciona 5-10 segmentos | Task 2, 9 |
| ffmpeg: pantalla arriba 60%, cara abajo 40% | Task 8 |
| Formato 1080x1920 9:16 HD | Task 8 |
| Captions karaoke-style (word highlighting) | Task 7, 8 |
| Sin marca de agua (todo local) | Task 8 |
| Job queue + polling de progreso | Task 9 |
| Clips descargables desde UI | Task 5, 9 |
| Calidad alta (-crf 18) | Task 8 |
| Uploads limpiados tras procesar | Task 9 |
