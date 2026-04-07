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

module.exports = { generateScript, selectClips };
