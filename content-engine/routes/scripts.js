// content-engine/routes/scripts.js
const router = require('express').Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { extractContent } = require('../services/scraper');
const { generateScript } = require('../services/claude');

const SCRIPTS_DIR = path.join(__dirname, '../scripts');
if (!fs.existsSync(SCRIPTS_DIR)) {
  fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
}

router.post('/generate', async (req, res, next) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url requerida' });

  try {
    const content = await extractContent(url);
    const script = await generateScript(content);

    const date = new Date().toISOString().slice(0, 10);
    const slug = crypto.createHash('md5').update(url).digest('hex').slice(0, 8);
    const filename = `${date}-${slug}.json`;
    const saved = { url, date, script, filename };

    await fs.promises.writeFile(path.join(SCRIPTS_DIR, filename), JSON.stringify(saved, null, 2));

    res.json({ script, filename });
  } catch (err) {
    next(err);
  }
});

router.get('/', (req, res, next) => {
  try {
    const files = fs.readdirSync(SCRIPTS_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    const list = files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, f), 'utf8'));
      return { filename: f, url: data.url, date: data.date };
    });

    res.json(list);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
