import { NextRequest, NextResponse } from 'next/server';

const SOROSWAP_API_URL = 'https://api.soroswap.finance';
const SOROSWAP_API_KEY = 'sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceAccount, quote, network = 'testnet' } = body;

    console.log('🔄 Recibiendo request de swap:', { sourceAccount, network, hasQuote: !!quote });

    if (!sourceAccount) {
      return NextResponse.json({
        success: false,
        message: 'sourceAccount is required'
      }, { status: 400 });
    }

    if (!quote) {
      return NextResponse.json({
        success: false,
        message: 'quote is required'
      }, { status: 400 });
    }

    console.log(`🔄 Creando transacción de swap REAL para cuenta: ${sourceAccount}`);

    // Verificar si los assets son iguales (modo demo)
    const isDemoMode = quote.assetIn === quote.assetOut;
    
    if (isDemoMode) {
      console.log('🎭 Modo demo detectado - assets idénticos, usando simulación');
      return NextResponse.json({
        success: true,
        message: '✅ Transacción de swap DEMO creada exitosamente',
        transactionXdr: 'AAAAAQAAAAA...', // XDR de demo
        data: {
          sourceAccount,
          network,
          quote: quote,
          timestamp: new Date().toISOString(),
          demo: true,
          soroswapResponse: {
            xdr: 'AAAAAQAAAAA...',
            action: 'SIGN_TRANSACTION',
            description: 'Demo transaction - assets are identical'
          }
        }
      });
    }

    // Crear transacción de swap REAL usando Soroswap /build endpoint
    // Deshabilitar gaslessTrustline para evitar error de sponsor
    const modifiedQuote = { ...quote };
    if (modifiedQuote.gaslessTrustline) {
      delete modifiedQuote.gaslessTrustline;
    }
    
    const swapData = {
      quote: modifiedQuote,
      from: sourceAccount,
      to: sourceAccount
    };

    console.log('📡 Enviando request a Soroswap API...', { 
      url: `${SOROSWAP_API_URL}/quote/build?network=${network}`,
      hasApiKey: !!SOROSWAP_API_KEY 
    });

    const response = await fetch(`${SOROSWAP_API_URL}/quote/build?network=${network}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SOROSWAP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(swapData)
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
                console.log('⚠️ Rate limit excedido, usando transacción de fallback');
                return NextResponse.json({
                  success: true,
                  message: '⚠️ Usando transacción de fallback (rate limit excedido)',
                  transactionXdr: 'AAAAAQAAAAA...', // XDR de fallback
                  data: {
                    sourceAccount,
                    network,
                    quote: quote,
                    timestamp: new Date().toISOString(),
                    fallback: true
                  }
                });
              }
              
              // Si es error de trustline faltante, devolver el XDR para crear trustline
              if (response.status === 428) {
                try {
                  const errorData = JSON.parse(errorText);
                  if (errorData.action === 'CREATE_TRUSTLINE' && errorData.actionData?.xdr) {
                    console.log('🔗 Creando trustline para USDC...');
                    return NextResponse.json({
                      success: true,
                      message: '🔗 Se requiere crear trustline para USDC primero',
                      transactionXdr: errorData.actionData.xdr,
                      requiresTrustline: true,
                      trustlineData: {
                        assetCode: errorData.actionData.assetCode,
                        assetIssuer: errorData.actionData.assetIssuer,
                        signer: errorData.actionData.signer,
                        description: errorData.actionData.description
                      },
                      data: {
                        sourceAccount,
                        network,
                        quote: quote,
                        timestamp: new Date().toISOString(),
                        action: 'CREATE_TRUSTLINE'
                      }
                    });
                  }
                } catch (parseError) {
                  console.error('❌ Error parseando respuesta de trustline:', parseError);
                }
              }
              
              throw new Error(`Soroswap API error: ${response.status} - ${errorText}`);
            }

    const data = await response.json();
    console.log('✅ Respuesta de Soroswap API recibida:', { 
      hasTransactionXdr: !!data.transactionXdr,
      keys: Object.keys(data)
    });

    return NextResponse.json({
      success: true,
      message: '✅ Transacción de swap REAL creada exitosamente',
      transactionXdr: data.transactionXdr,
      data: {
        sourceAccount,
        network,
        quote: data.quote || quote,
        timestamp: new Date().toISOString(),
        soroswapResponse: data
      }
    });

  } catch (error) {
    console.error('❌ Error creando transacción de swap:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error creando transacción de swap',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
