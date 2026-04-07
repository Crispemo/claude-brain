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
