// /api/telegram-webhook.js - Vercel Serverless Function
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL = process.env.API_BASE_URL || 'https://mmmeee.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const bot = new TelegramBot(TELEGRAM_TOKEN);
    const update = req.body;

    // Manejar mensajes
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text;

      if (text === '/start') {
        await bot.sendMessage(chatId, '🤖 ¡ZENTRADE Bot está activo!\n\n' +
          '✅ Funcionando en la nube 24/7\n' +
          '🌐 Conectado a: ' + API_BASE_URL + '\n\n' +
          'Comandos disponibles:\n' +
          '/wallet - Crear wallet\n' +
          '/swap - Intercambiar XLM ↔ USDC\n' +
          '/trade - Trading con leverage\n' +
          '/balance - Ver balance\n' +
          '/price - Ver precios');
      }
      
      // Aquí puedes agregar más comandos...
    }

    // Manejar callback queries (botones)
    if (update.callback_query) {
      const query = update.callback_query;
      // Manejar callbacks...
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



