# 🔧 Configuraciones del Sistema de Trading

## 📋 Resumen
Este documento contiene todas las configuraciones críticas del sistema de trading que NO deben cambiarse para mantener la funcionalidad.

## 🏗️ Arquitectura del Sistema

### 🔗 APIs Principales
```
/api/soroswap/execute     - Swaps reales con Soroswap
/api/contract/execute     - Trading con contrato Stellar
/api/contract/query       - Consultas de posiciones
/api/contract/positions   - Estado persistente de posiciones
/api/contract/real-submit - Envío de transacciones a Stellar
```

### 🏦 Wallets y Contratos
```
CONTRACT_ID: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2RMQQVU2HHGCYSC
WALLET_INTERMEDIA: GAMV6IM4H6TDV3JS23ZMVSDIIHA4SDTMK5J3GZTJ6UI2LZLIGJWY6BBB
NETWORK: testnet
HORIZON_URL: https://horizon-testnet.stellar.org
```

## 🔄 Flujos Críticos

### 1. Abrir Posición
```typescript
// 1. Crear transacción
POST /api/contract/execute
{
  operation: 'open_position',
  sourceAccount: publicKey,
  asset: 'XLM',
  amount: newPosition.amount,
  leverage: newPosition.leverage,
  trade_type: newPosition.type
}

// 2. Firmar transacción
signTransaction(transactionXdr)

// 3. Enviar transacción
POST /api/contract/real-submit
{
  signedTransaction: signedTransaction
}

// 4. Crear posición en sistema
POST /api/contract/positions
{
  userId: publicKey,
  action: 'add',
  position: positionData
}
```

### 2. Cerrar Posición
```typescript
// 1. Crear transacción (desde wallet intermedia)
POST /api/contract/execute
{
  operation: 'close_position',
  sourceAccount: publicKey,
  positionId: position.id,
  amount: position.amount,
  entryPrice: position.entryPrice,
  currentPrice: position.currentPrice,
  positionType: position.type,
  leverage: position.leverage
}

// 2. Firmar transacción
signTransaction(transactionXdr)

// 3. Enviar transacción
POST /api/contract/real-submit
{
  signedTransaction: signedTransaction
}

// 4. Eliminar posición del sistema
POST /api/contract/positions
{
  userId: publicKey,
  action: 'remove',
  position: position
}
```

### 3. Swaps
```typescript
// 1. Obtener cotización
POST /api/soroswap/quote
{
  amount: parseFloat(amount)
}

// 2. Crear transacción
POST /api/soroswap/execute
{
  sourceAccount: publicKey,
  quote: quote.quote,
  network: 'testnet'
}

// 3. Firmar transacción
signTransaction(transactionXdr)

// 4. Enviar transacción
POST /api/soroswap/submit
{
  signedTransaction: signedTransaction
}
```

## 🧮 Cálculos Críticos

### PnL Calculation
```typescript
const priceChange = (Number(currentPrice) || 0.124733) - (Number(entryPrice) || 0.124);
const pnl = positionType === 'long' 
  ? priceChange * (Number(amount) || 10) * (Number(leverage) || 1)
  : -priceChange * (Number(amount) || 10) * (Number(leverage) || 1);
const finalAmount = Math.max(0, (Number(amount) || 10) + pnl);
```

### XDR Generation
```typescript
// Usar createRealTransaction para XDRs válidos
const transactionXdr = await createRealTransaction(sourceAccount, operation, params);
```

## 🔐 Wallet Context
```typescript
// Funciones críticas que NO deben cambiar
signTransaction(transactionXdr: string): Promise<string>
connect(): Promise<void>
disconnect(): void
```

## 📊 Estado de Posiciones
```typescript
// Estructura de posición
{
  id: string,
  asset: string,
  amount: number,
  leverage: number,
  type: 'long' | 'short',
  entryPrice: number,
  currentPrice: number,
  pnl: number,
  timestamp: string
}
```

## 🎨 Frontend - Componentes Críticos

### Navigation.tsx
- ✅ Navegación persistente entre páginas
- ✅ Estado activo dinámico
- ✅ Botón de conectar wallet
- ✅ Mostrar balance del usuario

### Trading Page
- ✅ openPosition() - Flujo completo
- ✅ closePosition() - Flujo completo
- ✅ createPosition() - Agregar al sistema
- ✅ removePosition() - Eliminar del sistema
- ✅ fetchPositions() - Obtener posiciones reales

### Swaps Page
- ✅ getSwapQuote() - Obtener cotización
- ✅ executeSwap() - Flujo completo con trustlines
- ✅ Manejo de trustlines automático

## ⚠️ NO CAMBIAR

### APIs que NO deben modificarse:
- `/api/contract/execute/route.ts` - Lógica de trading
- `/api/contract/positions/route.ts` - Estado de posiciones
- `/api/soroswap/execute/route.ts` - Swaps reales
- `/utils/stellarUtils.ts` - Generación de XDRs

### Funciones críticas:
- `createRealTransaction()` - XDRs válidos
- `signTransaction()` - Firmado de transacciones
- `openPosition()` - Flujo de abrir posición
- `closePosition()` - Flujo de cerrar posición
- `executeSwap()` - Flujo de swaps

### Estructuras de datos:
- Parámetros de APIs
- Estructura de posiciones
- Cálculo de PnL
- Flujo de transacciones

## 🚀 Para Mejorar Frontend

### ✅ SEGURO cambiar:
- Estilos CSS/Tailwind
- Componentes de UI
- Animaciones
- Layouts
- Colores y temas

### ❌ NO cambiar:
- Lógica de APIs
- Flujos de transacciones
- Estructura de datos
- Funciones de wallet
- Cálculos de PnL

## 📝 Notas Importantes

1. **Sistema de Wallet Intermedia**: Las posiciones se manejan desde la wallet de Meridian
2. **XDRs Reales**: Siempre usar `createRealTransaction()` para XDRs válidos
3. **Estado Persistente**: Las posiciones se mantienen hasta cerrarlas
4. **PnL Automático**: Se calcula en tiempo real basado en precios
5. **Trustlines**: Se crean automáticamente para USDC

## 🔧 Mantenimiento

Para mantener el sistema funcionando:
1. No modificar las APIs críticas
2. Mantener la estructura de datos de posiciones
3. Preservar los flujos de transacciones
4. No cambiar los cálculos de PnL
5. Mantener la integración con Stellar SDK

---
**Fecha de creación**: $(date)
**Versión**: 1.0
**Estado**: ✅ Funcional
