'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/contexts/WalletContext";
import BottomNavigation from "@/components/MobileMenu";
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
  Smartphone
} from "lucide-react";

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
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-black" />
          </div>
              <span className="text-xl font-bold">ZenTrade</span>
            </motion.div>

            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-400">
                    {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                  </div>
                        <button
                          onClick={disconnect}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                    Disconnect
                        </button>
                    </div>
                  ) : (
                          <button
                            onClick={connect}
                            disabled={isLoading}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'Conectando...' : 'Iniciar Sesión'}
                          </button>
              )}
            </div>
          </div>
      </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-32 xl:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 flex flex-col items-center">
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
            <motion.span
              className="text-yellow-400"
              animate={{
                textShadow: [
                  "0 0 10px #FFD700",
                  "0 0 15px #FFD700, 0 0 20px #FFD700",
                  "0 0 10px #FFD700"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              First Native
            </motion.span>
              <br />
              <span className="text-white">Perpetuals on Stellar</span>
            </motion.h1>

            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Trade perpetuals with leverage up to 10x on Stellar network. 
              Built with Soroswap integration and real-time price feeds.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-4 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link href="/trading">
                <button className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl font-semibold text-lg sm:text-xl flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-yellow-500/25">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Start Trading</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </Link>
              <Link href="/swaps">
                <button className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 border-2 border-gray-600 hover:border-gray-500 rounded-xl font-semibold text-lg sm:text-xl flex items-center justify-center space-x-3 transition-all duration-200 hover:bg-gray-800/50">
                  <ArrowUpDown className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Swap Tokens</span>
                </button>
                </Link>
            </motion.div>
              </div>
            </div>

        {/* Grid Pattern Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-24 md:py-32 bg-gray-900/30 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16 sm:mb-20 md:mb-24 flex flex-col items-center" 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 text-center">Built for Stellar</h2>
            <p className="text-gray-400 text-lg sm:text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed text-center">
              Native integration with Stellar ecosystem and Soroswap protocol
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
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
              <motion.div
                key={index}
                className="p-6 sm:p-8 bg-gray-800/40 rounded-2xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:bg-gray-800/60"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="text-purple-500 mb-6 text-center">{feature.icon}</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center">{feature.title}</h3>
                <p className="text-gray-400 text-base sm:text-lg leading-relaxed text-center">{feature.description}</p>
              </motion.div>
            ))}
              </div>
            </div>
      </section>

      {/* Telegram Bot Section */}
      <section className="py-20 sm:py-24 md:py-32 bg-gradient-to-br from-gray-900/50 to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16 sm:mb-20 flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6 sm:mb-8"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 text-center">
              Trade desde <span className="text-yellow-400">Telegram</span>
            </h2>
            <p className="text-gray-400 text-lg sm:text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed text-center">
              La primera plataforma nativa de Stellar que te permite hacer swaps y trades directamente desde Telegram
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            {/* Left Side - Features */}
            <motion.div
              className="space-y-8 sm:space-y-10"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6 sm:space-y-8">
                {[
                  {
                    icon: <Bot className="w-6 h-6 sm:w-8 sm:h-8" />,
                    title: "Bot Inteligente",
                    description: "Interfaz conversacional para trading intuitivo"
                  },
                  {
                    icon: <Smartphone className="w-6 h-6 sm:w-8 sm:h-8" />,
                    title: "Acceso Móvil",
                    description: "Trade desde cualquier lugar con tu teléfono"
                  },
                  {
                    icon: <ArrowUpDown className="w-6 h-6 sm:w-8 sm:h-8" />,
                    title: "Swaps Instantáneos",
                    description: "Intercambia tokens XLM/USDC al instante"
                  },
                  {
                    icon: <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8" />,
                    title: "Trading Avanzado",
                    description: "Posiciones con leverage hasta 10x"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-4 sm:space-x-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-400">
                      {feature.icon}
                  </div>
                  <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white text-center">{feature.title}</h3>
                      <p className="text-gray-400 text-sm sm:text-base leading-relaxed text-center">{feature.description}</p>
                  </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side - CTA */}
            <motion.div
              className="text-center lg:text-left"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl p-8 sm:p-10 border border-gray-700/50">
                <div className="mb-8">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white text-center">
                    ¡Prueba el Bot!
                  </h3>
                  <p className="text-gray-400 text-lg sm:text-xl leading-relaxed mb-6 text-center">
                    Conecta tu wallet y comienza a tradear desde Telegram en segundos
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <a
                    href="https://t.me/your_bot_username"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <motion.button
                      className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold text-lg sm:text-xl flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Abrir en Telegram</span>
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>
                  </a>
                  
                  <div className="text-sm text-gray-500 text-center">
                    <p>💡 <strong>Tip:</strong> Usa /start para comenzar</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
            </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 sm:py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 md:gap-16 text-center">
            {[
              { label: "Total Volume", value: "$2.4M", icon: <TrendingUp className="w-8 h-8" /> },
              { label: "Active Users", value: "1,234", icon: <Activity className="w-8 h-8" /> },
              { label: "Successful Trades", value: "15,678", icon: <Star className="w-8 h-8" /> },
              { label: "Uptime", value: "99.9%", icon: <Shield className="w-8 h-8" /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-6 sm:p-8 bg-gray-900/30 rounded-2xl border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-purple-500 mb-4 flex justify-center">{stat.icon}</div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 text-white text-center">{stat.value}</div>
                <div className="text-gray-400 text-sm sm:text-base font-medium text-center">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 md:py-32 bg-gradient-to-r from-purple-500/10 to-yellow-500/10">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            className="space-y-8 flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center">
              Ready to Start Trading?
              </h2>
            <p className="text-gray-400 text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-center">
              Connect your wallet and start trading perpetuals on Stellar today
            </p>
            <div className="pt-4">
              <Link href="/swaps">
                <button className="px-10 sm:px-12 py-5 sm:py-6 bg-yellow-500 hover:bg-yellow-600 text-black rounded-2xl font-bold text-xl sm:text-2xl flex items-center justify-center space-x-3 mx-auto transition-all duration-200 shadow-2xl hover:shadow-yellow-500/25 hover:scale-105">
                  <span>Get Started</span>
                  <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-6 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-black" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white">ZenTrade</span>
            </div>
            <div className="text-gray-400 text-sm sm:text-base text-center sm:text-right max-w-md">
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