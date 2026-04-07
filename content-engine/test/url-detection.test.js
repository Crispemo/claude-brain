const { test } = require('node:test');
const assert = require('node:assert/strict');

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
