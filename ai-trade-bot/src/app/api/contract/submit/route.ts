import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signedTransaction } = body;

    if (!signedTransaction) {
      return NextResponse.json({
        success: false,
        message: 'signedTransaction is required'
      }, { status: 400 });
    }

    console.log('📤 Simulando envío de transacción firmada...');

    // Simular envío exitoso de transacción
    const mockHash = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      message: 'Transacción enviada exitosamente (simulado)',
      data: {
        hash: mockHash,
        successful: true,
        ledger: Math.floor(Math.random() * 1000000) + 1000000,
        network: 'testnet'
      }
    });

  } catch (error) {
    console.error('❌ Error enviando transacción:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error enviando transacción',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}