import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset') || 'stellar';
    const vsCurrency = searchParams.get('vs_currency') || 'usd';
    const apiKey = process.env.COINGECKO_API_KEY;

    const baseUrl = 'https://api.coingecko.com/api/v3/simple/price';
    const params = new URLSearchParams({
      ids: asset,
      vs_currencies: vsCurrency,
      include_24hr_change: 'true',
      include_24hr_vol: 'true',
      include_market_cap: 'true'
    });

    if (apiKey) {
      params.append('x_cg_demo_api_key', apiKey);
    }

    const response = await fetch(`${baseUrl}?${params}`);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const assetData = data[asset];

    if (!assetData) {
      throw new Error(`Asset ${asset} not found`);
    }

    return NextResponse.json({
      success: true,
      data: {
        asset,
        vsCurrency,
        price: assetData[vsCurrency],
        change24h: assetData[`${vsCurrency}_24h_change`],
        volume24h: assetData[`${vsCurrency}_24h_vol`],
        marketCap: assetData[`${vsCurrency}_market_cap`],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error obteniendo precio de CoinGecko:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
