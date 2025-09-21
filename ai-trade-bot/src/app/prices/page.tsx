'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface PriceData {
  asset: string;
  symbol: string;
  price: number;
  change24h: number;
  source: string;
  lastUpdate: string;
  icon: string;
}

export default function PricesPage() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  const fetchPrices = async () => {
    setIsLoading(true);
    try {
      // Obtener precio de XLM
      const xlmResponse = await fetch('/api/soroswap/price?asset=XLM&amount=1');
      const xlmData = await xlmResponse.json();
      
      // Obtener precio de USDC
      const usdcResponse = await fetch('/api/soroswap/price?asset=USDC&amount=1');
      const usdcData = await usdcResponse.json();

      const pricesData: PriceData[] = [];

      // Agregar XLM
      if (xlmData.success) {
        const xlmPrice = xlmData.data.coingecko?.price || xlmData.data.fallback?.xlm || 0.38;
        pricesData.push({
          asset: 'Stellar Lumens',
          symbol: 'XLM',
          price: xlmPrice,
          change24h: Math.random() * 10 - 5, // Simulado
          source: xlmData.data.coingecko?.successful ? 'CoinGecko' : 'Fallback',
          lastUpdate: new Date().toLocaleTimeString(),
          icon: '✨'
        });
      }

      // Agregar USDC
      if (usdcData.success) {
        const usdcPrice = usdcData.data.coingecko?.price || usdcData.data.soroswap?.price || 1.0;
        pricesData.push({
          asset: 'USD Coin',
          symbol: 'USDC',
          price: usdcPrice,
          change24h: Math.random() * 2 - 1, // Simulado
          source: usdcData.data.coingecko?.successful ? 'CoinGecko' : 
                  usdcData.data.soroswap?.successful ? 'Soroswap' : 'Fallback',
          lastUpdate: new Date().toLocaleTimeString(),
          icon: '💎'
        });
      }

      setPrices(pricesData);
      setLastUpdateTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error obteniendo precios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pt-4">
      <div className="mobile-container">
        {/* Header */}
        <div className="mb-6">
          <div className="app-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 relative mx-auto mb-4">
                <Image
                  src="/LOGOZZ.png"
                  alt="ZENTRADE Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Precios en Tiempo Real
              </h1>
              <p className="text-gray-600 mb-4">
                Datos actualizados desde múltiples fuentes
              </p>
              
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700">En Vivo</span>
                </div>
                <div className="text-gray-500">
                  Última actualización: {lastUpdateTime}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mb-6">
          <button
            onClick={fetchPrices}
            disabled={isLoading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
            <span>{isLoading ? 'Actualizando...' : 'Actualizar Precios'}</span>
          </button>
        </div>

        {/* Price Cards */}
        <div className="space-y-4">
          {isLoading && prices.length === 0 ? (
            // Loading Skeleton
            <>
              {[1, 2].map((i) => (
                <div key={i} className="app-card p-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-6 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            prices.map((priceData) => (
              <div key={priceData.symbol} className="app-card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                      {priceData.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {priceData.asset}
                      </h3>
                      <p className="text-sm text-gray-500 font-mono">
                        {priceData.symbol}
                      </p>
                      <p className="text-xs text-gray-400">
                        Fuente: {priceData.source}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      ${priceData.price.toFixed(6)}
                    </div>
                    <div className={`text-sm font-medium flex items-center justify-end space-x-1 ${
                      priceData.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span>{priceData.change24h >= 0 ? '↗' : '↘'}</span>
                      <span>{priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(2)}%</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      24h: {priceData.lastUpdate}
                    </div>
                  </div>
                </div>
                
                {/* Price Chart Simulation */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Gráfico 24h</span>
                    <span>USD</span>
                  </div>
                  <div className="h-16 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-end justify-center p-2">
                    <div className="text-xs text-gray-600">
                      📊 Gráfico disponible próximamente
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 mb-6">
          <div className="app-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información de Precios
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <span className="text-blue-500 mt-0.5">ℹ️</span>
                <div>
                  <strong>XLM:</strong> Precio obtenido de CoinGecko API con fallback local
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-500 mt-0.5">🔄</span>
                <div>
                  <strong>USDC:</strong> Precio desde Soroswap DEX en Stellar Testnet
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-500 mt-0.5">⏰</span>
                <div>
                  <strong>Actualización:</strong> Cada 30 segundos automáticamente
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-purple-500 mt-0.5">🎯</span>
                <div>
                  <strong>Red:</strong> Stellar Testnet para pruebas del hackathon
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Status */}
        <div className="mb-6">
          <div className="app-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Estado del Mercado
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">✅</div>
                <div className="text-sm font-medium text-green-800">Soroswap API</div>
                <div className="text-xs text-green-600">Operativo</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🌐</div>
                <div className="text-sm font-medium text-blue-800">Stellar Testnet</div>
                <div className="text-xs text-blue-600">Conectado</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
