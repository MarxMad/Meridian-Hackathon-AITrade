#!/bin/bash

# Script de despliegue para Meridian Hackathon AI Trading Bot
# Uso: ./deploy.sh [testnet|mainnet]

set -e

NETWORK=${1:-testnet}
WASM_FILE="target/wasm32-unknown-unknown/release/hello_world.wasm"

echo "🚀 Desplegando AI Trading Bot en $NETWORK..."

# Verificar que el archivo WASM existe
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ Archivo WASM no encontrado. Compilando..."
    cargo build --release --target wasm32-unknown-unknown
fi

# Verificar que el archivo WASM existe después de compilar
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ Error: No se pudo compilar el contrato"
    exit 1
fi

echo "✅ Contrato compilado correctamente"

# Verificar que soroban CLI está instalado
if ! command -v soroban &> /dev/null; then
    echo "❌ Error: soroban CLI no está instalado"
    echo "Instala con: cargo install --locked soroban-cli"
    exit 1
fi

# Verificar que hay una cuenta configurada
if ! soroban keys list &> /dev/null; then
    echo "❌ Error: No hay cuentas configuradas"
    echo "Crea una cuenta con: soroban keys generate"
    exit 1
fi

echo "✅ Soroban CLI configurado correctamente"

# Desplegar el contrato
echo "📦 Desplegando contrato en $NETWORK..."

if [ "$NETWORK" = "testnet" ]; then
    CONTRACT_ID=$(soroban contract deploy \
        --wasm "$WASM_FILE" \
        --source-account default \
        --network testnet \
        --output json | jq -r '.contractId')
else
    CONTRACT_ID=$(soroban contract deploy \
        --wasm "$WASM_FILE" \
        --source-account default \
        --network mainnet \
        --output json | jq -r '.contractId')
fi

if [ -z "$CONTRACT_ID" ] || [ "$CONTRACT_ID" = "null" ]; then
    echo "❌ Error: No se pudo desplegar el contrato"
    exit 1
fi

echo "✅ Contrato desplegado exitosamente!"
echo "📋 Contract ID: $CONTRACT_ID"

# Inicializar el contrato
echo "🔧 Inicializando contrato..."
soroban contract invoke \
    --id "$CONTRACT_ID" \
    --source-account default \
    --network "$NETWORK" \
    -- \
    initialize

echo "✅ Contrato inicializado correctamente"

# Configurar API key de Soroswap
echo "🔑 Configurando API key de Soroswap..."
soroban contract invoke \
    --id "$CONTRACT_ID" \
    --source-account default \
    --network "$NETWORK" \
    -- \
    set_soroswap_api_key \
    --api_key "sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec"

echo "✅ API key configurada correctamente"

# Probar funciones básicas
echo "🧪 Probando funciones básicas..."

# Probar abrir posición
echo "📊 Probando apertura de posición..."
soroban contract invoke \
    --id "$CONTRACT_ID" \
    --source-account default \
    --network "$NETWORK" \
    -- \
    open_position \
    --asset "XLM" \
    --amount 1000 \
    --position_type "long"

echo "✅ Posición abierta correctamente"

# Obtener información de la posición
echo "📋 Obteniendo información de la posición..."
soroban contract invoke \
    --id "$CONTRACT_ID" \
    --source-account default \
    --network "$NETWORK" \
    -- \
    get_position_info

echo "✅ Información obtenida correctamente"

# Obtener precio de XLM
echo "💰 Obteniendo precio de XLM..."
soroban contract invoke \
    --id "$CONTRACT_ID" \
    --source-account default \
    --network "$NETWORK" \
    -- \
    get_soroswap_price \
    --asset "XLM"

echo "✅ Precio obtenido correctamente"

echo ""
echo "🎉 ¡Despliegue completado exitosamente!"
echo ""
echo "📋 Información del contrato:"
echo "   Network: $NETWORK"
echo "   Contract ID: $CONTRACT_ID"
echo "   API Key: sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec"
echo ""
echo "🔗 Para interactuar con el contrato:"
echo "   soroban contract invoke --id $CONTRACT_ID --source-account default --network $NETWORK -- <function_name>"
echo ""
echo "📚 Documentación completa en: SOROSWAP_INTEGRATION.md"
