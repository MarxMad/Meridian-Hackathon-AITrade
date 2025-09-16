import { NextRequest, NextResponse } from 'next/server';

const SOROSWAP_API_URL = 'https://api.soroswap.finance';
const SOROSWAP_API_KEY = 'sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec';
const XLM_NATIVE = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, assetIn = XLM_NATIVE, assetOut = XLM_NATIVE } = body;

    if (!amount) {
      return NextResponse.json({
        success: false,
        message: 'Amount is required'
      }, { status: 400 });
    }

    console.log(`📊 Obteniendo cotización: ${amount} XLM...`);
    
    // Convertir a stroops
    const xlmStroops = Math.round(parseFloat(amount) * 1_000_000);
    
    const quoteData = {
      assetIn,
      assetOut,
      amount: xlmStroops.toString(),
      tradeType: 'EXACT_IN',
      protocols: ['sdex', 'soroswap', 'phoenix', 'aqua'],
      slippageTolerance: 100,
      gaslessTrustline: 'create'
    };

    const response = await fetch(`${SOROSWAP_API_URL}/quote?network=testnet`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SOROSWAP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quoteData)
    });

    if (!response.ok) {
      throw new Error(`Soroswap API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: '✅ Cotización obtenida correctamente desde Soroswap API',
      data: {
        input_amount_xlm: amount,
        input_amount_stroops: xlmStroops,
        quote: data,
        network: 'testnet',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo cotización:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo cotización desde Soroswap API',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
