import { NextRequest, NextResponse } from 'next/server';
import { createRealTransaction } from '@/utils/stellarUtils';

const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2RMQQVU2HHGCYSC';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, sourceAccount, asset, amount, leverage, trade_type, positionId, entryPrice, currentPrice, positionType } = body;

    if (!operation || !sourceAccount) {
      return NextResponse.json({
        success: false,
        message: 'operation and sourceAccount are required'
      }, { status: 400 });
    }

    console.log(`🔧 Ejecutando operación del contrato: ${operation} para cuenta: ${sourceAccount}`);
    console.log(`📋 Parámetros:`, { asset, amount, leverage, trade_type });

    // Validar operación permitida
    const allowedOperations = [
      'open_position',
      'close_position', 
      'deposit_funds',
      'withdraw_funds'
    ];

    if (!allowedOperations.includes(operation)) {
      return NextResponse.json({
        success: false,
        message: `Operación '${operation}' no permitida. Operaciones permitidas: ${allowedOperations.join(', ')}`
      }, { status: 400 });
    }

    // Crear transacción real de Stellar
    const transactionXdr = await createRealTransaction(sourceAccount, operation, {
      amount: amount || 0,
      leverage: leverage || 1,
      positionType: positionType || trade_type || 'long',
      asset: asset || 'XLM',
      positionId: positionId,
      entryPrice: entryPrice,
      currentPrice: currentPrice
    });

    console.log(`✅ Transacción del contrato ${operation} creada exitosamente`);

    return NextResponse.json({
      success: true,
      message: `Operación ${operation} ejecutada exitosamente`,
      transactionXdr: transactionXdr,
      operation: operation,
      sourceAccount,
      contractId: CONTRACT_ID,
      network: 'testnet',
      data: {
        isReal: true,
        note: `Transacción real para ejecutar ${operation} en el contrato de trading`
      }
    });

  } catch (error) {
    console.error('❌ Error ejecutando operación del contrato:', error);
    return NextResponse.json({
      success: false,
      message: `Error ejecutando operación del contrato: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, { status: 500 });
  }
}
