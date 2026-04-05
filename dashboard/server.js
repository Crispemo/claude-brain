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

// POST /api/generate-script — genera guión con Claude API
app.post('/api/generate-script', async (req, res) => {
  try {
    const { title, project, type } = req.body;
    if (!title) return res.status(400).json({ error: 'title requerido' });

    const projectContext = project === 'simulia'
      ? 'plataforma de preparación para oposiciones de enfermería (EIR). Audiencia: enfermeros y estudiantes de enfermería que quieren aprobar oposiciones.'
      : 'canal de YouTube sobre IA aplicada a ecommerce. Audiencia: emprendedores con tiendas online que quieren usar IA para crecer.';

    const typeContext = type === 'short'
      ? 'un SHORT de YouTube (máx 60 segundos, gancho primeros 3 segundos, sin intro larga)'
      : 'un VÍDEO LARGO de YouTube (10-15 min, estructura clara con intro/desarrollo/cta)';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: `Genera un guión detallado para ${typeContext} sobre el tema: "${title}". El canal es de ${projectContext}. Formato: gancho (primeros segundos), desarrollo (puntos clave), CTA final. Directo, sin relleno, en español.` }]
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

app.listen(PORT, () => {
  console.log(`Dashboard servidor corriendo en http://localhost:${PORT}`);
});
