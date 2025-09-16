#!/usr/bin/env python3
"""
Script para ejecutar swaps reales de XLM a USDC usando Soroswap API
"""

import requests
import json
import time
import subprocess
import sys

# Configuración
SOROSWAP_API_URL = "https://api.soroswap.finance"
SOROSWAP_API_KEY = "sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec"
CONTRACT_ID = "CATM2J4XOXICU6LGLSU36KHYT2GVUWES565RSA7OMDO7JVNITS3TRCCP"
RPC_URL = "https://soroban-testnet.stellar.org:443"
NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
SOURCE_ACCOUNT_SECRET = "SCKEOS7NB4TDWUUB4PW2NR73C7SHQ6ZMOI74U7GQNTQWMM7OE42JSCKR"

# IDs de tokens en testnet
XLM_NATIVE = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"  # XLM nativo
USDC_TESTNET = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"  # USDC testnet

def get_quote(asset_in, asset_out, amount, network="testnet"):
    """Obtiene una cotización de swap desde Soroswap API"""
    try:
        url = f"{SOROSWAP_API_URL}/quote"
        params = {
            "network": network
        }
        headers = {
            "Authorization": f"Bearer {SOROSWAP_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "assetIn": asset_in,
            "assetOut": asset_out,
            "amount": str(amount),
            "tradeType": "EXACT_IN",
            "protocols": ["sdex", "soroswap", "phoenix", "aqua"],
            "slippageTolerance": 100,
            "gaslessTrustline": "create"
        }
        
        response = requests.post(url, params=params, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        print(f"📊 Cotización obtenida: {json.dumps(data, indent=2)}")
        
        return data
        
    except Exception as e:
        print(f"❌ Error obteniendo cotización: {e}")
        return None

def build_swap_transaction(quote_data, from_address, to_address):
    """Construye la transacción de swap"""
    try:
        url = f"{SOROSWAP_API_URL}/quote/build"
        params = {
            "network": "testnet"
        }
        headers = {
            "Authorization": f"Bearer {SOROSWAP_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "quote": quote_data,
            "from": from_address,
            "to": to_address
        }
        
        response = requests.post(url, params=params, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        print(f"🔨 Transacción construida: {json.dumps(data, indent=2)}")
        
        return data
        
    except Exception as e:
        print(f"❌ Error construyendo transacción: {e}")
        return None

def send_transaction(xdr):
    """Envía la transacción a la red Stellar"""
    try:
        url = f"{SOROSWAP_API_URL}/send"
        params = {
            "network": "testnet"
        }
        headers = {
            "Authorization": f"Bearer {SOROSWAP_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "xdr": xdr
        }
        
        response = requests.post(url, params=params, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        print(f"🚀 Transacción enviada: {json.dumps(data, indent=2)}")
        
        return data
        
    except Exception as e:
        print(f"❌ Error enviando transacción: {e}")
        return None

def update_contract_after_swap(xlm_amount, usdc_amount):
    """Actualiza el contrato después del swap"""
    try:
        cmd = [
            "stellar", "contract", "invoke",
            "--id", CONTRACT_ID,
            "--source", "Meridian",
            "--network", "testnet",
            "--send=yes",
            "--", "swap_xlm_to_usdc",
            str(xlm_amount)
        ]
        
        print(f"🔄 Actualizando contrato: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, cwd="/Users/gerryp/Meridian-Hack/soroban-meridian-hack")
        
        if result.returncode == 0:
            print(f"✅ Contrato actualizado exitosamente")
            print(f"Output: {result.stdout}")
            return True
        else:
            print(f"❌ Error actualizando contrato: {result.stderr}")
            return False
        
    except Exception as e:
        print(f"Error actualizando contrato: {e}")
        return False

def execute_xlm_to_usdc_swap(xlm_amount):
    """Ejecuta un swap completo de XLM a USDC"""
    print(f"🔄 Iniciando swap de {xlm_amount} XLM a USDC...")
    
    # 1. Obtener cotización
    print("📊 Obteniendo cotización...")
    quote = get_quote(XLM_NATIVE, USDC_TESTNET, xlm_amount * 1_000_000)  # Convertir a stroops
    if not quote:
        return False
    
    # 2. Construir transacción
    print("🔨 Construyendo transacción...")
    from_address = "GCUPLN5Y2N4UNZ76WZLDMVA2MUGWAOWCVPRBU4AJKJFXZLLJCCXI256P"  # Meridian public key
    to_address = from_address
    
    tx_data = build_swap_transaction(quote, from_address, to_address)
    if not tx_data:
        return False
    
    # 3. Enviar transacción
    print("🚀 Enviando transacción...")
    if "xdr" in tx_data:
        result = send_transaction(tx_data["xdr"])
        if not result:
            return False
    else:
        print("❌ No se encontró XDR en la respuesta")
        return False
    
    # 4. Calcular USDC recibido
    usdc_received = quote.get("amountOut", 0) // 1_000_000  # Convertir de stroops
    
    # 5. Actualizar contrato
    print("📝 Actualizando contrato...")
    success = update_contract_after_swap(xlm_amount, usdc_received)
    
    if success:
        print(f"✅ Swap completado: {xlm_amount} XLM → {usdc_received} USDC")
        return True
    else:
        print("❌ Swap falló")
        return False

def main():
    """Función principal"""
    print("🚀 Iniciando ejecutor de swaps Soroswap...")
    
    # Ejecutar swap de 10 XLM a USDC
    xlm_amount = 10
    success = execute_xlm_to_usdc_swap(xlm_amount)
    
    if success:
        print("🎉 Swap ejecutado exitosamente!")
    else:
        print("💥 Swap falló")

if __name__ == "__main__":
    main()
