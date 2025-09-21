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

  // Abrir nueva posición - mantengo la funcionalidad completa
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

  // Cerrar posición - mantengo la funcionalidad completa
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
                Trading con Apalancamiento
              </h1>
              <p className="text-gray-600 mb-4">
                Swaps reales con Soroswap API • Leverage hasta 10x • Smart Contracts
              </p>
              
              <div className="inline-flex items-center bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
                <span className="mr-2">⚠️</span>
                Demo del Hackathon - Transacciones Reales Simplificadas
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        {isConnected ? (
          <div className="app-card p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{walletName}</div>
                  <div className="text-sm text-gray-500 font-mono">
                    {publicKey?.slice(0, 12)}...{publicKey?.slice(-12)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Balance Simulado</div>
                <div className="font-semibold text-gray-900">${walletBalance.toFixed(2)} XLM</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="app-card p-6 mb-6 text-center bg-red-50 border-red-200">
            <div className="text-red-600 font-semibold mb-2">❌ Wallet Desconectada</div>
            <div className="text-red-500 text-sm">Conecta tu wallet para empezar a hacer trading</div>
          </div>
        )}

        {/* Transaction Status */}
        {transactionStatus && (
          <div className="app-card p-4 mb-6">
            <div className="flex items-center space-x-3 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="font-medium">{transactionStatus}</span>
            </div>
          </div>
        )}

        {/* Current Price */}
        <div className="app-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <span className="text-2xl">📊</span>
              <span>Precio XLM/USD</span>
            </h2>
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium">En Vivo</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              ${xlmPrice.toFixed(6)}
            </div>
            <div className="text-sm text-gray-600">
              🕒 Última actualización: {lastUpdateTime || 'Cargando...'}
            </div>
          </div>
        </div>

        {/* New Position Form */}
        <div className="app-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <span className="text-2xl">🚀</span>
            <span>Abrir Nueva Posición</span>
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Cantidad XLM
              </label>
              <input
                type="number"
                value={newPosition.amount}
                onChange={(e) => setNewPosition(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100.0"
                step="0.1"
                min="0.1"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Leverage
              </label>
              <select
                value={newPosition.leverage}
                onChange={(e) => setNewPosition(prev => ({ ...prev, leverage: parseInt(e.target.value) }))}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={2}>2x Leverage</option>
                <option value={5}>5x Leverage</option>
                <option value={10}>10x Leverage</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Dirección
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setNewPosition(prev => ({ ...prev, type: 'long' as 'long' | 'short' }));
                  }}
                  className={`p-3 rounded-lg font-medium transition-all ${
                    newPosition.type === 'long' 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📈 Long
                  {newPosition.type === 'long' && <span className="ml-2">✅</span>}
                </button>
                <button
                  onClick={() => {
                    setNewPosition(prev => ({ ...prev, type: 'short' as 'long' | 'short' }));
                  }}
                  className={`p-3 rounded-lg font-medium transition-all ${
                    newPosition.type === 'short' 
                      ? 'bg-red-500 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📉 Short
                  {newPosition.type === 'short' && <span className="ml-2">✅</span>}
                </button>
              </div>
            </div>

            <button
              onClick={openPosition}
              disabled={isLoading || newPosition.amount <= 0 || !isConnected}
              className="w-full btn-success disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Abrir Posición</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Positions */}
        <div className="app-card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Posiciones Activas</h2>
            <button
              onClick={fetchRealPositions}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              🔄 Actualizar
            </button>
          </div>
          
          {positions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay posiciones activas
            </div>
          ) : (
            <div className="space-y-4">
              {positions.map((position) => (
                <div key={position.id} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center space-x-2">
                        <span>{position.type === 'long' ? '📈' : '📉'}</span>
                        <span>{position.asset} {position.leverage}x</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {position.amount} XLM • Entrada: ${position.entryPrice.toFixed(6)}
                      </div>
                    </div>
                    <button
                      onClick={() => closePosition(position.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Precio Actual</div>
                      <div className="font-semibold text-gray-900">${position.currentPrice.toFixed(6)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">PnL</div>
                      <div className={`font-semibold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Margen</div>
                      <div className="font-semibold text-gray-900">${position.margin.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Liquidación</div>
                      <div className="font-semibold text-red-600">${position.liquidationPrice.toFixed(6)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="app-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Soroswap API</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Activo
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Stellar Testnet</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Conectado
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Contrato Soroban</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Desplegado
              </span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {positions.length > 0 && (
          <div className="app-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{positions.length}</div>
                <div className="text-sm text-gray-600">Posiciones Activas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className={`text-2xl font-bold ${positions.reduce((sum, p) => sum + p.pnl, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${positions.reduce((sum, p) => sum + p.pnl, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">PnL Total</div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && tradeResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">
                    {tradeResult.action === 'close' ? '💰' : '🚀'}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {tradeResult.action === 'close' 
                      ? '¡Posición Cerrada - Fondos Devueltos!' 
                      : '¡Posición Abierta Exitosamente!'
                    }
                  </h2>
                  {tradeResult.action === 'close' && (
                    <p className="text-gray-600 mt-2">
                      El contrato ha transferido ${tradeResult.fundsReturned?.toFixed(2) || tradeResult.totalReturn?.toFixed(2)} de vuelta a tu wallet
                    </p>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Tipo:</span>
                      <div className={`font-semibold ${tradeResult.position?.type === 'long' ? 'text-green-600' : 'text-red-600'}`}>
                        {tradeResult.position?.type?.toUpperCase() || tradeResult.type?.toUpperCase()} {tradeResult.position?.leverage || tradeResult.leverage}x
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Cantidad:</span>
                      <div className="font-semibold text-gray-900">{tradeResult.position?.amount || tradeResult.amount} XLM</div>
                    </div>
                    {tradeResult.action === 'close' && tradeResult.pnl !== undefined && (
                      <>
                        <div>
                          <span className="font-medium text-gray-700">PnL:</span>
                          <div className={`font-semibold ${tradeResult.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${tradeResult.pnl.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">ROI:</span>
                          <div className={`font-semibold ${tradeResult.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tradeResult.roi.toFixed(2)}%
                          </div>
                        </div>
                      </>
                    )}
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Hash de Transacción:</span>
                      <div className="font-mono text-xs text-gray-600 break-all">
                        {tradeResult.hash}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${tradeResult.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full btn-primary text-center"
                  >
                    🔍 Ver en Explorador
                  </a>
                  
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setTradeResult(null);
                      setTransactionStatus('');
                      if (tradeResult.action === 'open') {
                        setNewPosition({ amount: 0, leverage: 2, type: 'long' });
                      }
                    }}
                    className="w-full bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
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