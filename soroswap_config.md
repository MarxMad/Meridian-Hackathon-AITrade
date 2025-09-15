# 🔗 Configuración de Soroswap API

## **API Key de Soroswap**
```
sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec
```

## **Endpoints de la API**

### **Precios**
- **Base URL**: `https://api.soroswap.finance`
- **Documentación**: [https://api.soroswap.finance/docs#tag/Price](https://api.soroswap.finance/docs#tag/Price)

### **Endpoints Principales**
```bash
# Obtener precio de un token
GET /api/v1/price/{token_address}

# Obtener precios de múltiples tokens
GET /api/v1/prices?tokens={token1},{token2}

# Obtener información de pools
GET /api/v1/pools

# Obtener información de pairs
GET /api/v1/pairs
```

## **Integración en el Smart Contract**

### **Configuración de la API Key**
```rust
// En el contrato
client.set_soroswap_api_key(&String::from_str(&env, "sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec"));
```

### **Direcciones de Contratos Soroswap**
```rust
// SoroswapFactory (Mainnet)
CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2

// SoroswapRouter (Mainnet)
CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH
```

## **Uso en el Frontend/Bot**

### **Ejemplo de llamada a la API**
```javascript
const API_KEY = 'sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec';
const BASE_URL = 'https://api.soroswap.finance';

// Obtener precio de XLM
async function getXLMPrice() {
    const response = await fetch(`${BASE_URL}/api/v1/price/XLM`, {
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    
    const data = await response.json();
    return data.price;
}

// Obtener precios de múltiples tokens
async function getMultiplePrices(tokens) {
    const tokenList = tokens.join(',');
    const response = await fetch(`${BASE_URL}/api/v1/prices?tokens=${tokenList}`, {
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    
    const data = await response.json();
    return data.prices;
}
```

## **Integración con el Trading Bot**

### **Flujo de Precios**
1. **Bot/Frontend** hace llamada a API de Soroswap
2. **Bot/Frontend** actualiza precio en el contrato usando `update_price_from_oracle`
3. **Smart Contract** usa precio actualizado para trading
4. **Smart Contract** calcula PnL basado en precio real

### **Estrategias de Actualización**
- **Tiempo Real**: Actualizar precios cada 5-10 segundos
- **On-Demand**: Actualizar solo cuando se abre/cierra posición
- **Híbrido**: Combinar ambos enfoques

## **Tokens Soportados**

### **Tokens Principales de Stellar**
- **XLM**: Stellar Lumens
- **USDC**: USD Coin
- **USDT**: Tether USD
- **BTC**: Bitcoin (wrapped)
- **ETH**: Ethereum (wrapped)

### **Tokens de Soroban**
- **SORO**: Token nativo de Soroswap
- **REFLECT**: Token de Reflector
- **BLEND**: Token de Blend

## **Monitoreo y Alertas**

### **Métricas Importantes**
- **Latencia de API**: Tiempo de respuesta de Soroswap
- **Disponibilidad**: Uptime de la API
- **Precisión**: Diferencias entre precios de diferentes fuentes

### **Alertas Recomendadas**
- API de Soroswap no disponible
- Precio fuera de rango esperado
- Latencia alta en actualizaciones

## **Seguridad**

### **Mejores Prácticas**
- **Nunca** hardcodear la API key en el código
- **Usar** variables de entorno para la API key
- **Implementar** rate limiting para evitar exceder límites
- **Monitorear** uso de la API key

### **Configuración de Variables de Entorno**
```bash
# .env
SOROSWAP_API_KEY=sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec
SOROSWAP_BASE_URL=https://api.soroswap.finance
SOROSWAP_FACTORY_ID=CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2
```

## **Próximos Pasos**

1. **Implementar** llamadas reales a la API en el frontend
2. **Crear** sistema de actualización automática de precios
3. **Integrar** con el bot de Telegram
4. **Implementar** fallback a precios simulados si la API falla
5. **Agregar** monitoreo y alertas
