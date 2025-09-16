import { NextRequest, NextResponse } from 'next/server';

const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sourceAccount } = body;

    if (!query) {
      return NextResponse.json({
        success: false,
        message: 'Query is required'
      }, { status: 400 });
    }

    console.log(`🔍 Ejecutando consulta: ${query}`);

    // Simular datos de respuesta según el tipo de consulta
    let mockData;
    switch (query) {
      case 'get_current_price':
        mockData = {
          price: 0.124733,
          timestamp: new Date().toISOString(),
          source: 'Soroswap API'
        };
        break;

      case 'get_global_stats':
        mockData = {
          totalPositions: 15,
          totalVolume: 125000,
          activeTraders: 8,
          totalPnL: 2500.50
        };
        break;

      case 'get_my_positions':
        mockData = {
          positions: [
            {
              id: 'pos_1',
              asset: 'XLM',
              amount: 10,
              leverage: 2,
              type: 'long',
              entryPrice: 0.124,
              currentPrice: 0.124733,
              pnl: 5.85
            }
          ]
        };
        break;

      default:
        mockData = { message: 'Consulta no soportada' };
    }

    // Crear transacción de consulta simulada
    const queryData = {
      query,
      sourceAccount,
      contractId: CONTRACT_ID,
      network: 'testnet',
      data: mockData,
      timestamp: new Date().toISOString()
    };

    const mockTransactionXdr = `AAAA${Buffer.from(JSON.stringify(queryData)).toString('base64')}`;

    console.log(`✅ Consulta ${query} ejecutada exitosamente`);

    return NextResponse.json({
      success: true,
      message: `Consulta ${query} ejecutada exitosamente`,
      data: {
        transactionXdr: mockTransactionXdr,
        query,
        contractId: CONTRACT_ID,
        network: 'testnet',
        result: mockData
      }
    });

  } catch (error) {
    console.error('❌ Error ejecutando consulta:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error ejecutando consulta',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}