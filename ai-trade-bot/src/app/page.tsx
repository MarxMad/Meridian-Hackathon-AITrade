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
    <div className="min-h-screen bg-gradient-to-br from-brazil-black via-slate-900 to-brazil-green">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-brazil-green/20 to-transparent rounded-full animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-brazil-yellow/10 to-transparent rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <header className="relative z-10 px-8 pt-16 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-brazil-white/95 to-brazil-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-brazil-green/30">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-block mb-6">
                    <div className="w-24 h-24 lg:w-32 lg:h-32 relative animate-pulse">
        <Image
                        src="/LOGOZZ.png"
                        alt="ZENTRADE Logo"
                        fill
                        className="object-contain"
          priority
        />
                    </div>
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-brazil-black via-brazil-green to-emerald-600 bg-clip-text text-transparent leading-tight">
                    ZENTRADE
                  </h1>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-700 mb-6">
                    AI Trading Bot
                  </p>
                  <div className="mb-6">
                    <div className="inline-flex items-center bg-gradient-to-r from-brazil-green to-emerald-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                      <span className="text-brazil-yellow mr-2">🏆</span>
                      Composability Track
                    </div>
                  </div>
                  <p className="text-xl text-brazil-gray mb-8 max-w-2xl mx-auto lg:mx-0">
                    Integración completa de protocolos Stellar para trading automatizado de próxima generación
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm">
                    <div className="flex items-center bg-brazil-gray/20 px-4 py-2 rounded-full border border-brazil-green/30">
                      <span className="text-brazil-green mr-2">🧩</span>
                      <span className="font-semibold">Multi-Protocol</span>
                    </div>
                    <div className="flex items-center bg-brazil-gray/20 px-4 py-2 rounded-full border border-brazil-green/30">
                      <span className="text-brazil-green mr-2">🔄</span>
                      <span className="font-semibold">Soroswap + Soroban</span>
                    </div>
                    <div className="flex items-center bg-brazil-gray/20 px-4 py-2 rounded-full border border-brazil-green/30">
                      <span className="text-brazil-green mr-2">🔗</span>
                      <span className="font-semibold">Wallet Integration</span>
                    </div>
                  </div>
                </div>
            
                {/* Wallet Connection */}
                <div className="lg:ml-8 w-full lg:w-auto">
                  {isConnected ? (
                    <div className="bg-gradient-to-br from-brazil-green to-emerald-600 text-white p-6 rounded-2xl shadow-xl border border-emerald-400/30 min-w-[320px] backdrop-blur-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-3 h-3 bg-emerald-300 rounded-full animate-pulse mr-3"></div>
                        <div className="text-lg font-bold">✅ {walletName} Conectada</div>
                      </div>
                      
                      <div className="bg-black/20 rounded-xl p-4 mb-4">
                        <div className="text-xs text-emerald-200 font-semibold mb-1">Dirección:</div>
                        <div className="text-sm font-mono break-all bg-black/30 px-3 py-2 rounded-lg">
                          {publicKey?.slice(0, 12)}...{publicKey?.slice(-12)}
                        </div>
                      </div>
                      
                      {/* Balance */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-black/20 rounded-xl p-3">
                          <div className="text-xs text-emerald-200 font-semibold mb-1">Balance XLM:</div>
                          <div className="text-lg font-bold">
                            {balanceLoading ? '⏳' : `${parseFloat(balance).toFixed(2)}`}
                          </div>
                        </div>
                        
                        <div className="bg-black/20 rounded-xl p-3">
                          <div className="text-xs text-emerald-200 font-semibold mb-1">Red:</div>
                          <div className="text-lg font-bold">
                            {network === WalletNetwork.TESTNET ? '🧪 Test' : '🌐 Main'}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={disconnect}
                        className="w-full bg-black/30 text-white px-4 py-3 rounded-xl font-semibold hover:bg-black/50 transition-all duration-300 border border-emerald-400/30 hover:border-emerald-300"
                      >
                        🔌 Desconectar
                      </button>
                    </div>
                  ) : (
                    <div className="text-center lg:text-right">
                      <button
                        onClick={connect}
                        disabled={isLoading}
                        className="group relative bg-gradient-to-r from-brazil-green to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 border border-emerald-400/30"
                      >
                        <div className="flex items-center justify-center">
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                              Conectando...
                            </>
                          ) : (
                            <>
                              <span className="text-2xl mr-3">🚀</span>
                              Conectar Wallet
                            </>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-brazil-green opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="mt-6 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 p-4 rounded-xl">
                  <div className="flex items-center">
                    <div className="text-red-500 text-xl mr-3">⚠️</div>
                    <div>
                      <strong className="text-red-700">Error de conexión:</strong>
                      <p className="text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* Features Section */}
      <main className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Funcionalidades <span className="bg-gradient-to-r from-brazil-green to-emerald-400 bg-clip-text text-transparent">Avanzadas</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experimenta el futuro del trading automatizado con nuestras herramientas de última generación
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1: Precios Reales */}
            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 hover:border-brazil-green/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-brazil-green/20">
              <div className="absolute inset-0 bg-gradient-to-br from-brazil-green/5 to-emerald-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-brazil-green to-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  📊
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-brazil-green transition-colors duration-300">
                  Precios en Tiempo Real
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Conecta directamente con Soroswap API para obtener cotizaciones precisas y actualizadas al instante
                </p>
                <Link 
                  href="/api/soroswap/price" 
                  className="inline-flex items-center bg-gradient-to-r from-brazil-green to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                >
                  <span className="mr-2">🔍</span>
                  Ver Precios
                  <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>
              </div>
            </div>

            {/* Card 2: Trading Apalancado */}
            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 hover:border-brazil-green/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-brazil-green/20">
              <div className="absolute inset-0 bg-gradient-to-br from-brazil-green/5 to-emerald-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  ⚡
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors duration-300">
                  Trading Apalancado
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Maximiza tus ganancias con leverage 2x, 5x, 10x y protección automática contra liquidaciones
                </p>
                <Link 
                  href="/trading" 
                  className="inline-flex items-center bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                >
                  <span className="mr-2">🚀</span>
                  Empezar Trading
                  <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>
              </div>
            </div>

            {/* Card 3: Swaps Automáticos */}
            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 hover:border-brazil-green/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-brazil-green/20">
              <div className="absolute inset-0 bg-gradient-to-br from-brazil-green/5 to-emerald-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  🔄
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors duration-300">
                  Swaps Inteligentes
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Intercambia XLM ↔ USDC de forma automática con las mejores tasas del mercado via Soroswap
                </p>
                <Link
                  href="/swaps"
                  className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                >
                  <span className="mr-2">💫</span>
                  Hacer Swap
                  <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Status Section */}
      <div className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Estado del <span className="bg-gradient-to-r from-brazil-green to-emerald-400 bg-clip-text text-transparent">Sistema</span>
              </h2>
              <p className="text-gray-300 text-lg">Monitoreo en tiempo real de todos los servicios</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group bg-gradient-to-br from-brazil-green/10 to-emerald-600/10 rounded-2xl p-6 border border-brazil-green/20 hover:border-brazil-green/40 transition-all duration-300">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brazil-green to-emerald-600 rounded-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Soroswap API</h3>
                  <div className="flex items-center justify-center text-brazil-green font-semibold mb-2">
                    <div className="w-2 h-2 bg-brazil-green rounded-full mr-2 animate-pulse"></div>
                    Conectado
                  </div>
                  <p className="text-gray-300 text-sm">Precios y swaps activos</p>
                </div>
              </div>
              
              <div className="group bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Stellar Testnet</h3>
                  <div className="flex items-center justify-center text-blue-400 font-semibold mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                    Operativo
                  </div>
                  <p className="text-gray-300 text-sm">Red blockchain activa</p>
                </div>
              </div>
              
              <div className="group bg-gradient-to-br from-yellow-500/10 to-orange-600/10 rounded-2xl p-6 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Contrato Soroban</h3>
                  <div className="flex items-center justify-center text-yellow-400 font-semibold mb-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                    Desplegado
                  </div>
                  <p className="text-gray-300 text-sm">Smart contract funcional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="bg-gradient-to-r from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/30">
            <div className="mb-6">
              <div className="inline-flex items-center bg-gradient-to-r from-brazil-green to-emerald-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg mb-4">
                <span className="text-brazil-yellow mr-2">🏆</span>
                Meridian Hackathon 2025
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-brazil-green to-emerald-400 bg-clip-text text-transparent">Composability Track</span>
            </h3>
            
            <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
              Demostración completa de integración multi-protocolo en Stellar
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center">
                <span className="text-brazil-green mr-2">🔗</span>
                <span>Soroswap Integration</span>
              </div>
              <div className="flex items-center">
                <span className="text-brazil-green mr-2">⚡</span>
                <span>Soroban Smart Contracts</span>
              </div>
              <div className="flex items-center">
                <span className="text-brazil-green mr-2">🚀</span>
                <span>Real-time Trading</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-700/50">
              <p className="text-gray-400 text-sm">
                Construido con Next.js, Tailwind CSS y ❤️ para la comunidad Stellar
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}