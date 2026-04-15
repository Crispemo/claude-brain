const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

function probeVideo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const stream = metadata.streams.find(s => s.codec_type === 'video');
      if (!stream) return reject(new Error('No video stream found'));
      resolve({
        width: stream.width,
        height: stream.height,
        duration: parseFloat(metadata.format.duration) || 0,
        codec: stream.codec_name,
        fps: eval(stream.r_frame_rate) || 30
      });
    });
  });
}

function extractFrame(filePath, outputPath, timeSeconds = 2) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(outputPath)) return resolve(outputPath);
    ffmpeg(filePath)
      .seekInput(timeSeconds)
      .frames(1)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

function processClip(inputPath, regions, outputPath, onProgress) {
  const { screen: s, face: f } = regions;

  // Stack: screen on top (75% height = 1440px), face on bottom (25% = 480px)
  // Total: 1080x1920 (9:16)
  const filter = [
    `[0:v]crop=${s.w}:${s.h}:${s.x}:${s.y},scale=1080:1440:force_original_aspect_ratio=decrease,pad=1080:1440:(ow-iw)/2:(oh-ih)/2:black[screen]`,
    `[0:v]crop=${f.w}:${f.h}:${f.x}:${f.y},scale=1080:480:force_original_aspect_ratio=decrease,pad=1080:480:(ow-iw)/2:(oh-ih)/2:black[face]`,
    `[screen][face]vstack[out]`
  ].join(';');

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(inputPath)
      .complexFilter(filter, 'out')
      .outputOptions(['-c:v libx264', '-preset fast', '-crf 23', '-c:a aac', '-movflags +faststart'])
      .output(outputPath);

    if (onProgress) cmd.on('progress', onProgress);

    cmd
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

module.exports = { probeVideo, extractFrame, processClip };
