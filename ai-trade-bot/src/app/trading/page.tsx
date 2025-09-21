'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { contractService } from '@/services/contractService';
import BottomNavigation from '@/components/MobileMenu';
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
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Zap className="w-3 h-3 sm:w-5 sm:h-5 text-black" />
      </div>
              <h1 className="text-xl sm:text-2xl font-bold">Trading</h1>
                    </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
                  {isConnected ? (
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-400">
                  <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}</span>
                  <span className="sm:hidden">{publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}</span>
                    </div>
                  ) : (
                <div className="text-xs sm:text-sm text-gray-400">Connect wallet</div>
              )}
                      </div>
                    </div>
                </div>
              </div>
              
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Price Chart */}
          <div className="lg:col-span-2">
            <motion.div
              className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">XLM Price</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl sm:text-3xl font-bold">${xlmPrice.toFixed(4)}</span>
                    <span className="text-green-400 text-xs sm:text-sm">+2.34%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchXlmPrice}
                    disabled={isUpdatingPrice}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isUpdatingPrice ? 'animate-spin' : ''}`} />
                  </button>
                  <div className="text-xs sm:text-sm text-gray-400">
                    {lastUpdateTime}
                  </div>
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
            </motion.div>
            </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            {/* New Position Form */}
            <motion.div
              className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Open Position</h3>
              
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
                  <motion.div
                    className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
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
                  </motion.div>
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
            </motion.div>

            {/* Active Positions */}
            <motion.div
              className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Active Positions</h3>
              
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
            </motion.div>
          </div>
        </div>

        {/* Status Messages */}
        {transactionStatus && (
          <motion.div
            className="mt-6 p-4 rounded-lg flex items-center space-x-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
          </motion.div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}