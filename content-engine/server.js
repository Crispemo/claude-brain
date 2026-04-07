require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use(express.static(__dirname));

app.use('/api/scripts', require('./routes/scripts'));
app.use('/api/clips', require('./routes/clips'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Content Engine running on http://localhost:${PORT}`));
