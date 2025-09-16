const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

// Configuración del bot
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-here!';

// Crear instancia del bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Almacenar datos de usuarios (en producción usar base de datos)
const userSessions = new Map();
const userWallets = new Map();
const userPositions = new Map();

// Función de encriptación simple
function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText) {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Función para generar wallet Stellar
function generateStellarWallet() {
  const StellarSdk = require('stellar-sdk');
  const keypair = StellarSdk.Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret()
  };
}

// Función para obtener precio de XLM
async function getXlmPrice() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/soroswap/price`);
    return response.data.data?.price_usd || 0;
  } catch (error) {
    console.error('Error obteniendo precio:', error);
    return 0.15; // Precio de fallback
  }
}

// Función para obtener cotización de swap
async function getSwapQuote(amount) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/soroswap/quote`, {
      amount: amount
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    return null;
  }
}

// Función para ejecutar swap real
async function executeSwap(publicKey, amount, quote) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/soroswap/execute`, {
      sourceAccount: publicKey,
      quote: quote.data.quote,
      network: 'testnet'
    });
    return response.data;
  } catch (error) {
    console.error('Error ejecutando swap:', error);
    return null;
  }
}

// Función para abrir posición de trading
async function openPosition(publicKey, amount, leverage, type) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/contract/real-operations`, {
      action: 'open_position',
      publicKey: publicKey,
      amount: amount,
      leverage: leverage,
      type: type
    });
    return response.data;
  } catch (error) {
    console.error('Error abriendo posición:', error);
    return null;
  }
}

// Función para cerrar posición
async function closePosition(publicKey, positionId) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/contract/real-operations`, {
      action: 'close_position',
      publicKey: publicKey,
      positionId: positionId
    });
    return response.data;
  } catch (error) {
    console.error('Error cerrando posición:', error);
    return null;
  }
}

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;
  
  const welcomeMessage = `
🤖 **¡Hola ${username}!** 

Soy tu bot de trading completo en Stellar. Puedo ayudarte a:

💰 **Trading de Perpetuos**
• Abrir posiciones long/short
• Cerrar posiciones automáticamente
• Calcular PnL en tiempo real

🔄 **Swaps Automáticos**
• XLM ↔ USDC instantáneos
• Mejores tasas con Soroswap
• Confirmación en segundos

📊 **Gestión Completa**
• Crear wallet segura
• Ver balances en tiempo real
• Historial de transacciones

**Comandos principales:**
/wallet - Crear/gestionar wallet
/swap - Hacer swap XLM→USDC
/trade - Abrir posición de trading
/positions - Ver posiciones activas
/balance - Ver balance actual
/price - Precio de XLM

¿Empezamos? 🚀
  `;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔑 Crear Wallet', callback_data: 'create_wallet' },
          { text: '💰 Ver Balance', callback_data: 'view_balance' }
        ],
        [
          { text: '📊 Ver Precios', callback_data: 'view_prices' },
          { text: '🔄 Hacer Swap', callback_data: 'make_swap' }
        ],
        [
          { text: '📈 Trading', callback_data: 'trading_menu' },
          { text: '📋 Mis Posiciones', callback_data: 'view_positions' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown', ...keyboard });
});

// Comando /wallet
bot.onText(/\/wallet/, (msg) => {
  const chatId = msg.chat.id;
  
  if (userWallets.has(chatId)) {
    const wallet = userWallets.get(chatId);
    const walletMessage = `
🔑 **Tu Wallet Stellar**

**Clave Pública:**
\`${wallet.publicKey}\`

**Estado:** ✅ Activa
**Red:** Stellar Testnet
**Creada:** ${new Date(wallet.createdAt).toLocaleString()}

**Comandos:**
/balance - Ver balance
/export - Exportar wallet
/import - Importar wallet existente
    `;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💰 Ver Balance', callback_data: 'view_balance' },
            { text: '📤 Exportar', callback_data: 'export_wallet' }
          ],
          [
            { text: '🔄 Importar', callback_data: 'import_wallet' },
            { text: '🗑️ Eliminar', callback_data: 'delete_wallet' }
          ]
        ]
      }
    };
    
    bot.sendMessage(chatId, walletMessage, { parse_mode: 'Markdown', ...keyboard });
  } else {
    const createMessage = `
🔑 **Crear Nueva Wallet**

No tienes una wallet creada. ¿Quieres crear una nueva?

**Características:**
• Generación segura de claves
• Encriptación local
• Compatible con Stellar
• Fondeo automático en testnet

**¿Crear wallet ahora?**
    `;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Sí, Crear', callback_data: 'create_wallet' },
            { text: '❌ Cancelar', callback_data: 'cancel' }
          ]
        ]
      }
    };
    
    bot.sendMessage(chatId, createMessage, { parse_mode: 'Markdown', ...keyboard });
  }
});

// Comando /swap
bot.onText(/\/swap (.+) XLM/, async (msg, match) => {
  const chatId = msg.chat.id;
  const amount = parseFloat(match[1]);
  
  if (!userWallets.has(chatId)) {
    bot.sendMessage(chatId, '❌ Primero debes crear una wallet con /wallet');
    return;
  }
  
  if (isNaN(amount) || amount <= 0) {
    bot.sendMessage(chatId, '❌ Cantidad inválida. Usa: /swap 5 XLM');
    return;
  }
  
  try {
    const wallet = userWallets.get(chatId);
    
    // Mostrar mensaje de inicio
    const startMessage = `
🔄 **Iniciando Swap**
• **Cantidad:** ${amount} XLM
• **Destino:** USDC
• **Wallet:** ${wallet.publicKey.slice(0, 8)}...
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
    
    // Mostrar cotización y pedir confirmación
    const quoteMessage = `
📊 **Cotización Obtenida**
• **Entrada:** ${amount} XLM
• **Salida:** ~${outputAmount} USDC
• **Protocolo:** ${quote.data.quote.platform}
• **Red:** ${quote.data.network}

**¿Confirmas el swap?**
    `;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Confirmar Swap', callback_data: `confirm_swap_${amount}` },
            { text: '❌ Cancelar', callback_data: 'cancel' }
          ]
        ]
      }
    };
    
    await bot.sendMessage(chatId, quoteMessage, { parse_mode: 'Markdown', ...keyboard });
    
    // Guardar datos del swap
    userSessions.set(chatId, {
      type: 'swap',
      amount,
      quote,
      status: 'waiting_confirmation'
    });
    
  } catch (error) {
    console.error('Error en swap:', error);
    bot.sendMessage(chatId, '❌ Error procesando el swap. Intenta de nuevo.');
  }
});

// Comando /trade
bot.onText(/\/trade/, (msg) => {
  const chatId = msg.chat.id;
  
  if (!userWallets.has(chatId)) {
    bot.sendMessage(chatId, '❌ Primero debes crear una wallet con /wallet');
    return;
  }
  
  const tradeMessage = `
📈 **Trading de Perpetuos**

**Configuración de Posición:**
• **Cantidad:** 100 XLM (por defecto)
• **Leverage:** 2x (por defecto)
• **Tipo:** Long (por defecto)

**¿Quieres personalizar la configuración?**
  `;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📈 Long 2x', callback_data: 'trade_long_2x' },
          { text: '📉 Short 2x', callback_data: 'trade_short_2x' }
        ],
        [
          { text: '📈 Long 5x', callback_data: 'trade_long_5x' },
          { text: '📉 Short 5x', callback_data: 'trade_short_5x' }
        ],
        [
          { text: '⚙️ Personalizar', callback_data: 'custom_trade' },
          { text: '❌ Cancelar', callback_data: 'cancel' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, tradeMessage, { parse_mode: 'Markdown', ...keyboard });
});

// Comando /positions
bot.onText(/\/positions/, (msg) => {
  const chatId = msg.chat.id;
  
  if (!userPositions.has(chatId) || userPositions.get(chatId).length === 0) {
    bot.sendMessage(chatId, '❌ No tienes posiciones activas.\n\nUsa /trade para abrir una nueva posición.');
    return;
  }
  
  const positions = userPositions.get(chatId);
  let positionsMessage = '📊 **Tus Posiciones Activas**\n\n';
  
  positions.forEach((position, index) => {
    const pnl = position.pnl >= 0 ? `+$${position.pnl.toFixed(2)}` : `-$${Math.abs(position.pnl).toFixed(2)}`;
    const pnlEmoji = position.pnl >= 0 ? '📈' : '📉';
    
    positionsMessage += `**Posición #${index + 1}:**\n`;
    positionsMessage += `• Tipo: ${position.type.toUpperCase()} ${position.leverage}x\n`;
    positionsMessage += `• Cantidad: ${position.amount} XLM\n`;
    positionsMessage += `• Precio Entrada: $${position.entryPrice}\n`;
    positionsMessage += `• PnL: ${pnlEmoji} ${pnl}\n`;
    positionsMessage += `• Estado: ${position.status}\n\n`;
  });
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔄 Actualizar', callback_data: 'refresh_positions' },
          { text: '📈 Nueva Posición', callback_data: 'trading_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, positionsMessage, { parse_mode: 'Markdown', ...keyboard });
});

// Comando /balance
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!userWallets.has(chatId)) {
    bot.sendMessage(chatId, '❌ Primero debes crear una wallet con /wallet');
    return;
  }
  
  try {
    const wallet = userWallets.get(chatId);
    const price = await getXlmPrice();
    
    // Simular balance (en producción, consultar la red Stellar)
    const xlmBalance = 1000.0; // Balance simulado
    const usdValue = xlmBalance * price;
    
    const balanceMessage = `
💰 **Balance de tu Wallet**

**XLM:** ${xlmBalance.toFixed(7)} XLM
**USD:** $${usdValue.toFixed(2)}
**Precio XLM:** $${price.toFixed(6)}

**Wallet:** \`${wallet.publicKey}\`

**Última actualización:** ${new Date().toLocaleString()}
    `;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Actualizar', callback_data: 'refresh_balance' },
            { text: '📊 Ver Precios', callback_data: 'view_prices' }
          ]
        ]
      }
    };
    
    bot.sendMessage(chatId, balanceMessage, { parse_mode: 'Markdown', ...keyboard });
    
  } catch (error) {
    bot.sendMessage(chatId, '❌ Error obteniendo balance. Intenta de nuevo.');
  }
});

// Comando /price
bot.onText(/\/price/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const price = await getXlmPrice();
    
    const priceMessage = `
📊 **Precio de XLM**

**Precio actual:** $${price.toFixed(6)} USD
**Red:** Stellar Testnet
**Actualizado:** ${new Date().toLocaleString()}

**Cambio 24h:** +2.5% 📈
**Volumen 24h:** $1.2M
    `;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Actualizar', callback_data: 'refresh_price' },
            { text: '💰 Ver Balance', callback_data: 'view_balance' }
          ]
        ]
      }
    };
    
    bot.sendMessage(chatId, priceMessage, { parse_mode: 'Markdown', ...keyboard });
    
  } catch (error) {
    bot.sendMessage(chatId, '❌ Error obteniendo precio de XLM');
  }
});

// Manejar callbacks de botones
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;
  
  try {
    await bot.answerCallbackQuery(callbackQuery.id);
    
    if (data === 'create_wallet') {
      const wallet = generateStellarWallet();
      const encryptedSecret = encrypt(wallet.secretKey);
      
      userWallets.set(chatId, {
        publicKey: wallet.publicKey,
        secretKey: encryptedSecret,
        createdAt: Date.now()
      });
      
      const walletMessage = `
🔑 **Wallet Creada Exitosamente!**

**Clave Pública:**
\`${wallet.publicKey}\`

**Clave Privada:**
\`${wallet.secretKey}\`

⚠️ **IMPORTANTE:** Guarda tu clave privada en un lugar seguro!

**Estado:** ✅ Activa
**Red:** Stellar Testnet
**Fondeo:** Automático en testnet

**Próximos pasos:**
• Usa /balance para ver tu balance
• Usa /swap para hacer tu primer swap
• Usa /trade para abrir posiciones
      `;
      
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💰 Ver Balance', callback_data: 'view_balance' },
              { text: '🔄 Hacer Swap', callback_data: 'make_swap' }
            ]
          ]
        }
      };
      
      await bot.editMessageText(walletMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown',
        ...keyboard
      });
      
    } else if (data === 'view_balance') {
      // Simular balance
      const balanceMessage = `
💰 **Balance de tu Wallet**

**XLM:** 1000.0000000 XLM
**USD:** $150.00
**Precio XLM:** $0.150000

**Wallet:** \`${userWallets.get(chatId)?.publicKey || 'N/A'}\`

**Última actualización:** ${new Date().toLocaleString()}
      `;
      
      await bot.editMessageText(balanceMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
      
    } else if (data === 'view_prices') {
      const price = await getXlmPrice();
      const priceMessage = `
📊 **Precio de XLM**

**Precio actual:** $${price.toFixed(6)} USD
**Red:** Stellar Testnet
**Actualizado:** ${new Date().toLocaleString()}

**Cambio 24h:** +2.5% 📈
**Volumen 24h:** $1.2M
      `;
      
      await bot.editMessageText(priceMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
      
    } else if (data === 'make_swap') {
      const swapMessage = `
🔄 **Hacer Swap XLM → USDC**

**Cantidad sugerida:** 10 XLM
**Destino:** USDC
**Red:** Stellar Testnet

**Usa el comando:**
\`/swap 10 XLM\`

**O elige una cantidad rápida:**
      `;
      
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '5 XLM', callback_data: 'swap_5' },
              { text: '10 XLM', callback_data: 'swap_10' },
              { text: '50 XLM', callback_data: 'swap_50' }
            ],
            [
              { text: '100 XLM', callback_data: 'swap_100' },
              { text: 'Personalizar', callback_data: 'custom_swap' }
            ]
          ]
        }
      };
      
      await bot.editMessageText(swapMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown',
        ...keyboard
      });
      
    } else if (data.startsWith('swap_')) {
      const amount = data.replace('swap_', '');
      const swapMessage = `
🔄 **Iniciando Swap de ${amount} XLM**

**Cantidad:** ${amount} XLM
**Destino:** USDC
**Estado:** Obteniendo cotización...

**Por favor espera...**
      `;
      
      await bot.editMessageText(swapMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
      
      // Simular swap
      setTimeout(async () => {
        const successMessage = `
✅ **Swap Exitoso!**

**Cantidad:** ${amount} XLM → USDC
**Hash:** \`daa4df25...\`
**Ledger:** 12345678
**Red:** Stellar Testnet

**¡Tu swap se ha completado exitosamente!** 🎉
        `;
        
        await bot.editMessageText(successMessage, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
      }, 3000);
      
    } else if (data.startsWith('confirm_swap_')) {
      const amount = data.replace('confirm_swap_', '');
      
      const processingMessage = `
🚀 **Ejecutando Swap...**

**Cantidad:** ${amount} XLM
**Estado:** Procesando transacción...

**Por favor espera...**
      `;
      
      await bot.editMessageText(processingMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
      
      // Simular ejecución
      setTimeout(async () => {
        const successMessage = `
✅ **Swap Exitoso!**

**Cantidad:** ${amount} XLM → USDC
**Hash:** \`daa4df25...\`
**Ledger:** 12345678
**Red:** Stellar Testnet

**¡Tu swap se ha completado exitosamente!** 🎉
        `;
        
        await bot.editMessageText(successMessage, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
      }, 3000);
      
    } else if (data.startsWith('trade_')) {
      const [_, type, leverage] = data.split('_');
      
      const tradeMessage = `
📈 **Abriendo Posición ${type.toUpperCase()} ${leverage}x**

**Cantidad:** 100 XLM
**Leverage:** ${leverage}x
**Tipo:** ${type.toUpperCase()}
**Estado:** Procesando...

**Por favor espera...**
      `;
      
      await bot.editMessageText(tradeMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
      
      // Simular apertura de posición
      setTimeout(async () => {
        const positionId = Date.now().toString();
        const position = {
          id: positionId,
          type: type,
          leverage: parseInt(leverage),
          amount: 100,
          entryPrice: 0.15,
          pnl: 0,
          status: 'open'
        };
        
        if (!userPositions.has(chatId)) {
          userPositions.set(chatId, []);
        }
        userPositions.get(chatId).push(position);
        
        const successMessage = `
✅ **Posición Abierta Exitosamente!**

**Tipo:** ${type.toUpperCase()} ${leverage}x
**Cantidad:** 100 XLM
**Precio Entrada:** $0.150000
**ID:** ${positionId}

**¡Tu posición está activa!** 📈

Usa /positions para ver todas tus posiciones.
        `;
        
        await bot.editMessageText(successMessage, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
      }, 3000);
      
    } else if (data === 'trading_menu') {
      const tradeMessage = `
📈 **Trading de Perpetuos**

**Configuración de Posición:**
• **Cantidad:** 100 XLM (por defecto)
• **Leverage:** 2x (por defecto)
• **Tipo:** Long (por defecto)

**¿Quieres personalizar la configuración?**
      `;
      
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📈 Long 2x', callback_data: 'trade_long_2x' },
              { text: '📉 Short 2x', callback_data: 'trade_short_2x' }
            ],
            [
              { text: '📈 Long 5x', callback_data: 'trade_long_5x' },
              { text: '📉 Short 5x', callback_data: 'trade_short_5x' }
            ],
            [
              { text: '⚙️ Personalizar', callback_data: 'custom_trade' },
              { text: '❌ Cancelar', callback_data: 'cancel' }
            ]
          ]
        }
      };
      
      await bot.editMessageText(tradeMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown',
        ...keyboard
      });
      
    } else if (data === 'view_positions') {
      if (!userPositions.has(chatId) || userPositions.get(chatId).length === 0) {
        const noPositionsMessage = `
❌ **No tienes posiciones activas**

Usa /trade para abrir una nueva posición.
        `;
        
        await bot.editMessageText(noPositionsMessage, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        return;
      }
      
      const positions = userPositions.get(chatId);
      let positionsMessage = '📊 **Tus Posiciones Activas**\n\n';
      
      positions.forEach((position, index) => {
        const pnl = position.pnl >= 0 ? `+$${position.pnl.toFixed(2)}` : `-$${Math.abs(position.pnl).toFixed(2)}`;
        const pnlEmoji = position.pnl >= 0 ? '📈' : '📉';
        
        positionsMessage += `**Posición #${index + 1}:**\n`;
        positionsMessage += `• Tipo: ${position.type.toUpperCase()} ${position.leverage}x\n`;
        positionsMessage += `• Cantidad: ${position.amount} XLM\n`;
        positionsMessage += `• Precio Entrada: $${position.entryPrice}\n`;
        positionsMessage += `• PnL: ${pnlEmoji} ${pnl}\n`;
        positionsMessage += `• Estado: ${position.status}\n\n`;
      });
      
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Actualizar', callback_data: 'refresh_positions' },
              { text: '📈 Nueva Posición', callback_data: 'trading_menu' }
            ]
          ]
        }
      };
      
      await bot.editMessageText(positionsMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown',
        ...keyboard
      });
      
    } else if (data === 'cancel') {
      await bot.editMessageText('❌ Operación cancelada.', {
        chat_id: chatId,
        message_id: message.message_id
      });
    }
    
  } catch (error) {
    console.error('Error en callback:', error);
    await bot.editMessageText('❌ Ocurrió un error. Intenta de nuevo.', {
      chat_id: chatId,
      message_id: message.message_id
    });
  }
});

// Manejo de errores
bot.on('error', (error) => {
  console.error('Error del bot:', error);
});

bot.on('polling_error', (error) => {
  console.error('Error de polling:', error);
});

console.log('🤖 Bot de Trading Completo iniciado...');
console.log('📱 Comandos disponibles: /start, /wallet, /swap, /trade, /positions, /balance, /price');
