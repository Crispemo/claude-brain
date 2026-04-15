const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const { probeVideo, extractFrame, processClip } = require('../services/video');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const OUTPUT_DIR = path.join(__dirname, '../output');
[UPLOADS_DIR, OUTPUT_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 * 1024 }, // 4GB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) return cb(null, true);
    cb(new Error('Solo se aceptan archivos de vídeo'));
  }
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/clips/upload
router.post('/upload', upload.single('video'), async (req, res, next) => {
  try {
    const { path: filePath, originalname, size } = req.file;
    const info = await probeVideo(filePath);
    res.json({
      fileId: path.basename(filePath),
      originalname,
      size,
      ...info
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/clips/download  — download video from URL via yt-dlp
router.post('/download', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url requerida' });

    const outputFile = `${Date.now()}.mp4`;
    const outputPath = path.join(UPLOADS_DIR, outputFile);

    await new Promise((resolve, reject) => {
      execFile('yt-dlp', [
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '-o', outputPath,
        '--no-playlist',
        url
      ], { timeout: 300000 }, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve();
      });
    });

    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ error: 'yt-dlp no generó el archivo de salida' });
    }

    const info = await probeVideo(outputPath);
    res.json({
      fileId: outputFile,
      originalname: outputFile,
      size: fs.statSync(outputPath).size,
      ...info
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/clips/analyze  — extract frame + Claude Vision detects webcam region
router.post('/analyze', async (req, res, next) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: 'fileId required' });

    const videoPath = path.join(UPLOADS_DIR, fileId);
    if (!fs.existsSync(videoPath)) return res.status(404).json({ error: 'Video not found' });

    const info = await probeVideo(videoPath);
    const seekTime = Math.min(3, info.duration * 0.1 || 1);
    const frameName = `frame-${fileId}.jpg`;
    const framePath = path.join(UPLOADS_DIR, frameName);

    await extractFrame(videoPath, framePath, seekTime);

    const frameData = fs.readFileSync(framePath).toString('base64');

    const msg = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: frameData }
          },
          {
            type: 'text',
            text: `This is a frame from an OBS screen recording. There is a main screen/presentation area AND a small webcam overlay showing a person's face.

Find the webcam/face overlay. Return ONLY valid JSON (no markdown, no explanation):
{
  "webcam": { "x": <left px>, "y": <top px>, "w": <width px>, "h": <height px> },
  "confidence": "high|medium|low",
  "note": "<one line>"
}

Video is ${info.width}x${info.height}px. Give pixel-accurate coordinates for the webcam bounding box.`
          }
        ]
      }]
    });

    const raw = msg.content[0].text.trim();
    let detected = { webcam: null, confidence: 'low', note: 'Could not detect' };
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      detected = JSON.parse(match ? match[0] : raw);
    } catch (e) {
      // keep default
    }

    res.json({
      frame: `/uploads/${frameName}`,
      videoInfo: info,
      webcamRegion: detected.webcam,
      screenRegion: { x: 0, y: 0, w: info.width, h: info.height },
      confidence: detected.confidence,
      note: detected.note
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/clips/process  — generate 9:16 MP4
router.post('/process', async (req, res, next) => {
  try {
    const { fileId, screenRegion, webcamRegion } = req.body;
    if (!fileId || !screenRegion || !webcamRegion) {
      return res.status(400).json({ error: 'fileId, screenRegion y webcamRegion son obligatorios' });
    }

    const videoPath = path.join(UPLOADS_DIR, fileId);
    if (!fs.existsSync(videoPath)) return res.status(404).json({ error: 'Video not found' });

    const outputFile = `clip-${Date.now()}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    await processClip(videoPath, { screen: screenRegion, face: webcamRegion }, outputPath);

    res.json({ output: `/output/${outputFile}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
