// railway-start.js - Optimizado para Railway deployment
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Configuración para Railway
const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.RAILWAY_STATIC_URL + '/webhook';
const API_BASE_URL = process.env.API_BASE_URL || 'https://mmmeee.vercel.app';

console.log('🚂 Iniciando ZENTRADE Bot en Railway...');
console.log('🔗 Webhook URL:', WEBHOOK_URL);
console.log('🌐 API Base URL:', API_BASE_URL);

// Crear bot
const bot = new TelegramBot(TELEGRAM_TOKEN);

// Configurar webhook
bot.setWebHook(WEBHOOK_URL).then(() => {
  console.log('✅ Webhook configurado correctamente');
}).catch(err => {
  console.error('❌ Error configurando webhook:', err);
});

// Importar funciones del bot principal
const { userWallets, userPositions } = require('./complete-trading-bot');

// Servidor Express para webhook
const express = require('express');
const app = express();

app.use(express.json());

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    bot: 'zentrade',
    timestamp: new Date().toISOString(),
    wallets: userWallets.size,
    positions: userPositions.size
  });
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log('📱 Bot activo 24/7 en Railway');
});

module.exports = { bot, app };



