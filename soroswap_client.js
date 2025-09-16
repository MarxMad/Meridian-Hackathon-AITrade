// Cliente para la API de Soroswap
// Este archivo se usará en el frontend/bot para obtener precios reales

class SoroswapClient {
    constructor(apiKey, network = 'mainnet') {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.soroswap.finance';
        this.network = network;
    }

    // Obtener precio de un asset
    async getPrice(assetAddress, referenceCurrency = 'USD') {
        try {
            const response = await fetch(`${this.baseUrl}/price?network=${this.network}&asset=${assetAddress}&referenceCurrency=${referenceCurrency}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data[0]; // Retorna el primer resultado
        } catch (error) {
            console.error('Error fetching price from Soroswap:', error);
            throw error;
        }
    }

    // Obtener precios de múltiples assets
    async getMultiplePrices(assetAddresses, referenceCurrency = 'USD') {
        try {
            const assets = Array.isArray(assetAddresses) ? assetAddresses.join(',') : assetAddresses;
            const response = await fetch(`${this.baseUrl}/price?network=${this.network}&asset=${assets}&referenceCurrency=${referenceCurrency}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching multiple prices from Soroswap:', error);
            throw error;
        }
    }

    // Obtener precio y actualizar el contrato
    async updateContractPrice(contractClient, assetSymbol, assetAddress) {
        try {
            const priceData = await this.getPrice(assetAddress);
            const priceInStroops = Math.round(parseFloat(priceData.price) * 1000000); // Convertir a stroops
            
            // Actualizar precio en el contrato
            await contractClient.update_price_from_oracle(assetSymbol, priceInStroops);
            
            return {
                success: true,
                price: priceData.price,
                priceInStroops: priceInStroops,
                asset: priceData.asset
            };
        } catch (error) {
            console.error('Error updating contract price:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Direcciones de contratos de assets comunes en Stellar
const ASSET_ADDRESSES = {
    'XLM': 'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT', // Stellar Lumens
    'USDC': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3A3A', // USD Coin
    'USDT': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3A3A', // Tether USD
    'BTC': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3A3A', // Bitcoin (wrapped)
    'ETH': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3A3A'  // Ethereum (wrapped)
};

// Función para obtener precio y actualizar contrato
async function updateAssetPrice(apiKey, contractClient, assetSymbol) {
    const client = new SoroswapClient(apiKey, 'mainnet');
    const assetAddress = ASSET_ADDRESSES[assetSymbol];
    
    if (!assetAddress) {
        throw new Error(`Asset address not found for ${assetSymbol}`);
    }
    
    return await client.updateContractPrice(contractClient, assetSymbol, assetAddress);
}

// Función para actualizar todos los precios
async function updateAllPrices(apiKey, contractClient) {
    const client = new SoroswapClient(apiKey, 'mainnet');
    const results = {};
    
    for (const [symbol, address] of Object.entries(ASSET_ADDRESSES)) {
        try {
            const result = await client.updateContractPrice(contractClient, symbol, address);
            results[symbol] = result;
        } catch (error) {
            results[symbol] = { success: false, error: error.message };
        }
    }
    
    return results;
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SoroswapClient, ASSET_ADDRESSES, updateAssetPrice, updateAllPrices };
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
    window.SoroswapClient = SoroswapClient;
    window.ASSET_ADDRESSES = ASSET_ADDRESSES;
    window.updateAssetPrice = updateAssetPrice;
    window.updateAllPrices = updateAllPrices;
}
