import { NextResponse } from 'next/server';

const SOROSWAP_API_URL = 'https://api.soroswap.finance';
const SOROSWAP_API_KEY = 'sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec';
const XLM_NATIVE = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export async function GET() {
  try {
    console.log('💰 Obteniendo precio real de XLM desde Soroswap API...');
    
    const response = await fetch(`${SOROSWAP_API_URL}/price?network=testnet&asset=${XLM_NATIVE}`, {
      headers: {
        'Authorization': `Bearer ${SOROSWAP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 30 } // Cache por 30 segundos
    });

    if (!response.ok) {
      throw new Error(`Soroswap API error: ${response.status}`);
    }

    const data = await response.json();
    const priceInfo = data[0];

    return NextResponse.json({
      success: true,
      message: '✅ Precio real obtenido desde Soroswap API',
      data: {
        asset: 'XLM',
        price_usd: priceInfo.price,
        price_micro: Math.round(priceInfo.price * 1_000_000),
        timestamp: priceInfo.timestamp,
        source: 'Soroswap API',
        network: 'testnet',
        contract_id: XLM_NATIVE
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo precio:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo precio desde Soroswap API',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
