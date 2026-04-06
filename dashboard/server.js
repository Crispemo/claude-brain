require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');

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
    const body = req.body;
    if (!body || typeof body !== 'object' || !body.week || !body.projects) {
      return res.status(400).json({ error: 'Invalid state shape' });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(body, null, 2));
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
    const task = state.projects[project].tasks.find(t => String(t.id) === String(taskId));
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

    // 2. Añadir al banco-de-ideas.md del proyecto
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

app.post('/api/chat', async (req, res) => {
  try {
    const { message, stateContext } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'message is required' });
    }
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
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errData?.error?.message || 'Anthropic API error' });
    }
    const data = await response.json();
    res.json({ reply: data.content?.[0]?.text || 'Sin respuesta' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/youtube/analytics — vistas de los últimos 7 días (requiere OAuth)
app.get('/api/youtube/analytics', async (req, res) => {
  try {
    // 1. Obtener access token con el refresh token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
        grant_type: 'refresh_token'
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(401).json({ error: 'No se pudo obtener access token', detail: tokenData.error });
    }
    const accessToken = tokenData.access_token;

    // 2. Calcular rango de fechas: últimos 7 días
    const end = new Date(); end.setDate(end.getDate() - 1); // ayer (Analytics no da hoy)
    const start = new Date(); start.setDate(start.getDate() - 7);
    const fmt = d => d.toISOString().split('T')[0];

    // 3. Llamar YouTube Analytics API
    const analyticsUrl = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${fmt(start)}&endDate=${fmt(end)}&metrics=views,estimatedMinutesWatched,subscribersGained,subscribersLost&dimensions=day&sort=day`;
    const analyticsRes = await fetch(analyticsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!analyticsRes.ok) {
      const err = await analyticsRes.json();
      return res.status(analyticsRes.status).json({ error: 'Analytics API error', detail: err?.error?.message });
    }
    const analytics = await analyticsRes.json();

    // 4. Sumar métricas de los 7 días
    const rows = analytics.rows || [];
    const totalViews = rows.reduce((s, r) => s + (r[1] || 0), 0);
    const totalMinutes = rows.reduce((s, r) => s + (r[2] || 0), 0);
    const subsGained = rows.reduce((s, r) => s + (r[3] || 0), 0);
    const subsLost = rows.reduce((s, r) => s + (r[4] || 0), 0);

    res.json({
      weeklyViews: Math.round(totalViews),
      weeklyMinutes: Math.round(totalMinutes),
      subsGained,
      subsLost,
      netSubs: subsGained - subsLost,
      days: rows.map(r => ({ date: r[0], views: r[1] }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/youtube', async (req, res) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${process.env.YOUTUBE_CHANNEL_ID}&key=${process.env.YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: 'YouTube API error' });
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

app.get('/api/stripe', async (req, res) => {
  try {
    const subsRes = await fetch('https://api.stripe.com/v1/subscriptions?status=active&limit=100', {
      headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    });
    if (!subsRes.ok) return res.status(subsRes.status).json({ error: 'Stripe API error' });
    const subs = await subsRes.json();
    let mrr = 0;
    const activeSubs = subs.data || [];
    for (const sub of activeSubs) {
      const amount = sub.plan?.amount || sub.items?.data?.[0]?.plan?.amount || 0;
      const interval = sub.plan?.interval || sub.items?.data?.[0]?.plan?.interval || 'month';
      mrr += interval === 'year' ? (amount / 12) : amount;
    }
    mrr = Math.round(mrr / 100);
    const startOfMonth = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000);
    const newThisMonth = activeSubs.filter(s => s.created >= startOfMonth).length;
    res.json({ mrr, activeUsers: activeSubs.length, newThisMonth });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/instagram', async (req, res) => {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    const profileRes = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}?fields=followers_count,media_count,media.limit(10){like_count,comments_count}&access_token=${token}`
    );
    if (!profileRes.ok) return res.status(profileRes.status).json({ error: 'Instagram API error' });
    const profile = await profileRes.json();
    let er = null;
    const posts = profile.media?.data || [];
    if (posts.length > 0 && profile.followers_count > 0) {
      const totalEngagement = posts.reduce((acc, p) => acc + (p.like_count || 0) + (p.comments_count || 0), 0);
      er = ((totalEngagement / posts.length) / profile.followers_count * 100).toFixed(2);
    }
    let daysLeft = null;
    const appToken = process.env.META_APP_TOKEN;
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
    res.json({ followers: profile.followers_count, mediaCount: profile.media_count, engagementRate: er, tokenDaysLeft: daysLeft });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/script/:id — avanza el estado del script en el pipeline
app.patch('/api/script/:id', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.scripts = state.scripts || [];
    const script = state.scripts.find(s => s.id === req.params.id);
    if (!script) return res.status(404).json({ error: 'Script no encontrado' });
    const PIPELINE = ['pendiente', 'grabado', 'editado', 'publicado'];
    const { status, scheduledDate, notes, title } = req.body;
    if (status && PIPELINE.includes(status)) script.status = status;
    if (scheduledDate !== undefined) script.scheduledDate = scheduledDate;
    if (notes !== undefined) script.notes = notes;
    if (title !== undefined) script.title = title;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, script });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/script — crea nuevo script
app.post('/api/script', (req, res) => {
  try {
    const { project, type, title } = req.body;
    if (!project || !title) return res.status(400).json({ error: 'project y title requeridos' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.scripts = state.scripts || [];
    const id = `${project.slice(0,2)}-${Date.now()}`;
    const script = { id, project, type: type || 'largo', title, status: 'pendiente', scheduledDate: null, notes: '' };
    state.scripts.push(script);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, script });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/script/:id
app.delete('/api/script/:id', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.scripts = (state.scripts || []).filter(s => s.id !== req.params.id);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/script-content/:folder — lee el guion.md real de un script de agencia
app.get('/api/script-content/:folder', (req, res) => {
  try {
    const folder = req.params.folder.replace(/[^a-z0-9\-]/gi, ''); // sanitize
    const guionPath = path.join(__dirname, '..', 'agencia', 'scripts', folder, 'guion.md');
    if (!fs.existsSync(guionPath)) return res.status(404).json({ error: 'Guión no encontrado' });
    const content = fs.readFileSync(guionPath, 'utf8');
    res.json({ content });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/goal/:id — edita una meta existente
app.patch('/api/goal/:id', (req, res) => {
  try {
    const { name, date, emoji } = req.body;
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const goal = (state.goals || []).find(g => String(g.id) === String(req.params.id));
    if (!goal) return res.status(404).json({ error: 'Meta no encontrada' });
    if (name) goal.name = name;
    if (date) goal.date = date;
    if (emoji) goal.emoji = emoji;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, goal });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/generate-script — genera guión con Claude API usando contexto real del canal
app.post('/api/generate-script', async (req, res) => {
  try {
    const { title, project, type, folder } = req.body;
    if (!title) return res.status(400).json({ error: 'title requerido' });

    // Si tiene folder, leer el guión real como base
    let existingGuion = '';
    if (folder && project === 'agencia') {
      const guionPath = path.join(__dirname, '..', 'agencia', 'scripts', folder, 'guion.md');
      if (fs.existsSync(guionPath)) {
        existingGuion = fs.readFileSync(guionPath, 'utf8');
      }
    }

    // Contexto rico del canal (extraído de 00-contexto.md y 04-banco-de-ideas.md)
    const agenciaContext = `
CANAL: @CristinaPerisAI — YouTube sobre IA aplicada a ecommerce en español
OBJETIVO DEL CANAL: Captar clientes para agencia de automatización (no views virales)
CLIENTE IDEAL (ICP): Dueño/a de tienda Shopify/WooCommerce, facturando algo, frustrado con procesos manuales
NICHO: IA + n8n aplicado a ecommerce. Casos reales. Siempre el ángulo: "cómo esto mejora tu tienda"
REGLA DE ORO DE TÍTULOS: incluir "Shopify" ó número ó problema exacto en palabras del dueño
REFERENTE: Nacho Leo (YouTube). Diferenciarse siendo más específico en IA + ecom

FORMATO QUE FUNCIONA EN TUS VÍDEOS:
- Hook: primeros 30 segundos sin intro de canal, directo al problema
- Estructura: problema reconocible → causa → solución con workflow/demo → CTA a WhatsApp
- Los vídeos de WhatsApp + Shopify tienen más views → priorizar ese ángulo
- CTA final: "sesión de revisión gratuita" → wa.me/34643135603

HISTORIAL DE VÍDEOS QUE FUNCIONARON BIEN:
- WhatsApp + Shopify automation (máximos views)
- Dashboard Shopify con métricas automáticas
- Fichas de producto con IA en 1 hora`;

    const simuliaContext = `
PLATAFORMA: Simulia (simulia.es) — preparación para oposiciones de enfermería EIR
AUDIENCIA: Enfermeros y estudiantes que quieren aprobar oposiciones EIR/OPE
OBJETIVO DE CONTENIDO: Captación orgánica para la plataforma
CTA: Probar Simulia gratis en simulia.es`;

    const projectContext = project === 'simulia' ? simuliaContext : agenciaContext;

    let prompt;
    if (existingGuion) {
      prompt = `Tengo este guión base para un vídeo de YouTube:

---
${existingGuion.slice(0, 3000)}
---

CONTEXTO DEL CANAL:
${projectContext}

Mejora y expande este guión con:
1. Hook de apertura MÁS impactante (primeros 30 segundos)
2. Ejemplos más concretos y datos reales
3. CTA más directo a conseguir clientes
4. Frases exactas a decir en cámara para los puntos clave

Formato de salida: guión listo para grabar, con indicaciones de escena, frases exactas y estructura clara. En español. Máximo 800 palabras.`;
    } else {
      const typeCtx = type === 'short'
        ? 'SHORT de YouTube (máx 60 segundos, gancho primeros 3 segundos, NO intro de canal, directo al error/solución, texto en pantalla que refuerza)'
        : 'VÍDEO LARGO de YouTube (10-15 min, hook urgente → problema → solución con demo → CTA WhatsApp)';
      prompt = `Genera un guión detallado para ${typeCtx} sobre: "${title}"

CONTEXTO DEL CANAL:
${projectContext}

El guión debe incluir:
- Hook exacto (primeros 30 segundos, palabra por palabra)
- Estructura del vídeo por bloques con duración estimada
- Frases clave a decir en cámara
- Elementos visuales necesarios (pantallas, gráficos)
- CTA final exacto

Directo, accionable, en español. Sin relleno. Máximo 800 palabras.`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) return res.status(response.status).json({ error: 'Claude API error' });
    const data = await response.json();
    res.json({ script: data.content?.[0]?.text || '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /oauth/callback — captura el código de Google y lo intercambia por refresh_token
app.get('/oauth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No se recibió código de autorización');
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        redirect_uri: 'http://localhost:3001/oauth/callback',
        grant_type: 'authorization_code'
      })
    });
    const tokens = await tokenRes.json();
    if (tokens.refresh_token) {
      res.send(`
        <html><body style="font-family:monospace;background:#0f0f0f;color:#f0f0f0;padding:40px">
        <h2 style="color:#22c55e">✅ ¡Refresh token obtenido!</h2>
        <p>Copia esta línea y pégala en <code>dashboard/.env</code>:</p>
        <pre style="background:#1a1a1a;padding:20px;border-radius:8px;word-break:break-all">YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
        <p style="color:#888">También necesitas añadir en .env:<br>
        YOUTUBE_CLIENT_ID=${process.env.YOUTUBE_CLIENT_ID || 'ya_configurado'}<br>
        YOUTUBE_CLIENT_SECRET=(el que tienes en Google Cloud)
        </p>
        <p>Después reinicia el servidor: <code>npm start</code></p>
        </body></html>
      `);
    } else {
      res.send(`<pre style="background:#0f0f0f;color:#ef4444;padding:40px">${JSON.stringify(tokens, null, 2)}</pre>`);
    }
  } catch (e) {
    res.status(500).send(`Error: ${e.message}`);
  }
});

// POST /api/goal — añade una meta con cuenta atrás
app.post('/api/goal', (req, res) => {
  try {
    const { name, date, emoji } = req.body;
    if (!name || !date) return res.status(400).json({ error: 'name y date requeridos' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.goals = state.goals || [];
    const goal = { id: Date.now(), name, date, emoji: emoji || '🎯' };
    state.goals.push(goal);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, goal });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/goal/:id — elimina una meta
app.delete('/api/goal/:id', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.goals = (state.goals || []).filter(g => String(g.id) !== String(req.params.id));
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/habit-log — marca/desmarca hábito para hoy
app.post('/api/habit-log', (req, res) => {
  try {
    const { habitId, done } = req.body;
    if (!habitId) return res.status(400).json({ error: 'habitId requerido' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const today = new Date().toISOString().split('T')[0];
    state.habitLog = state.habitLog || {};
    state.habitLog[today] = state.habitLog[today] || [];
    if (done) {
      if (!state.habitLog[today].includes(habitId)) state.habitLog[today].push(habitId);
    } else {
      state.habitLog[today] = state.habitLog[today].filter(h => h !== habitId);
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/life-goal — añade una meta de vida
app.post('/api/life-goal', (req, res) => {
  try {
    const { name, emoji, category } = req.body;
    if (!name) return res.status(400).json({ error: 'name requerido' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.lifeGoals = state.lifeGoals || [];
    const goal = { id: `lg-${Date.now()}`, name, emoji: emoji || '🎯', category: category || 'general', habits: [] };
    state.lifeGoals.push(goal);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, goal });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/life-goal/:id — elimina una meta de vida
app.delete('/api/life-goal/:id', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.lifeGoals = (state.lifeGoals || []).filter(g => g.id !== req.params.id);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/life-goal/:id/habit — añade hábito a una meta
app.post('/api/life-goal/:id/habit', (req, res) => {
  try {
    const { name, icon, daysPerWeek } = req.body;
    if (!name) return res.status(400).json({ error: 'name requerido' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const goal = (state.lifeGoals || []).find(g => g.id === req.params.id);
    if (!goal) return res.status(404).json({ error: 'Meta no encontrada' });
    const habit = { id: `h-${Date.now()}`, name, icon: icon || '✅', daysPerWeek: parseInt(daysPerWeek) || 7 };
    goal.habits = goal.habits || [];
    goal.habits.push(habit);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, habit });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/habit/:id — elimina un hábito de cualquier meta
app.delete('/api/habit/:id', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    (state.lifeGoals || []).forEach(g => {
      g.habits = (g.habits || []).filter(h => h.id !== req.params.id);
    });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/evaluate-habits — IA evalúa los hábitos y da feedback
app.post('/api/evaluate-habits', async (req, res) => {
  try {
    const { habitStats, lifeGoals, weekFocus } = req.body;
    const goalsText = (lifeGoals || []).map(g =>
      `${g.emoji} ${g.name}: ${(g.habits || []).map(h => h.name).join(', ')}`
    ).join('\n');
    const statsText = (habitStats || []).map(h =>
      `• ${h.name} (meta: ${h.goal}): hoy=${h.doneToday?'✅':'❌'}, racha=${h.streak}d, semana=${h.weeklyCount}/${h.daysPerWeek}`
    ).join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: `Eres el coach de Cris (26 años, emprendedor digital en transición de enfermero a tecnólogo). Analiza sus hábitos hoy.

METAS DE VIDA:
${goalsText}

ESTADO DE HÁBITOS (${new Date().toLocaleDateString('es-ES')}):
${statsText}

FOCO SEMANA: ${weekFocus || '—'}

Dame:
1. Evaluación honesta en 2 frases (sé directo si va mal)
2. La acción MÁS IMPORTANTE que debe hacer ahora
3. Por qué importa a largo plazo (1 frase)

Máximo 120 palabras. Directo. Sin relleno. En español.` }]
      })
    });
    if (!response.ok) return res.status(response.status).json({ error: 'Claude API error' });
    const data = await response.json();
    res.json({ evaluation: data.content?.[0]?.text || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/gratitude — devuelve el log de agradecimiento
app.get('/api/gratitude', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    res.json(state.gratitudeLog || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/gratitude — guarda entradas de agradecimiento para hoy
app.post('/api/gratitude', (req, res) => {
  try {
    const { entries } = req.body; // array de strings
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries debe ser un array' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const today = new Date().toISOString().split('T')[0];
    state.gratitudeLog = state.gratitudeLog || {};
    state.gratitudeLog[today] = entries.filter(e => typeof e === 'string' && e.trim());
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, date: today, entries: state.gratitudeLog[today] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/youtube/videos — top vídeos del canal para research
app.get('/api/youtube/videos', async (req, res) => {
  try {
    // Obtener lista de vídeos del canal (últimos 20)
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${process.env.YOUTUBE_CHANNEL_ID}&type=video&order=viewCount&maxResults=20&key=${process.env.YOUTUBE_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return res.status(searchRes.status).json({ error: 'YouTube API error' });
    const searchData = await searchRes.json();
    const videoIds = (searchData.items || []).map(i => i.id.videoId).join(',');
    if (!videoIds) return res.json({ videos: [] });

    // Obtener estadísticas de esos vídeos
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();
    const videos = (statsData.items || []).map(v => ({
      id: v.id,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      thumbnail: v.snippet.thumbnails?.medium?.url,
      views: parseInt(v.statistics.viewCount || 0),
      likes: parseInt(v.statistics.likeCount || 0),
      comments: parseInt(v.statistics.commentCount || 0),
      engagement: v.statistics.viewCount > 0
        ? ((parseInt(v.statistics.likeCount || 0) + parseInt(v.statistics.commentCount || 0)) / parseInt(v.statistics.viewCount) * 100).toFixed(2)
        : '0'
    })).sort((a, b) => b.views - a.views);
    res.json({ videos });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/content-research — Claude analiza los vídeos top y genera ideas de parte 2 + nuevos ángulos
app.post('/api/content-research', async (req, res) => {
  try {
    const { videos, project } = req.body;
    if (!videos || videos.length === 0) return res.status(400).json({ error: 'No hay vídeos para analizar' });

    const videoList = videos.slice(0, 10).map((v, i) =>
      `${i+1}. "${v.title}" → ${v.views.toLocaleString()} views, ${v.likes} likes, ${v.comments} comentarios, ER: ${v.engagement}%`
    ).join('\n');

    const projectCtx = project === 'simulia'
      ? 'Canal Simulia — oposiciones enfermería EIR/OPE. Audiencia: enfermeros preparando oposiciones.'
      : 'Canal @CristinaPerisAI — IA aplicada a ecommerce/Shopify. Audiencia: dueños de tiendas online. Objetivo: captar clientes para agencia.';

    const prompt = `Eres un content strategist experto en YouTube. Analiza el rendimiento de estos vídeos y genera una estrategia de contenido.

CONTEXTO DEL CANAL:
${projectCtx}

VÍDEOS ORDENADOS POR VISTAS (top 10):
${videoList}

Genera exactamente esto:

## 🏆 LO QUE FUNCIONA (patrones de los top vídeos)
(2-3 patrones concretos: tipo de hook, tema, formato, longitud del título...)

## 📹 PARTE 2 / EXPANSIONES URGENTES
Para los 3 vídeos con más vistas, sugiere una "Parte 2" o ángulo de expansión concreto con título exacto.

## 💡 3 IDEAS DE VÍDEO NUEVAS BASADAS EN LOS DATOS
(Títulos exactos + por qué van a funcionar basándose en el historial)

## ⚠️ LO QUE NO DEBERÍAS REPETIR
(Tipo de contenido con bajo rendimiento y por qué)

Máximo 350 palabras. Directo. En español.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 700, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) return res.status(response.status).json({ error: 'Claude API error' });
    const data = await response.json();
    res.json({ research: data.content?.[0]?.text || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/brownie/training — guarda sesión de entrenamiento de Brownie
app.post('/api/brownie/training', (req, res) => {
  try {
    const { skill, duration, result, notes } = req.body;
    if (!skill) return res.status(400).json({ error: 'skill requerido' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (!state.brownie) state.brownie = { profile: { name: 'Brownie', issues: [], goals: [] }, trainingLog: [], notes: [] };
    const entry = { id: `bt-${Date.now()}`, date: new Date().toISOString().split('T')[0], skill, duration: duration || 10, result: result || 'bien', notes: notes || '' };
    state.brownie.trainingLog = state.brownie.trainingLog || [];
    state.brownie.trainingLog.unshift(entry);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, entry });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/brownie/note — añade nota de aprendizaje de Brownie
app.post('/api/brownie/note', (req, res) => {
  try {
    const { text, tags } = req.body;
    if (!text) return res.status(400).json({ error: 'text requerido' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (!state.brownie) state.brownie = { profile: { name: 'Brownie', issues: [], goals: [] }, trainingLog: [], notes: [] };
    const note = { id: `bn-${Date.now()}`, date: new Date().toISOString().split('T')[0], text, tags: tags || [] };
    state.brownie.notes = state.brownie.notes || [];
    state.brownie.notes.unshift(note);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, note });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/brownie/note/:id
app.delete('/api/brownie/note/:id', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (state.brownie) state.brownie.notes = (state.brownie.notes || []).filter(n => n.id !== req.params.id);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/brownie/coaching — Claude da consejo de entrenamiento basado en historial
app.post('/api/brownie/coaching', async (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const brownie = state.brownie || {};
    const recentSessions = (brownie.trainingLog || []).slice(0, 5)
      .map(s => `• ${s.date} — "${s.skill}" (${s.result}) ${s.notes ? '— ' + s.notes : ''}`).join('\n') || '— sin sesiones registradas';
    const recentNotes = (brownie.notes || []).slice(0, 5)
      .map(n => `• ${n.date}: ${n.text}`).join('\n') || '— sin notas';

    const prompt = `Eres un experto en educación canina, especialmente en perros con problemas de frustración social y falta de autocontrol.

PERFIL DEL PERRO:
- Nombre: Brownie
- Problemas principales: ${(brownie.profile?.issues || []).join(', ')}
- Objetivos del entrenamiento: ${(brownie.profile?.goals || []).join(', ')}

ÚLTIMAS SESIONES DE ENTRENAMIENTO:
${recentSessions}

NOTAS Y APRENDIZAJES:
${recentNotes}

Dame exactamente:
1. **Análisis rápido** — qué está funcionando / qué no (basado en el historial)
2. **Ejercicio concreto para HOY** — pasos exactos, duración, qué buscar
3. **Un consejo clave** para el problema de frustración social o autocontrol

Máximo 200 palabras. Práctico, directo, basado en evidencia. En español.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 500, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) return res.status(response.status).json({ error: 'Claude API error' });
    const data = await response.json();
    res.json({ coaching: data.content?.[0]?.text || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/tiktok-log — guarda métricas manuales de TikTok por semana
app.post('/api/tiktok-log', (req, res) => {
  try {
    const { account, week, views, followers, likes, comments, topVideo, notes } = req.body;
    if (!account || !week) return res.status(400).json({ error: 'account y week requeridos' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.tiktokLog = state.tiktokLog || {};
    state.tiktokLog[account] = state.tiktokLog[account] || [];
    const existing = state.tiktokLog[account].findIndex(e => e.week === week);
    const entry = { week, views: views || 0, followers: followers || 0, likes: likes || 0, comments: comments || 0, topVideo: topVideo || '', notes: notes || '', updatedAt: new Date().toISOString() };
    if (existing >= 0) state.tiktokLog[account][existing] = entry;
    else state.tiktokLog[account].push(entry);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, entry });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/tiktok-analysis — Claude analiza métricas TikTok y genera plan semanal
app.post('/api/tiktok-analysis', async (req, res) => {
  try {
    const { account, project } = req.body;
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const logs = (state.tiktokLog || {})[account] || [];
    if (logs.length === 0) return res.status(400).json({ error: 'No hay datos de TikTok para analizar' });

    const last = logs[logs.length - 1];
    const prev = logs[logs.length - 2] || null;
    const viewsDelta = prev ? last.views - prev.views : null;
    const followersDelta = prev ? last.followers - prev.followers : null;

    const projectCtx = project === 'simulia'
      ? `Canal TikTok de SIMULIA (@simulia o cuenta EIR/oposiciones). Audiencia: enfermeros/as preparando oposiciones EIR/OPE en España. Objetivo: captar suscriptores para simulia.es. Contenido que funciona: preguntas tipo test, errores comunes en oposiciones, tips de estudio, comparativas de temario.`
      : `Canal TikTok de AGENCIA (@CristinaPerisAI). Audiencia: dueños de tiendas online Shopify. Objetivo: captar clientes para agencia de automatización. Contenido que funciona: WhatsApp+Shopify, n8n automations, problemas concretos de ecommerce.`;

    const prompt = `Eres el social media manager de Cris. Analiza las métricas de TikTok y genera el plan de la próxima semana.

CONTEXTO DEL CANAL:
${projectCtx}

MÉTRICAS SEMANA ACTUAL (${last.week}):
- Views: ${last.views.toLocaleString()}${viewsDelta !== null ? ` (${viewsDelta >= 0 ? '+' : ''}${viewsDelta} vs semana anterior)` : ''}
- Seguidores: ${last.followers.toLocaleString()}${followersDelta !== null ? ` (${followersDelta >= 0 ? '+' : ''}${followersDelta})` : ''}
- Likes: ${last.likes} | Comentarios: ${last.comments}
- Vídeo top: "${last.topVideo || 'no especificado'}"
- Notas: ${last.notes || '—'}

${prev ? `MÉTRICAS SEMANA ANTERIOR (${prev.week}):
- Views: ${prev.views.toLocaleString()} | Seguidores: ${prev.followers.toLocaleString()}` : ''}

Dame exactamente:
1. **Qué funcionó esta semana** (1-2 frases, basado en los datos)
2. **Qué NO funcionó** (1 frase directa)
3. **3 vídeos concretos para la próxima semana** — para cada uno: título exacto + hook de apertura (primeros 5 segundos)
4. **Una decisión de formato** (¿doblar en frecuencia? ¿cambiar horario? ¿distinto gancho?)

Máximo 250 palabras. Directo, accionable. En español.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) return res.status(response.status).json({ error: 'Claude API error' });
    const data = await response.json();
    res.json({ analysis: data.content?.[0]?.text || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/weekly-briefing — Claude genera el plan completo de la semana en autopiloto
app.post('/api/weekly-briefing', async (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

    // Recopilar todo el contexto disponible
    const simulia = state.projects?.simulia;
    const agencia = state.projects?.agencia;

    const pendingScripts = (state.scripts || [])
      .filter(s => s.status === 'pendiente')
      .map(s => `- [${s.project}] "${s.title}"`)
      .join('\n') || '— ninguno pendiente';

    const inProgressScripts = (state.scripts || [])
      .filter(s => ['grabado', 'editado'].includes(s.status))
      .map(s => `- [${s.status}] "${s.title}"`)
      .join('\n') || '— ninguno';

    const today = new Date().toISOString().split('T')[0];
    const habitsToday = (state.habitLog || {})[today] || [];
    const allHabits = (state.lifeGoals || []).flatMap(g => g.habits || []);
    const habitsSummary = allHabits.map(h => `${h.icon} ${h.name}: ${habitsToday.includes(h.id) ? '✅ hecho' : '⬜ pendiente'}`).join(' | ');

    const upcomingGoals = (state.goals || [])
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3)
      .map(g => { const days = Math.ceil((new Date(g.date) - new Date()) / 86400000); return `${g.emoji} ${g.name}: en ${days} días`; })
      .join(' | ');

    // TikTok último dato disponible
    const tiktokAccounts = state.tiktokLog || {};
    const tiktokSummary = Object.entries(tiktokAccounts).map(([acc, logs]) => {
      const last = logs[logs.length - 1];
      return last ? `@${acc}: ${last.views.toLocaleString()} views, ${last.followers.toLocaleString()} followers (${last.week})` : '';
    }).filter(Boolean).join(' | ') || '— sin datos TikTok';

    const prompt = `Eres el chief-of-staff y coach de Cris (26 años, ex-enfermero, primer año en tecnología).

ESTADO DE SUS PROYECTOS:

SIMULIA (plataforma oposiciones enfermería):
- MRR: ${simulia?.current} — objetivo: ${simulia?.objective} (${simulia?.progress}%)
- Tareas pendientes: ${(simulia?.tasks || []).filter(t => !t.done).map(t => t.text).join(', ') || '—'}

AGENCIA (canal IA+ecom, ICP = dueños Shopify):
- ${agencia?.current} — objetivo: ${agencia?.objective}
- Scripts listos para grabar:\n${pendingScripts}
- Scripts en producción:\n${inProgressScripts}

MÉTRICAS TikTok:
${tiktokSummary}

HÁBITOS HOY (${today}):
${habitsSummary || '— sin registros'}

PRÓXIMAS FECHAS IMPORTANTES:
${upcomingGoals || '—'}

FOCO SEMANA: ${state.weekFocus || '—'}

Genera el BRIEFING DE SEMANA COMPLETO con:

## 🎯 LAS 3 ACCIONES MÁS IMPORTANTES ESTA SEMANA
(en orden de impacto real en los objetivos, con el motivo)

## 📹 SIGUIENTE VÍDEO A GRABAR
(el más urgente del pipeline, con el por qué específico ahora)

## 💡 UNA DECISIÓN QUE TIENES QUE TOMAR
(algo que llevas aplazando, directamente)

## 💪 FRASE DE ARRANQUE
(personalizada a su situación real, estilo Topuria/Rohn — sin patetismo, con fuerza)

Máximo 300 palabras. Directo. Sin relleno. En español.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 700, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) return res.status(response.status).json({ error: 'Claude API error' });
    const data = await response.json();
    res.json({ briefing: data.content?.[0]?.text || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`Dashboard servidor corriendo en http://localhost:${PORT}`);
});
