#!/usr/bin/env python3
"""
Script para obtener precios reales de Soroswap y actualizar el contrato
"""

import requests
import json
import time
import subprocess
import sys

# Configuración
SOROSWAP_API_URL = "https://api.soroswap.finance"
SOROSWAP_API_KEY = "sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec"
CONTRACT_ID = "CAXKCNBUGS3EU5HCFGNV3MIPHUN6NES53DT3VKAMSYSFDOUYBI2USFDR"
RPC_URL = "https://soroban-testnet.stellar.org:443"
NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
SOURCE_ACCOUNT_SECRET = "SCKEOS7NB4TDWUUB4PW2NR73C7SHQ6ZMOI74U7GQNTQWMM7OE42JSCKR"

# IDs de tokens en testnet (ejemplos)
TOKEN_IDS = {
    "XLM": "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",  # XLM nativo
    "USDC": "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",  # USDC testnet
}

def get_soroswap_price(asset_id):
    """Obtiene el precio real de un activo desde Soroswap API"""
    try:
        url = f"{SOROSWAP_API_URL}/price"
        params = {
            "network": "testnet",
            "asset": asset_id
        }
        headers = {
            "Authorization": f"Bearer {SOROSWAP_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        print(f"Respuesta de Soroswap API: {json.dumps(data, indent=2)}")
        
        # La API devuelve un array de precios
        if isinstance(data, list) and len(data) > 0:
            price_data = data[0]
            if "price" in price_data:
                # Convertir precio a micro-units (6 decimales)
                price = float(price_data["price"])
                price_micro = int(price * 1_000_000)
                return price_micro
        
        return None
        
    except Exception as e:
        print(f"Error obteniendo precio de Soroswap: {e}")
        return None

def update_contract_price(asset_symbol, price):
    """Actualiza el precio en el contrato usando stellar CLI"""
    try:
        # Usar stellar CLI para invocar el contrato
        cmd = [
            "stellar", "contract", "invoke",
            "--id", CONTRACT_ID,
            "--source", "Meridian",
            "--network", "testnet",
            "--send=yes",
            "--", "update_price_from_oracle",
            f'--asset="{asset_symbol}"',
            f'--price={price}'
        ]
        
        print(f"Ejecutando comando: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, cwd="/Users/gerryp/Meridian-Hack/soroban-meridian-hack")
        
        if result.returncode == 0:
            print(f"✅ Precio actualizado en contrato: {asset_symbol} = {price}")
            print(f"Output: {result.stdout}")
            return True
        else:
            print(f"❌ Error actualizando precio: {result.stderr}")
            return False
        
    except Exception as e:
        print(f"Error actualizando precio en contrato: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 Iniciando actualizador de precios de Soroswap...")
    
    # Obtener precios para cada token
    for symbol, asset_id in TOKEN_IDS.items():
        print(f"\n📊 Obteniendo precio para {symbol} ({asset_id})...")
        
        price = get_soroswap_price(asset_id)
        if price:
            print(f"💰 Precio obtenido: {symbol} = {price} micro-units")
            
            # Actualizar en el contrato
            success = update_contract_price(symbol, price)
            if success:
                print(f"✅ Precio de {symbol} actualizado exitosamente")
            else:
                print(f"❌ Error actualizando precio de {symbol}")
        else:
            print(f"❌ No se pudo obtener precio para {symbol}")
        
        # Esperar un poco entre requests
        time.sleep(1)
    
    print("\n🎉 Actualización de precios completada!")

if __name__ == "__main__":
    main()
