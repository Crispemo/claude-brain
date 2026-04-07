const { spawnSync } = require('child_process');
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

  // Try preferred languages in order; stop at first success
  const langCandidates = ['es', 'en', 'es-419'];
  for (const lang of langCandidates) {
    spawnSync('yt-dlp', [
      '--skip-download',
      '--write-auto-sub',
      '--sub-lang', lang,
      '-o', outTemplate,
      url
    ], { encoding: 'utf8', timeout: 60000 });

    const subtitleFiles = fs.readdirSync(tmpDir).filter(f => f.endsWith('.srt') || f.endsWith('.vtt'));
    if (subtitleFiles.length > 0) {
      const raw = fs.readFileSync(path.join(tmpDir, subtitleFiles[0]), 'utf8');
      fs.rmSync(tmpDir, { recursive: true });
      return subtitleFiles[0].endsWith('.srt') ? parseSrt(raw) : parseVtt(raw);
    }
  }

  fs.rmSync(tmpDir, { recursive: true });
  throw new Error('No subtitles found for this URL. Use a YouTube video with auto-captions enabled, or paste an article URL.');
}

function parseSrt(srt) {
  return srt
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed &&
        !/^\d+$/.test(trimmed) &&
        !/\d{2}:\d{2}:\d{2},\d{3} -->/.test(trimmed);
    })
    .join(' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseVtt(vtt) {
  const seen = new Set();
  const lines = [];

  for (const line of vtt.split('\n')) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed === 'WEBVTT' ||
      /^Kind:/.test(trimmed) ||
      /^Language:/.test(trimmed) ||
      /^\d{2}:\d{2}:\d{2}/.test(trimmed) ||  // timestamp lines
      /^NOTE/.test(trimmed)
    ) continue;

    // Strip inline VTT tags like <00:00:12.759><c>word</c>
    const clean = trimmed.replace(/<[^>]+>/g, '').trim();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    lines.push(clean);
  }

  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

async function extractFromArticle(url) {
  const { load } = require('cheerio');

  let res;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; content-engine/1.0)' }
    });
  } catch (e) {
    throw new Error(`Failed to fetch article: ${e.message}`);
  }

  if (!res.ok) throw new Error(`Failed to fetch article: HTTP ${res.status}`);
  const html = await res.text();
  const $ = load(html);

  $('nav, header, footer, script, style, aside, .sidebar, .menu, .ad, .cookie').remove();

  const selectors = ['article', 'main', '.post-content', '.entry-content', '.content', 'body'];
  let text = '';
  for (const sel of selectors) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) {
      text = el.text();
      break;
    }
  }

  if (!text) throw new Error('Could not extract readable text from this URL');

  return text.replace(/\s+/g, ' ').trim().slice(0, 8000);
}

module.exports = { extractContent, detectUrlType };
