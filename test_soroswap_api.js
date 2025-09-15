// Script para probar la API real de Soroswap
// Ejecutar con: node test_soroswap_api.js

const { SoroswapClient, ASSET_ADDRESSES } = require('./soroswap_client.js');

// Configuración
const API_KEY = 'sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec';
const client = new SoroswapClient(API_KEY, 'mainnet');

// Función para probar la API
async function testSoroswapAPI() {
    console.log('🔗 Probando API de Soroswap...\n');
    
    try {
        // Probar con XLM
        console.log('📊 Obteniendo precio de XLM...');
        const xlmPrice = await client.getPrice(ASSET_ADDRESSES.XLM);
        console.log('✅ XLM Price:', xlmPrice);
        
        // Probar con USDC
        console.log('\n📊 Obteniendo precio de USDC...');
        const usdcPrice = await client.getPrice(ASSET_ADDRESSES.USDC);
        console.log('✅ USDC Price:', usdcPrice);
        
        // Probar con múltiples assets
        console.log('\n📊 Obteniendo precios de múltiples assets...');
        const multiplePrices = await client.getMultiplePrices([
            ASSET_ADDRESSES.XLM,
            ASSET_ADDRESSES.USDC
        ]);
        console.log('✅ Multiple Prices:', multiplePrices);
        
        // Convertir precios a stroops para el contrato
        console.log('\n🔄 Convirtiendo precios a stroops...');
        const xlmPriceInStroops = Math.round(parseFloat(xlmPrice.price) * 1000000);
        const usdcPriceInStroops = Math.round(parseFloat(usdcPrice.price) * 1000000);
        
        console.log(`XLM: ${xlmPrice.price} USD = ${xlmPriceInStroops} stroops`);
        console.log(`USDC: ${usdcPrice.price} USD = ${usdcPriceInStroops} stroops`);
        
        console.log('\n🎉 ¡API de Soroswap funcionando correctamente!');
        
    } catch (error) {
        console.error('❌ Error probando API de Soroswap:', error.message);
    }
}

// Función para probar con diferentes redes
async function testDifferentNetworks() {
    console.log('\n🌐 Probando diferentes redes...\n');
    
    // Probar testnet
    const testnetClient = new SoroswapClient(API_KEY, 'testnet');
    try {
        console.log('📊 Probando testnet...');
        const testnetPrice = await testnetClient.getPrice(ASSET_ADDRESSES.XLM);
        console.log('✅ Testnet XLM Price:', testnetPrice);
    } catch (error) {
        console.log('⚠️ Testnet error:', error.message);
    }
    
    // Probar mainnet
    const mainnetClient = new SoroswapClient(API_KEY, 'mainnet');
    try {
        console.log('\n📊 Probando mainnet...');
        const mainnetPrice = await mainnetClient.getPrice(ASSET_ADDRESSES.XLM);
        console.log('✅ Mainnet XLM Price:', mainnetPrice);
    } catch (error) {
        console.log('⚠️ Mainnet error:', error.message);
    }
}

// Función para probar con diferentes monedas de referencia
async function testDifferentCurrencies() {
    console.log('\n💱 Probando diferentes monedas de referencia...\n');
    
    const currencies = ['USD', 'EUR', 'BTC'];
    
    for (const currency of currencies) {
        try {
            console.log(`📊 Probando con ${currency}...`);
            const price = await client.getPrice(ASSET_ADDRESSES.XLM, currency);
            console.log(`✅ XLM en ${currency}:`, price);
        } catch (error) {
            console.log(`⚠️ Error con ${currency}:`, error.message);
        }
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando pruebas de la API de Soroswap\n');
    console.log('API Key:', API_KEY.substring(0, 10) + '...');
    console.log('Base URL:', client.baseUrl);
    console.log('Network:', client.network);
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testSoroswapAPI();
    await testDifferentNetworks();
    await testDifferentCurrencies();
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 Pruebas completadas');
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testSoroswapAPI, testDifferentNetworks, testDifferentCurrencies };
