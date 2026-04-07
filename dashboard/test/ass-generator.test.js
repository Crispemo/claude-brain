const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildAssFile, toAssTime } = require('../services/ass-generator');

test('toAssTime converts 0 seconds correctly', () => {
  assert.equal(toAssTime(0), '0:00:00.00');
});

test('toAssTime converts 61.5 seconds correctly', () => {
  assert.equal(toAssTime(61.5), '0:01:01.50');
});

test('toAssTime converts 3661.25 seconds correctly', () => {
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
  assert.ok(typeof ass === 'string');
  assert.ok(ass.includes('[Script Info]'));
  assert.ok(ass.includes('[Events]'));
  assert.ok(ass.includes('Dialogue:'));
});
