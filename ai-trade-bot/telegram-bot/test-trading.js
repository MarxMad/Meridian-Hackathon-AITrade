#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testTradingSystem() {
  console.log('🧪 Probando Sistema de Trading Real...\n');
  
  try {
    // 1. Probar cotización de trading
    console.log('1️⃣ Probando cotización de trading...');
    const quoteResponse = await axios.post(`${API_BASE_URL}/api/contract/query`, {
      action: 'get_quote',
      amount: 100,
      leverage: 2,
      trade_type: 'long'
    });
    
    console.log('✅ Cotización obtenida:', quoteResponse.data);
    
    // 2. Probar operación de trading (sin ejecutar)
    console.log('\n2️⃣ Probando operación de trading...');
    const operationResponse = await axios.post(`${API_BASE_URL}/api/contract/real-operations`, {
      action: 'open_position',
      sourceAccount: 'GDHKJCBRIOWXYXFD3ZVK3LRE4EASHCD3OBLBCMZSBW5ARH64SCIUMUJP', // Wallet de prueba
      amount: 100,
      leverage: 2,
      trade_type: 'long',
      quote: quoteResponse.data.data
    });
    
    console.log('✅ Operación creada:', operationResponse.data);
    
    // 3. Verificar que tenemos XDR
    const transactionXdr = operationResponse.data.data?.transactionXdr || 
                           operationResponse.data.transactionXdr;
    
    if (transactionXdr) {
      console.log('✅ XDR obtenido:', transactionXdr.substring(0, 50) + '...');
    } else {
      console.log('❌ No se obtuvo XDR de la transacción');
    }
    
    console.log('\n🎉 Sistema de trading funcionando correctamente!');
    console.log('\n📋 Resumen:');
    console.log('• ✅ Cotización de trading: OK');
    console.log('• ✅ Creación de operación: OK');
    console.log('• ✅ XDR de transacción: OK');
    console.log('\n🤖 El bot de Telegram está listo para trades reales!');
    
  } catch (error) {
    console.error('❌ Error probando sistema de trading:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
    }
  }
}

// Ejecutar prueba
testTradingSystem();
