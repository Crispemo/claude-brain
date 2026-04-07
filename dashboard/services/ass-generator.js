/**
 * Convert seconds to ASS timestamp format: H:MM:SS.cc
 */
function toAssTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

/**
 * Build an ASS subtitle file with karaoke-style word highlighting.
 * Words are highlighted in yellow as they are spoken.
 *
 * @param {object} whisperJson - full Whisper JSON output
 * @param {number} startOffset - segment start time to subtract (so clip starts at 0)
 * @returns {string} ASS file content
 */
function buildAssFile(whisperJson, startOffset = 0) {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,58,&H00FFFFFF,&H0000FFFF,&H00000000,&H99000000,-1,0,0,0,100,100,0,0,1,3,1,2,20,20,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const dialogues = [];

  for (const seg of whisperJson.segments) {
    const words = seg.words || [];

    if (!words.length) {
      // No word timestamps — render segment as one block
      const start = toAssTime(Math.max(0, seg.start - startOffset));
      const end = toAssTime(Math.max(0, seg.end - startOffset));
      dialogues.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,${seg.text.trim()}`);
      continue;
    }

    // Group words into lines of max 6 words for readability
    const chunkSize = 6;
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize);
      const lineStart = toAssTime(Math.max(0, chunk[0].start - startOffset));
      const lineEnd = toAssTime(Math.max(0, chunk[chunk.length - 1].end - startOffset));

      // Build karaoke text: {\\kf<duration_centiseconds>}word
      let karaokeText = '';
      for (let j = 0; j < chunk.length; j++) {
        const w = chunk[j];
        const duration = Math.round((w.end - w.start) * 100);
        karaokeText += (j === 0 ? '' : ' ') + `{\\kf${duration}}${w.word}`;
      }

      dialogues.push(`Dialogue: 0,${lineStart},${lineEnd},Default,,0,0,0,,${karaokeText}`);
    }
  }

  return header + '\n' + dialogues.join('\n');
}

module.exports = { buildAssFile, toAssTime };
