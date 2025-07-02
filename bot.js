// Panggil library yang dibutuhkan
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Untuk memuat variabel dari file .env

const app = express();
const PORT = process.env.PORT || 3000;
const PING_URL = 'https://your-render-app-name.onrender.com/leaderboard'; // ganti ini

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ==========================================================
// 1. KONEKSI DATABASE
// ==========================================================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Berhasil terhubung ke MongoDB Atlas'))
    .catch(err => console.error('❌ Gagal terhubung ke MongoDB:', err));

// ==========================================================
// 2. SKEMA & MODEL DATA (Struktur Tabel Database)
// ==========================================================
const scoreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    score: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

// ==========================================================
// 3. ENDPOINTS / ROUTES (Logika Aplikasi)
// ==========================================================

// POST: Tambah data baru
app.post('/submit-score', async (req, res) => {
    try {
        const { name, phone, score } = req.body;

        if (!name || !phone || score == null) {
            return res.status(400).json({ error: 'Incomplete data' });
        }
        
        const newScore = new Score({ name, phone, score });
        await newScore.save(); // Simpan ke database
        res.status(201).json({ message: 'Score saved to database!' });

    } catch (error) {
        res.status(500).json({ error: 'Server error while saving score', details: error.message });
    }
});

// GET: Ambil semua data
app.get('/scores', async (req, res) => {
    try {
        const scores = await Score.find({}); // Cari semua dokumen
        res.status(200).json(scores);
    } catch (error) {
        res.status(500).json({ error: 'Server error while fetching scores' });
    }
});

// PUT: Update berdasarkan `name`
app.put('/update-score', async (req, res) => {
    try {
        const { name, phone, score } = req.body;

        if (!name || !phone || score == null) {
            return res.status(400).json({ error: 'Incomplete data' });
        }
        
        // Cari satu data berdasarkan nama, lalu update. Opsi { new: true } mengembalikan data yang sudah diupdate.
        const updatedScore = await Score.findOneAndUpdate(
            { name: name }, 
            { phone, score, date: new Date() }, 
            { new: true, runValidators: true }
        );

        if (!updatedScore) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        
        res.status(200).json({ message: 'Score updated!', data: updatedScore });

    } catch (error) {
        res.status(500).json({ error: 'Server error while updating score' });
    }
});

// DELETE: Hapus berdasarkan `name`
app.delete('/delete-score/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const result = await Score.findOneAndDelete({ name: name });

        if (!result) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        
        res.status(200).json({ message: 'Score deleted!' });

    } catch (error) {
        res.status(500).json({ error: 'Server error while deleting score' });
    }
});

// GET: Leaderboard diurutkan berdasarkan skor
app.get('/leaderboard', async (req, res) => {
    try {
        // Cari semua data, urutkan berdasarkan 'score' secara descending (-1)
        const leaderboard = await Score.find({}).sort({ score: -1 });
        res.status(200).json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Server error while fetching leaderboard' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

// KEEP ALIVE PING (tidak perlu diubah)
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
setInterval(() => {
    fetch(PING_URL)
        .then(() => console.log(`[PING] Sent at ${new Date().toLocaleTimeString()}`))
        .catch(err => console.error('[PING ERROR]', err));
}, 14 * 60 * 1000);