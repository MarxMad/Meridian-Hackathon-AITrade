import { NextRequest, NextResponse } from 'next/server';

// Cache para evitar demasiadas requests
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const priceCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 segundos
const COINGECKO_API_KEY = 'CG-SRKm83vPGJwuXMVkmbBQRAXU';

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  entry.count++;
  return true;
}

function getCachedData(key: string): any | null {
  const cached = priceCache.get(key);
  if (cached && Date.now() < cached.timestamp + cached.ttl) {
    console.log(`📦 Cache hit para ${key}`);
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any, ttl: number = CACHE_TTL): void {
  priceCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔄 Intento ${i + 1}/${maxRetries} para ${url}`);
      
      // Delay progresivo entre intentos
      if (i > 0) {
        const backoffDelay = Math.min(1000 * Math.pow(2, i - 1), 5000);
        console.log(`⏳ Esperando ${backoffDelay}ms antes del reintento...`);
        await delay(backoffDelay);
      }
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      });
      
      if (response.status === 429) {
        console.log(`⚠️ Rate limit detectado (429), reintentando...`);
        continue;
      }
      
      return response;
      
    } catch (error) {
      console.log(`❌ Error en intento ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (i === maxRetries - 1) throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}

async function fetchSoroswapPrice(asset: string, amount: string): Promise<any | null> {
  try {
    const SOROSWAP_API_KEY = 'sk_a4aec292b2c03443f42a09506d6dec231e0f2c8ddfb4f8c1b1177aba17a33eec';
    
    console.log(`🔍 Obteniendo precio de Soroswap para ${asset}...`);
    
    const response = await fetchWithRetry('https://api.soroswap.finance/quote?network=testnet', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SOROSWAP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assetIn: asset === 'XLM' ? 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC' : asset,
        assetOut: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU2BQ4WWFEIE3USCIHMXQDAMA', // USDC
        amountIn: (parseFloat(amount) * 10000000).toString(),
        tradeType: 'EXACT_IN'
      })
    });

    if (!response.ok) {
      console.log(`⚠️ Soroswap error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Soroswap response recibida`);
    return data;
    
  } catch (error) {
    console.error(`❌ Error fetching Soroswap:`, error);
    return null;
  }
}

async function fetchCoinGeckoPrice(assetId: string): Promise<number> {
  try {
    console.log(`🔍 Obteniendo precio de CoinGecko para ${assetId}...`);
    
    // Mapeo de assets a IDs de CoinGecko
    const assetMap: { [key: string]: string } = {
      'XLM': 'stellar',
      'USDC': 'usd-coin'
    };
    
    const coinGeckoId = assetMap[assetId] || assetId.toLowerCase();
    
    const response = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd&x_cg_demo_api_key=${COINGECKO_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      console.log(`⚠️ CoinGecko error: ${response.status}`);
      // Fallback sin API key
      const fallbackResponse = await fetchWithRetry(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`,
        { method: 'GET', headers: { 'Accept': 'application/json' } }
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return fallbackData[coinGeckoId]?.usd || 0;
      }
      
      return 0;
    }

    const data = await response.json();
    console.log(`✅ CoinGecko response recibida`);
    return data[coinGeckoId]?.usd || 0;
    
  } catch (error) {
    console.error(`❌ Error fetching CoinGecko:`, error);
    // Precios de fallback
    const fallbackPrices: { [key: string]: number } = {
      'XLM': 0.38,
      'USDC': 1.0
    };
    return fallbackPrices[assetId] || 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset') || 'XLM';
    const amount = searchParams.get('amount') || '1';
    const cacheKey = `${asset}-${amount}`;
    
    // Verificar rate limiting por IP
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      console.log(`⚠️ Rate limit excedido para IP: ${clientIp}`);
      // Devolver datos cacheados si existen
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: { ...cachedData, source: 'cache-rate-limited' }
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: 60
      }, { status: 429 });
    }

    // Verificar cache primero
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData
      });
    }

    console.log(`🚀 Iniciando fetch de precios para ${asset}...`);

    // Intentar ambas APIs en paralelo con manejo de errores
    const [soroswapData, coingeckoPrice] = await Promise.allSettled([
      fetchSoroswapPrice(asset, amount),
      fetchCoinGeckoPrice(asset)
    ]);

    const soroswap = soroswapData.status === 'fulfilled' ? soroswapData.value : null;
    const coingecko = coingeckoPrice.status === 'fulfilled' ? coingeckoPrice.value : 0;

    // Calcular precio de Soroswap
    let soroswapPriceUsd = 0;
    let soroswapSuccessful = false;
    
    if (soroswap?.quote?.amountIn && soroswap?.quote?.amountOut) {
      if (asset === 'XLM') {
        const xlmAmount = parseFloat(amount);
        const usdcAmount = parseFloat(soroswap.quote.amountOut) / 10000000;
        // Usar 1.0 como precio base de USDC
        soroswapPriceUsd = usdcAmount / xlmAmount;
        soroswapSuccessful = true;
      } else if (asset === 'USDC') {
        soroswapPriceUsd = 1.0;
        soroswapSuccessful = true;
      }
    }

    const responseData = {
      asset,
      amount,
      soroswap: {
        price: soroswapPriceUsd,
        successful: soroswapSuccessful,
        amountIn: soroswap?.quote?.amountIn,
        amountOut: soroswap?.quote?.amountOut,
        priceImpact: soroswap?.quote?.priceImpactPct
      },
      coingecko: {
        price: coingecko,
        successful: coingeckoPrice.status === 'fulfilled'
      },
      fallback: {
        xlm: 0.38,
        usdc: 1.0
      },
      timestamp: new Date().toISOString(),
      source: 'fresh'
    };

    // Cachear la respuesta
    setCachedData(cacheKey, responseData);

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error general obteniendo precios:', error);
    
    // Intentar devolver datos cacheados como último recurso
    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset') || 'XLM';
    const amount = searchParams.get('amount') || '1';
    const cacheKey = `${asset}-${amount}`;
    
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log('📦 Devolviendo datos cacheados como fallback');
      return NextResponse.json({
        success: true,
        data: { ...cachedData, source: 'cache-fallback' }
      });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      fallback: {
        xlm: 0.38,
        usdc: 1.0
      }
    }, { status: 500 });
  }
}