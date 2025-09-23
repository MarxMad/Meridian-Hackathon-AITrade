'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/contexts/WalletContext";
import BottomNavigation from "@/components/MobileMenu";
import Navigation from "@/components/Navigation";
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  TrendingUp, 
  Wallet, 
  BarChart3,
  ArrowUpDown,
  Activity,
  Star,
  ChevronRight,
  MessageCircle,
  Bot,
  Smartphone,
  Menu,
  X,
  Settings,
  Bell,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";

export default function Home() {
  const { isConnected, publicKey, walletName, network, connect, disconnect, isLoading, error } = useWallet();
  const [balance, setBalance] = useState<string>('0.0000000');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('XLM-USD');
  const [leverage, setLeverage] = useState(2);
  const [positionSize, setPositionSize] = useState('100');
  const [isLong, setIsLong] = useState(true);

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

  // Datos de ejemplo para métricas
  const marketData = {
    totalVolume: "$24,821,113,265",
    totalTrades: "2,381,716",
    totalTraders: "43,263",
    xlmPrice: "113,098.8",
    xlmChange: "+0.07%",
    xlmChangePositive: true
  };

  const assets = [
    { symbol: "XLM-USD", price: "113,098.8", change: "+0.07%", positive: true, category: "Crypto" },
    { symbol: "USDC-USD", price: "1.0000", change: "+0.01%", positive: true, category: "Stablecoin" },
    { symbol: "BTC-USD", price: "67,234.5", change: "-1.23%", positive: false, category: "Crypto" }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Navigation Bar */}
      <Navigation />

      {/* Hero Section - Global Markets */}
      <section className="relative py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight">
              <span className="text-white">Global Markets,</span>
              <br />
              <span className="text-purple-500">Limitless Leverage.</span>
            </h1>

            <div className="flex justify-center">
              <p className="text-xl text-gray-400 max-w-3xl leading-relaxed text-center">
                Trade crypto, forex, metals, commodities, indices, straight from your wallet.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link href="/trading">
                <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-lg flex items-center space-x-3 transition-all duration-200">
                  <span>Trade now</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
                  </div>
      </section>

      {/* Market Data Section */}
      <section className="py-12 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 text-center">
            {/* Asset Cards */}
            {assets.map((asset, index) => (
              <div
                key={index}
                className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="text-sm text-gray-400 mb-2">{asset.category}</div>
                <div className="text-lg font-semibold mb-2">{asset.symbol}</div>
                <div className="text-2xl font-bold mb-2">${asset.price}</div>
                <div className={`text-sm ${asset.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {asset.change}
                </div>
              </div>
            ))}

            {/* Market Stats */}
            <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/50">
              <div className="text-sm text-gray-400 mb-2">Total Traded Volume</div>
              <div className="text-2xl font-bold">{marketData.totalVolume}</div>
                    </div>

            <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/50">
              <div className="text-sm text-gray-400 mb-2">Trades</div>
              <div className="text-2xl font-bold">{marketData.totalTrades}</div>
            </div>
          </div>
      </div>
      </section>

      {/* Trading Interface */}
      <section className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Trading Controls */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-semibold mb-6">Trading Panel</h3>
                
                {/* Asset Selection */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">Asset</label>
                  <select 
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="XLM-USD">XLM-USD</option>
                    <option value="USDC-USD">USDC-USD</option>
                    <option value="BTC-USD">BTC-USD</option>
                  </select>
                </div>

                {/* Position Type */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">Position</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setIsLong(true)}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        isLong 
                          ? 'bg-green-600 text-white border-2 border-green-500' 
                          : 'bg-gray-700 text-gray-300 border-2 border-transparent hover:bg-gray-600'
                      }`}
                    >
                      Long
                    </button>
                    <button
                      onClick={() => setIsLong(false)}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        !isLong 
                          ? 'bg-red-600 text-white border-2 border-red-500' 
                          : 'bg-gray-700 text-gray-300 border-2 border-transparent hover:bg-gray-600'
                      }`}
                    >
                      Short
                    </button>
                  </div>
                </div>

                {/* Collateral */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">Collateral</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={positionSize}
                      onChange={(e) => setPositionSize(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-16 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="100"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      USDC
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    {[10, 25, 50, 75, 100].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => setPositionSize(percent.toString())}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Leverage */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">Leverage</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={leverage}
                      onChange={(e) => setLeverage(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="w-16 text-center">
                      <span className="text-lg font-semibold">{leverage}x</span>
                    </div>
                  </div>
                </div>

                {/* Position Size */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">Position Size</label>
                  <div className="bg-gray-700 rounded-lg px-4 py-3 text-white">
                    <div className="text-lg font-semibold">${(parseFloat(positionSize) * leverage).toFixed(2)}</div>
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-lg transition-all duration-200">
                  {isConnected ? 'Open Position' : 'Connect Wallet'}
                </button>

                {/* Status */}
                <div className="mt-6 flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-400">Fully Operational</span>
                  </div>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <Settings className="w-4 h-4" />
                </button>
                </div>
              </div>
            </div>

            {/* Center Panel - Chart Area */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">{marketData.xlmPrice}</h3>
                    <div className={`text-sm ${marketData.xlmChangePositive ? 'text-green-400' : 'text-red-400'}`}>
                      {marketData.xlmChange}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                      1m
                    </button>
                    <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                      5m
                    </button>
                    <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                      1h
                    </button>
                    <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                      1d
                    </button>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="h-64 bg-gray-700/50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500">Chart will be integrated here</p>
                  </div>
                </div>

                {/* Market Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-400">24H CHANGE</div>
                    <div className="text-lg font-semibold text-green-400">+0.07%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400">OI (L/S)</div>
                    <div className="text-lg font-semibold">3.3M / 3.1M</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400">LIQUIDITY</div>
                    <div className="text-lg font-semibold">7.7M / 7.9M</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400">SENTIMENT</div>
                    <div className="text-lg font-semibold">51% / 49%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
                </div>
      </section>

      {/* Advanced Trading Features */}
      <section className="py-20 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Advanced Trading Features</h2>
            <div className="flex justify-center">
              <p className="text-gray-400 text-xl max-w-4xl text-center">
                Professional tools for sophisticated traders on Stellar
              </p>
            </div>
          </div>

          {/* Loss Protection & Positive Slippage Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Loss Protection Card */}
            <div className="bg-gray-800/60 rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-purple-400 font-medium">TRADER</div>
                  <h3 className="text-2xl font-bold">Loss Protection</h3>
                </div>
              </div>
              
              <p className="text-gray-400 mb-6">
                Get up to 20% rebate on losses when trading against popular sentiment or for arbitrage strategies.
              </p>

              {/* Market Sentiment */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Market Sentiment</span>
                  <span className="text-gray-300">71% Long / 29% Short</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '71%' }}></div>
                </div>
              </div>

              {/* Position Size */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Position Size</label>
                <div className="relative">
                  <input
                    type="text"
                    value="20,000.00"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-16 text-white focus:border-purple-500 focus:outline-none"
                    readOnly
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    USDC
                  </div>
                </div>
              </div>

              {/* Trade Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button className="py-3 px-4 bg-green-600 text-white rounded-lg font-medium border-2 border-green-500 flex items-center justify-center">
                  Long
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
                <button className="py-3 px-4 bg-gray-700 text-gray-300 rounded-lg font-medium border-2 border-transparent hover:bg-gray-600">
                  Short
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-400">Loss Protection Inactive</span>
                </div>
                <div className="text-sm text-gray-400">Up to 20% rebate</div>
              </div>
            </div>

            {/* Positive Slippage Card */}
            <div className="bg-gray-800/60 rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-purple-400 font-medium">TRADER</div>
                  <h3 className="text-2xl font-bold">Positive Slippage</h3>
                </div>
              </div>
              
              <p className="text-gray-400 mb-6">
                Get rewarded with positive slippage for balancing open interest. Enter trades at better-than-market prices.
              </p>

              {/* Asset Selection */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold">Ξ</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">ETH-USD</div>
                    <div className="text-sm text-green-400">10x Long</div>
                  </div>
                </div>
              </div>

              {/* Price Metrics */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Price</span>
                  <span className="text-white">2,892.60</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price Benefit</span>
                  <span className="text-green-400">+0.05%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Execution Price</span>
                  <span className="text-green-400 font-semibold">2,747.97</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-400">Positive Slippage Active</span>
                </div>
                <div className="text-sm text-green-400">Better execution</div>
              </div>
            </div>
          </div>

          {/* Liquidity Provider Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Optimized for LPs */}
            <div className="bg-gray-800/60 rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
              <div className="mb-4">
                <div className="text-sm text-purple-400 font-medium mb-2">LIQUIDITY PROVIDER</div>
                <h3 className="text-2xl font-bold mb-4">Optimized for LPs</h3>
                <p className="text-gray-400 mb-6">
                  Our dynamic risk-engine optimizes LP returns across all market conditions. Our LPs have already earned &gt;$1M in USDC fees.
                </p>
              </div>

              {/* APR Chart Placeholder */}
              <div className="h-32 bg-gray-700/50 rounded-lg mb-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <BarChart3 className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Dynamic APR Chart</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">APR</span>
                <span className="text-2xl font-bold text-green-400">+15.32%</span>
              </div>
            </div>

            {/* Built for every type of LP */}
            <div className="bg-gray-800/60 rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
              <div className="mb-4">
                <div className="text-sm text-purple-400 font-medium mb-2">LIQUIDITY PROVIDER</div>
                <h3 className="text-2xl font-bold mb-4">Built for every type of LP</h3>
                <p className="text-gray-400 mb-6">
                  Avantis unlocks a new design space for LPs via our unique time and risk parameters. Choose to be on the lowest or highest end of the risk-spectrum.
                </p>
              </div>

              {/* Risk Tranches */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-gray-300" />
                      </div>
                      <div>
                        <div className="font-semibold">Junior Tranche</div>
                        <div className="text-sm text-red-400">High Risk</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">Senior Tranche</div>
                        <div className="text-sm text-green-400">Low Risk</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total liquidity</span>
                  <span className="text-white">$140,648.55</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">APR</span>
                  <span className="text-white">20%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Real Swaps",
                description: "Execute real XLM ↔ USDC swaps using Soroswap API integration"
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "10x Leverage",
                description: "Trade with up to 10x leverage on perpetual positions"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Secure Trading",
                description: "All transactions verified on Stellar blockchain"
              },
              {
                icon: <Activity className="w-8 h-8" />,
                title: "Real-time Prices",
                description: "Live price feeds from CoinGecko and Soroswap APIs"
              },
              {
                icon: <Wallet className="w-8 h-8" />,
                title: "Auto Wallets",
                description: "Automatic wallet creation via Telegram bot"
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Live Charts",
                description: "Real-time price charts for informed trading decisions"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="p-8 bg-gray-800/40 rounded-2xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="text-purple-500 mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-500/10 to-yellow-500/10">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold">
              Ready to Start Trading?
              </h2>
            <div className="flex justify-center">
              <p className="text-gray-400 text-xl max-w-3xl text-center">
              Connect your wallet and start trading perpetuals on Stellar today
            </p>
            </div>
            <div className="pt-4">
              <Link href="/trading">
                <button className="px-12 py-6 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xl flex items-center justify-center space-x-3 mx-auto transition-all duration-200 shadow-2xl hover:shadow-purple-500/25 hover:scale-105">
                  <span>Get Started</span>
                  <ChevronRight className="w-6 h-6" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-6 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span className="text-xl font-bold">ZenTrade</span>
            </div>
            <div className="text-gray-400 text-sm text-center sm:text-right max-w-md">
              Built for Meridian Hackathon 2025 • Powered by Stellar & Soroswap
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}