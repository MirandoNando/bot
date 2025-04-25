const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const PING_URL = 'https://your-render-app-name.onrender.com/leaderboard'; // ganti ini

// Middleware
app.use(cors());
app.use(bodyParser.json());

// POST: Tambah data baru
app.post('/submit-score', (req, res) => {
  const { name, phone, score } = req.body;

  if (!name || !phone || score == null) {
    return res.status(400).json({ error: 'Incomplete data' });
  }

  let existingData = [];
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE);
    existingData = JSON.parse(raw);
  }

  const newEntry = { name, phone, score, date: new Date().toISOString() };
  existingData.push(newEntry);

  fs.writeFileSync(DATA_FILE, JSON.stringify(existingData, null, 2));
  res.status(200).json({ message: 'Score saved to file!' });
});

// GET: Ambil semua data
app.get('/scores', (req, res) => {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE);
    const data = JSON.parse(raw);
    res.status(200).json(data);
  } else {
    res.status(200).json([]);
  }
});

// PUT: Update berdasarkan `name`
app.put('/update-score', (req, res) => {
  const { name, phone, score } = req.body;

  if (!name || !phone || score == null) {
    return res.status(400).json({ error: 'Incomplete data' });
  }

  if (!fs.existsSync(DATA_FILE)) {
    return res.status(404).json({ error: 'Data not found' });
  }

  const raw = fs.readFileSync(DATA_FILE);
  let data = JSON.parse(raw);

  const index = data.findIndex(entry => entry.name === name);
  if (index === -1) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  data[index] = {
    ...data[index],
    phone,
    score,
    date: new Date().toISOString()
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.status(200).json({ message: 'Score updated!' });
});

// DELETE: Hapus berdasarkan `name`
app.delete('/delete-score/:name', (req, res) => {
  const { name } = req.params;

  if (!fs.existsSync(DATA_FILE)) {
    return res.status(404).json({ error: 'Data file not found' });
  }

  const raw = fs.readFileSync(DATA_FILE);
  let data = JSON.parse(raw);

  const newData = data.filter(entry => entry.name !== name);

  if (newData.length === data.length) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2));
  res.status(200).json({ message: 'Score deleted!' });
});

// GET: Leaderboard sorted by score descending
app.get('/leaderboard', (req, res) => {
  if (!fs.existsSync(DATA_FILE)) {
    return res.status(200).json([]);
  }

  const raw = fs.readFileSync(DATA_FILE);
  const data = JSON.parse(raw);
  const sorted = data.sort((a, b) => b.score - a.score);

  res.status(200).json(sorted);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

// KEEP ALIVE PING
setInterval(() => {
  fetch(PING_URL)
    .then(res => res.json())
    .then(() => console.log(`[PING] Sent at ${new Date().toLocaleTimeString()}`))
    .catch(err => console.error('[PING ERROR]', err));
}, 14 * 60 * 1000); // 14 menit
