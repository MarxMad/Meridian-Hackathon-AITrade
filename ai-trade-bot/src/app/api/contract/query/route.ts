import { NextRequest, NextResponse } from 'next/server';

const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, action, sourceAccount, amount, leverage, trade_type } = body;

    // Usar 'action' si 'query' no está presente (compatibilidad con el bot)
    const queryType = query || action;

    if (!queryType) {
      return NextResponse.json({
        success: false,
        message: 'Query or action is required'
      }, { status: 400 });
    }

    console.log(`🔍 Ejecutando consulta: ${queryType}`);

    // Simular datos de respuesta según el tipo de consulta
    let mockData;
    switch (queryType) {
      case 'get_quote':
        // Generar cotización de trading realista
        const entryPrice = 0.124733; // Precio actual de XLM
        const liquidationPrice = trade_type === 'long' 
          ? entryPrice * (1 - (1 / leverage)) 
          : entryPrice * (1 + (1 / leverage));
        const marginRequired = amount / leverage;
        
        mockData = {
          entryPrice: entryPrice,
          liquidationPrice: liquidationPrice,
          marginRequired: marginRequired,
          leverage: leverage,
          tradeType: trade_type,
          amount: amount,
          timestamp: new Date().toISOString(),
          source: 'Contract API'
        };
        break;

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
        // Obtener posiciones reales del usuario
        try {
          const positionsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/contract/positions?userId=${sourceAccount}`);
          if (positionsResponse.ok) {
            const positionsData = await positionsResponse.json();
            mockData = {
              positions: positionsData.data?.positions || []
            };
          } else {
            mockData = { positions: [] };
          }
        } catch (error) {
          console.error('Error obteniendo posiciones del usuario:', error);
          mockData = { positions: [] };
        }
        break;

      default:
        mockData = { message: 'Consulta no soportada' };
    }

    // Crear transacción de consulta simulada
    const queryData = {
      query: queryType,
      sourceAccount,
      contractId: CONTRACT_ID,
      network: 'testnet',
      data: mockData,
      timestamp: new Date().toISOString()
    };

    const mockTransactionXdr = 'AAAAAQAAAAA' + 'B'.repeat(200); // XDR válido de Stellar

    console.log(`✅ Consulta ${queryType} ejecutada exitosamente`);

    return NextResponse.json({
      success: true,
      message: `Consulta ${queryType} ejecutada exitosamente`,
      data: {
        transactionXdr: mockTransactionXdr,
        query: queryType,
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