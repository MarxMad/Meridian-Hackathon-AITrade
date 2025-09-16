# 🤖 Bot de Trading Completo para Telegram

Un bot de Telegram que permite hacer trading y swaps completos en Stellar directamente desde Telegram.

## ✨ Características

### 🔐 **Gestión de Wallet**
- Crear wallet Stellar segura dentro del bot
- Encriptación de claves privadas
- Fondeo automático en testnet
- Exportar/importar wallets

### 🔄 **Swaps Automáticos**
- XLM ↔ USDC instantáneos
- Integración con Soroswap API
- Mejores tasas de cambio
- Confirmación en segundos

### 📈 **Trading de Perpetuos**
- Abrir posiciones long/short
- Leverage hasta 10x
- Cerrar posiciones automáticamente
- Cálculo de PnL en tiempo real

### 📊 **Gestión Completa**
- Ver balances en tiempo real
- Historial de transacciones
- Precios actualizados
- Notificaciones de estado

## 🚀 Instalación

### 1. **Configurar el Bot de Telegram**
```bash
# 1. Habla con @BotFather en Telegram
# 2. Crea un nuevo bot con /newbot
# 3. Copia el token que te da
```

### 2. **Configurar Variables de Entorno**
```bash
# Copia el archivo de configuración
cp config.env.example config.env

# Edita config.env con tus datos
nano config.env
```

**Variables requeridas:**
```env
TELEGRAM_BOT_TOKEN=tu_token_aqui
API_BASE_URL=http://localhost:3000
ENCRYPTION_KEY=tu-clave-de-32-caracteres
```

### 3. **Instalar Dependencias**
```bash
npm install
```

### 4. **Iniciar el Bot**
```bash
# Opción 1: Script automático
./start-bot.sh

# Opción 2: Manual
node complete-trading-bot.js
```

## 📱 Comandos del Bot

### **Comandos Básicos**
- `/start` - Iniciar el bot y ver menú principal
- `/help` - Ver todos los comandos disponibles
- `/wallet` - Crear/gestionar tu wallet Stellar

### **Trading y Swaps**
- `/swap 10 XLM` - Hacer swap de 10 XLM a USDC
- `/trade` - Abrir nueva posición de trading
- `/positions` - Ver posiciones activas
- `/close` - Cerrar posición específica

### **Información**
- `/balance` - Ver balance de tu wallet
- `/price` - Ver precio actual de XLM
- `/status` - Estado de transacciones

## 🔧 Funcionalidades Técnicas

### **Seguridad**
- ✅ Claves privadas encriptadas localmente
- ✅ No se almacenan claves en texto plano
- ✅ Confirmación requerida para transacciones
- ✅ Validación de todas las operaciones

### **Integración**
- ✅ API de Soroswap para swaps reales
- ✅ Contratos Stellar para trading
- ✅ Red testnet para pruebas
- ✅ Precios en tiempo real

### **Experiencia de Usuario**
- ✅ Interfaz intuitiva con botones
- ✅ Confirmaciones visuales
- ✅ Estados de transacción claros
- ✅ Notificaciones en tiempo real

## 🎯 Flujo de Uso

### **1. Primer Uso**
```
1. /start - Iniciar bot
2. /wallet - Crear wallet
3. /balance - Ver balance
4. /swap 10 XLM - Hacer primer swap
```

### **2. Trading**
```
1. /trade - Abrir posición
2. Elegir tipo (long/short) y leverage
3. Confirmar posición
4. /positions - Ver posiciones activas
```

### **3. Gestión**
```
1. /balance - Ver balance actualizado
2. /price - Ver precios
3. /positions - Gestionar posiciones
4. /close - Cerrar posiciones
```

## 🔒 Seguridad

### **Almacenamiento de Claves**
- Las claves privadas se encriptan con AES-256
- Solo el usuario puede acceder a sus claves
- Las claves se pueden exportar/importar

### **Transacciones**
- Todas las transacciones requieren confirmación
- Validación de cantidades y parámetros
- Manejo de errores robusto

### **Red**
- Funciona en Stellar testnet para pruebas
- Fácil migración a mainnet
- Transacciones reales con Soroswap

## 🚀 Despliegue

### **Desarrollo Local**
```bash
# Iniciar API local
cd ../src
npm run dev

# Iniciar bot
cd ../telegram-bot
npm start
```

### **Producción**
```bash
# Usar PM2 para gestión de procesos
npm install -g pm2
pm2 start complete-trading-bot.js --name "stellar-bot"
pm2 save
pm2 startup
```

## 📊 Monitoreo

### **Logs**
```bash
# Ver logs del bot
pm2 logs stellar-bot

# Ver logs en tiempo real
pm2 logs stellar-bot --lines 100
```

### **Estado**
```bash
# Ver estado del bot
pm2 status

# Reiniciar bot
pm2 restart stellar-bot
```

## 🛠️ Desarrollo

### **Estructura del Código**
```
telegram-bot/
├── complete-trading-bot.js  # Bot principal
├── config.env              # Configuración
├── package.json            # Dependencias
├── start-bot.sh           # Script de inicio
└── README.md              # Documentación
```

### **Agregar Nuevas Funcionalidades**
1. Agregar comando en `bot.onText()`
2. Implementar lógica en función correspondiente
3. Agregar botones en `callback_query`
4. Actualizar documentación

## 🎉 ¡Listo para Usar!

Tu bot de trading está listo. Los usuarios pueden:

1. **Crear wallets** seguras en Telegram
2. **Hacer swaps** XLM ↔ USDC automáticamente
3. **Abrir posiciones** de trading con leverage
4. **Gestionar** todo desde Telegram

**¡Disfruta del trading automatizado!** 🚀