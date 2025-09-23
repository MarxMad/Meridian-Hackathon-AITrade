'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { contractService } from '@/services/contractService';
import BottomNavigation from '@/components/MobileMenu';
import Navigation from '@/components/Navigation';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Zap, 
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';

interface Position {
  id: string;
  asset: string;
  amount: number;
  leverage: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  margin: number;
  liquidationPrice: number;
  type: 'long' | 'short';
}

interface PriceData {
  time: string;
  price: number;
  volume: number;
}

export default function TradingPage() {
  const { isConnected, publicKey, walletName, signTransaction } = useWallet();
  const [xlmPrice, setXlmPrice] = useState<number>(0);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newPosition, setNewPosition] = useState({
    amount: 0,
    leverage: 2,
    type: 'long' as 'long' | 'short'
  });
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tradeResult, setTradeResult] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(1000);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Obtener precio de XLM desde Soroswap
  const fetchXlmPrice = async () => {
    try {
      setIsUpdatingPrice(true);
      const response = await fetch('/api/soroswap/price?asset=XLM&amount=1');
      const data = await response.json();
      
      if (data.success && data.data.soroswap.price > 0) {
        const newPrice = data.data.soroswap.price;
        setXlmPrice(newPrice);
        setLastUpdateTime(new Date().toLocaleTimeString());
        
        // Agregar a historial de precios
        const newDataPoint: PriceData = {
          time: new Date().toLocaleTimeString(),
          price: newPrice,
          volume: Math.random() * 1000000 // Simulado
        };
        
        setPriceHistory(prev => {
          const updated = [...prev, newDataPoint];
          // Mantener solo los últimos 50 puntos
          return updated.slice(-50);
        });
      } else {
        // Fallback a precio simulado
        const fallbackPrice = 0.12 + (Math.random() - 0.5) * 0.02;
        setXlmPrice(fallbackPrice);
          setLastUpdateTime(new Date().toLocaleTimeString());
        
        const newDataPoint: PriceData = {
          time: new Date().toLocaleTimeString(),
          price: fallbackPrice,
          volume: Math.random() * 1000000
        };
        
        setPriceHistory(prev => {
          const updated = [...prev, newDataPoint];
          return updated.slice(-50);
        });
      }
    } catch (error) {
      console.error('Error obteniendo precio XLM:', error);
      // Fallback a precio simulado
      const fallbackPrice = 0.12 + (Math.random() - 0.5) * 0.02;
      setXlmPrice(fallbackPrice);
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // Cargar precio inicial y configurar actualización automática
  useEffect(() => {
    fetchXlmPrice();
    
    // Actualizar precio cada 5 segundos
    const interval = setInterval(fetchXlmPrice, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Obtener posiciones del usuario
  const fetchPositions = async () => {
    if (!isConnected || !publicKey) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/contract/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          function: 'get_my_positions',
          args: [publicKey]
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPositions(data.data || []);
      }
    } catch (error) {
      console.error('Error obteniendo posiciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar posiciones cuando se conecta la wallet
  useEffect(() => {
    if (isConnected && publicKey) {
      fetchPositions();
    }
  }, [isConnected, publicKey]);

  // Abrir nueva posición
  const openPosition = async () => {
    if (!isConnected || !publicKey || newPosition.amount <= 0) return;

    setTransactionStatus('Abriendo posición...');
    setIsLoading(true);

    try {
      const response = await fetch('/api/contract/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          function: 'open_position',
          args: [
            'XLM',
            newPosition.amount,
            newPosition.type,
            'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC' // Token asset
          ]
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTransactionStatus('¡Posición abierta exitosamente!');
        setTradeResult(data);
        setShowConfirmation(true);
        
        // Actualizar posiciones
        fetchPositions();
        
        // Resetear formulario
        setNewPosition({
          amount: 0,
          leverage: 2,
          type: 'long'
        });
      } else {
        setTransactionStatus(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error abriendo posición:', error);
      setTransactionStatus(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Cerrar posición
  const closePosition = async (positionId: string) => {
    setTransactionStatus('Cerrando posición...');
    setIsLoading(true);

    try {
      const response = await fetch('/api/contract/execute', {
          method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
          function: 'close_position',
          args: [positionId]
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTransactionStatus('¡Posición cerrada exitosamente!');
        setTradeResult(data);
        setShowConfirmation(true);
        
        // Actualizar posiciones
        fetchPositions();
      } else {
        setTransactionStatus(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error cerrando posición:', error);
      setTransactionStatus(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePnL = (position: Position) => {
    const priceChange = position.currentPrice - position.entryPrice;
    const pnl = position.type === 'long' 
      ? priceChange * position.amount * position.leverage
      : -priceChange * position.amount * position.leverage;
    return pnl;
  };

  const getPnLColor = (pnl: number) => {
    return pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Top Navigation Bar */}
      <Navigation />
              
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Price Chart */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">XLM-USD</h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold">${xlmPrice.toFixed(4)}</span>
                    <span className="text-green-400 text-sm">+2.34%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    {['1m', '5m', '1h', '1d'].map((timeframe) => (
                      <button
                        key={timeframe}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          timeframe === '1m' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {timeframe}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={fetchXlmPrice}
                    disabled={isUpdatingPrice}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isUpdatingPrice ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              {/* Chart */}
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceHistory}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7D00FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#7D00FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={(value) => value.split(':').slice(0, 2).join(':')}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                      domain={['dataMin - 0.001', 'dataMax + 0.001']}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#E5E7EB'
                      }}
                      formatter={(value: any) => [`$${value.toFixed(4)}`, 'Price']}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#7D00FF"
                      strokeWidth={2}
                      fill="url(#priceGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            {/* New Position Form */}
            <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-semibold mb-6">Trading Panel</h3>
              
              <div className="space-y-3 sm:space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-xs sm:text-sm text-gray-400 mb-2">Amount (XLM)</label>
                  <input
                    type="number"
                    value={newPosition.amount}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-purple-500 focus:outline-none text-sm sm:text-base"
                    placeholder="0.0"
                  />
                </div>

                {/* Leverage */}
                <div>
                  <label className="block text-xs sm:text-sm text-gray-400 mb-2">Leverage</label>
                  <select
                    value={newPosition.leverage}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, leverage: parseInt(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-purple-500 focus:outline-none text-sm sm:text-base"
                  >
                    {[1, 2, 3, 5, 10].map(leverage => (
                      <option key={leverage} value={leverage}>{leverage}x</option>
                    ))}
                  </select>
                </div>

                {/* Position Type */}
                <div>
                  <label className="block text-xs sm:text-sm text-gray-400 mb-2">Position Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setNewPosition(prev => ({ ...prev, type: 'long' }))}
                      className={`py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                        newPosition.type === 'long' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                        Long
                    </button>
                    <button
                      onClick={() => setNewPosition(prev => ({ ...prev, type: 'short' }))}
                      className={`py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                        newPosition.type === 'short' 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}
                    >
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                        Short
                    </button>
                  </div>
                </div>

                {/* Position Info */}
                {newPosition.amount > 0 && (
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Entry Price:</span>
                        <span className="text-white">${xlmPrice.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Leverage:</span>
                        <span className="text-white">{newPosition.leverage}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Margin Required:</span>
                        <span className="text-white">{(newPosition.amount * xlmPrice).toFixed(2)} USDC</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Open Position Button */}
                <button
                  onClick={openPosition}
                  disabled={!isConnected || newPosition.amount <= 0 || isLoading}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isConnected && newPosition.amount > 0 && !isLoading
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                      : 'bg-gray-600 text-gray-400'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Opening...</span>
                    </div>
                  ) : (
                    'Open Position'
                  )}
                </button>
              </div>
            </div>

            {/* Active Positions */}
            <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-semibold mb-6">Active Positions</h3>
              
              {positions.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-400">
                  <BarChart3 className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">No active positions</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {positions.map((position) => (
                    <div key={position.id} className="p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          {position.type === 'long' ? (
                            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                          )}
                          <span className="font-medium text-sm sm:text-base">{position.type.toUpperCase()}</span>
                          <span className="text-gray-400 text-xs sm:text-sm">{position.asset}</span>
                        </div>
                        <span className={`font-semibold text-sm sm:text-base ${getPnLColor(calculatePnL(position))}`}>
                          {calculatePnL(position) > 0 ? '+' : ''}${calculatePnL(position).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">
                        <div>
                          <span>Entry: ${position.entryPrice.toFixed(4)}</span>
                        </div>
                        <div>
                          <span>Current: ${position.currentPrice.toFixed(4)}</span>
                        </div>
                        <div>
                          <span>Leverage: {position.leverage}x</span>
                        </div>
                        <div>
                          <span>Amount: {position.amount}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => closePosition(position.id)}
                        disabled={isLoading}
                        className="w-full py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 text-sm sm:text-base"
                      >
                        Close Position
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {transactionStatus && (
          <div
            className="mt-6 p-4 rounded-lg flex items-center space-x-2"
            style={{
              backgroundColor: transactionStatus.includes('Error') ? '#1F2937' : '#065F46',
              borderColor: transactionStatus.includes('Error') ? '#EF4444' : '#10B981'
            }}
          >
            {transactionStatus.includes('Error') ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            <span>{transactionStatus}</span>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}