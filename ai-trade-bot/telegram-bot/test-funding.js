#!/usr/bin/env node

/**
 * Script de prueba para verificar el fondeo de wallets
 */

const StellarSdk = require('@stellar/stellar-sdk');
const { Horizon } = StellarSdk;

async function testWalletFunding() {
  console.log('🧪 Probando fondeo de wallet...');
  
  try {
    // Generar wallet de prueba
    const keypair = StellarSdk.Keypair.random();
    const publicKey = keypair.publicKey();
    const secretKey = keypair.secret();
    
    console.log('🔑 Wallet generada:');
    console.log('  Public Key:', publicKey);
    console.log('  Secret Key:', secretKey);
    
    // Conectar a Stellar testnet
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    console.log('🌐 Conectando a Stellar testnet...');
    
    // Fondear la cuenta usando Friendbot
    console.log('💰 Fondeando cuenta...');
    const response = await fetch(`https://friendbot.stellar.org/?addr=${publicKey}`);
    const result = await response.json();
    
    if (result.status === 400 && result.detail.includes('already funded')) {
      console.log('✅ Cuenta ya está fondada');
    } else if (result.status === 400) {
      console.log('⚠️ Error de Friendbot:', result.detail);
      throw new Error(`Friendbot error: ${result.detail}`);
    } else if (response.status !== 200) {
      throw new Error('Friendbot no pudo fondear la cuenta');
    }
    
    // Verificar balance
    console.log('✅ Verificando balance...');
    const account = await server.loadAccount(publicKey);
    const xlmBalance = account.balances.find(balance => balance.asset_type === 'native');
    
    console.log('🎉 ¡Fondeo exitoso!');
    console.log('  Balance XLM:', xlmBalance.balance);
    console.log('  Estado:', account.state);
    
    return {
      success: true,
      publicKey,
      balance: parseFloat(xlmBalance.balance)
    };
    
  } catch (error) {
    console.error('❌ Error en el fondeo:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Ejecutar prueba
testWalletFunding()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Prueba completada exitosamente');
      console.log('   Balance:', result.balance, 'XLM');
    } else {
      console.log('\n❌ Prueba falló:', result.error);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
