const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateScript(content) {
  let promptTemplate;
  try {
    promptTemplate = fs.readFileSync(path.join(__dirname, '../prompts/script-agencia.txt'), 'utf8');
  } catch (e) {
    throw new Error('Missing prompt file: prompts/script-agencia.txt');
  }
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

  if (!sections['INTRO']) {
    throw new Error(`Claude response missing required [INTRO] section. Raw: ${raw.slice(0, 300)}`);
  }

  return sections;
}

function scriptToText(script) {
  return Object.entries(script).map(([k, v]) => `[${k}]\n${v}`).join('\n\n');
}

async function generateLinkedIn(script) {
  const scriptText = scriptToText(script);

  const msg = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Basándote en este script de vídeo, escribe un post de LinkedIn en español.

Reglas:
- Primera línea: hook bold que genera curiosidad o hace una afirmación fuerte (sin "I" ni emojis al inicio)
- Párrafos muy cortos (1-3 líneas máximo), muchos saltos de línea
- 200-300 palabras en el cuerpo
- 3-5 emojis colocados estratégicamente, no al inicio de cada línea
- Termina con una pregunta al lector o CTA directo
- Pon 4-6 hashtags relevantes en la última línea, separados por espacio
- Tono: founder que comparte aprendizajes reales, directo, sin corporativismo

Script:
${scriptText}

Devuelve SOLO el post, sin explicaciones.`
    }]
  });

  return msg.content[0].text.trim();
}

async function generateEmail(script) {
  const scriptText = scriptToText(script);

  const msg = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Basándote en este script de vídeo, escribe un email de newsletter en español.

Reglas:
- Asunto: máximo 50 caracteres, intrigante, no clickbait
- Preheader: 1 frase corta que complementa el asunto (máx 90 caracteres)
- Cuerpo: tono cercano y conversacional, como escribir a un amigo
- 200-350 palabras
- Estructura: contexto → problema/insight → aprendizaje clave → CTA (ver el vídeo o responder)
- Máximo 2-3 emojis, no usar en exceso
- Sin bullet points ni negritas excesivas

Script:
${scriptText}

Devuelve en este formato exacto:
ASUNTO: <asunto>
PREHEADER: <preheader>
---
<cuerpo del email>`
    }]
  });

  return msg.content[0].text.trim();
}

async function selectClips(transcriptionText) {
  let promptTemplate;
  try {
    promptTemplate = fs.readFileSync(path.join(__dirname, '../prompts/clip-selector.txt'), 'utf8');
  } catch (e) {
    throw new Error('Missing prompt file: prompts/clip-selector.txt');
  }
  const prompt = promptTemplate.replace('{{TRANSCRIPTION}}', transcriptionText);

  const msg = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = msg.content[0].text.trim();
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Claude returned invalid JSON for clip selection: ${raw.slice(0, 200)}`);
  }
}

module.exports = { generateScript, generateLinkedIn, generateEmail, selectClips };
