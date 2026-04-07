require('dotenv').config();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set in .env');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({ origin: 'http://localhost:3001' }));
app.use(express.json());
app.use('/output', express.static(path.join(__dirname, 'output')));

app.use('/api/scripts', require('./routes/scripts'));
app.use('/api/clips', require('./routes/clips'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Content Engine running on http://localhost:${PORT}`));
