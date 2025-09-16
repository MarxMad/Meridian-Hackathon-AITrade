#!/usr/bin/env python3
"""
Bot de Telegram para Trading Automatizado en Stellar
Integra con el contrato de trading desplegado en Stellar testnet
"""

import os
import json
import requests
import asyncio
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
from stellar_sdk import Server, Keypair, TransactionBuilder, Network, Asset
from stellar_sdk.exceptions import NotFoundError, BadResponseError

# Configuración
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
STELLAR_NETWORK = "testnet"
CONTRACT_ID = "CCZADOPVO32ZSR5GYCDPUCBYDTKSR2QKR5PCHCRNUG7ANEBWB4G5RU5E"
SOROSWAP_API_KEY = "sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec"

# Configurar Stellar
server = Server("https://soroban-testnet.stellar.org")
network_passphrase = Network.TESTNET_NETWORK_PASSPHRASE

# Almacenamiento de usuarios (en producción usar base de datos)
user_wallets = {}
user_positions = {}

class StellarTradingBot:
    def __init__(self):
        self.contract_id = CONTRACT_ID
        self.server = server
        
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /start"""
        user_id = update.effective_user.id
        username = update.effective_user.username or "Usuario"
        
        welcome_text = f"""
🤖 **¡Hola {username}!** 

Soy tu bot de trading automatizado en Stellar. Puedo ayudarte a:

💰 **Trading de Perpetuos**
- Abrir posiciones long/short
- Cerrar posiciones automáticamente
- Calcular PnL en tiempo real

🤖 **Trading Automatizado**
- Estrategias de momentum
- Mean reversion
- Breakout trading

📊 **Monitoreo**
- Precios en tiempo real
- Historial de transacciones
- Estadísticas de trading

**Comandos disponibles:**
/help - Ver todos los comandos
/wallet - Crear/gestionar wallet
/price - Ver precios actuales
/trade - Abrir posición
/positions - Ver posiciones activas
/close - Cerrar posición
/auto - Trading automatizado
        """
        
        keyboard = [
            [InlineKeyboardButton("💰 Crear Wallet", callback_data="create_wallet")],
            [InlineKeyboardButton("📊 Ver Precios", callback_data="view_prices")],
            [InlineKeyboardButton("📈 Trading", callback_data="trading_menu")],
            [InlineKeyboardButton("🤖 Auto Trading", callback_data="auto_trading")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(welcome_text, parse_mode='Markdown', reply_markup=reply_markup)
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /help"""
        help_text = """
🤖 **Comandos del Bot de Trading**

**📱 Comandos Básicos:**
/start - Iniciar el bot
/help - Ver esta ayuda
/status - Estado del sistema

**💰 Wallet:**
/wallet - Crear o ver wallet
/balance - Ver balance de XLM

**📊 Trading:**
/price - Ver precios actuales
/trade - Abrir nueva posición
/positions - Ver posiciones activas
/close - Cerrar posición
/history - Historial de transacciones

**🤖 Automatización:**
/auto - Configurar trading automático
/strategies - Ver estrategias disponibles
/stop - Detener trading automático

**📈 Análisis:**
/stats - Estadísticas personales
/global - Estadísticas globales
/leaderboard - Ranking de traders

**⚙️ Configuración:**
/settings - Configurar preferencias
/alerts - Configurar alertas
        """
        await update.message.reply_text(help_text, parse_mode='Markdown')
    
    async def create_wallet(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Crear wallet para el usuario"""
        user_id = update.effective_user.id
        
        # Generar nueva keypair
        keypair = Keypair.random()
        public_key = keypair.public_key
        secret_key = keypair.secret
        
        # Guardar wallet del usuario
        user_wallets[user_id] = {
            'public_key': public_key,
            'secret_key': secret_key,
            'created': True
        }
        
        # Fondear la cuenta en testnet
        try:
            self.server.fund(public_key)
            funded = True
        except:
            funded = False
        
        wallet_text = f"""
🔑 **Wallet Creada Exitosamente**

**Clave Pública:**
`{public_key}`

**Clave Privada:**
`{secret_key}`

⚠️ **IMPORTANTE:** Guarda tu clave privada en un lugar seguro. No la compartas con nadie.

**Estado:** {'✅ Fondada en testnet' if funded else '❌ Error al fondear'}
        """
        
        await update.message.reply_text(wallet_text, parse_mode='Markdown')
    
    async def get_prices(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Obtener precios actuales"""
        try:
            # Simular precios (en producción, obtener desde Soroswap API)
            prices = {
                "XLM": 0.15,
                "BTC": 45000,
                "ETH": 3000,
                "USDC": 1.00,
                "USDT": 1.00
            }
            
            price_text = "📊 **Precios Actuales**\n\n"
            for asset, price in prices.items():
                price_text += f"**{asset}:** ${price:,.2f}\n"
            
            price_text += "\n💡 Usa /trade para abrir una posición"
            
            await update.message.reply_text(price_text, parse_mode='Markdown')
            
        except Exception as e:
            await update.message.reply_text(f"❌ Error al obtener precios: {str(e)}")
    
    async def open_position(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Abrir nueva posición de trading"""
        user_id = update.effective_user.id
        
        if user_id not in user_wallets:
            await update.message.reply_text("❌ Primero debes crear una wallet con /wallet")
            return
        
        # Simular apertura de posición
        position_data = {
            'user_id': user_id,
            'asset': 'XLM',
            'amount': 1000,
            'position_type': 'long',
            'entry_price': 0.15,
            'status': 'open'
        }
        
        user_positions[user_id] = position_data
        
        position_text = f"""
📈 **Posición Abierta**

**Asset:** {position_data['asset']}
**Cantidad:** {position_data['amount']}
**Tipo:** {position_data['position_type'].upper()}
**Precio Entrada:** ${position_data['entry_price']}
**Estado:** {position_data['status'].upper()}

💡 Usa /positions para ver todas tus posiciones
        """
        
        await update.message.reply_text(position_text, parse_mode='Markdown')
    
    async def view_positions(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Ver posiciones activas"""
        user_id = update.effective_user.id
        
        if user_id not in user_positions:
            await update.message.reply_text("❌ No tienes posiciones activas")
            return
        
        position = user_positions[user_id]
        
        positions_text = f"""
📊 **Tus Posiciones**

**Posición #1:**
- Asset: {position['asset']}
- Cantidad: {position['amount']}
- Tipo: {position['position_type'].upper()}
- Precio Entrada: ${position['entry_price']}
- Estado: {position['status'].upper()}

💡 Usa /close para cerrar una posición
        """
        
        await update.message.reply_text(positions_text, parse_mode='Markdown')
    
    async def close_position(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Cerrar posición"""
        user_id = update.effective_user.id
        
        if user_id not in user_positions:
            await update.message.reply_text("❌ No tienes posiciones activas")
            return
        
        position = user_positions[user_id]
        
        # Simular cierre de posición
        current_price = 0.16  # Precio simulado
        pnl = (current_price - position['entry_price']) * position['amount']
        
        close_text = f"""
📉 **Posición Cerrada**

**Precio Entrada:** ${position['entry_price']}
**Precio Actual:** ${current_price}
**PnL:** ${pnl:.2f}
**Estado:** {'✅ Ganancia' if pnl > 0 else '❌ Pérdida' if pnl < 0 else '➖ Sin cambio'}

💰 **Monto Final:** ${position['amount'] + pnl:.2f}
        """
        
        # Eliminar posición
        del user_positions[user_id]
        
        await update.message.reply_text(close_text, parse_mode='Markdown')
    
    async def auto_trading(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Configurar trading automático"""
        auto_text = """
🤖 **Trading Automatizado**

**Estrategias Disponibles:**
1. **Momentum** - Seguir tendencias
2. **Mean Reversion** - Reversión a la media
3. **Breakout** - Romper resistencias
4. **Scalping** - Trading de alta frecuencia

**Configuración:**
- Stop Loss: 5%
- Take Profit: 10%
- Cantidad: 1000 XLM

💡 Usa los botones para configurar
        """
        
        keyboard = [
            [InlineKeyboardButton("🚀 Momentum", callback_data="strategy_momentum")],
            [InlineKeyboardButton("🔄 Mean Reversion", callback_data="strategy_mean_reversion")],
            [InlineKeyboardButton("💥 Breakout", callback_data="strategy_breakout")],
            [InlineKeyboardButton("⚡ Scalping", callback_data="strategy_scalping")],
            [InlineKeyboardButton("⏹️ Detener Auto", callback_data="stop_auto")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(auto_text, parse_mode='Markdown', reply_markup=reply_markup)
    
    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Manejar callbacks de botones"""
        query = update.callback_query
        await query.answer()
        
        data = query.data
        
        if data == "create_wallet":
            await self.create_wallet(update, context)
        elif data == "view_prices":
            await self.get_prices(update, context)
        elif data == "trading_menu":
            await self.open_position(update, context)
        elif data == "auto_trading":
            await self.auto_trading(update, context)
        elif data.startswith("strategy_"):
            strategy = data.replace("strategy_", "")
            await query.edit_message_text(f"✅ Estrategia '{strategy}' configurada")
        elif data == "stop_auto":
            await query.edit_message_text("⏹️ Trading automático detenido")
    
    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Manejar errores"""
        print(f"Error: {context.error}")
        await update.message.reply_text("❌ Ocurrió un error. Intenta de nuevo.")

def main():
    """Función principal"""
    print("🤖 Iniciando Bot de Trading de Stellar...")
    
    # Crear aplicación
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Crear instancia del bot
    bot = StellarTradingBot()
    
    # Agregar handlers
    application.add_handler(CommandHandler("start", bot.start))
    application.add_handler(CommandHandler("help", bot.help_command))
    application.add_handler(CommandHandler("wallet", bot.create_wallet))
    application.add_handler(CommandHandler("price", bot.get_prices))
    application.add_handler(CommandHandler("trade", bot.open_position))
    application.add_handler(CommandHandler("positions", bot.view_positions))
    application.add_handler(CommandHandler("close", bot.close_position))
    application.add_handler(CommandHandler("auto", bot.auto_trading))
    
    # Callback handlers
    application.add_handler(CallbackQueryHandler(bot.button_callback))
    
    # Error handler
    application.add_error_handler(bot.error_handler)
    
    # Iniciar bot
    print("✅ Bot iniciado correctamente")
    application.run_polling()

if __name__ == '__main__':
    main()
