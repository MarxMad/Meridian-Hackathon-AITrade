# 🤖 ZenTrade - AI Trading Bot para Meridian Hackathon 2025

> **✅ PROYECTO COMPLETADO - Una plataforma de trading automatizado completa con frontend web y bot de Telegram funcionando**

[![Stellar](https://img.shields.io/badge/Stellar-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)](https://stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Soroban](https://img.shields.io/badge/Soroban-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)](https://soroban.stellar.org)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://telegram.org)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

## 🚀 **DEMO EN VIVO**

### 🌐 **Web Application**
**URL:** [https://mmmeee.vercel.app/](https://mmmeee.vercel.app/)
- ✅ **Swaps reales** XLM ↔ USDC con Soroswap
- ✅ **Trading con leverage** hasta 10x
- ✅ **Precios en tiempo real** de CoinGecko y Soroswap
- ✅ **Conexión de wallet** con Stellar Wallet Kit
- ✅ **UI moderna** con diseño tech y gradientes

### 🤖 **Telegram Bot**
**Bot:** @ZenTradeBot
- ✅ **Creación automática** de wallets Stellar
- ✅ **Swaps reales** ejecutados en la blockchain
- ✅ **Trading con leverage** funcional
- ✅ **Links al explorer** para verificar transacciones
- ✅ **Timer de 60 segundos** para nuevas wallets

## 🎯 **Visión del Proyecto - COMPLETADA ✅**

Una plataforma de trading automatizado que permite a los usuarios ejecutar estrategias de trading de perpetuos en Stellar a través de un agente de IA controlado via Telegram o interfaz web. **¡TODO FUNCIONANDO!**

## ✨ **Características Principales - TODAS IMPLEMENTADAS ✅**

### 🌐 **Frontend Web Completo**
- ✅ **Landing Page** moderna con diseño tech y gradientes
- ✅ **Página de Swaps** con integración real a Soroswap
- ✅ **Página de Trading** con leverage hasta 10x
- ✅ **Conexión de Wallet** con Stellar Wallet Kit
- ✅ **Precios en tiempo real** de múltiples fuentes
- ✅ **UI responsive** y optimizada para mobile

### 🤖 **Bot de Telegram Completo**
- ✅ **Creación automática** de wallets Stellar
- ✅ **Swaps reales** XLM ↔ USDC ejecutados
- ✅ **Trading con leverage** funcional
- ✅ **Gestión de posiciones** en tiempo real
- ✅ **Links al explorer** para verificar transacciones
- ✅ **Timer de protección** para nuevas wallets
- ✅ **Interfaz intuitiva** con botones y menús

### 💰 **Sistema de Trading Real**
- ✅ **Posiciones Long/Short** funcionando
- ✅ **Cálculo de PnL** en tiempo real
- ✅ **Transferencias reales** en Stellar testnet
- ✅ **Integración con Soroswap** para swaps reales
- ✅ **Smart contracts** desplegados y funcionando

## 🏗️ **Arquitectura Técnica COMPLETA**

### **📱 Frontend (Next.js)**
```typescript
ai-trade-bot/
├── src/app/
│   ├── page.tsx              // 🏠 Landing page moderna
│   ├── swaps/page.tsx        // 🔄 Swaps XLM ↔ USDC
│   ├── trading/page.tsx      // 📈 Trading con leverage
│   └── api/                  // 🔌 APIs backend
│       ├── soroswap/         // Integración Soroswap
│       └── contract/         // Smart contract calls
└── telegram-bot/
    └── complete-trading-bot.js // 🤖 Bot completo
```

### **🔗 Smart Contract (Soroban) - DESPLEGADO ✅**
```rust
// Funciones principales implementadas y funcionando
- open_position()      // ✅ Abrir posición de trading
- close_position()     // ✅ Cerrar posición y calcular PnL
- auto_trade()         // ✅ Trading automático con IA
- get_my_positions()   // ✅ Obtener posiciones del usuario
- get_active_positions() // ✅ Posiciones activas globales
- get_trader_stats()   // ✅ Estadísticas del trader
```

### **🔌 Integraciones REALES**
- ✅ **Soroswap API**: Swaps reales en blockchain
- ✅ **CoinGecko API**: Precios de referencia
- ✅ **Stellar Wallet Kit**: Conexión de wallets
- ✅ **Telegram Bot API**: Interfaz conversacional
- ✅ **Stellar RPC**: Transacciones en testnet

## 🚀 **Instalación y Uso - FUNCIONANDO EN VIVO**

### **🌐 Acceso Directo**
```bash
# Web App (ya desplegada)
🔗 https://mmmeee.vercel.app/

# Telegram Bot (ya funcionando)
🤖 @ZenTradeBot en Telegram
```

### **💻 Setup Local (Opcional)**
```bash
# 1. Clonar el repositorio
git clone https://github.com/MarxMad/Meridian-Hackathon-AITrade.git
cd Meridian-Hackathon-AITrade

# 2. Frontend Next.js
cd ai-trade-bot
npm install
npm run dev  # http://localhost:3000

# 3. Bot de Telegram
cd telegram-bot
npm install
node complete-trading-bot.js
```

### **☁️ Deployment Options**
```bash
# Frontend (Vercel)
npm run deploy:vercel

# Telegram Bot (Railway/Heroku)
npm run deploy:railway
npm run deploy:heroku
```

### **🎉 Contrato Desplegado (v4.0 - Con Swaps Automáticos)**
- **Dirección**: `CBKXVZULDSVITY5K47BG34EMGSLS5WXZB7UETS3KYF3FOQCF4CH22JMD`
- **Red**: Stellar Testnet
- **Hash WASM**: `84ff18905f17fc4bb8b3681daa45fcd7e00faa3e78f3fe04081c3a2a559636d0`
- **Explorador**: [Ver en Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBKXVZULDSVITY5K47BG34EMGSLS5WXZB7UETS3KYF3FOQCF4CH22JMD)
- **Características**: ✅ Swaps automáticos XLM→USDC, ✅ Precios reales de Soroswap API, ✅ Transferencias reales, ✅ Manejo de dinero real

### **Testing**
```bash
# Ejecutar todos los tests
cargo test

# Tests específicos
cargo test test_open_position
cargo test test_auto_trade
```

### **🧪 Comandos de Prueba del Contrato**

#### **Inicializar el Contrato**
```bash
stellar contract invoke \
  --id CBKXVZULDSVITY5K47BG34EMGSLS5WXZB7UETS3KYF3FOQCF4CH22JMD \
  --source Meridian \
  --network testnet \
  --send=yes \
  -- initialize
```

#### **Configurar API de Soroswap**
```bash
stellar contract invoke \
  --id CBKXVZULDSVITY5K47BG34EMGSLS5WXZB7UETS3KYF3FOQCF4CH22JMD \
  --source Meridian \
  --network testnet \
  --send=yes \
  -- set_soroswap_api_key \
  --api_key '"sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec"'
```

#### **Actualizar Precios Reales desde Soroswap API**
```bash
# Ejecutar el script de actualización de precios automático
cd /Users/gerryp/Meridian-Hack/soroban-meridian-hack
source venv/bin/activate
python soroswap_price_updater.py
```

#### **Obtener Precios Actuales**
```bash
# Precio de XLM (desde oráculo interno)
stellar contract invoke \
  --id CBKXVZULDSVITY5K47BG34EMGSLS5WXZB7UETS3KYF3FOQCF4CH22JMD \
  --source Meridian \
  --network testnet \
  -- get_current_price \
  --asset '"XLM"'

# Precio desde Soroswap API (requiere API key)
stellar contract invoke \
  --id CBKXVZULDSVITY5K47BG34EMGSLS5WXZB7UETS3KYF3FOQCF4CH22JMD \
  --source Meridian \
  --network testnet \
  -- get_soroswap_price \
  --asset '"XLM"'
```

#### **Abrir Posición de Trading (Con Transferencia Real)**
```bash
# Nota: Ahora requiere token_asset (dirección del contrato de token)
stellar contract invoke \
  --id CBKXVZULDSVITY5K47BG34EMGSLS5WXZB7UETS3KYF3FOQCF4CH22JMD \
  --source Meridian \
  --network testnet \
  --send=yes \
  -- open_position \
  --asset '"XLM"' \
  --amount 1000 \
  --position_type '"long"' \
  --token_asset CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXEXYVU2
```

#### **Depositar Fondos (Transferencia Real)**
```bash
stellar contract invoke \
  --id CBKXVZULDSVITY5K47BG34EMGSLS5WXZB7UETS3KYF3FOQCF4CH22JMD \
  --source Meridian \
  --network testnet \
  --send=yes \
  -- deposit_funds \
  --asset CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXEXYVU2 \
  --amount 1000
```

#### **Swap Automático XLM → USDC**
```bash
# Swap simulado (usando precios del contrato)
stellar contract invoke \
  --id CBKXVZULDSVITY5K47BG34EMGSLS5WXZB7UETS3KYF3FOQCF4CH22JMD \
  --source Meridian \
  --network testnet \
  --send=yes \
  -- swap_xlm_to_usdc \
  --xlm_amount 100

# Swap real usando Soroswap API
cd /Users/gerryp/Meridian-Hack/soroban-meridian-hack
source venv/bin/activate
python soroswap_swap_executor.py
```

#### **Cerrar Posición (Con Devolución de Dinero)**
```bash
stellar contract invoke \
  --id CBKXVZULDSVITY5K47BG34EMGSLS5WXZB7UETS3KYF3FOQCF4CH22JMD \
  --source Meridian \
  --network testnet \
  --send=yes \
  -- close_position \
  --position_id 1
```

#### **Ver Posiciones del Trader**
```bash
stellar contract invoke \
  --id CBKXVZULDSVITY5K47BG34EMGSLS5WXZB7UETS3KYF3FOQCF4CH22JMD \
  --source Meridian \
  --network testnet \
  -- get_trader_positions \
  --trader CCZADOPVO32ZSR5GYCDPUCBYDTKSR2QKR5PCHCRNUG7ANEBWB4G5RU5E
```

## 📊 **Funcionalidades del Contrato**

### **Gestión de Posiciones**
- ✅ Abrir posiciones long/short
- ✅ Cerrar posiciones con cálculo de PnL
- ✅ Tracking de posiciones activas
- ✅ Historial de transacciones

### **Sistema de Lectura**
- ✅ Posiciones del trader actual
- ✅ Estadísticas globales del contrato
- ✅ Historial de transacciones
- ✅ Información detallada de posiciones

### **Agente Automático**
- ✅ Trading basado en estrategias
- ✅ Cierre automático de posiciones
- ✅ Registro de transacciones
- ✅ Gestión de riesgo automática

### **💰 Transferencias Reales de Dinero**
- ✅ **Depósitos automáticos** al abrir posiciones
- ✅ **Devolución de ganancias** al cerrar posiciones
- ✅ **Manejo de pérdidas** con transferencias reales
- ✅ **Integración con Stellar Token Contract**
- ✅ **Cálculo de PnL con dinero real**

### **📊 Precios Reales de Soroswap API**
- ✅ **Integración con Soroswap API** para precios en tiempo real
- ✅ **Script automático** de actualización de precios (`soroswap_price_updater.py`)
- ✅ **Oráculo interno** que almacena precios actualizados
- ✅ **Fallback a precios simulados** si no hay datos reales
- ✅ **Soporte para múltiples activos** (XLM, USDC, BTC, etc.)
- ✅ **Autenticación con API key** de Soroswap

### **🔄 Swaps Automáticos XLM → USDC**
- ✅ **Función de swap integrada** en el contrato (`swap_xlm_to_usdc`)
- ✅ **Script de swap real** usando Soroswap API (`soroswap_swap_executor.py`)
- ✅ **Cotizaciones en tiempo real** desde Soroswap
- ✅ **Construcción automática** de transacciones XDR
- ✅ **Ejecución directa** en la red Stellar
- ✅ **Actualización automática** del contrato después del swap
- ✅ **Manejo de errores** y reintentos

## 🔧 **Configuración**

### **Variables de Entorno**
```bash
# Stellar Network
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Soroswap Integration
SOROSWAP_FACTORY_ID=your_factory_id
```

### **Estrategias de Trading**
```rust
// Configuración de estrategias
"momentum_up" => String::from_str(env, "long"),
"momentum_down" => String::from_str(env, "short"),
"mean_reversion" => {
    if current_price > 150000 {
        String::from_str(env, "short")
    } else {
        String::from_str(env, "long")
    }
}
```

## 📈 **Estado del Proyecto - COMPLETADO AL 100% ✅**

### **✅ Fase 1: Smart Contract** 
- ✅ Contrato base de trading
- ✅ Sistema de posiciones
- ✅ Cálculo de PnL
- ✅ Tests completos
- ✅ Desplegado en testnet

### **✅ Fase 2: Integración** 
- ✅ Integración con Soroswap (API key configurada)
- ✅ Sistema de oráculos interno
- ✅ Precios reales desde API
- ✅ Transferencias reales de tokens
- ✅ Manejo de dinero real
- ✅ CoinGecko para precios de referencia

### **✅ Fase 3: Frontend y Bot**
- ✅ **Bot de Telegram completo** y funcionando
- ✅ **Interfaz web moderna** desplegada en Vercel
- ✅ **Trading con IA** implementado
- ✅ **Generación automática** de wallets

### **✅ Fase 4: Producción**
- ✅ **Desplegado en la nube** (Vercel + múltiples opciones)
- ✅ **Monitoreo** de transacciones en explorer
- ✅ **Optimizado para hackathon**
- ✅ **Documentación completa**

## 🎖️ **LOGROS DESTACADOS**

### **🥇 Completación Total**
- ✅ **100% funcional** en frontend y backend
- ✅ **Swaps reales** ejecutándose en Stellar testnet
- ✅ **Trading con leverage** operativo
- ✅ **Bot de Telegram** con todas las funciones
- ✅ **UI moderna** con diseño profesional

### **🚀 Innovaciones Técnicas**
- ✅ **Integración completa** Soroswap + Stellar
- ✅ **Timer de protección** para nuevas wallets
- ✅ **Rate limiting** y caching inteligente
- ✅ **Fallbacks** para máxima disponibilidad
- ✅ **Deployment multi-plataforma**

## 🤝 **Contribución**

### **Estructura del Proyecto COMPLETA**