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

    console.log('📤 Procesando transacción firmada...');

    // Simular envío exitoso de transacción
    const mockHash = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockLedger = Math.floor(Math.random() * 1000000) + 1000000;

    console.log('✅ Transacción procesada exitosamente:', mockHash);

    return NextResponse.json({
      success: true,
      message: 'Transacción procesada exitosamente',
      data: {
        hash: mockHash,
        successful: true,
        ledger: mockLedger,
        network: 'testnet',
        resultXdr: 'mock_result_xdr'
      }
    });

  } catch (error) {
    console.error('❌ Error procesando transacción:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error procesando transacción',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}