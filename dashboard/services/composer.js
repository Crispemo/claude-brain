const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Extract audio from a video file as mono 16kHz WAV (format Whisper expects).
 * @param {string} videoPath
 * @param {string} audioPath - output .wav path
 * @returns {Promise<void>}
 */
function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', videoPath,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      audioPath
    ];

    const proc = spawn('ffmpeg', args);
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      if (code !== 0) reject(new Error(`ffmpeg audio extraction failed (code ${code}): ${stderr.slice(-500)}`));
      else resolve();
    });
    proc.on('error', err => reject(new Error(`ffmpeg not found: ${err.message}`)));
  });
}

/**
 * Render a single vertical 9:16 clip:
 * - Screen video: top 60% (1080x1152)
 * - Face cam: bottom 40% (1080x768)
 * - Captions burned in from ASS file (karaoke style)
 * - Output: 1080x1920 HD, CRF 18
 *
 * @param {string} screenPath - path to screen recording video
 * @param {string} facePath   - path to face cam video
 * @param {{start: number, end: number}} segment
 * @param {string} assPath    - path to .ass subtitle file
 * @param {string} outputPath - output mp4 path
 * @returns {Promise<void>}
 */
function renderClip(screenPath, facePath, segment, assPath, outputPath) {
  return new Promise((resolve, reject) => {
    const { start, end } = segment;
    const duration = end - start;

    // Escape assPath for ffmpeg subtitles filter (convert backslashes and colons)
    const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');

    const args = [
      '-y',
      // Screen input trimmed
      '-ss', String(start), '-t', String(duration), '-i', screenPath,
      // Face input trimmed
      '-ss', String(start), '-t', String(duration), '-i', facePath,
      '-filter_complex',
      [
        // Scale screen to 1080 wide, force height to 1152 (60% of 1920)
        '[0:v]scale=1080:1152:force_original_aspect_ratio=increase,crop=1080:1152[screen]',
        // Scale face to 1080 wide, force height to 768 (40% of 1920)
        '[1:v]scale=1080:768:force_original_aspect_ratio=increase,crop=1080:768[face]',
        // Stack vertically → 1080x1920
        '[screen][face]vstack=inputs=2[stacked]',
        // Burn ASS subtitles
        `[stacked]subtitles='${escapedAss}'[out]`
      ].join(';'),
      '-map', '[out]',
      '-map', '1:a',
      '-c:v', 'libx264',
      '-crf', '18',
      '-preset', 'fast',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      outputPath
    ];

    const proc = spawn('ffmpeg', args);
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      if (code !== 0) reject(new Error(`ffmpeg render failed (code ${code}): ${stderr.slice(-800)}`));
      else resolve();
    });
    proc.on('error', err => reject(new Error(`ffmpeg not found: ${err.message}`)));
  });
}

module.exports = { extractAudio, renderClip };
