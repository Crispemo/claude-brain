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
