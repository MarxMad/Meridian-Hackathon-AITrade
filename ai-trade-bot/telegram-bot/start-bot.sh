#!/bin/bash

# Script para iniciar el bot de Telegram
echo "🤖 Iniciando Bot de Trading de Stellar..."

# Verificar que existe el archivo de configuración
if [ ! -f "config.env" ]; then
    echo "❌ Error: No se encontró el archivo config.env"
    echo "📝 Copia config.env.example a config.env y configura las variables"
    exit 1
fi

# Cargar variables de entorno
export $(cat config.env | grep -v '^#' | xargs)

# Verificar que el token del bot esté configurado
if [ "$TELEGRAM_BOT_TOKEN" = "your_telegram_bot_token_here" ]; then
    echo "❌ Error: Debes configurar TELEGRAM_BOT_TOKEN en config.env"
    echo "📝 Obtén tu token de @BotFather en Telegram"
    exit 1
fi

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Iniciar el bot
echo "🚀 Iniciando bot..."
node complete-trading-bot.js
