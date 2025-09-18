'use client';

// Forzar rendering dinámico para evitar static generation
export const dynamic = 'force-dynamic';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-emerald-500/15 to-transparent rounded-full animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-cyan-500/10 to-transparent rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full animate-pulse delay-500"></div>
          
          {/* Tech grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}></div>
          </div>
          
          {/* Floating tech elements */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-cyan-400 rounded-full animate-ping delay-700"></div>
          <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping delay-1500"></div>
          <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-ping delay-300"></div>
        </div>
        
        <header className="relative z-10 px-8 pt-16 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-emerald-500/30 relative overflow-hidden">
              {/* Decorative elements for visual appeal */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-green-400/15 to-blue-400/15 rounded-full blur-lg"></div>
              
              <div className="flex flex-col lg:flex-row justify-between items-center gap-8 relative z-10">
                <div className="flex-1 text-center lg:text-left">
                  {/* Logo Section - Much Larger */}
                  <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 mb-8">
                    <div className="relative group">
                      <div className="w-40 h-40 lg:w-48 lg:h-48 relative">
                        {/* Glowing effect behind logo */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <div className="absolute inset-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-full animate-pulse"></div>
                        <Image
                          src="/LOGOZZ.png"
                          alt="ZENTRADE Logo"
                          fill
                          className="object-contain relative z-10 drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
                          priority
                        />
                        {/* Orbiting elements around logo */}
                        <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                        <div className="absolute bottom-6 left-2 w-2 h-2 bg-cyan-400 rounded-full animate-ping delay-1000"></div>
                        <div className="absolute top-1/2 -right-2 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping delay-500"></div>
                      </div>
                    </div>
                    
                    {/* Title and subtitle section */}
                    <div className="flex-1">
                      <h1 className="text-4xl lg:text-6xl xl:text-7xl font-extrabold mb-4 bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 bg-clip-text text-transparent leading-tight drop-shadow-lg">
                        ZENTRADE
                      </h1>
                      <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                        <div className="h-1 w-12 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></div>
                        <p className="text-xl lg:text-2xl font-bold text-white drop-shadow-lg">
                          AI Trading Bot
                        </p>
                        <div className="h-1 w-12 bg-gradient-to-r from-cyan-400 to-green-400 rounded-full"></div>
                      </div>
                      
                      {/* Animated stats */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3 text-center">
                          <div className="text-emerald-400 font-bold text-lg">24/7</div>
                          <div className="text-xs text-gray-300">Trading</div>
                        </div>
                        <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-xl p-3 text-center">
                          <div className="text-cyan-400 font-bold text-lg">10x</div>
                          <div className="text-xs text-gray-300">Leverage</div>
                        </div>
                        <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-3 text-center col-span-2 lg:col-span-1">
                          <div className="text-green-400 font-bold text-lg">Real-time</div>
                          <div className="text-xs text-gray-300">Prices</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Badge and description */}
                  <div className="mb-6">
                    <div className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg border border-emerald-400/50 hover:scale-105 transition-transform duration-300">
                      <span className="text-yellow-400 mr-2 animate-bounce">🏆</span>
                      Composability Track
                    </div>
                  </div>
                  
                  <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                    Complete integration of Stellar protocols for next-generation automated trading
                  </p>
                  
                  {/* Feature badges */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm">
                    <div className="flex items-center bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-400/40 shadow-lg hover:bg-emerald-500/30 transition-all duration-300">
                      <span className="text-emerald-400 mr-2">🧩</span>
                      <span className="font-semibold text-white">Multi-Protocol</span>
                    </div>
                    <div className="flex items-center bg-cyan-500/20 px-4 py-2 rounded-full border border-cyan-400/40 shadow-lg hover:bg-cyan-500/30 transition-all duration-300">
                      <span className="text-cyan-400 mr-2">🔄</span>
                      <span className="font-semibold text-white">Soroswap + Soroban</span>
                    </div>
                    <div className="flex items-center bg-green-500/20 px-4 py-2 rounded-full border border-green-400/40 shadow-lg hover:bg-green-500/30 transition-all duration-300">
                      <span className="text-green-400 mr-2">🔗</span>
                      <span className="font-semibold text-white">Wallet Integration</span>
                    </div>
                  </div>
                </div>
            
                {/* Wallet Connection - Enhanced */}
                <div className="lg:ml-8 w-full lg:w-auto">
                  {isConnected ? (
                    <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 text-white p-6 rounded-2xl shadow-xl border border-emerald-400/50 min-w-[380px] backdrop-blur-sm overflow-hidden">
                      {/* Decorative background */}
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-300/20 rounded-full blur-xl"></div>
                      <div className="absolute -bottom-5 -left-5 w-16 h-16 bg-green-300/15 rounded-full blur-lg"></div>
                      
                      <div className="relative z-10">
                        {/* Status Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="w-4 h-4 bg-emerald-300 rounded-full animate-pulse"></div>
                              <div className="absolute inset-0 w-4 h-4 bg-emerald-300 rounded-full animate-ping"></div>
                            </div>
                            <div className="text-xl font-bold ml-3">✅ {walletName}</div>
                          </div>
                          <div className="text-2xl animate-bounce">🚀</div>
                        </div>
                        
                        {/* Wallet Address */}
                        <div className="bg-black/30 rounded-xl p-4 mb-4 border border-emerald-400/30">
                          <div className="text-xs text-emerald-200 font-semibold mb-2">🏠 Dirección:</div>
                          <div className="text-sm font-mono break-all bg-black/40 px-3 py-2 rounded-lg border border-emerald-500/20">
                            {publicKey?.slice(0, 12)}...{publicKey?.slice(-12)}
                          </div>
                        </div>
                        
                        {/* Balance and Network Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-black/30 rounded-xl p-4 border border-emerald-400/30 hover:bg-black/40 transition-all duration-300">
                            <div className="text-xs text-emerald-200 font-semibold mb-1">💰 XLM Balance:</div>
                            <div className="text-xl font-bold flex items-center">
                              {balanceLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <span className="text-emerald-200 mr-1">✨</span>
                                  {parseFloat(balance).toFixed(2)}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-black/30 rounded-xl p-4 border border-emerald-400/30 hover:bg-black/40 transition-all duration-300">
                            <div className="text-xs text-emerald-200 font-semibold mb-1">🌐 Network:</div>
                            <div className="text-xl font-bold">
                              {network === WalletNetwork.TESTNET ? '🧪 Test' : '🌐 Main'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <button className="bg-emerald-600/30 border border-emerald-400/40 text-white px-3 py-2 rounded-lg font-semibold hover:bg-emerald-600/50 transition-all duration-300 text-sm">
                            📊 Balance
                          </button>
                          <button className="bg-emerald-600/30 border border-emerald-400/40 text-white px-3 py-2 rounded-lg font-semibold hover:bg-emerald-600/50 transition-all duration-300 text-sm">
                            🔄 Refresh
                          </button>
                        </div>
                        
                        {/* Disconnect Button */}
                        <button
                          onClick={disconnect}
                          className="w-full bg-red-500/20 border border-red-400/40 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition-all duration-300 group"
                        >
                          <span className="group-hover:animate-bounce inline-block mr-2">🔌</span>
                          Disconnect Wallet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center lg:text-right min-w-[380px]">
                      {/* Connect Wallet Card */}
                      <div className="relative bg-gradient-to-br from-slate-700/90 to-slate-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-emerald-500/30 overflow-hidden">
                        {/* Decorative background */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl"></div>
                        <div className="absolute -bottom-5 -left-5 w-16 h-16 bg-cyan-400/10 rounded-full blur-lg"></div>
                        
                        <div className="relative z-10">
                          {/* Icon and Title */}
                          <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto shadow-lg">
                              👛
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
                            <p className="text-gray-300 text-sm">Start your trading experience</p>
                          </div>
                          
                          {/* Benefits */}
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center text-sm text-gray-300">
                              <span className="text-emerald-400 mr-3">✨</span>
                              Leveraged trading
                            </div>
                            <div className="flex items-center text-sm text-gray-300">
                              <span className="text-cyan-400 mr-3">🔄</span>
                              Instant swaps
                            </div>
                            <div className="flex items-center text-sm text-gray-300">
                              <span className="text-green-400 mr-3">🚀</span>
                              Full platform access
                            </div>
                          </div>
                          
                          {/* Connect Button */}
                          <button
                            onClick={connect}
                            disabled={isLoading}
                            className="group relative w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 border border-emerald-400/50"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center justify-center">
                              {isLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <span className="text-2xl mr-3 group-hover:animate-bounce">🚀</span>
                                  Connect Wallet
                                  <span className="ml-3 group-hover:translate-x-1 transition-transform duration-300">→</span>
                                </>
                              )}
                            </div>
                          </button>
                        </div>
                      </div>
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
              Advanced <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">Features</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the future of automated trading with our cutting-edge tools
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1: Precios Reales */}
            <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-emerald-500/30 hover:border-emerald-400/70 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-400/20">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  📊
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors duration-300">
                  Real-Time Prices
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Connect directly with Soroswap API to get precise and instantly updated quotes
                </p>
                <Link 
                  href="/api/soroswap/price" 
                  className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                >
                  <span className="mr-2">🔍</span>
                  View Prices
                  <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>
              </div>
            </div>

            {/* Card 2: Trading Apalancado */}
            <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-yellow-500/30 hover:border-yellow-400/70 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-400/20">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  ⚡
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors duration-300">
                  Leveraged Trading
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Maximize your profits with 2x, 5x, 10x leverage and automatic protection against liquidations
                </p>
                <Link 
                  href="/trading" 
                  className="inline-flex items-center bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                >
                  <span className="mr-2">🚀</span>
                  Start Trading
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
                  Smart Swaps
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Exchange XLM ↔ USDC automatically with the best market rates via Soroswap
                </p>
                <Link
                  href="/swaps"
                  className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                >
                  <span className="mr-2">💫</span>
                  Make Swap
                  <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Powered By Section */}
      <div className="px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Powered by Cutting-Edge <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">Technologies</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We integrate the best tools from the Stellar ecosystem to deliver a superior trading experience
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Soroswap Engine */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-500">
                {/* Header */}
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-4xl mr-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    🔄
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">Soroswap</h3>
                    <p className="text-emerald-400 font-semibold">Exchange Engine</p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mr-4"></div>
                    <span>Most advanced Stellar DEX</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mr-4"></div>
                    <span>Real-time quotes</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mr-4"></div>
                    <span>Optimized liquidity</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mr-4"></div>
                    <span>Automatic swaps without slippage</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-4 text-center">
                    <div className="text-emerald-400 font-bold text-xl">99.9%</div>
                    <div className="text-xs text-gray-300">Uptime</div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-4 text-center">
                    <div className="text-emerald-400 font-bold text-xl">&lt;2s</div>
                    <div className="text-xs text-gray-300">Response Time</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stellar Wallet Kit */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-500">
                {/* Header */}
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-4xl mr-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    👛
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">Stellar Wallet Kit</h3>
                    <p className="text-cyan-400 font-semibold">Wallet System</p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-4"></div>
                    <span>Universal wallet connection</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-4"></div>
                    <span>Freighter, Albedo, Rabet</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-4"></div>
                    <span>Maximum security</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-4"></div>
                    <span>Seamless integration</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-xl p-4 text-center">
                    <div className="text-cyan-400 font-bold text-xl">5+</div>
                    <div className="text-xs text-gray-300">Supported Wallets</div>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-xl p-4 text-center">
                    <div className="text-cyan-400 font-bold text-xl">100%</div>
                    <div className="text-xs text-gray-300">Compatibility</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Overview */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Technical <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Architecture</span>
              </h3>
              <p className="text-gray-300">Technologies that make ZENTRADE possible</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  ⭐
                </div>
                <h4 className="font-bold text-white mb-2">Stellar</h4>
                <p className="text-xs text-gray-400">Blockchain Base</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  🔗
                </div>
                <h4 className="font-bold text-white mb-2">Soroban</h4>
                <p className="text-xs text-gray-400">Smart Contracts</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  ⚛️
                </div>
                <h4 className="font-bold text-white mb-2">Next.js</h4>
                <p className="text-xs text-gray-400">Frontend Framework</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  🚀
                </div>
                <h4 className="font-bold text-white mb-2">TypeScript</h4>
                <p className="text-xs text-gray-400">Type Safety</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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