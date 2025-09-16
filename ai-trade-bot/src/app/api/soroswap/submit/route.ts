import { NextRequest, NextResponse } from 'next/server';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

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

    console.log('📤 Enviando transacción de swap REAL firmada...');

    // Enviar transacción REAL a Horizon
    const response = await fetch(`${HORIZON_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `tx=${encodeURIComponent(signedTransaction)}`
    });

    console.log('📡 Respuesta de Horizon:', { 
      status: response.status, 
      ok: response.ok 
    });

    const result = await response.json();

    if (response.ok && result.successful) {
      console.log('✅ Transacción de swap REAL enviada exitosamente:', result.hash);

      return NextResponse.json({
        success: true,
        message: '✅ Swap REAL ejecutado exitosamente',
        data: {
          hash: result.hash,
          successful: result.successful,
          ledger: result.ledger,
          network: 'testnet',
          resultXdr: result.result_xdr,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.error('❌ Transacción de swap REAL falló:', result);
      throw new Error(`Transaction failed: ${result.extras?.result_codes || result.detail || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Error procesando transacción de swap:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error procesando transacción de swap',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
