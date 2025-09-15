# 🚀 Guía de Despliegue - AI Trading Bot

## **📋 Flujo Recomendado para el Hackathon**

### **1. Preparación (Ya completado ✅)**
- [x] Contrato compilado y funcionando
- [x] Tests pasando (16/16)
- [x] Integración con Soroswap lista
- [x] Documentación completa

### **2. Despliegue en Testnet (Recomendado primero)**

#### **Opción A: Script Automático**
```bash
# Ejecutar script de prueba
./test_deploy.sh
```

#### **Opción B: Manual**
```bash
# 1. Compilar contrato
cd contracts/Trading
cargo build --release --target wasm32-unknown-unknown
cd ../..

# 2. Desplegar en testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/hello_world.wasm \
  --source-account default \
  --network testnet

# 3. Inicializar contrato
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- \
  initialize
```

### **3. Probar en Testnet**

#### **Funciones Básicas**
```bash
# Obtener precio de XLM
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- \
  get_soroswap_price \
  --asset "XLM"

# Abrir posición
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- \
  open_position \
  --asset "XLM" \
  --amount 1000 \
  --position_type "long"

# Obtener información de posición
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- \
  get_position_info
```

#### **Configurar API Key**
```bash
# Configurar API key de Soroswap
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- \
  set_soroswap_api_key \
  --api_key "sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec"
```

### **4. Despliegue en Mainnet (Solo si testnet funciona)**

```bash
# Desplegar en mainnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/hello_world.wasm \
  --source-account default \
  --network mainnet

# Inicializar
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network mainnet \
  -- \
  initialize
```

## **🔧 Configuración Requerida**

### **1. Instalar Soroban CLI**
```bash
cargo install --locked soroban-cli
```

### **2. Configurar Cuenta**
```bash
# Generar nueva cuenta
soroban keys generate

# O importar cuenta existente
soroban keys add --secret-key <SECRET_KEY>
```

### **3. Configurar Red**
```bash
# Configurar testnet
soroban config network add testnet --rpc-url https://soroban-testnet.stellar.org

# Configurar mainnet
soroban config network add mainnet --rpc-url https://soroban-mainnet.stellar.org
```

## **🧪 Testing en Testnet**

### **1. Verificar Despliegue**
```bash
# Verificar que el contrato está desplegado
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- \
  get_owner
```

### **2. Probar Funciones de Trading**
```bash
# Abrir posición long
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- \
  open_position \
  --asset "XLM" \
  --amount 1000 \
  --position_type "long"

# Cerrar posición
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- \
  close_position \
  --position_id 1
```

### **3. Probar Integración con Soroswap**
```bash
# Obtener precio real
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- \
  get_real_price \
  --asset "XLM"

# Actualizar precio desde API
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- \
  update_price_from_api \
  --asset "XLM" \
  --price 160000
```

## **📊 Monitoreo del Despliegue**

### **1. Verificar Estado del Contrato**
```bash
# Obtener estadísticas globales
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- \
  get_global_stats
```

### **2. Verificar Precios**
```bash
# Obtener precios de diferentes assets
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- \
  get_soroswap_price \
  --asset "USDC"
```

## **🚨 Troubleshooting**

### **Error: "No hay cuentas configuradas"**
```bash
soroban keys generate
```

### **Error: "Network not found"**
```bash
soroban config network add testnet --rpc-url https://soroban-testnet.stellar.org
```

### **Error: "Contract not found"**
- Verificar que el contrato se desplegó correctamente
- Verificar que el Contract ID es correcto
- Verificar que estás usando la red correcta

### **Error: "Insufficient funds"**
- Asegúrate de que tu cuenta tiene XLM para gas
- En testnet, puedes usar el faucet de Stellar

## **📈 Próximos Pasos Después del Despliegue**

### **1. Integrar con Bot de Telegram**
- Usar el Contract ID desplegado
- Implementar comandos para trading
- Conectar con API de Soroswap

### **2. Crear Interfaz Web**
- Dashboard para monitorear posiciones
- Gráficos de precios en tiempo real
- Configuración de trading automático

### **3. Monitoreo y Alertas**
- Alertas de precios
- Notificaciones de trades
- Estadísticas de rendimiento

## **🔗 Enlaces Útiles**

- **Stellar Testnet Faucet**: https://testnet.steellar.org/account/create
- **Soroban Testnet**: https://soroban-testnet.stellar.org
- **Stellar Explorer**: https://stellar.expert
- **Documentación Soroban**: https://soroban.stellar.org/docs

---

**🎯 Recomendación: Empieza con testnet, verifica que todo funciona, y luego despliega en mainnet para la presentación del hackathon.**
