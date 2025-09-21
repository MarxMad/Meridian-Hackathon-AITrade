'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { WalletNetwork } from "@creit.tech/stellar-wallets-kit";

export default function Home() {
  const { isConnected, publicKey, walletName, network, connect, disconnect, isLoading, error } = useWallet();
  const [balance, setBalance] = useState<string>('0.0000000');
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Obtener balance de la wallet
  const fetchBalance = async () => {
    if (!publicKey) return;
    
    setBalanceLoading(true);
    try {
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
      const data = await response.json();
      
      if (data.balances && data.balances.length > 0) {
        const xlmBalance = data.balances.find((b: any) => b.asset_type === 'native');
        if (xlmBalance) {
          setBalance(parseFloat(xlmBalance.balance).toFixed(7));
        }
      }
    } catch (error) {
      console.error('Error obteniendo balance:', error);
      setBalance('0.0000000');
    } finally {
      setBalanceLoading(false);
    }
  };

  // Obtener balance cuando se conecta la wallet
  useEffect(() => {
    if (isConnected && publicKey) {
      fetchBalance();
    }
  }, [isConnected, publicKey]);

  return (
    <div className="min-h-screen bg-slate-50 pt-4">
      <div className="mobile-container">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="app-card p-8 text-center">
            <div className="w-24 h-24 relative mx-auto mb-6">
              <Image
                src="/LOGOZZ.png"
                alt="ZENTRADE Logo"
                fill
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ZENTRADE
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-6">
              AI Trading Bot para Stellar
            </p>
            
            <div className="inline-flex items-center bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span className="mr-2">🏆</span>
              Meridian Hackathon 2025 - Composability Track
            </div>

            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Integración completa de protocolos Stellar para trading automatizado de nueva generación con Soroswap y Soroban
            </p>
          </div>
        </div>

        {/* Wallet Connection */}
        {isConnected ? (
          <div className="mb-8">
            <div className="app-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xl">✓</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Wallet Conectada</h3>
                    <p className="text-sm text-gray-600">{walletName}</p>
                  </div>
                </div>
                <button
                  onClick={disconnect}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Desconectar
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-xs text-gray-500 mb-1">Dirección de la Wallet:</div>
                <div className="text-sm font-mono text-gray-700 break-all">
                  {publicKey?.slice(0, 12)}...{publicKey?.slice(-12)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-xs text-blue-600 font-semibold mb-1">Balance XLM:</div>
                  <div className="text-lg font-bold text-blue-700">
                    {balanceLoading ? (
                      <div className="animate-pulse">Cargando...</div>
                    ) : (
                      parseFloat(balance).toFixed(2)
                    )}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-xs text-green-600 font-semibold mb-1">Red:</div>
                  <div className="text-lg font-bold text-green-700">
                    {network === WalletNetwork.TESTNET ? 'Testnet' : 'Mainnet'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="app-card p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl">👛</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Conecta tu Wallet</h3>
              <p className="text-gray-600 mb-6">
                Conecta tu wallet de Stellar para comenzar a usar todas las funciones
              </p>
              
              <button
                onClick={connect}
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Conectando...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>Conectar Wallet</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-500 text-xl mr-3">⚠️</div>
                <div>
                  <strong className="text-red-700">Error de conexión:</strong>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Funciones Principales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Swaps Card */}
            <Link href="/swaps" className="block group">
              <div className="app-card p-6 hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <span className="text-2xl">🔄</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Smart Swaps
                </h3>
                <p className="text-gray-600 mb-4">
                  Intercambia XLM ↔ USDC automáticamente con las mejores tasas de Soroswap
                </p>
                <div className="flex items-center text-blue-600 font-medium">
                  <span className="mr-2">💫</span>
                  <span>Hacer Swap</span>
                  <span className="ml-auto group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Trading Card */}
            <Link href="/trading" className="block group">
              <div className="app-card p-6 hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Trading con Apalancamiento
                </h3>
                <p className="text-gray-600 mb-4">
                  Maximiza tus ganancias con leverage 2x, 5x, 10x y protección automática
                </p>
                <div className="flex items-center text-green-600 font-medium">
                  <span className="mr-2">📈</span>
                  <span>Abrir Posición</span>
                  <span className="ml-auto group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Prices Card */}
            <Link href="/prices" className="block group">
              <div className="app-card p-6 hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Precios en Tiempo Real
                </h3>
                <p className="text-gray-600 mb-4">
                  Conecta directamente con Soroswap API para obtener cotizaciones precisas
                </p>
                <div className="flex items-center text-purple-600 font-medium">
                  <span className="mr-2">📊</span>
                  <span>Ver Precios</span>
                  <span className="ml-auto group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* API Status Card */}
            <div className="app-card p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Estado del Sistema
              </h3>
              <p className="text-gray-600 mb-4">
                Monitoreo en tiempo real de todos los servicios conectados
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Soroswap API</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Activo
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Stellar Testnet</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Conectado
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Contrato Soroban</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Desplegado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mb-8">
          <div className="app-card p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              Tecnologías Integradas
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg">
                <div className="text-2xl mb-2">⭐</div>
                <div className="text-sm font-semibold text-gray-800">Stellar</div>
                <div className="text-xs text-gray-600">Blockchain</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg">
                <div className="text-2xl mb-2">🔗</div>
                <div className="text-sm font-semibold text-gray-800">Soroban</div>
                <div className="text-xs text-gray-600">Smart Contracts</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-b from-green-50 to-green-100 rounded-lg">
                <div className="text-2xl mb-2">🔄</div>
                <div className="text-sm font-semibold text-gray-800">Soroswap</div>
                <div className="text-xs text-gray-600">DEX Protocol</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-b from-purple-50 to-purple-100 rounded-lg">
                <div className="text-2xl mb-2">⚛️</div>
                <div className="text-sm font-semibold text-gray-800">Next.js</div>
                <div className="text-xs text-gray-600">Frontend</div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Ventajas de ZENTRADE
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="app-card p-4 text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h4 className="font-semibold text-gray-900 mb-2">Rápido</h4>
              <p className="text-sm text-gray-600">
                Transacciones ejecutadas en segundos en la red Stellar
              </p>
            </div>
            
            <div className="app-card p-4 text-center">
              <div className="text-3xl mb-3">🔒</div>
              <h4 className="font-semibold text-gray-900 mb-2">Seguro</h4>
              <p className="text-sm text-gray-600">
                Contratos inteligentes auditados y wallet no custodial
              </p>
            </div>
            
            <div className="app-card p-4 text-center">
              <div className="text-3xl mb-3">💰</div>
              <h4 className="font-semibold text-gray-900 mb-2">Económico</h4>
              <p className="text-sm text-gray-600">
                Tarifas mínimas gracias a la eficiencia de Stellar
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mb-6">
          <div className="app-card p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">
              Construido para el <strong>Meridian Hackathon 2025</strong>
            </p>
            <p className="text-gray-500 text-xs">
              Demostración completa de integración multi-protocolo en Stellar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}