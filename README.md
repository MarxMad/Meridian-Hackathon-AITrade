# 🤖 Meridian Hackathon - AI Trading Bot

> **Una plataforma de trading automatizado de perpetuos en Stellar con agente de IA integrado**

[![Stellar](https://img.shields.io/badge/Stellar-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)](https://stellar.org)
[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://rust-lang.org)
[![Soroban](https://img.shields.io/badge/Soroban-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)](https://soroban.stellar.org)
[![AI](https://img.shields.io/badge/AI-FF6B6B?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)

## 🎯 **Visión del Proyecto**

Crear una plataforma de trading automatizado que permita a los usuarios ejecutar estrategias de trading de perpetuos en Stellar a través de un agente de IA que puede ser controlado via Telegram o interfaz web.

## ✨ **Características Principales**

### 🔄 **Trading Automatizado**
- **Estrategias Múltiples**: Momentum, Mean Reversion, Breakout, Scalping
- **Trading de Alta Frecuencia**: Aprovecha la velocidad de Stellar
- **Arbitraje Automático**: Detecta oportunidades entre pools
- **Gestión de Riesgo**: Stop-loss y take-profit automáticos

### 🤖 **Agente de IA**
- **Interfaz de Telegram**: Control via mensajes naturales
- **Interfaz Web**: Dashboard completo para monitoreo
- **Generación Automática de Wallets**: Creación de wallets sin fricción
- **Análisis de Mercado**: IA que analiza patrones y ejecuta trades

### 💰 **Sistema de Perpetuos**
- **Posiciones Long/Short**: Trading en ambas direcciones
- **Cálculo de PnL**: Profit/Loss en tiempo real
- **Transferencias Automáticas**: Depósitos y retiros automáticos
- **Historial Completo**: Tracking de todas las transacciones

## 🏗️ **Arquitectura Técnica**

### **Smart Contract (Soroban)**
```rust
// Funciones principales del contrato
- open_position()      // Abrir posición de trading
- close_position()     // Cerrar posición y calcular PnL
- auto_trade()         // Trading automático con IA
- get_my_positions()   // Obtener posiciones del usuario
- get_active_positions() // Posiciones activas globales
- get_trader_stats()   // Estadísticas del trader
```

### **Estrategias de Trading Implementadas**
- **Momentum Up/Down**: Seguir tendencias del mercado
- **Mean Reversion**: Reversión a la media
- **Breakout**: Romper resistencias/soportes
- **Scalping**: Trading de alta frecuencia

### **Integración con Ecosistema Stellar**
- **Soroswap**: Precios reales de DEX
- **Reflector**: Predicciones de mercado
- **Oracles**: Datos de precios externos

## 🚀 **Instalación y Uso**

### **Prerrequisitos**
```bash
# Instalar Stellar CLI
curl -sSf https://sh.rustup.rs | sh
cargo install --locked soroban-cli

# Instalar dependencias
cargo build
```

### **Despliegue del Contrato**
```bash
# Compilar el contrato
make build

# Desplegar en testnet
make deploy
```

### **🎉 Contrato Desplegado (v3.0 - Con Precios Reales de Soroswap)**
- **Dirección**: `CATM2J4XOXICU6LGLSU36KHYT2GVUWES565RSA7OMDO7JVNITS3TRCCP`
- **Red**: Stellar Testnet
- **Hash WASM**: `d8271caf4b0f7dba7295b451aebeb923740a048471543c3c954d765cddcb4d2a`
- **Explorador**: [Ver en Stellar Expert](https://stellar.expert/explorer/testnet/contract/CATM2J4XOXICU6LGLSU36KHYT2GVUWES565RSA7OMDO7JVNITS3TRCCP)
- **Características**: ✅ Precios reales de Soroswap API, ✅ Transferencias reales, ✅ Manejo de dinero real

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
  --id CATM2J4XOXICU6LGLSU36KHYT2GVUWES565RSA7OMDO7JVNITS3TRCCP \
  --source Meridian \
  --network testnet \
  --send=yes \
  -- initialize
```

#### **Configurar API de Soroswap**
```bash
stellar contract invoke \
  --id CATM2J4XOXICU6LGLSU36KHYT2GVUWES565RSA7OMDO7JVNITS3TRCCP \
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
  --id CATM2J4XOXICU6LGLSU36KHYT2GVUWES565RSA7OMDO7JVNITS3TRCCP \
  --source Meridian \
  --network testnet \
  -- get_current_price \
  --asset '"XLM"'

# Precio desde Soroswap API (requiere API key)
stellar contract invoke \
  --id CATM2J4XOXICU6LGLSU36KHYT2GVUWES565RSA7OMDO7JVNITS3TRCCP \
  --source Meridian \
  --network testnet \
  -- get_soroswap_price \
  --asset '"XLM"'
```

#### **Abrir Posición de Trading (Con Transferencia Real)**
```bash
# Nota: Ahora requiere token_asset (dirección del contrato de token)
stellar contract invoke \
  --id CATM2J4XOXICU6LGLSU36KHYT2GVUWES565RSA7OMDO7JVNITS3TRCCP \
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
  --id CATM2J4XOXICU6LGLSU36KHYT2GVUWES565RSA7OMDO7JVNITS3TRCCP \
  --source Meridian \
  --network testnet \
  --send=yes \
  -- deposit_funds \
  --asset CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXEXYVU2 \
  --amount 1000
```

#### **Cerrar Posición (Con Devolución de Dinero)**
```bash
stellar contract invoke \
  --id CATM2J4XOXICU6LGLSU36KHYT2GVUWES565RSA7OMDO7JVNITS3TRCCP \
  --source Meridian \
  --network testnet \
  --send=yes \
  -- close_position \
  --position_id 1
```

#### **Ver Posiciones del Trader**
```bash
stellar contract invoke \
  --id CATM2J4XOXICU6LGLSU36KHYT2GVUWES565RSA7OMDO7JVNITS3TRCCP \
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

## 📈 **Roadmap**

### **Fase 1: Smart Contract** ✅
- [x] Contrato base de trading
- [x] Sistema de posiciones
- [x] Cálculo de PnL
- [x] Tests completos

### **Fase 2: Integración** ✅
- [x] Integración con Soroswap (API key configurada)
- [x] Sistema de oráculos interno
- [x] Precios reales desde API
- [x] Transferencias reales de tokens
- [x] Manejo de dinero real
- [ ] Integración con Reflector

### **Fase 3: Agente de IA** 📋
- [ ] Bot de Telegram
- [ ] Interfaz web
- [ ] Análisis de mercado con IA
- [ ] Generación automática de wallets

### **Fase 4: Producción** 📋
- [ ] Despliegue en mainnet
- [ ] Monitoreo y alertas
- [ ] Optimizaciones de gas
- [ ] Documentación completa

## 🤝 **Contribución**

### **Estructura del Proyecto**
```
soroban-meridian-hack/
├── contracts/
│   └── Trading/
│       ├── src/
│       │   ├── lib.rs      # Contrato principal
│       │   └── test.rs     # Tests
│       └── Cargo.toml
├── bot/                     # Bot de Telegram (próximo)
├── frontend/                # Interfaz web (próximo)
└── README.md
```

### **Cómo Contribuir**
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📊 **Actualizador de Precios de Soroswap**

### **Script de Actualización Automática**
```bash
# Activar entorno virtual
source venv/bin/activate

# Ejecutar actualizador de precios
python soroswap_price_updater.py
```

### **Características del Script**
- 🔄 **Actualización automática** de precios desde Soroswap API
- 🔑 **Autenticación** con API key de Soroswap
- 📈 **Soporte para múltiples activos** (XLM, USDC, etc.)
- ⚡ **Integración directa** con el contrato desplegado
- 🛡️ **Manejo de errores** y reintentos automáticos

### **Configuración del Script**
```python
# Configuración en soroswap_price_updater.py
SOROSWAP_API_URL = "https://api.soroswap.finance"
SOROSWAP_API_KEY = "sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec"
CONTRACT_ID = "CATM2J4XOXICU6LGLSU36KHYT2GVUWES565RSA7OMDO7JVNITS3TRCCP"
```

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🏆 **Hackathon Meridian 2025**

Este proyecto fue desarrollado para el **Meridian Hackathon 2025** en la categoría de **Payments**.

### **Track: Payments**
- ✅ Trading automatizado de perpetuos
- ✅ Integración con ecosistema Stellar
- ✅ Agente de IA para trading
- ✅ Interfaz de usuario intuitiva
- ✅ Precios reales de Soroswap API
- ✅ Transferencias reales de dinero
- ✅ Script de actualización automática de precios

## 📞 **Contacto**

- **GitHub**: [MarxMad/Meridian-Hackathon-AITrade](https://github.com/MarxMad/Meridian-Hackathon-AITrade)
- **Stellar**: [Stellar.org](https://stellar.org)
- **Soroban**: [Soroban.stellar.org](https://soroban.stellar.org)

## 🙏 **Agradecimientos**

- **Stellar Development Foundation** por el ecosistema
- **Soroban Team** por el SDK de Rust
- **Meridian Hackathon** por la oportunidad
- **Comunidad Stellar** por el apoyo

---

**⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!**