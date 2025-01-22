const TelegramBot = require('node-telegram-bot-api');

// Token bot yang kamu dapatkan dari BotFather
const token = '6845395329:AAG5MuqwFhKPwFGk_D9uJYxmjkft7ML1xAM';
const bot = new TelegramBot(token, { polling: true });

// Nama game pendek yang didaftarkan di BotFather
const GAME_SHORT_NAME = 'idleFarmingMonsterAR';


const express = require('express');
const app = express();

// Gunakan PORT dari variabel lingkungan, atau fallback ke 3000
const PORT = process.env.PORT || 3000;

const axios = require('axios');

setInterval(() => {
  axios.get('https://bot-lzsk.onrender.com/')
    .then(() => console.log('Ping successful!'))
    .catch(err => console.log('Ping failed:', err.message));
}, 5 * 60 * 1000); // Ping setiap 5 menit

app.get('/', (req, res) => {
  res.send('Hello, Render!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle command /start untuk menyapa pengguna
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Selamat datang di bot game MonsterAR! Gunakan /play untuk mulai bermain.');
});

// Handle command /play untuk mengirim game
bot.onText(/\/play/, (msg) => {
    const chatId = msg.chat.id;

    // Kirim pesan game dengan tombol "Play"
    bot.sendGame(chatId, GAME_SHORT_NAME).catch((err) => {
        console.error('Error sending game:', err);
    });
});

// Inline query untuk menawarkan game di inline mode
bot.on('inline_query', (query) => {
    const results = [
        {
            type: 'game',
            id: '1',
            game_short_name: GAME_SHORT_NAME, // Game yang sudah dibuat di BotFather
        },
    ];

    bot.answerInlineQuery(query.id, results).catch((err) => {
        console.error('Error answering inline query:', err);
    });
});

// Handle callback query ketika tombol Play ditekan
bot.on('callback_query', (callbackQuery) => {
    const { id, game_short_name, from } = callbackQuery;

    if (game_short_name !== GAME_SHORT_NAME) {
        bot.answerCallbackQuery(id, {
            text: 'Game tidak dikenali!',
        });
        return;
    }

    // Ambil user ID dan username dari callback query
    const userId = from.id;
    const username = from.username || 'unknown'; // Username bisa undefined, berikan default

    // Buat URL dengan query parameter user_id dan username
  //  const gameUrl = `https://webgame.monsterar.net/idleFarming?user_id=${userId}&username=${encodeURIComponent(username)}`;
    const gameUrl = `https://webgame.monsterar.net/idleFarming/`;

    // Jawab callback query dengan URL game
    bot.answerCallbackQuery(id, {
        url: gameUrl,
    }).catch((err) => {
        console.error('Error answering callback query:', err);
    });
});
