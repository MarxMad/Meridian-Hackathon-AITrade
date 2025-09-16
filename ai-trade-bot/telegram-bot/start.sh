#!/bin/bash

echo "🤖 Iniciando Bot de Telegram - AI Trading Bot"
echo "=============================================="

# Verificar si existe el archivo .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado. Copiando config.example.env..."
    cp config.example.env .env
    echo "📝 Por favor, edita el archivo .env con tu token de bot de Telegram"
    echo "   Obtén tu token en: https://t.me/botfather"
    exit 1
fi

# Verificar si el token está configurado
if grep -q "YOUR_BOT_TOKEN_HERE" .env; then
    echo "⚠️  Token de bot no configurado en .env"
    echo "📝 Por favor, edita el archivo .env con tu token real"
    echo "   Obtén tu token en: https://t.me/botfather"
    exit 1
fi

echo "✅ Configuración encontrada"
echo "🚀 Iniciando bot..."

# Iniciar el bot
npm start
