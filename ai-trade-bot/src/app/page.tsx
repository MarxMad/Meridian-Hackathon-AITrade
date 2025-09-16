'use client';

import Link from "next/link";
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
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Header con colores de Brasil */}
      <header className="w-full max-w-6xl mb-12">
        <div className="bg-brazil-white rounded-lg p-8 shadow-2xl border-4 border-brazil-green">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl font-bold text-center mb-4">
                <span className="text-brazil-green">🤖</span> AI Trade Bot
              </h1>
              <p className="text-xl text-brazil-gray text-center mb-6">
                <span className="text-brazil-green font-semibold">Composability Track</span> - Integración completa de protocolos Stellar
              </p>
              <div className="flex justify-center space-x-4 text-sm text-brazil-gray">
                <span>🧩 Multi-Protocol</span>
                <span>•</span>
                <span>🔄 Soroswap + Soroban</span>
                <span>•</span>
                <span>🔗 Wallet Integration</span>
              </div>
            </div>
            
            {/* Wallet Connection */}
            <div className="ml-8">
              {isConnected ? (
                <div className="bg-brazil-green text-brazil-white p-4 rounded-lg min-w-[280px]">
                  <div className="text-sm font-bold mb-2">✅ {walletName} Conectada</div>
                  <div className="text-xs font-mono break-all mb-2">
                    {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                  </div>
                  
                  {/* Balance */}
                  <div className="mb-2">
                    <div className="text-xs text-brazil-yellow font-semibold">Balance XLM:</div>
                    <div className="text-sm font-mono">
                      {balanceLoading ? '⏳ Cargando...' : `${balance} XLM`}
                    </div>
                  </div>
                  
                  {/* Red */}
                  <div className="mb-3">
                    <div className="text-xs text-brazil-yellow font-semibold">Red:</div>
                    <div className="text-sm">
                      {network === WalletNetwork.TESTNET ? '🧪 Testnet' : '🌐 Mainnet'}
                    </div>
                  </div>
                  
                  <button
                    onClick={disconnect}
                    className="text-xs bg-brazil-black text-brazil-white px-2 py-1 rounded hover:bg-brazil-gray transition-colors"
                  >
                    Desconectar
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={isLoading}
                  className="bg-brazil-green text-brazil-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? '⏳ Conectando...' : '🔗 Elegir Wallet'}
                </button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      </header>

      {/* Cards principales */}
      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Card 1: Precios Reales */}
        <div className="bg-brazil-black rounded-lg p-6 border-2 border-brazil-gray hover:border-brazil-green transition-colors">
          <div className="text-3xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-brazil-white mb-2">Precios Reales</h2>
          <p className="text-brazil-gray mb-4">
            Obtén precios en tiempo real desde Soroswap API para trading preciso
          </p>
          <Link 
            href="/api/soroswap/price" 
            className="inline-block bg-brazil-green text-brazil-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Ver Precios
          </Link>
        </div>

        {/* Card 2: Trading Apalancado */}
        <div className="bg-brazil-black rounded-lg p-6 border-2 border-brazil-gray hover:border-brazil-green transition-colors">
          <div className="text-3xl mb-4">⚡</div>
          <h2 className="text-xl font-bold text-brazil-white mb-2">Trading Apalancado</h2>
          <p className="text-brazil-gray mb-4">
            Posiciones con leverage 2x, 5x, 10x con liquidaciones automáticas
          </p>
          <Link 
            href="/trading" 
            className="inline-block bg-brazil-green text-brazil-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Empezar Trading
          </Link>
        </div>

        {/* Card 3: Swaps Automáticos */}
        <div className="bg-brazil-black rounded-lg p-6 border-2 border-brazil-gray hover:border-brazil-green transition-colors">
          <div className="text-3xl mb-4">🔄</div>
          <h2 className="text-xl font-bold text-brazil-white mb-2">Swaps Automáticos</h2>
          <p className="text-brazil-gray mb-4">
            Intercambia XLM ↔ USDC automáticamente usando Soroswap
          </p>
          <Link 
            href="/api/soroswap/quote" 
            className="inline-block bg-brazil-green text-brazil-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Hacer Swap
          </Link>
        </div>

      </main>

      {/* Estado del Sistema */}
      <div className="w-full max-w-6xl bg-brazil-white rounded-lg p-6 border-4 border-brazil-green">
        <h2 className="text-2xl font-bold text-brazil-black mb-4 text-center">Estado del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-brazil-green text-brazil-white p-4 rounded">
            <div className="text-2xl font-bold">✅</div>
            <div className="font-semibold">Soroswap API</div>
            <div className="text-sm">Conectado</div>
          </div>
          <div className="bg-brazil-green text-brazil-white p-4 rounded">
            <div className="text-2xl font-bold">✅</div>
            <div className="font-semibold">Stellar Testnet</div>
            <div className="text-sm">Activo</div>
          </div>
          <div className="bg-brazil-green text-brazil-white p-4 rounded">
            <div className="text-2xl font-bold">✅</div>
            <div className="font-semibold">Contrato Soroban</div>
            <div className="text-sm">Desplegado</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-brazil-gray">
        <p>🏆 Meridian Hackathon 2025 - Track: Payments</p>
        <p className="text-sm mt-2">
          Integración completa con Soroswap API para trading automatizado
        </p>
      </footer>
    </div>
  );
}