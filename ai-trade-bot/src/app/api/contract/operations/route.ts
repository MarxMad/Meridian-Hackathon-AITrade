import { NextRequest, NextResponse } from 'next/server';

const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, sourceAccount, ...params } = body;

    if (!operation || !sourceAccount) {
      return NextResponse.json({
        success: false,
        message: 'Operation and sourceAccount are required'
      }, { status: 400 });
    }

    console.log(`🔧 Creando transacción: ${operation} para cuenta: ${sourceAccount}`);

    // Crear estructura de transacción básica para demostración
    const transactionData = {
      sourceAccount,
      operation,
      contractId: CONTRACT_ID,
      network: 'testnet',
      params: params,
      timestamp: new Date().toISOString()
    };

    // Simular creación de transacción XDR
    const mockTransactionXdr = `AAAA${Buffer.from(JSON.stringify(transactionData)).toString('base64')}`;

    console.log(`✅ Transacción ${operation} creada exitosamente`);

    return NextResponse.json({
      success: true,
      message: `Transacción ${operation} creada exitosamente`,
      data: {
        transactionXdr: mockTransactionXdr,
        operation,
        sourceAccount,
        contractId: CONTRACT_ID,
        network: 'testnet',
        params: params
      }
    });

  } catch (error) {
    console.error('❌ Error creando transacción:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error creando transacción',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}