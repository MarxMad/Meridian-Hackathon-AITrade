# 🤖 ZENTRADE Bot - Deployment Guide

## 🎯 Opciones de Deployment

### **Opción 1: Railway (Recomendado) 🚂**

**Ventajas:** Fácil, gratis tier, perfecto para bots

1. **Crear cuenta en Railway**
   - Ve a [railway.app](https://railway.app)
   - Conecta tu GitHub

2. **Deploy desde GitHub**
   ```bash
   # En Railway dashboard:
   New Project → Deploy from GitHub → Seleccionar MMMEEE
   ```

3. **Configurar variables de entorno**
   ```
   TELEGRAM_BOT_TOKEN=tu_token_aqui
   API_BASE_URL=https://mmmeee.vercel.app
   ENCRYPTION_KEY=tu_clave_aqui
   STELLAR_NETWORK=testnet
   ```

4. **Configurar start command**
   ```
   npm run railway
   ```

5. **Deploy!** ✅

---

### **Opción 2: Render (Gratis) 🎨**

1. **Ir a Render.com**
2. **Conectar GitHub**
3. **Crear Web Service**
4. **Configurar:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node.js

---

### **Opción 3: Heroku (Clásico) 📦**

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login
heroku login

# Crear app
heroku create zentrade-bot

# Configurar variables
heroku config:set TELEGRAM_BOT_TOKEN=tu_token
heroku config:set API_BASE_URL=https://mmmeee.vercel.app

# Deploy
git push heroku main
```

---

### **Opción 4: VPS (Máximo Control) 🖥️**

**Para DigitalOcean, Linode, AWS EC2:**

```bash
# 1. Conectar a VPS
ssh root@tu-servidor

# 2. Ejecutar script de deploy
curl -sSL https://raw.githubusercontent.com/MarxMad/MMMEEE/main/ai-trade-bot/telegram-bot/deploy-vps.sh | bash

# 3. Configurar variables
nano .env
# Agregar:
# TELEGRAM_BOT_TOKEN=tu_token
# API_BASE_URL=https://mmmeee.vercel.app

# 4. Reiniciar
pm2 restart zentrade-bot
```

---

### **Opción 5: Vercel Serverless** ⚡

**Para webhooks (más eficiente):**

1. **Configurar webhook en Telegram:**
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
        -d "url=https://mmmeee.vercel.app/api/telegram-webhook"
   ```

2. **El archivo ya está en `/api/telegram-webhook.js`**

3. **Configurar variables en Vercel:**
   - `TELEGRAM_BOT_TOKEN`
   - `API_BASE_URL`

---

## 🔧 Configuración Rápida

### **Variables de entorno requeridas:**
```env
TELEGRAM_BOT_TOKEN=8343949971:AAFefvH90WJCYeEkbGxYVBDRy9dLpiSwAnQ
API_BASE_URL=https://mmmeee.vercel.app
ENCRYPTION_KEY=meridian-hackathon-2025-key
STELLAR_NETWORK=testnet
CONTRACT_ID=tu-contract-id
```

### **Para obtener TELEGRAM_BOT_TOKEN:**
1. Habla con [@BotFather](https://t.me/botfather)
2. `/newbot`
3. Sigue las instrucciones
4. Copia el token

---

## ⚡ Deploy Rápido (2 minutos)

**Railway (Más fácil):**
1. Fork el repo MMMEEE
2. Conectar a Railway
3. Agregar variables de entorno
4. ¡Deploy automático!

**¿Necesitas ayuda?** El bot ya está funcionando en local, solo falta deployarlo. 🚀

---

## 📊 Monitoreo

**Railway:** Dashboard integrado
**Heroku:** `heroku logs --tail`
**VPS:** `pm2 monit`
**Render:** Dashboard logs

---

## 🎯 Para el Hackathon

**Recomiendo Railway** porque:
- ✅ Setup más fácil
- ✅ Tier gratuito generoso
- ✅ GitHub integration
- ✅ Zero config deployment

**¡Tu bot estará online 24/7 en 5 minutos!** 🤖

