# 🧩 AI Trade Bot - Composability Track

**Meridian Hackathon 2025 - Composability Track**

Una aplicación completa que demuestra la composabilidad en el ecosistema Stellar mediante la integración de múltiples protocolos, herramientas y servicios en una plataforma unificada.

## 🎯 Composability Track Features

### ✅ Características Implementadas

1. **🔗 Wallet Integrations**
   - Freighter Wallet API
   - Stellar Wallet Kit
   - Multi-wallet support
   - Transaction signing

2. **🤖 Soroban AI Token Manager**
   - Contrato inteligente para trading automatizado
   - Posiciones apalancadas (2x, 5x, 10x)
   - Liquidaciones automáticas
   - Cálculo de PnL en tiempo real

3. **🏊 Pool Creator**
   - Integración completa con Soroswap API
   - Precios en tiempo real
   - Ejecución de swaps
   - Gestión de liquidez

4. **📦 Transaction Bundler**
   - Agrupación de múltiples operaciones
   - Optimización de gas
   - Procesamiento por lotes
   - Operaciones atómicas

5. **🌉 Bridge Integrations**
   - Puente Soroswap API
   - Integración Stellar Horizon
   - Compatibilidad cross-protocol
   - Sincronización de datos en tiempo real

6. **📊 Position Maker (Robinhood Style)**
   - Interfaz amigable para el usuario
   - Seguimiento de PnL en tiempo real
   - Gestión de leverage
   - Gestión de riesgo

7. **⚠️ Liquidation Alerts**
   - Monitoreo en tiempo real
   - Cálculo de precio de liquidación
   - Cierre automático de posiciones
   - Notificaciones de riesgo

8. **🔍 Aggregator for Stellar Liquidity Pools**
   - Agregación multi-pool
   - Descubrimiento de mejores precios
   - Análisis de liquidez
   - Comparación de pools

## 🚀 Tecnologías Utilizadas

### Frontend
- **Next.js 15** + TypeScript
- **Tailwind CSS** (colores de bandera de Brasil)
- **React Context** para estado global
- **Responsive Design**

### Integraciones Stellar
- **Stellar SDK** para operaciones de red
- **Freighter API** para wallet integration
- **Soroswap API** para DEX operations
- **Soroban Smart Contracts** para lógica de trading

### Backend/API
- **Next.js API Routes** para endpoints
- **Stellar Horizon** para datos de red
- **Soroswap API** para precios y swaps
- **Contract Service** para invocaciones

## 🏗️ Arquitectura de Composabilidad

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  Next.js + TypeScript + Tailwind CSS + Wallet Context     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Integration Layer                           │
│  Soroswap API + Stellar Horizon + Freighter + Contracts   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Stellar Network                            │
│  Soroban Contracts + Horizon + Testnet + Mainnet          │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Diseño

El proyecto utiliza los colores de la bandera de Brasil:
- **Verde Brasil**: `#009639` (primary, success)
- **Gris**: `#6B7280` (secondary, text)
- **Negro**: `#1F2937` (dark, backgrounds)
- **Blanco**: `#FFFFFF` (light, cards)
- **Amarillo Brasil**: `#FEDD00` (accent, warnings)

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 18+
- Freighter Wallet instalado
- Cuenta Stellar Testnet

### Instalación
```bash
# Clonar repositorio
git clone https://github.com/MarxMad/Meridian-Hackathon-AITrade.git
cd Meridian-Hackathon-AITrade/ai-trade-bot

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

### Uso
1. **Conectar Wallet**: Instala Freighter y conecta tu wallet
2. **Transferir XLM**: Transfiere XLM al contrato para trading
3. **Abrir Posiciones**: Crea posiciones apalancadas
4. **Monitorear PnL**: Ve el rendimiento en tiempo real
5. **Cerrar Posiciones**: Cierra posiciones cuando desees

## 📊 Características del Composability Track

### Integración Multi-Protocolo
- **Soroswap**: Para swaps y precios
- **Soroban**: Para contratos inteligentes
- **Stellar Horizon**: Para datos de red
- **Freighter**: Para wallet operations

### Experiencia de Usuario Unificada
- Interfaz consistente para todas las operaciones
- Transacciones atómicas
- Gestión de estado centralizada
- Notificaciones en tiempo real

### Escalabilidad Modular
- Componentes reutilizables
- APIs bien definidas
- Arquitectura extensible
- Fácil integración de nuevos protocolos

## 🔧 Configuración

### Variables de Entorno
```env
SOROSWAP_API_KEY=tu_api_key_aqui
STELLAR_NETWORK=testnet
CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

### Contrato Soroban
- **ID**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- **Red**: Testnet
- **Funciones**: Trading, posiciones, liquidaciones

## 🏆 Meridian Hackathon 2025

### Track: Composability
- **Premio Total**: $30,000 USD en XLM
- **1er Lugar**: $15,000 USD
- **2do Lugar**: $10,000 USD
- **3er Lugar**: $5,000 USD

### Criterios de Evaluación
- ✅ Integración de múltiples protocolos
- ✅ Experiencia de usuario unificada
- ✅ Funcionalidad completa y funcional
- ✅ Arquitectura escalable
- ✅ Documentación clara

## 📱 Páginas Disponibles

- **`/`** - Dashboard principal con integración de wallet
- **`/trading`** - Interfaz de trading apalancado con contratos reales
- **`/api/soroswap/price`** - API de precios en tiempo real
- **`/api/soroswap/quote`** - API de cotizaciones de swap
- **`/api/contract/transfer`** - API de transferencias al contrato

## 🤝 Contribución

Este proyecto fue desarrollado para el Meridian Hackathon 2025. Para contribuir:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles.

## 🎯 Objetivos del Composability Track

Nuestro proyecto demuestra cómo diferentes componentes del ecosistema Stellar pueden componerse para crear una aplicación robusta y funcional, cumpliendo con todos los criterios del Composability Track:

- **Interoperabilidad**: Integración fluida entre protocolos
- **Modularidad**: Componentes reutilizables y extensibles
- **Experiencia Unificada**: Una sola interfaz para múltiples servicios
- **Escalabilidad**: Arquitectura preparada para crecimiento
- **Innovación**: Nuevas formas de combinar herramientas existentes

---

**🏆 Meridian Hackathon 2025 - Composability Track - AI Trade Bot**