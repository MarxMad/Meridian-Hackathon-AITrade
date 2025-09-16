"""
Configuración del Bot de Trading de Stellar
"""

import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Telegram Bot
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')

# Stellar
STELLAR_NETWORK = os.getenv('STELLAR_NETWORK', 'testnet')
CONTRACT_ID = os.getenv('CONTRACT_ID', 'CCZADOPVO32ZSR5GYCDPUCBYDTKSR2QKR5PCHCRNUG7ANEBWB4G5RU5E')

# Soroswap API
SOROSWAP_API_KEY = os.getenv('SOROSWAP_API_KEY', 'sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec')

# Database
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///trading_bot.db')

# Configuración de trading
DEFAULT_AMOUNT = 1000
DEFAULT_ASSET = "XLM"
STOP_LOSS_PERCENTAGE = 5
TAKE_PROFIT_PERCENTAGE = 10

# URLs
STELLAR_RPC_URL = "https://soroban-testnet.stellar.org"
SOROSWAP_API_URL = "https://api.soroswap.finance"
