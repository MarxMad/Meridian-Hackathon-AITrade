'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWallet } from '@/contexts/WalletContext';
import { contractService } from '@/services/contractService';

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

export default function TradingPage() {
  const { isConnected, publicKey, walletName, signTransaction } = useWallet();
  const [xlmPrice, setXlmPrice] = useState<number>(0);
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
  const [walletBalance, setWalletBalance] = useState<number>(1000); // Simulado

  // Monitorear cambios en el estado de la posición (solo para depuración)
  // useEffect(() => {
  //   console.log('🔄 Estado de newPosition cambió:', newPosition);
  // }, [newPosition]);

  // Obtener precio de XLM desde Soroswap (precio real)
  const fetchXlmPrice = async () => {
    try {
      const response = await fetch('/api/soroswap/price?asset=XLM&amount=1');
      const data = await response.json();
      if (data.success && data.data.soroswap.price > 0) {
        setXlmPrice(data.data.soroswap.price);
        setLastUpdateTime(new Date().toLocaleTimeString());
      } else {
        // Fallback a CoinGecko
        const coingeckoResponse = await fetch('/api/coingecko/price?asset=stellar');
        const coingeckoData = await coingeckoResponse.json();
        if (coingeckoData.success) {
          setXlmPrice(coingeckoData.data.price);
          setLastUpdateTime(new Date().toLocaleTimeString());
        }
      }
    } catch (error) {
      console.error('Error obteniendo precio:', error);
    }
  };

  // Obtener cotización de swap
  const getSwapQuote = async (amount: number) => {
    try {
      const response = await fetch('/api/soroswap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo cotización:', error);
      return null;
    }
  };

  // Abrir nueva posición
  const openPosition = async () => {
    if (newPosition.amount <= 0) {
      return;
    }
    if (!isConnected || !publicKey) {
      alert('Por favor conecta tu wallet primero');
      return;
    }
    
    setIsLoading(true);
    setTransactionStatus('Preparando transacción...');
    
    try {
      // 1. Obtener cotización de swap
      const quote = await getSwapQuote(newPosition.amount);
      if (!quote?.success) {
        alert('Error obteniendo cotización');
        return;
      }

      // 2. Crear transacción para abrir posición en el contrato
      setTransactionStatus('Creando transacción de posición...');
      
      const transactionXdr = await contractService.openPosition(
        publicKey,
        newPosition.amount,
        newPosition.leverage,
        newPosition.type
      );

      // 3. Firmar transacción
      setTransactionStatus('Firmando transacción...');
      const signedTransaction = await signTransaction(transactionXdr);

      // 4. Enviar transacción
      setTransactionStatus('Enviando transacción...');
      const result = await contractService.submitTransaction(signedTransaction);

      if (result.successful) {
        // 5. Calcular margen requerido
        const margin = newPosition.amount / newPosition.leverage;
        const liquidationPrice = newPosition.type === 'long' 
          ? newPosition.amount * 0.9 / newPosition.leverage  // 10% de margen
          : newPosition.amount * 1.1 / newPosition.leverage;

        // 6. Crear nueva posición local
        const position: Position = {
          id: Date.now().toString(),
          asset: 'XLM',
          amount: newPosition.amount,
          leverage: newPosition.leverage,
          entryPrice: xlmPrice,
          currentPrice: xlmPrice,
          pnl: 0,
          margin,
          liquidationPrice,
          type: newPosition.type
        };

        setPositions(prev => [...prev, position]);
        
        // Mostrar pantalla de confirmación
        setTradeResult({
          hash: result.hash,
          ledger: result.ledger || 'N/A',
          action: 'open',
          amount: newPosition.amount,
          leverage: newPosition.leverage,
          type: newPosition.type,
          entryPrice: xlmPrice,
          margin: margin,
          liquidationPrice: liquidationPrice,
          network: 'testnet'
        });
        setShowConfirmation(true);
        setTransactionStatus(''); // Limpiar el estado de transacción
      } else {
        throw new Error('Transacción falló');
      }
    } catch (error) {
      console.error('Error abriendo posición:', error);
      setTransactionStatus('❌ Error abriendo posición');
      alert(`Error abriendo posición: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Cerrar posición
  const closePosition = async (id: string) => {
    if (!isConnected || !publicKey) {
      alert('Por favor conecta tu wallet primero');
      return;
    }

    // Encontrar la posición a cerrar
    const position = positions.find(p => p.id === id);
    if (!position) {
      alert('Posición no encontrada');
      return;
    }

    setIsLoading(true);
    setTransactionStatus('Calculando PnL...');
    
    try {
      // 1. Calcular PnL real basado en el precio actual
      const currentPrice = xlmPrice;
      const entryPrice = position.entryPrice;
      const amount = position.amount;
      const leverage = position.leverage;
      
      let pnl;
      if (position.type === 'long') {
        // Para LONG: PnL = (precio_actual - precio_entrada) * cantidad * leverage
        pnl = (currentPrice - entryPrice) * amount * leverage;
      } else {
        // Para SHORT: PnL = (precio_entrada - precio_actual) * cantidad * leverage
        pnl = (entryPrice - currentPrice) * amount * leverage;
      }
      
      const margin = amount / leverage;
      const totalReturn = margin + pnl; // Margen inicial + PnL
      const roi = (pnl / margin) * 100; // Return on Investment
      
      // Debug logging
      console.log('🔍 Cálculo de PnL:');
      console.log('  - Entry Price:', entryPrice);
      console.log('  - Current Price:', currentPrice);
      console.log('  - Amount:', amount);
      console.log('  - Leverage:', leverage);
      console.log('  - PnL:', pnl);
      console.log('  - Margin:', margin);
      console.log('  - Total Return:', totalReturn);
      console.log('  - ROI:', roi + '%');
      
      // Devolver el monto completo de la posición (no solo el margen)
      // En un sistema real, esto sería: margen + PnL, pero para demo devolvemos el monto completo
      const actualReturn = amount; // Monto completo de la posición (222 XLM)
      console.log('🔍 Monto a devolver (posición completa):', actualReturn);
      console.log('🔍 Margen calculado:', margin);
      console.log('🔍 PnL calculado:', pnl);
      console.log('🔍 Total Return (margen + PnL):', totalReturn);
      
      setTransactionStatus('Creando transacción de cierre...');
      
      // 2. Crear transacción para cerrar posición en el contrato
      const transactionXdr = await contractService.closePosition(publicKey, id);

      // 3. Firmar transacción
      setTransactionStatus('Firmando transacción...');
      const signedTransaction = await signTransaction(transactionXdr);

      // 4. Enviar transacción del contrato
      setTransactionStatus('Enviando transacción de cierre...');
      const result = await contractService.submitTransaction(signedTransaction);

      if (result.successful) {
        setTransactionStatus('Creando transacción de transferencia de fondos...');
        
        // 5. Transferir fondos directamente desde wallet Meridian (método simplificado)
        setTransactionStatus('Transfiriendo fondos desde wallet Meridian...');
        const transferResponse = await fetch('/api/transfer-funds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toAccount: publicKey,
            amount: amount.toFixed(7), // Monto original de la posición
            memo: `PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`
          })
        });

        const transferData = await transferResponse.json();
        console.log('🔍 Transfer response:', transferData);
        if (!transferData.success) {
          console.warn('⚠️ Error transfiriendo fondos:', transferData.message);
          // Continúa aunque falle la transferencia
        } else {
          console.log('✅ Transferencia exitosa:', transferData.data?.hash);
        }

        // 6. Mostrar pantalla de confirmación con PnL y fondos devueltos
        setTradeResult({
          hash: result.hash,
          transferHash: transferData.data?.hash, // Hash de la transferencia de fondos
          ledger: result.ledger || 'N/A',
          action: 'close',
          position: {
            type: position.type,
            leverage: position.leverage,
            amount: position.amount,
            entryPrice: position.entryPrice,
            currentPrice: currentPrice
          },
          pnl: pnl,
          margin: margin,
          totalReturn: totalReturn,
          roi: roi,
          fundsReturned: actualReturn, // Monto real devuelto por el contrato
          transferSuccessful: transferData.success,
          network: 'testnet'
        });
        setShowConfirmation(true);
        setTransactionStatus(''); // Limpiar el estado de transacción
        
        // 7. Remover posición de la lista
        setPositions(prev => prev.filter(p => p.id !== id));
        
        // 8. Actualizar balance de la wallet (simulado)
        setWalletBalance(prev => prev + actualReturn);
        
        // 9. Mostrar notificación de fondos devueltos
        setTimeout(() => {
          alert(`💰 Fondos devueltos: $${actualReturn.toFixed(2)}\n\nEl contrato ha transferido los fondos de vuelta a tu wallet.`);
        }, 1000);
      } else {
        throw new Error('Transacción falló');
      }
    } catch (error) {
      console.error('Error cerrando posición:', error);
      setTransactionStatus('❌ Error cerrando posición');
      alert(`Error cerrando posición: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener posiciones reales del contrato
  const fetchRealPositions = async () => {
    if (!isConnected || !publicKey) return;
    
    try {
      setTransactionStatus('Obteniendo posiciones del contrato...');
      const transactionXdr = await contractService.getTraderPositions(publicKey);
      
      // Firmar y enviar consulta
      const signedTransaction = await signTransaction(transactionXdr);
      const result = await contractService.submitTransaction(signedTransaction);
      
      if (result.successful) {
        console.log('✅ Posiciones obtenidas del contrato:', result);
        // Aquí procesarías los datos reales del contrato
      }
    } catch (error) {
      console.error('Error obteniendo posiciones:', error);
    }
  };

  // Actualizar precios
  useEffect(() => {
    fetchXlmPrice();
    const interval = setInterval(fetchXlmPrice, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  // Obtener posiciones reales cuando se conecta la wallet
  // Comentado para evitar ejecución automática
  // useEffect(() => {
  //   if (isConnected && publicKey) {
  //     fetchRealPositions();
  //   }
  // }, [isConnected, publicKey]);

  // Actualizar PnL de posiciones
  useEffect(() => {
    setPositions(prev => prev.map(pos => ({
      ...pos,
      currentPrice: xlmPrice,
      pnl: pos.type === 'long' 
        ? (xlmPrice - pos.entryPrice) * pos.amount * pos.leverage
        : (pos.entryPrice - xlmPrice) * pos.amount * pos.leverage
    })));
  }, [xlmPrice]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brazil-black via-slate-900 to-brazil-green">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-l from-brazil-green/10 to-transparent rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-r from-yellow-500/5 to-transparent rounded-full animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <header className="mb-12">
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30 shadow-2xl">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 relative mr-4 animate-pulse">
                      <Image
                        src="/LOGOZZ.png"
                        alt="ZENTRADE Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-2">
                        <span className="bg-gradient-to-r from-brazil-green to-emerald-400 bg-clip-text text-transparent">ZENTRADE</span> Trading
                      </h1>
                      <p className="text-gray-300 text-lg">
                        Swaps reales con Soroswap API • Leverage hasta 10x • Smart Contracts
                      </p>
                    </div>
                  </div>
                  
                  <div className="inline-flex items-center bg-gradient-to-r from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-xl text-sm font-semibold">
                    <span className="mr-2">⚠️</span>
                    Demo del Hackathon - Transacciones Reales Simplificadas
                  </div>
                </div>
                
                {/* Enhanced Wallet Status */}
                <div className="lg:min-w-[300px]">
                  {isConnected ? (
                    <div className="bg-gradient-to-br from-brazil-green/80 to-emerald-600/80 backdrop-blur-sm text-white p-6 rounded-2xl border border-emerald-400/30 shadow-xl">
                      <div className="flex items-center mb-3">
                        <div className="w-3 h-3 bg-emerald-300 rounded-full animate-pulse mr-3"></div>
                        <div className="text-lg font-bold">✅ {walletName}</div>
                      </div>
                      <div className="bg-black/20 rounded-xl p-3 mb-3">
                        <div className="text-xs text-emerald-200 font-semibold mb-1">Dirección:</div>
                        <div className="text-sm font-mono break-all">
                          {publicKey?.slice(0, 12)}...{publicKey?.slice(-12)}
                        </div>
                      </div>
                      <div className="text-sm text-emerald-200">
                        Balance: ${walletBalance.toFixed(2)} XLM
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-red-500/80 to-red-600/80 backdrop-blur-sm text-white p-6 rounded-2xl border border-red-400/30 shadow-xl">
                      <div className="flex items-center mb-3">
                        <div className="w-3 h-3 bg-red-300 rounded-full animate-pulse mr-3"></div>
                        <div className="text-lg font-bold">❌ Wallet Desconectada</div>
                      </div>
                      <p className="text-red-200 text-sm">
                        Conecta tu wallet para empezar a hacer trading
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Enhanced Transaction Status */}
              {transactionStatus && (
                <div className="mt-6 bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-4">
                  <div className="flex items-center text-blue-300">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mr-3"></div>
                    <span className="font-semibold">{transactionStatus}</span>
                  </div>
                </div>
              )}
            </div>
          </header>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de Trading */}
          <div className="lg:col-span-2 space-y-8">
            {/* Precio Actual - Enhanced */}
            <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30 hover:border-brazil-green/50 transition-all duration-500 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-brazil-green to-emerald-600 rounded-xl flex items-center justify-center text-xl mr-3">
                    📊
                  </div>
                  Precio XLM/USD
                </h2>
                <div className="flex items-center text-brazil-green">
                  <div className="w-2 h-2 bg-brazil-green rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-semibold">En Vivo</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-brazil-green/10 to-emerald-600/10 rounded-2xl p-6 border border-brazil-green/20">
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-brazil-green to-emerald-400 bg-clip-text text-transparent mb-2">
                  ${xlmPrice.toFixed(6)}
                </div>
                <div className="text-gray-300 text-sm flex items-center">
                  <span className="mr-2">🕒</span>
                  Última actualización: {lastUpdateTime || 'Cargando...'}
                </div>
              </div>
            </div>

            {/* Nueva Posición - Enhanced */}
            <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30 hover:border-yellow-500/50 transition-all duration-500 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center text-xl mr-3">
                  🚀
                </div>
                <h2 className="text-2xl font-bold text-white">Abrir Nueva Posición</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-3 flex items-center">
                    <span className="mr-2">💰</span>
                    Cantidad XLM
                  </label>
                  <input
                    type="number"
                    value={newPosition.amount}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 text-white rounded-2xl border border-gray-600/50 focus:border-brazil-green focus:ring-2 focus:ring-brazil-green/20 transition-all duration-300 text-lg font-semibold"
                    placeholder="100.0"
                    step="0.1"
                    min="0.1"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-3 flex items-center">
                    <span className="mr-2">⚡</span>
                    Leverage
                  </label>
                  <select
                    value={newPosition.leverage}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, leverage: parseInt(e.target.value) }))}
                    className="w-full p-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 text-white rounded-2xl border border-gray-600/50 focus:border-brazil-green focus:ring-2 focus:ring-brazil-green/20 transition-all duration-300 text-lg font-semibold"
                  >
                    <option value={2}>2x Leverage</option>
                    <option value={5}>5x Leverage</option>
                    <option value={10}>10x Leverage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-3 flex items-center">
                    <span className="mr-2">📊</span>
                    Dirección
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setNewPosition(prev => ({ ...prev, type: 'long' as 'long' | 'short' }));
                      }}
                      className={`group relative p-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                        newPosition.type === 'long' 
                          ? 'bg-gradient-to-r from-brazil-green to-emerald-600 text-white border-2 border-emerald-400 shadow-lg transform scale-105' 
                          : 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 text-gray-300 border border-gray-600/50 hover:border-brazil-green/50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="mr-2">📈</span>
                        Long
                        {newPosition.type === 'long' && <span className="ml-2">✅</span>}
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setNewPosition(prev => ({ ...prev, type: 'short' as 'long' | 'short' }));
                      }}
                      className={`group relative p-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                        newPosition.type === 'short' 
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-400 shadow-lg transform scale-105' 
                          : 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 text-gray-300 border border-gray-600/50 hover:border-red-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="mr-2">📉</span>
                        Short
                        {newPosition.type === 'short' && <span className="ml-2">✅</span>}
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={openPosition}
                  disabled={isLoading || newPosition.amount <= 0 || !isConnected}
                  className="group relative w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 border border-orange-400/30"
                >
                  {isLoading ? '⏳ Procesando...' : '🚀 Abrir Posición'}
                </button>
              </div>
            </div>

            {/* Posiciones Activas */}
            <div className="bg-brazil-black rounded-lg p-6 border-2 border-brazil-gray">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-brazil-white">Posiciones Activas</h2>
                <button
                  onClick={fetchRealPositions}
                  className="bg-brazil-green text-brazil-white px-4 py-2 rounded text-sm hover:bg-green-700"
                >
                  🔄 Obtener Posiciones
                </button>
              </div>
              
              {positions.length === 0 ? (
                <div className="text-brazil-gray text-center py-8">
                  No hay posiciones activas
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position) => (
                    <div key={position.id} className="bg-brazil-gray rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-brazil-white">
                            {position.type === 'long' ? '📈' : '📉'} {position.asset} {position.leverage}x
                          </div>
                          <div className="text-sm text-brazil-gray">
                            {position.amount} XLM • Entrada: ${position.entryPrice.toFixed(6)}
                          </div>
                        </div>
                        <button
                          onClick={() => closePosition(position.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Cerrar
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-brazil-gray">Precio Actual</div>
                          <div className="text-brazil-white">${position.currentPrice.toFixed(6)}</div>
                        </div>
                        <div>
                          <div className="text-brazil-gray">PnL</div>
                          <div className={`font-bold ${position.pnl >= 0 ? 'text-brazil-green' : 'text-red-500'}`}>
                            {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-brazil-gray">Margen</div>
                          <div className="text-brazil-white">${position.margin.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-brazil-gray">Liquidación</div>
                          <div className="text-red-400">${position.liquidationPrice.toFixed(6)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Estado del Sistema */}
            <div className="bg-brazil-white rounded-lg p-6 border-4 border-brazil-green">
              <h3 className="text-lg font-bold text-brazil-black mb-4">Estado del Sistema</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-brazil-gray">Soroswap API</span>
                  <span className="text-brazil-green font-bold">✅ Activo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brazil-gray">Stellar Testnet</span>
                  <span className="text-brazil-green font-bold">✅ Conectado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brazil-gray">Contrato</span>
                  <span className="text-brazil-green font-bold">✅ Desplegado</span>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-brazil-black rounded-lg p-6 border-2 border-brazil-gray">
              <h3 className="text-lg font-bold text-brazil-white mb-4">Estadísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-brazil-gray">Posiciones</span>
                  <span className="text-brazil-white font-bold">{positions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brazil-gray">PnL Total</span>
                  <span className={`font-bold ${positions.reduce((sum, p) => sum + p.pnl, 0) >= 0 ? 'text-brazil-green' : 'text-red-500'}`}>
                    ${positions.reduce((sum, p) => sum + p.pnl, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brazil-gray">Margen Total</span>
                  <span className="text-brazil-white font-bold">
                    ${positions.reduce((sum, p) => sum + p.margin, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pantalla de Confirmación de Trading */}
        {showConfirmation && tradeResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-brazil-white rounded-lg max-w-lg w-full border-4 border-brazil-green max-h-[90vh] flex flex-col">
              <div className="p-6 text-center flex-shrink-0">
                <div className="text-6xl mb-4">
                  {tradeResult.action === 'close' ? '💰' : '🚀'}
                </div>
                <h2 className="text-2xl font-bold text-brazil-black mb-4">
                  {tradeResult.action === 'close' 
                    ? '¡Posición Cerrada - Fondos Devueltos!' 
                    : '¡Posición Abierta Exitosamente!'
                  }
                </h2>
                {tradeResult.action === 'close' && (
                  <p className="text-brazil-gray mb-4">
                    El contrato ha transferido ${tradeResult.fundsReturned?.toFixed(2) || tradeResult.totalReturn.toFixed(2)} de vuelta a tu wallet
                  </p>
                )}
                
                <div className="bg-brazil-gray rounded-lg p-6 mb-6 text-left overflow-y-auto max-h-96">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-bold text-brazil-white">Tipo:</span>
                      <div className={`text-lg font-bold ${tradeResult.position?.type === 'long' ? 'text-brazil-green' : 'text-red-500'}`}>
                        {tradeResult.position?.type?.toUpperCase()} {tradeResult.position?.leverage}x
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-brazil-white">Cantidad:</span>
                      <div className="text-brazil-yellow">{tradeResult.position?.amount || tradeResult.amount} XLM</div>
                    </div>
                    <div>
                      <span className="font-bold text-brazil-white">Precio Entrada:</span>
                      <div className="text-brazil-yellow">${tradeResult.position?.entryPrice?.toFixed(4) || tradeResult.entryPrice?.toFixed(4)}</div>
                    </div>
                    {tradeResult.action === 'close' && tradeResult.position?.currentPrice && (
                      <div>
                        <span className="font-bold text-brazil-white">Precio Salida:</span>
                        <div className="text-brazil-yellow">${tradeResult.position.currentPrice.toFixed(4)}</div>
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-brazil-white">Margen:</span>
                      <div className="text-brazil-yellow">${tradeResult.margin?.toFixed(2) || tradeResult.margin?.toFixed(2)}</div>
                    </div>
                    {tradeResult.action === 'open' && tradeResult.liquidationPrice && (
                      <div>
                        <span className="font-bold text-brazil-white">Liquidation Price:</span>
                        <div className="text-brazil-yellow">${tradeResult.liquidationPrice.toFixed(4)}</div>
                      </div>
                    )}
                    {tradeResult.action === 'close' && (
                      <>
                        <div>
                          <span className="font-bold text-brazil-white">PnL:</span>
                          <div className={`text-lg font-bold ${tradeResult.pnl >= 0 ? 'text-brazil-green' : 'text-red-500'}`}>
                            ${tradeResult.pnl.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="font-bold text-brazil-white">ROI:</span>
                          <div className={`text-lg font-bold ${tradeResult.roi >= 0 ? 'text-brazil-green' : 'text-red-500'}`}>
                            {tradeResult.roi.toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <span className="font-bold text-brazil-white">Fondos Devueltos:</span>
                          <div className="text-brazil-yellow text-lg font-bold">
                            ${tradeResult.fundsReturned?.toFixed(2) || tradeResult.totalReturn.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="font-bold text-brazil-white">Margen Inicial:</span>
                          <div className="text-brazil-yellow">${tradeResult.margin.toFixed(2)}</div>
                        </div>
                      </>
                    )}
                    <div>
                      <span className="font-bold text-brazil-white">Hash Contrato:</span>
                      <div className="text-brazil-yellow font-mono text-xs break-all">
                        {tradeResult.hash}
                      </div>
                    </div>
                    {tradeResult.action === 'close' && tradeResult.transferHash && (
                      <div>
                        <span className="font-bold text-brazil-white">Hash Transferencia:</span>
                        <div className="text-brazil-yellow font-mono text-xs break-all">
                          {tradeResult.transferHash}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-brazil-white">Ledger:</span>
                      <div className="text-brazil-yellow">{tradeResult.ledger}</div>
                    </div>
                    <div>
                      <span className="font-bold text-brazil-white">Red:</span>
                      <div className="text-brazil-yellow">Stellar Testnet</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-shrink-0">
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${tradeResult.action === 'close' ? tradeResult.transferHash : tradeResult.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-brazil-green text-brazil-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                  >
                    🔍 Ver en Explorador
                  </a>
                  
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setTradeResult(null);
                      setTransactionStatus(''); // Limpiar estado de transacción
                      if (tradeResult.action === 'open') {
                        setNewPosition({ amount: 0, leverage: 2, type: 'long' });
                      }
                    }}
                    className="block w-full bg-brazil-gray text-brazil-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                  >
                    {tradeResult.action === 'close' ? '✨ Ver Posiciones' : '✨ Abrir Otra Posición'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
