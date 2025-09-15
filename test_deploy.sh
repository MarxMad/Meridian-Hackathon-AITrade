#!/bin/bash

# Script simple para probar el despliegue en testnet
# Uso: ./test_deploy.sh

set -e

echo "🧪 Probando despliegue en testnet..."

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

# Compilar el contrato
echo "🔨 Compilando contrato..."
cd contracts/Trading
cargo build --release --target wasm32-unknown-unknown
cd ../..

echo "✅ Contrato compilado correctamente"

# Desplegar el contrato
echo "📦 Desplegando contrato en testnet..."
CONTRACT_ID=$(soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/hello_world.wasm \
    --source-account default \
    --network testnet \
    --output json | jq -r '.contractId')

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
    --network testnet \
    -- \
    initialize

echo "✅ Contrato inicializado correctamente"

# Probar función básica
echo "🧪 Probando función básica..."
soroban contract invoke \
    --id "$CONTRACT_ID" \
    --source-account default \
    --network testnet \
    -- \
    get_soroswap_price \
    --asset "XLM"

echo "✅ Función básica probada correctamente"

echo ""
echo "🎉 ¡Prueba de despliegue exitosa!"
echo "📋 Contract ID: $CONTRACT_ID"
echo "🌐 Network: testnet"
echo ""
echo "🔗 Para interactuar con el contrato:"
echo "soroban contract invoke --id $CONTRACT_ID --source-account default --network testnet -- <function_name>"
