import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const SOROSWAP_API_KEY = 'sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec';
    
    // Obtener cotización de 1 USDC a XLM para calcular el precio real
    const soroswapResponse = await fetch('https://api.soroswap.finance/quote?network=testnet', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SOROSWAP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assetIn: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA', // USDC
        assetOut: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC', // XLM
        amountIn: '10000000', // 1 USDC en stroops
        tradeType: 'EXACT_IN',
        protocols: ['sdex', 'soroswap', 'phoenix', 'aqua'],
        slippageTolerance: 100
      })
    });

    if (!soroswapResponse.ok) {
      throw new Error(`Soroswap API error: ${soroswapResponse.status}`);
    }

    const soroswapData = await soroswapResponse.json();
    
    // Obtener precio de XLM desde CoinGecko
    const coingeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd');
    const coingeckoData = await coingeckoResponse.json();
    
    const xlmPriceUsd = coingeckoData.stellar?.usd || 0;
    
    // Calcular precio de USDC basado en la cotización real
    let usdcPriceUsd = 1.0; // Precio por defecto
    if (soroswapData.quote && soroswapData.quote.amountIn && soroswapData.quote.amountOut) {
      const usdcAmount = 1.0; // 1 USDC
      const xlmAmount = parseFloat(soroswapData.quote.amountOut) / 10000000; // Convertir de stroops
      usdcPriceUsd = xlmAmount * xlmPriceUsd; // Precio de USDC en USD
    }

    return NextResponse.json({
      success: true,
      data: {
        asset: 'USDC',
        soroswap: {
          price: usdcPriceUsd,
          xlmAmount: soroswapData.quote ? parseFloat(soroswapData.quote.amountOut) / 10000000 : 0,
          xlmPriceUsd: xlmPriceUsd
        },
        coingecko: {
          price: 1.0 // USDC siempre es ~$1 en CoinGecko
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error obteniendo precio de USDC desde Soroswap:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
