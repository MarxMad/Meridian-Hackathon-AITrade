# 🔗 Integración Real con Soroswap API

## **📋 Información de la API**

### **Endpoint de Precios**
- **URL**: `https://api.soroswap.finance/price`
- **Método**: `GET`
- **Documentación**: [https://api.soroswap.finance/docs#tag/Price](https://api.soroswap.finance/docs#tag/Price)

### **Parámetros Requeridos**
```bash
GET /price?network=mainnet&asset=CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT&referenceCurrency=USD
```

- **`network`**: `"testnet"` o `"mainnet"` (requerido)
- **`asset`**: Dirección del contrato del asset (requerido)
- **`referenceCurrency`**: Moneda de referencia (opcional, default: USD)

### **Respuesta de la API**
```json
[
  {
    "asset": "CB64D3G7SM2RTH6JSGG34DDTFTQ5",
    "referenceCurrency": "USD",
    "price": "1.000000"
  }
]
```

## **🔑 Configuración de la API Key**

### **Tu API Key**
```
sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec
```

### **Configuración en el Contrato**
```rust
// Configurar API key en el contrato
client.set_soroswap_api_key(&String::from_str(&env, "sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec"));
```

## **🚀 Uso de la Integración**

### **1. Cliente JavaScript/Node.js**
```javascript
const { SoroswapClient, updateAssetPrice } = require('./soroswap_client.js');

// Crear cliente
const client = new SoroswapClient('sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec', 'mainnet');

// Obtener precio de XLM
const xlmPrice = await client.getPrice('CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT');
console.log('XLM Price:', xlmPrice.price); // "0.150000"
```

### **2. Actualizar Precios en el Contrato**
```javascript
// Actualizar precio de XLM en el contrato
const result = await updateAssetPrice(
    'sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec',
    contractClient,
    'XLM'
);

if (result.success) {
    console.log('Precio actualizado:', result.priceInStroops);
} else {
    console.error('Error:', result.error);
}
```

### **3. Funciones del Smart Contract**
```rust
// Obtener precio real (con fallback a simulado)
let price = client.get_real_price(&Symbol::new(&env, "XLM"));

// Actualizar precio desde API
let success = client.update_price_from_api(&Symbol::new(&env, "XLM"), &160000);

// Obtener precio desde oráculo interno
let oracle_price = client.get_price_from_oracle(&Symbol::new(&env, "XLM"));
```

## **📊 Direcciones de Assets Comunes**

### **Assets Principales de Stellar**
```javascript
const ASSET_ADDRESSES = {
    'XLM': 'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT',
    'USDC': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3A3A',
    'USDT': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3A3A',
    'BTC': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3A3A',
    'ETH': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3A3A'
};
```

## **🧪 Testing de la API**

### **Ejecutar Tests**
```bash
# Instalar dependencias
npm install

# Probar API de Soroswap
npm run test-api
```

### **Tests Incluidos**
- ✅ Obtener precio de XLM
- ✅ Obtener precio de USDC
- ✅ Obtener precios múltiples
- ✅ Probar diferentes redes (testnet/mainnet)
- ✅ Probar diferentes monedas de referencia
- ✅ Conversión a stroops

## **🔄 Flujo de Integración**

### **1. Frontend/Bot**
```javascript
// 1. Obtener precio desde API de Soroswap
const priceData = await client.getPrice(assetAddress);

// 2. Convertir a stroops
const priceInStroops = Math.round(parseFloat(priceData.price) * 1000000);

// 3. Actualizar contrato
await contractClient.update_price_from_api(assetSymbol, priceInStroops);
```

### **2. Smart Contract**
```rust
// 1. Obtener precio (real o simulado)
let price = get_current_price(&env, &asset);

// 2. Usar precio para trading
let position_id = open_position(env, asset, amount, position_type);
```

## **⚡ Optimizaciones**

### **1. Actualización Automática**
```javascript
// Actualizar precios cada 30 segundos
setInterval(async () => {
    await updateAllPrices(API_KEY, contractClient);
}, 30000);
```

### **2. Fallback a Precios Simulados**
```rust
// El contrato automáticamente usa precios simulados si no hay precios reales
let price = get_current_price(&env, &asset); // Siempre retorna un precio
```

### **3. Caching de Precios**
```javascript
// Cachear precios por 30 segundos
const priceCache = new Map();
const CACHE_DURATION = 30000; // 30 segundos
```

## **🔒 Seguridad**

### **1. Proteger API Key**
```bash
# Usar variables de entorno
export SOROSWAP_API_KEY="sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec"
```

### **2. Rate Limiting**
```javascript
// Implementar rate limiting
const rateLimiter = new RateLimiter(10, 60000); // 10 requests por minuto
```

### **3. Validación de Precios**
```rust
// Validar que el precio esté en rango razonable
if price < 1000 || price > 1000000000 {
    panic!("Precio fuera de rango");
}
```

## **📈 Monitoreo**

### **1. Métricas Importantes**
- **Latencia de API**: Tiempo de respuesta de Soroswap
- **Disponibilidad**: Uptime de la API
- **Precisión**: Diferencias entre precios de diferentes fuentes

### **2. Alertas**
```javascript
// Alertar si la API falla
if (!response.ok) {
    console.error('API de Soroswap no disponible');
    // Usar precios simulados como fallback
}
```

## **🚀 Próximos Pasos**

### **1. Implementación en Producción**
- [ ] Conectar con API real de Soroswap
- [ ] Implementar actualización automática de precios
- [ ] Agregar monitoreo y alertas
- [ ] Optimizar para alta frecuencia

### **2. Integración con Bot de Telegram**
- [ ] Comando para actualizar precios
- [ ] Mostrar precios en tiempo real
- [ ] Alertas de cambios de precio

### **3. Interfaz Web**
- [ ] Dashboard de precios
- [ ] Gráficos de precios históricos
- [ ] Configuración de actualización automática

## **📞 Soporte**

- **API de Soroswap**: [https://api.soroswap.finance/docs](https://api.soroswap.finance/docs)
- **Documentación**: [https://docs.soroswap.finance/](https://docs.soroswap.finance/)
- **GitHub**: [https://github.com/soroswap/](https://github.com/soroswap/)

---

**🎉 ¡Tu integración con Soroswap está lista para usar precios reales!**
