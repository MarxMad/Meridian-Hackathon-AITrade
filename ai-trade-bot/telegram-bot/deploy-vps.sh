#!/bin/bash

# deploy-vps.sh - Script para deploy en VPS

echo "🚀 Deployando ZENTRADE Bot en VPS..."

# Instalar dependencias
sudo apt update
sudo apt install -y nodejs npm git

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2

# Clonar repositorio
git clone https://github.com/MarxMad/MMMEEE.git
cd MMMEEE/ai-trade-bot/telegram-bot

# Instalar dependencias
npm install

# Configurar variables de entorno
echo "TELEGRAM_BOT_TOKEN=tu_token_aqui" > .env
echo "API_BASE_URL=https://mmmeee.vercel.app" >> .env
echo "ENCRYPTION_KEY=tu_clave_aqui" >> .env

# Iniciar con PM2
pm2 start complete-trading-bot.js --name "zentrade-bot"
pm2 startup
pm2 save

echo "✅ Bot desplegado exitosamente"
echo "📊 Monitoreo: pm2 monit"
echo "🔄 Restart: pm2 restart zentrade-bot"
echo "📝 Logs: pm2 logs zentrade-bot"
