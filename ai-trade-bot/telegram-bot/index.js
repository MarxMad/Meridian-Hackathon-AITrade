const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

// Configuración del bot
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Crear instancia del bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Almacenar datos de usuarios
const userSessions = new Map();

// Comandos disponibles
const commands = {
  start: '/start - Iniciar el bot',
  help: '/help - Mostrar comandos disponibles',
  swap: '/swap <cantidad> XLM - Hacer swap de XLM a USDC',
  balance: '/balance - Ver balance de XLM',
  price: '/price - Ver precio actual de XLM',
  status: '/status - Ver estado de la última transacción'
};

// Función para obtener precio de XLM
async function getXlmPrice() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/soroswap/price`);
    return response.data.data?.price_usd || 0;
  } catch (error) {
    console.error('Error obteniendo precio:', error);
    return 0;
  }
}

// Función para obtener cotización de swap
async function getSwapQuote(amount) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/soroswap/quote`, {
      amount: amount.toString()
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    return null;
  }
}

// Función para ejecutar swap (simulado para demo)
async function executeSwap(userId, amount, quote) {
  try {
    // En un bot real, necesitarías manejar las claves privadas de forma segura
    // Para el demo, simulamos la ejecución
    const response = await axios.post(`${API_BASE_URL}/api/soroswap/execute`, {
      sourceAccount: `USER_${userId}`, // En producción sería la clave pública real
      quote: quote.data.quote,
      network: 'testnet'
    });
    return response.data;
  } catch (error) {
    console.error('Error ejecutando swap:', error);
    return null;
  }
}

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🤖 **AI Trading Bot - Stellar Swaps**

¡Hola! Soy tu asistente de trading automático en Stellar.

**Comandos disponibles:**
${Object.values(commands).join('\n')}

**Ejemplo de uso:**
\`/swap 5 XLM\` - Intercambia 5 XLM por USDC

**Assets soportados:**
• XLM → USDC (Stellar Testnet)

¿Listo para hacer tu primer swap? 🚀
  `;
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Comando /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📚 **Comandos del Bot**

${Object.values(commands).join('\n')}

**Ejemplos:**
• \`/swap 10 XLM\` - Intercambia 10 XLM por USDC
• \`/price\` - Ver precio actual de XLM
• \`/balance\` - Ver tu balance (requiere conectar wallet)

**Nota:** Este bot funciona en Stellar Testnet para pruebas.
  `;
  
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Comando /price
bot.onText(/\/price/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    bot.sendMessage(chatId, '📊 Obteniendo precio de XLM...');
    
    const price = await getXlmPrice();
    const priceMessage = `
💰 **Precio de XLM**
• **Precio actual:** $${price.toFixed(4)} USD
• **Red:** Stellar Testnet
• **Actualizado:** ${new Date().toLocaleString()}
    `;
    
    bot.sendMessage(chatId, priceMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Error obteniendo precio de XLM');
  }
});

// Comando /swap
bot.onText(/\/swap (.+) XLM/, async (msg, match) => {
  const chatId = msg.chat.id;
  const amount = parseFloat(match[1]);
  
  if (isNaN(amount) || amount <= 0) {
    bot.sendMessage(chatId, '❌ Cantidad inválida. Usa: /swap 5 XLM');
    return;
  }
  
  try {
    // Mostrar mensaje de inicio
    const startMessage = `
🔄 **Iniciando Swap**
• **Cantidad:** ${amount} XLM
• **Destino:** USDC
• **Red:** Stellar Testnet
• **Estado:** Obteniendo cotización...
    `;
    
    await bot.sendMessage(chatId, startMessage, { parse_mode: 'Markdown' });
    
    // Obtener cotización
    const quote = await getSwapQuote(amount);
    
    if (!quote || !quote.success) {
      bot.sendMessage(chatId, '❌ Error obteniendo cotización. Intenta de nuevo.');
      return;
    }
    
    const outputAmount = (parseInt(quote.data.quote.amountOut) / 1_000_000).toFixed(6);
    const priceImpact = quote.data.quote.priceImpactPct || '0.00';
    
    // Mostrar cotización
    const quoteMessage = `
📊 **Cotización Obtenida**
• **Entrada:** ${amount} XLM
• **Salida:** ~${outputAmount} USDC
• **Impacto de precio:** ${priceImpact}%
• **Protocolo:** ${quote.data.quote.platform}
• **Red:** ${quote.data.network}

¿Confirmas el swap? Responde "SÍ" para continuar.
    `;
    
    await bot.sendMessage(chatId, quoteMessage, { parse_mode: 'Markdown' });
    
    // Guardar sesión del usuario
    userSessions.set(chatId, {
      amount,
      quote,
      status: 'waiting_confirmation'
    });
    
  } catch (error) {
    console.error('Error en swap:', error);
    bot.sendMessage(chatId, '❌ Error procesando el swap. Intenta de nuevo.');
  }
});

// Confirmación de swap
bot.onText(/^(SÍ|SI|YES|Y|sí|si|yes|y)$/i, async (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions.get(chatId);
  
  if (!session || session.status !== 'waiting_confirmation') {
    bot.sendMessage(chatId, '❌ No hay swap pendiente de confirmación.');
    return;
  }
  
  try {
    await bot.sendMessage(chatId, '🚀 Ejecutando swap...');
    
    // Simular ejecución (en producción sería real)
    const swapResult = await executeSwap(chatId, session.amount, session.quote);
    
    if (swapResult && swapResult.success) {
      const successMessage = `
✅ **Swap Exitoso!**
• **Cantidad:** ${session.amount} XLM → USDC
• **Hash:** ${swapResult.data?.hash || 'DEMO_HASH'}
• **Ledger:** ${swapResult.data?.ledger || 'DEMO_LEDGER'}
• **Red:** Stellar Testnet

¡Tu swap se ha completado exitosamente! 🎉
      `;
      
      await bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(chatId, '❌ Error ejecutando el swap. Intenta de nuevo.');
    }
    
    // Limpiar sesión
    userSessions.delete(chatId);
    
  } catch (error) {
    console.error('Error ejecutando swap:', error);
    await bot.sendMessage(chatId, '❌ Error ejecutando el swap. Intenta de nuevo.');
  }
});

// Comando /status
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions.get(chatId);
  
  if (!session) {
    bot.sendMessage(chatId, 'ℹ️ No hay transacciones activas.');
    return;
  }
  
  const statusMessage = `
📊 **Estado de la Transacción**
• **Cantidad:** ${session.amount} XLM
• **Estado:** ${session.status}
• **Tiempo:** ${new Date().toLocaleString()}
  `;
  
  bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
});

// Comando /balance (simulado)
bot.onText(/\/balance/, (msg) => {
  const chatId = msg.chat.id;
  const balanceMessage = `
💰 **Balance (Simulado)**
• **XLM:** 100.0000000
• **USDC:** 0.0000000
• **Red:** Stellar Testnet

*Nota: Este es un balance simulado para el demo.*
  `;
  
  bot.sendMessage(chatId, balanceMessage, { parse_mode: 'Markdown' });
});

// Manejo de errores
bot.on('error', (error) => {
  console.error('Error del bot:', error);
});

bot.on('polling_error', (error) => {
  console.error('Error de polling:', error);
});

console.log('🤖 Bot de Telegram iniciado...');
console.log('📱 Comandos disponibles:', Object.keys(commands).join(', '));
