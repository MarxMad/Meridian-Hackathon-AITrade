import { NextRequest, NextResponse } from 'next/server';

const SOROSWAP_API_URL = 'https://api.soroswap.finance';
const SOROSWAP_API_KEY = 'sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec';

// Assets REALES para swaps en Stellar testnet
// XLM nativo - usando el asset ID correcto para Soroswap API
const XLM_NATIVE = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

// USDC real de Stellar testnet - contrato real de USDC encontrado en stellar.expert
const USDC_TESTNET = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';

// NOTA: Para el demo del hackathon, vamos a simular un swap real
// En producción necesitaríamos assets reales diferentes de Stellar testnet

// NOTA: Para un swap real en testnet:
// - XLM nativo: "native" (asset nativo de Stellar)
// - USDC real: "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
// 
// IMPORTANTE: Estos son assets reales de testnet que existen y funcionan

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, assetIn = XLM_NATIVE, assetOut = USDC_TESTNET } = body;

    if (!amount) {
      return NextResponse.json({
        success: false,
        message: 'Amount is required'
      }, { status: 400 });
    }

    console.log(`📊 Obteniendo cotización REAL: ${amount} XLM...`);
    console.log('📊 Parámetros:', { amount, assetIn, assetOut });
    
    // Convertir a stroops (1 XLM = 10,000,000 stroops)
    const xlmAmount = parseFloat(amount);
    const xlmStroops = Math.round(xlmAmount * 10_000_000);
    
    console.log(`📊 Conversión: ${xlmAmount} XLM = ${xlmStroops} stroops`);
    
    const quoteData = {
      assetIn,
      assetOut,
      amount: xlmStroops.toString(),
      tradeType: 'EXACT_IN',
      protocols: ['sdex', 'soroswap', 'phoenix', 'aqua'],
      slippageTolerance: 100,
      gaslessTrustline: 'create'
    };

    console.log('📊 Datos de cotización:', quoteData);

    console.log('📡 Enviando request a Soroswap API...', { 
      url: `${SOROSWAP_API_URL}/quote?network=testnet`,
      hasApiKey: !!SOROSWAP_API_KEY 
    });

    const response = await fetch(`${SOROSWAP_API_URL}/quote?network=testnet`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SOROSWAP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quoteData)
    });

    console.log('📡 Respuesta de Soroswap API:', { 
      status: response.status, 
      ok: response.ok 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de Soroswap API:', errorText);
      
      // Si es rate limit, devolver un fallback
      if (response.status === 429) {
        console.log('⚠️ Rate limit excedido, usando cotización de fallback');
        return NextResponse.json({
          success: true,
          message: '⚠️ Usando cotización de fallback (rate limit excedido)',
          data: {
            input_amount_xlm: amount,
            input_amount_stroops: xlmStroops,
            quote: {
              assetIn,
              assetOut,
              amountIn: xlmStroops.toString(),
              amountOut: Math.round(xlmStroops * 0.95).toString(), // 5% de slippage para demo
              otherAmountThreshold: Math.round(xlmStroops * 0.9).toString(),
              priceImpactPct: "5.0",
              tradeType: "EXACT_IN",
              platform: "fallback",
              rawTrade: {
                source_asset_type: "native",
                source_amount: amount,
                destination_asset_type: "native", 
                destination_amount: (parseFloat(amount) * 0.95).toFixed(7),
                path: [],
                min_destination_amount: (parseFloat(amount) * 0.9).toFixed(7)
              },
              routePlan: [{
                swapInfo: {
                  protocol: "fallback",
                  path: [assetIn, assetOut]
                },
                percent: "100"
              }],
              gaslessTrustline: "create"
            },
            network: "testnet",
            timestamp: new Date().toISOString()
          }
        });
      }
      
      throw new Error(`Soroswap API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Respuesta de Soroswap API recibida:', { 
      hasData: !!data,
      keys: Object.keys(data || {}),
      data: data
    });

    return NextResponse.json({
      success: true,
      message: '✅ Cotización obtenida correctamente desde Soroswap API',
      data: {
        input_amount_xlm: xlmAmount,
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
