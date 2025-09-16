import { NextRequest, NextResponse } from 'next/server';

const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceAccount, amount, signedTransaction } = body;

    if (!sourceAccount || !amount || !signedTransaction) {
      return NextResponse.json({
        success: false,
        message: 'Missing required parameters'
      }, { status: 400 });
    }

    console.log(`💰 Procesando transferencia de ${amount} XLM al contrato...`);

    // Enviar transacción usando fetch
    const response = await fetch(`${HORIZON_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `tx=${encodeURIComponent(signedTransaction)}`
    });

    const result = await response.json();

    if (response.ok && result.successful) {
      console.log('✅ Transferencia exitosa:', result.hash);
      
      return NextResponse.json({
        success: true,
        message: 'Transferencia exitosa',
        data: {
          hash: result.hash,
          amount: amount,
          contract_id: CONTRACT_ID,
          source_account: sourceAccount,
          network: 'testnet'
        }
      });
    } else {
      throw new Error(result.extras?.result_codes || result.detail || 'Transaction failed');
    }

  } catch (error) {
    console.error('❌ Error procesando transferencia:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error procesando transferencia',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}