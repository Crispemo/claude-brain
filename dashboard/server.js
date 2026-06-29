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

// POST /api/monitor/run — ejecuta manualmente el monitor de Simulia
app.post('/api/monitor/run', async (req, res) => {
  try {
    const { runMonitor } = require('./simulia-monitor.js');
    const newAlerts = await runMonitor();
    res.json({ ok: true, newAlerts: newAlerts || 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/trends/search — busca tendencias usando Claude API
app.post('/api/trends/search', async (req, res) => {
  try {
    const { niche } = req.body;
    if (!niche || !['agencia', 'simulia'].includes(niche)) {
      return res.status(400).json({ error: 'niche debe ser "agencia" o "simulia"' });
    }
    const nicheDesc = niche === 'agencia'
      ? 'IA aplicada a ecommerce en español'
      : 'oposiciones de enfermería EIR/OPE en España';
    const prompt = `Lista exactamente 8 tendencias actuales en ${nicheDesc}. Para cada una devuelve JSON: [{"topic": "...", "why": "...reason in 1 sentence...", "contentIdea": "...video/post idea..."}]. Solo el JSON, sin explicaciones.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errData?.error?.message || 'Anthropic API error' });
    }
    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const trends = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.trends = state.trends || {};
    state.trends[niche] = { items: trends, updatedAt: new Date().toISOString() };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    res.json(trends);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/competitors — lista competidores
app.get('/api/competitors', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    res.json(state.competitors || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/competitors — añade un competidor
app.post('/api/competitors', (req, res) => {
  try {
    const { name, platform, url, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name es requerido' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.competitors = state.competitors || [];
    const competitor = { id: Date.now(), name, platform, url, notes };
    state.competitors.push(competitor);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, competitor });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/competitors/:id — elimina un competidor
app.delete('/api/competitors/:id', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.competitors = (state.competitors || []).filter(c => String(c.id) !== String(req.params.id));
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/hashtags — lista grupos de hashtags
app.get('/api/hashtags', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    res.json(state.hashtags || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/hashtags — añade un grupo de hashtags
app.post('/api/hashtags', (req, res) => {
  try {
    const { name, platform, tags } = req.body;
    if (!name || !tags) return res.status(400).json({ error: 'name y tags son requeridos' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.hashtags = state.hashtags || [];
    const hashtag = { id: Date.now(), name, platform, tags };
    state.hashtags.push(hashtag);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, hashtag });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/hashtags/:id — elimina un grupo de hashtags
app.delete('/api/hashtags/:id', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.hashtags = (state.hashtags || []).filter(h => String(h.id) !== String(req.params.id));
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/competitors/analyze — análisis competitivo con Claude
app.post('/api/competitors/analyze', async (req, res) => {
  try {
    const { competitorId } = req.body;
    if (!competitorId) return res.status(400).json({ error: 'competitorId es requerido' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const competitor = (state.competitors || []).find(c => String(c.id) === String(competitorId));
    if (!competitor) return res.status(404).json({ error: 'Competidor no encontrado' });

    const prompt = `Haz un análisis competitivo breve de "${competitor.name}" en la plataforma ${competitor.platform || 'desconocida'}. URL: ${competitor.url || 'no disponible'}. Notas: ${competitor.notes || 'ninguna'}. Responde en español con: 1) Fortalezas, 2) Debilidades, 3) Oportunidades para diferenciarse. Máximo 200 palabras.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errData?.error?.message || 'Anthropic API error' });
    }
    const data = await response.json();
    const analysis = data.content?.[0]?.text || 'Sin análisis';

    competitor.lastAnalysis = analysis;
    competitor.lastAnalyzedAt = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    res.json({ ok: true, analysis });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/community — datos del community manager
app.get('/api/community', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    res.json(state.community || { calendar: [], metrics: {} });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/community/calendar — añade entrada al calendario
app.post('/api/community/calendar', (req, res) => {
  try {
    const { title, platform, date, time, status } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'title y date son requeridos' });
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.community = state.community || { calendar: [], metrics: {} };
    state.community.calendar = state.community.calendar || [];
    const entry = { id: Date.now(), title, platform, date, time, status: status || 'planned' };
    state.community.calendar.push(entry);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ ok: true, entry });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/community/calendar/:id — elimina entrada del calendario
app.delete('/api/community/calendar/:id', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (state.community && state.community.calendar) {
      state.community.calendar = state.community.calendar.filter(e => String(e.id) !== String(req.params.id));
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard servidor corriendo en http://localhost:${PORT}`);
});
