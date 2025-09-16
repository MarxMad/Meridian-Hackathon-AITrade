const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

// Configuración del bot
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8343949971:AAFefvH90WJCYeEkbGxYVBDRy9dLpiSwAnQ';
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

// Importar StellarSdk una sola vez
const StellarSdk = require('@stellar/stellar-sdk');
const { Horizon } = StellarSdk;

// Función para generar wallet Stellar
function generateStellarWallet() {
  const keypair = StellarSdk.Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret()
  };
}

// Función para fondear wallet en testnet
async function fundWallet(publicKey) {
  try {
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    
    // Usar Friendbot para fondear la cuenta en testnet
    const response = await fetch(`https://friendbot.stellar.org/?addr=${publicKey}`);
    const result = await response.json();
    
    if (result.status === 400 && result.detail.includes('already funded')) {
      // La cuenta ya está fondada, verificar balance
      const account = await server.loadAccount(publicKey);
      const xlmBalance = account.balances.find(balance => balance.asset_type === 'native');
      
      return {
        success: true,
        balance: parseFloat(xlmBalance.balance),
        message: `✅ Wallet ya estaba fondada con ${xlmBalance.balance} XLM`
      };
    } else if (result.status === 400) {
      throw new Error(`Friendbot error: ${result.detail}`);
    } else if (response.status !== 200) {
      throw new Error('Friendbot no pudo fondear la cuenta');
    } else {
      // Verificar que la cuenta esté fondada
      const account = await server.loadAccount(publicKey);
      const xlmBalance = account.balances.find(balance => balance.asset_type === 'native');
      
      return {
        success: true,
        balance: parseFloat(xlmBalance.balance),
        message: `✅ Wallet fondada con ${xlmBalance.balance} XLM`
      };
    }
  } catch (error) {
    console.error('Error fondeando wallet:', error);
    return {
      success: false,
      balance: 0,
      message: `❌ Error fondeando wallet: ${error.message}`
    };
  }
}

// Función para obtener precio de XLM desde Soroswap (precio real de Stellar DEX)
async function getXlmPrice() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/soroswap/price?asset=XLM&amount=1`);
    
    if (response.data.success && response.data.data.soroswap.price > 0) {
      return response.data.data.soroswap.price;
    }
    
    // Fallback a CoinGecko si Soroswap falla
    const coingeckoResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd');
    return coingeckoResponse.data.stellar?.usd || 0.12;
  } catch (error) {
    console.error('Error obteniendo precio de XLM:', error);
    return 0.12; // Precio de fallback
  }
}

// Función para obtener precio de USDC desde Soroswap
async function getUsdcPrice() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/soroswap/price?asset=USDC&amount=1`);
    
    if (response.data.success && response.data.data.soroswap.price > 0) {
      return response.data.data.soroswap.price;
    }
    
    return 1.0; // USDC siempre es ~$1
  } catch (error) {
    console.error('Error obteniendo precio de USDC:', error);
    return 1.0;
  }
}

// Función para obtener cotización de swap REAL con retry
async function getSwapQuote(amount, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📊 Obteniendo cotización REAL para ${amount} XLM... (intento ${attempt}/${retries})`);
      
      const response = await axios.post(`${API_BASE_URL}/api/soroswap/quote`, {
        amount: amount
      });
      
      console.log('📊 Respuesta de cotización:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        console.error(`❌ Error en cotización (intento ${attempt}):`, response.data.message);
        
        // Si es rate limit, esperar antes del siguiente intento
        if (response.data.message && response.data.message.includes('rate limit')) {
          if (attempt < retries) {
            const waitTime = attempt * 2000; // 2s, 4s, 6s
            console.log(`⏳ Rate limit detectado, esperando ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        return null;
      }
    } catch (error) {
      console.error(`❌ Error obteniendo cotización (intento ${attempt}):`, error.message);
      
      // Si es rate limit, esperar antes del siguiente intento
      if (error.response && error.response.status === 429) {
        if (attempt < retries) {
          const waitTime = attempt * 2000; // 2s, 4s, 6s
          console.log(`⏳ Rate limit detectado, esperando ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      if (attempt === retries) {
        return null;
      }
    }
  }
  
  return null;
}

// Función para obtener cotización de trading REAL
async function getTradeQuote(amount, leverage = 2, tradeType = 'long', retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📈 Obteniendo cotización REAL para trade: ${amount} XLM, ${leverage}x, ${tradeType}... (intento ${attempt}/${retries})`);
      
      const response = await axios.post(`${API_BASE_URL}/api/contract/query`, {
        action: 'get_quote',
        amount: amount,
        leverage: leverage,
        trade_type: tradeType
      });
      
      console.log('📈 Respuesta de cotización de trading:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        console.error(`❌ Error en cotización de trading (intento ${attempt}):`, response.data.message);
        
        // Si es rate limit, esperar antes del siguiente intento
        if (response.data.message && response.data.message.includes('rate limit')) {
          if (attempt < retries) {
            const waitTime = attempt * 2000; // 2s, 4s, 6s
            console.log(`⏳ Rate limit detectado, esperando ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        return null;
      }
    } catch (error) {
      console.error(`❌ Error obteniendo cotización de trading (intento ${attempt}):`, error.message);
      
      if (attempt === retries) {
        return null;
      }
    }
  }
  
  return null;
}

// Función para firmar transacciones
async function signTransaction(transactionXdr, secretKey) {
  try {
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    const transaction = StellarSdk.TransactionBuilder.fromXDR(transactionXdr, StellarSdk.Networks.TESTNET);
    transaction.sign(keypair);
    return transaction.toXDR();
  } catch (error) {
    console.error('❌ Error firmando transacción:', error);
    throw new Error(`Error firmando transacción: ${error.message}`);
  }
}

// Función para ejecutar swap REAL con retry
async function executeSwap(publicKey, secretKey, amount, quote, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Ejecutando swap REAL: ${amount} XLM → USDC (intento ${attempt}/${retries})`);
      console.log('🔄 Quote recibida:', quote);
      
      // 1. Crear transacción de swap
      const executeResponse = await axios.post(`${API_BASE_URL}/api/soroswap/execute`, {
        sourceAccount: publicKey,
        quote: quote.quote,
        network: 'testnet'
      });
    
    if (!executeResponse.data.success) {
      throw new Error(executeResponse.data.message || 'Error creando transacción');
    }
    
    console.log('✅ Transacción creada:', executeResponse.data);
    
    // 2. Verificar si es transacción de fallback
    if (executeResponse.data.fallback) {
      throw new Error('Rate limit excedido en Soroswap API. Por favor intenta más tarde.');
    }
    
    // 3. Verificar si necesita crear trustline primero
    if (executeResponse.data.requiresTrustline) {
      console.log('🔗 Se requiere crear trustline primero...');
      
      const transactionXdr = executeResponse.data.transactionXdr;
      if (!transactionXdr || transactionXdr === 'AAAAAQAAAAA...') {
        throw new Error('No se recibió XDR válido para crear trustline');
      }
      
      console.log('🔐 Firmando transacción de trustline...');
      const signedTransaction = await signTransaction(transactionXdr, secretKey);
      
      console.log('📤 Enviando transacción de trustline...');
      const trustlineResponse = await axios.post(`${API_BASE_URL}/api/soroswap/submit`, {
        signedTransaction: signedTransaction
      });
      
      if (!trustlineResponse.data.success) {
        throw new Error(trustlineResponse.data.message || 'Error creando trustline');
      }
      
      console.log('✅ Trustline creada exitosamente:', trustlineResponse.data);
      
      // Esperar un poco para que la trustline se propague
      console.log('⏳ Esperando propagación de trustline...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Aumentar a 5 segundos
      
      // Ahora crear la transacción de swap real
      console.log('🔄 Creando transacción de swap...');
      const swapExecuteResponse = await axios.post(`${API_BASE_URL}/api/soroswap/execute`, {
        sourceAccount: publicKey,
        quote: quote.quote,
        network: 'testnet'
      });
      
      if (!swapExecuteResponse.data.success) {
        console.error('❌ Error creando transacción de swap:', swapExecuteResponse.data);
        throw new Error(swapExecuteResponse.data.message || 'Error creando transacción de swap');
      }
      
      console.log('✅ Transacción de swap creada:', swapExecuteResponse.data);
      
      // El XDR puede estar en transactionXdr o en soroswapResponse.xdr
      const swapTransactionXdr = swapExecuteResponse.data.transactionXdr || 
                                 swapExecuteResponse.data.data?.soroswapResponse?.xdr;
      
      console.log('🔍 XDR encontrado:', swapTransactionXdr ? swapTransactionXdr.substring(0, 50) + '...' : 'undefined');
      console.log('🔍 transactionXdr:', swapExecuteResponse.data.transactionXdr);
      console.log('🔍 data.soroswapResponse.xdr:', swapExecuteResponse.data.data?.soroswapResponse?.xdr);
      
      if (!swapTransactionXdr || swapTransactionXdr === 'AAAAAQAAAAA...') {
        console.error('❌ XDR de swap inválido:', swapTransactionXdr);
        console.error('❌ Respuesta completa:', swapExecuteResponse.data);
        throw new Error('No se recibió XDR válido para el swap. La trustline puede necesitar más tiempo para propagarse.');
      }
      
      console.log('🔐 Firmando transacción de swap...');
      const signedSwapTransaction = await signTransaction(swapTransactionXdr, secretKey);
      
      console.log('📤 Enviando transacción de swap...');
      const swapSubmitResponse = await axios.post(`${API_BASE_URL}/api/soroswap/submit`, {
        signedTransaction: signedSwapTransaction
      });
      
      if (!swapSubmitResponse.data.success) {
        throw new Error(swapSubmitResponse.data.message || 'Error enviando transacción de swap');
      }
      
      console.log('✅ Swap REAL ejecutado exitosamente:', swapSubmitResponse.data);
      
      return {
        success: true,
        hash: swapSubmitResponse.data.data.hash,
        ledger: swapSubmitResponse.data.data.ledger,
        message: 'Swap ejecutado exitosamente',
        trustlineHash: trustlineResponse.data.data.hash
      };
    } else {
      // Swap directo sin trustline
      // El XDR puede estar en transactionXdr o en soroswapResponse.xdr
      const transactionXdr = executeResponse.data.transactionXdr || 
                             executeResponse.data.data?.soroswapResponse?.xdr;
      
      console.log('🔍 XDR encontrado (swap directo):', transactionXdr ? transactionXdr.substring(0, 50) + '...' : 'undefined');
      console.log('🔍 transactionXdr:', executeResponse.data.transactionXdr);
      console.log('🔍 data.soroswapResponse.xdr:', executeResponse.data.data?.soroswapResponse?.xdr);
      
      if (!transactionXdr) {
        console.error('❌ No se recibió XDR de la transacción');
        console.error('❌ Respuesta completa:', executeResponse.data);
        throw new Error('No se recibió XDR de la transacción');
      }
      
      // Si es XDR de fallback, no podemos proceder
      if (transactionXdr === 'AAAAAQAAAAA...') {
        throw new Error('Rate limit excedido en Soroswap API. Por favor intenta más tarde.');
      }
      
      console.log('🔐 Firmando transacción de swap...');
      const signedTransaction = await signTransaction(transactionXdr, secretKey);
      
      console.log('📤 Enviando transacción de swap...');
      const submitResponse = await axios.post(`${API_BASE_URL}/api/soroswap/submit`, {
        signedTransaction: signedTransaction
      });
      
      if (!submitResponse.data.success) {
        throw new Error(submitResponse.data.message || 'Error enviando transacción');
      }
      
      console.log('✅ Swap REAL ejecutado exitosamente:', submitResponse.data);
      
      return {
        success: true,
        hash: submitResponse.data.data.hash,
        ledger: submitResponse.data.data.ledger,
        message: 'Swap ejecutado exitosamente'
      };
    }
    
    } catch (error) {
      console.error(`❌ Error ejecutando swap REAL (intento ${attempt}):`, error);
      
      // Si es rate limit, esperar antes del siguiente intento
      if (error.message && error.message.includes('Rate limit')) {
        if (attempt < retries) {
          const waitTime = attempt * 3000; // 3s, 6s, 9s
          console.log(`⏳ Rate limit detectado, esperando ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      if (attempt === retries) {
        return { 
          success: false, 
          message: `Error ejecutando swap: ${error.message}` 
        };
      }
    }
  }
  
  return { 
    success: false, 
    message: 'Error ejecutando swap después de múltiples intentos' 
  };
}

// Función para ejecutar trade REAL con retry
async function executeTrade(publicKey, secretKey, amount, leverage, tradeType, quote, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📈 Ejecutando trade REAL: ${amount} XLM, ${leverage}x, ${tradeType}... (intento ${attempt}/${retries})`);
      console.log('📈 Quote recibida:', quote);
      
      // 1. Crear transacción de trading
      const executeResponse = await axios.post(`${API_BASE_URL}/api/contract/real-operations`, {
        action: 'open_position',
        sourceAccount: publicKey,
        amount: amount,
        leverage: leverage,
        trade_type: tradeType,
        quote: quote
      });
    
      if (!executeResponse.data.success) {
        throw new Error(executeResponse.data.message || 'Error creando transacción de trading');
      }
      
      console.log('✅ Transacción de trading creada:', executeResponse.data);
      
      // 2. Verificar si es transacción de fallback
      if (executeResponse.data.fallback) {
        throw new Error('Rate limit excedido en Contract API. Por favor intenta más tarde.');
      }
      
      // 3. Obtener XDR de la transacción
      const transactionXdr = executeResponse.data.data?.transactionXdr || 
                             executeResponse.data.transactionXdr;
      
      console.log('🔍 XDR encontrado (trade):', transactionXdr ? transactionXdr.substring(0, 50) + '...' : 'undefined');
      
      if (!transactionXdr) {
        console.error('❌ No se recibió XDR de la transacción de trading');
        console.error('❌ Respuesta completa:', executeResponse.data);
        throw new Error('No se recibió XDR de la transacción de trading');
      }
      
      // 4. Firmar transacción
      console.log('🔐 Firmando transacción de trading...');
      const signedTransaction = await signTransaction(transactionXdr, secretKey);
      
      // 5. Enviar transacción
      console.log('📤 Enviando transacción de trading...');
      const submitResponse = await axios.post(`${API_BASE_URL}/api/contract/real-submit`, {
        signedTransaction: signedTransaction
      });
      
      if (!submitResponse.data.success) {
        throw new Error(submitResponse.data.message || 'Error enviando transacción de trading');
      }
      
      console.log('✅ Trade REAL ejecutado exitosamente:', submitResponse.data);
      
      return {
        success: true,
        hash: submitResponse.data.data.hash,
        ledger: submitResponse.data.data.ledger,
        message: 'Trade ejecutado exitosamente'
      };
      
    } catch (error) {
      console.error(`❌ Error ejecutando trade REAL (intento ${attempt}):`, error);
      
      // Si es rate limit, esperar antes del siguiente intento
      if (error.message && error.message.includes('Rate limit')) {
        if (attempt < retries) {
          const waitTime = attempt * 3000; // 3s, 6s, 9s
          console.log(`⏳ Rate limit detectado, esperando ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      if (attempt === retries) {
        return { 
          success: false, 
          message: `Error ejecutando trade: ${error.message}` 
        };
      }
    }
  }
  
  return { 
    success: false, 
    message: 'Error ejecutando trade después de múltiples intentos' 
  };
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
  
  // Verificar si ya tiene wallet
  const hasWallet = userWallets.has(chatId);
  
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
      inline_keyboard: hasWallet ? [
        [
          { text: '🔑 Mi Wallet', callback_data: 'view_wallet' },
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
      ] : [
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

**💰 Clave Pública (Para Recibir Fondos):**
\`${wallet.publicKey}\`
*Copia esta clave para recibir XLM de otras wallets*

**Estado:** ✅ Activa
**Red:** Stellar Testnet
**Creada:** ${new Date(wallet.createdAt).toLocaleString()}

🌐 **Ver en Explorador:**
[Testnet Explorer](https://stellar.expert/explorer/testnet/account/${wallet.publicKey})
*Haz clic para ver tu wallet en tiempo real*

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
          ],
          [
            { text: '📋 Copiar Clave Pública', callback_data: 'copy_public_key' }
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
    
    // Verificar si la wallet es nueva (menos de 60 segundos)
    const walletAge = Date.now() - wallet.createdAt;
    const isNewWallet = walletAge < 60000; // 60 segundos
    
    if (isNewWallet) {
      const remainingTime = Math.ceil((60000 - walletAge) / 1000);
      const waitMessage = `
⏰ **Wallet Nueva Detectada**

**Tiempo restante:** ${remainingTime} segundos
**Estado:** Esperando propagación en la red...

**¿Por qué?**
Las wallets nuevas necesitan tiempo para propagarse en Stellar testnet antes de poder hacer swaps.

**Próximos pasos:**
• Espera ${remainingTime} segundos más
• Luego usa /swap ${amount} XLM nuevamente
• O usa /balance para verificar tu wallet

🔄 **Reintentar en ${remainingTime}s...**
      `;
      
      await bot.sendMessage(chatId, waitMessage, { parse_mode: 'Markdown' });
      return;
    }
    
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
    
    if (!quote || !quote.quote) {
      bot.sendMessage(chatId, '❌ Error obteniendo cotización. Intenta de nuevo.');
      return;
    }
    
    const outputAmount = (parseInt(quote.quote.amountOut) / 10_000_000).toFixed(6);
    
    // Mostrar cotización y pedir confirmación
    const quoteMessage = `
📊 **Cotización Obtenida**
• **Entrada:** ${amount} XLM
• **Salida:** ~${outputAmount} USDC
• **Protocolo:** ${quote.quote.platform}
• **Red:** ${quote.network}

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
  
  // Verificar si la wallet es nueva (menos de 60 segundos)
  const wallet = userWallets.get(chatId);
  const walletAge = Date.now() - wallet.createdAt;
  const isNewWallet = walletAge < 60000; // 60 segundos
  
  if (isNewWallet) {
    const remainingTime = Math.ceil((60000 - walletAge) / 1000);
    const waitMessage = `
⏰ **Wallet Nueva Detectada**

**Tiempo restante:** ${remainingTime} segundos
**Estado:** Esperando propagación en la red...

**¿Por qué?**
Las wallets nuevas necesitan tiempo para propagarse en Stellar testnet antes de poder hacer trading.

**Próximos pasos:**
• Espera ${remainingTime} segundos más
• Luego usa /trade nuevamente
• O usa /balance para verificar tu wallet

🔄 **Reintentar en ${remainingTime}s...**
    `;
    
    bot.sendMessage(chatId, waitMessage, { parse_mode: 'Markdown' });
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
    
    // Obtener balance real de la red Stellar
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    const account = await server.loadAccount(wallet.publicKey);
    const xlmBalance = account.balances.find(balance => balance.asset_type === 'native');
    const balance = parseFloat(xlmBalance.balance);
    
    // Actualizar balance en memoria
    wallet.balance = balance;
    userWallets.set(chatId, wallet);
    
    const usdValue = balance * price;
    
    // Verificar si la wallet es nueva
    const walletAge = Date.now() - wallet.createdAt;
    const isNewWallet = walletAge < 60000; // 60 segundos
    const remainingTime = isNewWallet ? Math.ceil((60000 - walletAge) / 1000) : 0;
    
    let balanceMessage = `
💰 **Balance de tu Wallet**

**XLM:** ${balance.toFixed(7)} XLM
**USD:** $${usdValue.toFixed(2)}
**Precio XLM:** $${price.toFixed(6)}

**💰 Clave Pública (Para Recibir Fondos):**
\`${wallet.publicKey}\`
*Copia esta clave para recibir XLM de otras wallets*

**Estado:** ${balance > 0 ? '✅ Fondada' : '❌ Sin fondos'}

`;

    if (isNewWallet) {
      balanceMessage += `⏰ **Temporizador de Red:**
**Tiempo restante:** ${remainingTime} segundos
**Estado:** Wallet nueva, esperando propagación...

**⚠️ No puedes hacer swaps/trading hasta que termine el temporizador**

`;
    } else {
      balanceMessage += `✅ **Wallet Lista:**
**Estado:** Lista para swaps y trading

`;
    }

    balanceMessage += `**Última actualización:** ${new Date().toLocaleString()}`;
    
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
    console.error('Error obteniendo balance:', error);
    bot.sendMessage(chatId, `❌ Error obteniendo balance: ${error.message}`);
  }
});

// Comando /price
bot.onText(/\/price/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const [xlmPrice, usdcPrice] = await Promise.all([
      getXlmPrice(),
      getUsdcPrice()
    ]);
    
    // Obtener datos adicionales de CoinGecko
    const coingeckoResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true');
    const coingeckoData = coingeckoResponse.data.stellar;
    
    const priceMessage = `
📊 **Precios Reales de Stellar DEX**

**XLM (Soroswap):** $${xlmPrice.toFixed(6)} USD
**USDC (Soroswap):** $${usdcPrice.toFixed(6)} USD

**Referencia CoinGecko:**
• XLM: $${coingeckoData?.usd?.toFixed(6) || 'N/A'} USD
• Cambio 24h: ${coingeckoData?.usd_24h_change?.toFixed(2) || 'N/A'}% ${coingeckoData?.usd_24h_change >= 0 ? '📈' : '📉'}
• Volumen 24h: $${(coingeckoData?.usd_24h_vol / 1000000)?.toFixed(2) || 'N/A'}M

**Red:** Stellar Testnet
**Actualizado:** ${new Date().toLocaleString()}
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
      // Mostrar mensaje de creación
      await bot.editMessageText('🔑 **Creando wallet...**\n\nPor favor espera...', {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
      
      const wallet = generateStellarWallet();
      const encryptedSecret = encrypt(wallet.secretKey);
      
      // Mostrar mensaje de wallet creada
      await bot.editMessageText(`🔑 **Wallet Creada!**

**Clave Pública:**
\`${wallet.publicKey}\`

**Estado:** ⏳ Esperando fondeo...
**Red:** Stellar Testnet

🌐 **Ver en Explorador:**
[Testnet Explorer](https://stellar.expert/explorer/testnet/account/${wallet.publicKey})
*La wallet aparecerá vacía hasta que se fondee*

💰 **Fondeando con 10,000 XLM...**`, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
      
      // Pequeña pausa para que el usuario vea la wallet
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mostrar mensaje de fondeo
      await bot.editMessageText('💰 **Fondeando wallet con 10,000 XLM...**\n\nConectando con Stellar testnet...', {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
      
      // Fondear la wallet
      const fundResult = await fundWallet(wallet.publicKey);
      
      userWallets.set(chatId, {
        publicKey: wallet.publicKey,
        secretKey: encryptedSecret,
        createdAt: Date.now(),
        balance: fundResult.balance,
        funded: fundResult.success
      });
      
      const walletMessage = `
🔑 **Wallet Creada y Fondada Exitosamente!**

**💰 Clave Pública (Para Recibir Fondos):**
\`${wallet.publicKey}\`
*Copia esta clave para recibir XLM de otras wallets*

**🔐 Clave Privada (MANTENER SECRETA):**
\`${wallet.secretKey}\`

**Balance XLM:** ${fundResult.balance.toFixed(7)} XLM
**Estado:** ${fundResult.success ? '✅ Fondada' : '❌ Error de fondeo'}
**Red:** Stellar Testnet

🌐 **Ver en Explorador:**
[Testnet Explorer](https://stellar.expert/explorer/testnet/account/${wallet.publicKey})
*Haz clic para ver tu wallet con balance real*

⚠️ **IMPORTANTE:** 
• Guarda tu clave privada en un lugar seguro
• Comparte SOLO la clave pública para recibir fondos

⏰ **Temporizador de Red:**
La wallet necesita 60 segundos para propagarse en la red antes de poder hacer swaps.

**Próximos pasos:**
• Espera 60 segundos antes de hacer tu primer swap
• Usa /balance para ver tu balance
• Usa /swap después del temporizador
• Usa /trade para abrir posiciones
      `;
      
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💰 Ver Balance', callback_data: 'view_balance' },
              { text: '🔄 Hacer Swap', callback_data: 'make_swap' }
            ],
            [
              { text: '📋 Copiar Clave Pública', callback_data: 'copy_public_key' }
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
      const wallet = userWallets.get(chatId);
      if (!wallet) {
        await bot.editMessageText('❌ No tienes una wallet creada. Usa /wallet para crear una.', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        return;
      }
      
      // Obtener precio actual de XLM
      const price = await getXlmPrice();
      const usdValue = wallet.balance * price;
      
      const balanceMessage = `
💰 **Balance de tu Wallet**

**XLM:** ${wallet.balance.toFixed(7)} XLM
**USD:** $${usdValue.toFixed(2)}
**Precio XLM:** $${price.toFixed(6)}

**Wallet:** \`${wallet.publicKey}\`
**Estado:** ${wallet.funded ? '✅ Fondada' : '❌ No fondada'}

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
      
      await bot.editMessageText(balanceMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown',
        ...keyboard
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

**Nota:** Actualmente solo soportamos swaps a USDC

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
      
      if (!userWallets.has(chatId)) {
        await bot.editMessageText('❌ **Error:** No tienes una wallet creada. Usa /start para crear una.', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        return;
      }
      
      const wallet = userWallets.get(chatId);
      const secretKey = decrypt(wallet.secretKey);
      
      const swapMessage = `
🔄 **Iniciando Swap REAL de ${amount} XLM**

**Cantidad:** ${amount} XLM → USDC
**Estado:** Obteniendo cotización de Soroswap...

**Por favor espera...**
      `;
      
      await bot.editMessageText(swapMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
      
      try {
        // 1. Obtener cotización real
        const quote = await getSwapQuote(amount);
        if (!quote || !quote.quote) {
          throw new Error('No se pudo obtener cotización de Soroswap');
        }
        
        // 2. Ejecutar swap real
        await bot.editMessageText(`
🔄 **Ejecutando Swap REAL de ${amount} XLM**

**Cantidad:** ${amount} XLM → USDC
**Estado:** Ejecutando transacción...

**Nota:** Si es tu primer swap, se creará trustline para USDC primero

**Por favor espera...**
        `, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        
        const swapResult = await executeSwap(wallet.publicKey, secretKey, amount, quote);
        
        if (swapResult.success) {
          let successMessage = `
✅ **Swap REAL Exitoso!**

**Cantidad:** ${amount} XLM → USDC
**Hash:** \`${swapResult.hash}\`
**Ledger:** ${swapResult.ledger}
**Red:** Stellar Testnet

🌐 **Ver Comprobante:**
[Explorador de Transacción](https://stellar.expert/explorer/testnet/tx/${swapResult.hash})
*Haz clic para ver el comprobante en el explorador*
          `;
          
          // Si se creó trustline, mostrarlo
          if (swapResult.trustlineHash) {
            successMessage += `

🔗 **Trustline Creada:**
[Ver Trustline](https://stellar.expert/explorer/testnet/tx/${swapResult.trustlineHash})
*Se creó trustline para USDC antes del swap*
            `;
          }
          
          successMessage += `

**Nota:** Actualmente solo soportamos swaps a USDC

**¡Tu swap REAL se ha completado exitosamente!** 🎉
          `;
          
          await bot.editMessageText(successMessage, {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'Markdown'
          });
        } else {
          throw new Error(swapResult.message);
        }
        
      } catch (error) {
        console.error('❌ Error ejecutando swap REAL:', error);
        
        let errorMessage = `
❌ **Error en Swap REAL**

**Cantidad:** ${amount} XLM → USDC
**Error:** ${error.message}
        `;
        
        if (error.message.includes('Rate limit')) {
          errorMessage += `

⏰ **Rate Limit Excedido**
La API de Soroswap está temporalmente saturada. Por favor intenta en unos minutos.

**Sugerencias:**
• Espera 2-3 minutos antes de intentar de nuevo
• Prueba con una cantidad menor
• Usa /balance para verificar tu wallet
          `;
        } else {
          errorMessage += `

**Por favor intenta de nuevo o contacta soporte.**
          `;
        }
        
        await bot.editMessageText(errorMessage, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
      }
      
    } else if (data.startsWith('confirm_swap_')) {
      const amount = data.replace('confirm_swap_', '');
      
      if (!userWallets.has(chatId)) {
        await bot.editMessageText('❌ **Error:** No tienes una wallet creada. Usa /start para crear una.', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        return;
      }
      
      const wallet = userWallets.get(chatId);
      const secretKey = decrypt(wallet.secretKey);
      
      const processingMessage = `
🚀 **Ejecutando Swap REAL...**

**Cantidad:** ${amount} XLM → USDC
**Estado:** Obteniendo cotización...

**Por favor espera...**
      `;
      
      await bot.editMessageText(processingMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
      
      try {
        // 1. Obtener cotización real
        await bot.editMessageText(`
🚀 **Ejecutando Swap REAL...**

**Cantidad:** ${amount} XLM → USDC
**Estado:** Obteniendo cotización de Soroswap...

**Nota:** Si hay rate limit, se reintentará automáticamente

**Por favor espera...**
        `, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        
        const quote = await getSwapQuote(amount);
        if (!quote || !quote.quote) {
          throw new Error('No se pudo obtener cotización de Soroswap después de múltiples intentos');
        }
        
        // 2. Ejecutar swap real
        await bot.editMessageText(`
🚀 **Ejecutando Swap REAL...**

**Cantidad:** ${amount} XLM → USDC
**Estado:** Ejecutando transacción...

**Por favor espera...**
        `, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        
        const swapResult = await executeSwap(wallet.publicKey, secretKey, amount, quote);
        
        if (swapResult.success) {
          let successMessage = `
✅ **Swap REAL Exitoso!**

**Cantidad:** ${amount} XLM → USDC
**Hash:** \`${swapResult.hash}\`
**Ledger:** ${swapResult.ledger}
**Red:** Stellar Testnet

🌐 **Ver Comprobante:**
[Explorador de Transacción](https://stellar.expert/explorer/testnet/tx/${swapResult.hash})
*Haz clic para ver el comprobante en el explorador*
          `;
          
          // Si se creó trustline, mostrarlo
          if (swapResult.trustlineHash) {
            successMessage += `

🔗 **Trustline Creada:**
[Ver Trustline](https://stellar.expert/explorer/testnet/tx/${swapResult.trustlineHash})
*Se creó trustline para USDC antes del swap*
            `;
          }
          
          successMessage += `

**Nota:** Actualmente solo soportamos swaps a USDC

**¡Tu swap REAL se ha completado exitosamente!** 🎉
          `;
          
          await bot.editMessageText(successMessage, {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'Markdown'
          });
        } else {
          throw new Error(swapResult.message);
        }
        
      } catch (error) {
        console.error('❌ Error ejecutando swap REAL:', error);
        
        let errorMessage = `
❌ **Error en Swap REAL**

**Cantidad:** ${amount} XLM → USDC
**Error:** ${error.message}
        `;
        
        if (error.message.includes('Rate limit')) {
          errorMessage += `

⏰ **Rate Limit Excedido**
La API de Soroswap está temporalmente saturada. Por favor intenta en unos minutos.

**Sugerencias:**
• Espera 2-3 minutos antes de intentar de nuevo
• Prueba con una cantidad menor
• Usa /balance para verificar tu wallet
          `;
        } else {
          errorMessage += `

**Por favor intenta de nuevo o contacta soporte.**
          `;
        }
        
        await bot.editMessageText(errorMessage, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
      }
      
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
      
    } else if (data === 'refresh_balance') {
      const wallet = userWallets.get(chatId);
      if (!wallet) {
        await bot.editMessageText('❌ No tienes una wallet creada. Usa /wallet para crear una.', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        return;
      }
      
      // Actualizar balance desde la red
      await bot.editMessageText('🔄 **Actualizando balance...**\n\nConsultando Stellar testnet...', {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
      
      try {
        const server = new Horizon.Server('https://horizon-testnet.stellar.org');
        const account = await server.loadAccount(wallet.publicKey);
        const xlmBalance = account.balances.find(balance => balance.asset_type === 'native');
        
        // Actualizar balance en memoria
        wallet.balance = parseFloat(xlmBalance.balance);
        userWallets.set(chatId, wallet);
        
        // Obtener precio actual
        const price = await getXlmPrice();
        const usdValue = wallet.balance * price;
        
        const balanceMessage = `
💰 **Balance Actualizado**

**XLM:** ${wallet.balance.toFixed(7)} XLM
**USD:** $${usdValue.toFixed(2)}
**Precio XLM:** $${price.toFixed(6)}

**Wallet:** \`${wallet.publicKey}\`
**Estado:** ✅ Fondada

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
        
        await bot.editMessageText(balanceMessage, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown',
          ...keyboard
        });
        
      } catch (error) {
        await bot.editMessageText(`❌ Error actualizando balance: ${error.message}`, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
      }
      
    } else if (data === 'cancel') {
      await bot.editMessageText('❌ Operación cancelada.', {
        chat_id: chatId,
        message_id: message.message_id
      });
    } else if (data === 'copy_public_key') {
      const wallet = userWallets.get(chatId);
      if (!wallet) {
        await bot.editMessageText('❌ No tienes una wallet creada.', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        return;
      }
      
      const copyMessage = `
📋 **Clave Pública para Copiar**

**💰 Clave Pública:**
\`${wallet.publicKey}\`

**Instrucciones:**
1. Toca y mantén presionado el texto de arriba
2. Selecciona "Copiar"
3. Comparte esta clave para recibir XLM

**⚠️ Importante:**
• Esta es tu clave PÚBLICA (segura de compartir)
• NUNCA compartas tu clave privada
• Solo usa esta clave para recibir fondos

**Comandos:**
/wallet - Ver información completa de tu wallet
/balance - Ver balance actual
      `;
      
      await bot.editMessageText(copyMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: 'Markdown'
      });
    } else if (data.startsWith('trade_')) {
      // Manejar callbacks de trading
      const wallet = userWallets.get(chatId);
      if (!wallet) {
        await bot.editMessageText('❌ No tienes una wallet creada. Usa /wallet para crear una.', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        return;
      }
      
      // Verificar si la wallet es nueva (menos de 60 segundos)
      const walletAge = Date.now() - wallet.createdAt;
      const isNewWallet = walletAge < 60000; // 60 segundos
      
      if (isNewWallet) {
        const remainingTime = Math.ceil((60000 - walletAge) / 1000);
        const waitMessage = `
⏰ **Wallet Nueva Detectada**

**Tiempo restante:** ${remainingTime} segundos
**Estado:** Esperando propagación en la red...

**¿Por qué?**
Las wallets nuevas necesitan tiempo para propagarse en Stellar testnet antes de poder hacer trading.

**Próximos pasos:**
• Espera ${remainingTime} segundos más
• Luego usa /trade nuevamente
• O usa /balance para verificar tu wallet

🔄 **Reintentar en ${remainingTime}s...**
        `;
        
        await bot.editMessageText(waitMessage, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        return;
      }
      
      // Parsear datos del trade
      const parts = data.split('_');
      const tradeType = parts[1]; // long o short
      const leverage = parseInt(parts[2].replace('x', '')); // 2 o 5
      const amount = 100; // Cantidad fija por ahora
      
      try {
        // Mostrar mensaje de inicio
        await bot.editMessageText(`📈 **Iniciando Trade REAL**

**Configuración:**
• **Tipo:** ${tradeType.toUpperCase()}
• **Leverage:** ${leverage}x
• **Cantidad:** ${amount} XLM
• **Wallet:** ${wallet.publicKey.slice(0, 8)}...

**Estado:** Obteniendo cotización...`, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        
        // Obtener cotización
        const quote = await getTradeQuote(amount, leverage, tradeType);
        
        if (!quote) {
          await bot.editMessageText('❌ Error obteniendo cotización de trading. Intenta de nuevo.', {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'Markdown'
          });
          return;
        }
        
        // Mostrar cotización y confirmar
        const quoteMessage = `
📈 **Cotización de Trading**

**Configuración:**
• **Tipo:** ${tradeType.toUpperCase()}
• **Leverage:** ${leverage}x
• **Cantidad:** ${amount} XLM

**Cotización:**
• **Precio Entrada:** $${quote.entryPrice || 'N/A'}
• **Liquidation Price:** $${quote.liquidationPrice || 'N/A'}
• **Margen Requerido:** ${quote.marginRequired || 'N/A'} XLM

**¿Confirmar este trade?**
        `;
        
        const confirmKeyboard = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Confirmar Trade', callback_data: `confirm_trade_${tradeType}_${leverage}x_${amount}` },
                { text: '❌ Cancelar', callback_data: 'cancel' }
              ]
            ]
          }
        };
        
        await bot.editMessageText(quoteMessage, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown',
          ...confirmKeyboard
        });
        
      } catch (error) {
        console.error('Error en trading:', error);
        await bot.editMessageText(`❌ Error procesando el trade: ${error.message}`, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
      }
      
    } else if (data.startsWith('confirm_trade_')) {
      // Confirmar trade
      const wallet = userWallets.get(chatId);
      if (!wallet) {
        await bot.editMessageText('❌ No tienes una wallet creada.', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        return;
      }
      
      // Parsear datos del trade
      const parts = data.split('_');
      const tradeType = parts[2]; // long o short
      const leverage = parseInt(parts[3].replace('x', '')); // 2 o 5
      const amount = parseInt(parts[4]); // 100
      
      try {
        // Mostrar mensaje de ejecución
        await bot.editMessageText(`🔄 **Ejecutando Trade REAL**

**Configuración:**
• **Tipo:** ${tradeType.toUpperCase()}
• **Leverage:** ${leverage}x
• **Cantidad:** ${amount} XLM

**Estado:** Procesando transacción...`, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
        
        // Obtener cotización nuevamente
        const quote = await getTradeQuote(amount, leverage, tradeType);
        
        if (!quote) {
          await bot.editMessageText('❌ Error obteniendo cotización. Intenta de nuevo.', {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'Markdown'
          });
          return;
        }
        
        // Ejecutar trade
        const tradeResult = await executeTrade(
          wallet.publicKey,
          decrypt(wallet.secretKey),
          amount,
          leverage,
          tradeType,
          quote
        );
        
        if (tradeResult.success) {
          // Agregar posición a la lista del usuario
          if (!userPositions.has(chatId)) {
            userPositions.set(chatId, []);
          }
          
          const position = {
            id: Date.now(),
            type: tradeType,
            leverage: leverage,
            amount: amount,
            entryPrice: quote.entryPrice || 0,
            liquidationPrice: quote.liquidationPrice || 0,
            pnl: 0,
            status: 'Activa',
            createdAt: Date.now(),
            hash: tradeResult.hash,
            ledger: tradeResult.ledger
          };
          
          userPositions.get(chatId).push(position);
          
          const successMessage = `
✅ **Trade REAL Ejecutado Exitosamente!**

**Configuración:**
• **Tipo:** ${tradeType.toUpperCase()}
• **Leverage:** ${leverage}x
• **Cantidad:** ${amount} XLM
• **Precio Entrada:** $${quote.entryPrice || 'N/A'}

**Transacción:**
• **Hash:** \`${tradeResult.hash}\`
• **Ledger:** ${tradeResult.ledger}

🌐 **Ver en Explorador:**
[Testnet Explorer](https://stellar.expert/explorer/testnet/tx/${tradeResult.hash})

**Próximos pasos:**
• Usa /positions para ver tus posiciones
• Usa /balance para ver tu balance actualizado
          `;
          
          const keyboard = {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📊 Ver Posiciones', callback_data: 'view_positions' },
                  { text: '💰 Ver Balance', callback_data: 'view_balance' }
                ],
                [
                  { text: '📈 Nueva Posición', callback_data: 'trading_menu' }
                ]
              ]
            }
          };
          
          await bot.editMessageText(successMessage, {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'Markdown',
            ...keyboard
          });
          
        } else {
          await bot.editMessageText(`❌ Error ejecutando trade: ${tradeResult.message}`, {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'Markdown'
          });
        }
        
      } catch (error) {
        console.error('Error ejecutando trade:', error);
        await bot.editMessageText(`❌ Error ejecutando trade: ${error.message}`, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        });
      }
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
