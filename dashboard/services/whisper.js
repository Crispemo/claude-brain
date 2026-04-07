const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Transcribe an audio/video file using local Whisper CLI.
 * Returns the full Whisper JSON output (with segments and word timestamps).
 * @param {string} audioPath - path to audio or video file
 * @returns {object} whisperJson with .segments array
 */
function transcribeAudio(audioPath) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-whisper-'));

  const result = spawnSync('whisper', [
    audioPath,
    '--model', 'medium',
    '--language', 'es',
    '--output_format', 'json',
    '--word_timestamps', 'True',
    '--output_dir', tmpDir
  ], { encoding: 'utf8', timeout: 600000 }); // 10 min timeout

  if (result.status !== 0) {
    fs.rmSync(tmpDir, { recursive: true });
    throw new Error(`Whisper failed: ${result.stderr || result.stdout || 'unknown error'}`);
  }

  const jsonFiles = fs.readdirSync(tmpDir).filter(f => f.endsWith('.json'));
  if (!jsonFiles.length) {
    fs.rmSync(tmpDir, { recursive: true });
    throw new Error('Whisper produced no JSON output');
  }

  let json;
  try {
    json = JSON.parse(fs.readFileSync(path.join(tmpDir, jsonFiles[0]), 'utf8'));
  } catch (e) {
    fs.rmSync(tmpDir, { recursive: true });
    throw new Error(`Failed to parse Whisper output: ${e.message}`);
  }

  fs.rmSync(tmpDir, { recursive: true });
  return json;
}

/**
 * Convert Whisper JSON segments to a timestamped text string for Claude.
 * @param {object} whisperJson
 * @returns {string}
 */
function formatTranscriptForClaude(whisperJson) {
  if (!whisperJson?.segments?.length) {
    throw new Error('Whisper JSON has no segments');
  }
  return whisperJson.segments
    .map(seg => `[${seg.start.toFixed(1)}-${seg.end.toFixed(1)}] ${seg.text.trim()}`)
    .join('\n');
}

module.exports = { transcribeAudio, formatTranscriptForClaude };
