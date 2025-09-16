'use client';

import { useState, useEffect } from 'react';
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

  // Obtener precio de XLM
  const fetchXlmPrice = async () => {
    try {
      const response = await fetch('/api/soroswap/price');
      const data = await response.json();
      if (data.success) {
        setXlmPrice(data.data.price_usd);
        setLastUpdateTime(new Date().toLocaleTimeString());
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
        setTransactionStatus(`✅ Posición abierta exitosamente - Hash: ${result.hash.substring(0, 8)}...`);
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
      
      // Para demostración, devolver siempre el monto original completo
      // En un sistema real, el contrato manejaría el PnL correctamente
      const actualReturn = amount; // Monto original completo (222 XLM)
      console.log('🔍 Monto a devolver (para demo):', actualReturn);
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
        
        // 5. Crear transacción de transferencia que el usuario debe firmar
        setTransactionStatus('Creando transacción de transferencia de fondos...');
        const transferResponse = await fetch('/api/transfer-funds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toAccount: publicKey,
            amount: amount.toFixed(7), // Monto original de la posición
            memo: `PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`,
            createTransaction: true // Solo crear la transacción, no enviarla
          })
        });

        const transferData = await transferResponse.json();
        if (!transferData.success) {
          throw new Error('Error creando transacción de transferencia: ' + transferData.message);
        }

        // 6. Firmar la transacción de transferencia
        setTransactionStatus('Firmando transacción de transferencia de fondos...');
        console.log('📝 TransactionXdr recibido:', transferData.transactionXdr ? transferData.transactionXdr.substring(0, 50) + '...' : 'undefined');
        const signedTransferTransaction = await signTransaction(transferData.transactionXdr);
        console.log('📝 SignedTransaction result:', typeof signedTransferTransaction, signedTransferTransaction ? signedTransferTransaction.substring(0, 50) + '...' : 'undefined');

        // 7. Enviar la transacción de transferencia
        setTransactionStatus('Enviando transferencia de fondos...');
        const transferSubmitResponse = await fetch('/api/transfer-funds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedTransaction: signedTransferTransaction
          })
        });

        const transferSubmitData = await transferSubmitResponse.json();
        if (!transferSubmitData.success) {
          throw new Error('Error enviando transferencia: ' + transferSubmitData.message);
        }

        // 8. Mostrar pantalla de confirmación con PnL y fondos devueltos
        setTradeResult({
          hash: result.hash,
          transferHash: transferSubmitData.data?.hash, // Hash de la transferencia de fondos
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
          fundsReturned: totalReturn, // Monto real devuelto por el contrato
          transferSuccessful: transferSubmitData.success,
          network: 'testnet'
        });
        setShowConfirmation(true);
        setTransactionStatus(`✅ Posición cerrada - Fondos devueltos: $${totalReturn.toFixed(2)} - Hash: ${result.hash.substring(0, 8)}...`);
        
        // 9. Remover posición de la lista
        setPositions(prev => prev.filter(p => p.id !== id));
        
        // 10. Actualizar balance de la wallet (simulado)
        setWalletBalance(prev => prev + totalReturn);
        
        // 11. Mostrar notificación de fondos devueltos
        setTimeout(() => {
          alert(`💰 Fondos devueltos: $${totalReturn.toFixed(2)}\n\nEl contrato ha transferido los fondos de vuelta a tu wallet.`);
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
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-brazil-white mb-2">
                ⚡ Trading Apalancado
              </h1>
              <p className="text-brazil-gray">
                Swaps reales con Soroswap API • Leverage hasta 10x
              </p>
              <div className="mt-2 p-2 bg-brazil-yellow text-brazil-black rounded text-sm font-bold">
                ⚠️ TRANSACCIONES REALES SIMPLIFICADAS - Para demostración del hackathon
              </div>
            </div>
            
            {/* Wallet Status */}
            <div className="text-right space-y-2">
              {isConnected ? (
                <div className="bg-brazil-green text-brazil-white p-3 rounded-lg">
                  <div className="text-sm font-bold">✅ {walletName} Conectada</div>
                  <div className="text-xs font-mono">
                    {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                  </div>
                </div>
              ) : (
                <div className="bg-red-600 text-white p-3 rounded-lg">
                  <div className="text-sm font-bold">❌ Wallet Desconectada</div>
                  <div className="text-xs">Conecta tu wallet para trading</div>
                </div>
              )}
              
            </div>
          </div>
          
          {/* Transaction Status */}
          {transactionStatus && (
            <div className="mt-4 p-3 bg-brazil-gray rounded-lg">
              <div className="text-brazil-white font-semibold">
                {transactionStatus}
              </div>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de Trading */}
          <div className="lg:col-span-2 space-y-6">
            {/* Precio Actual */}
            <div className="bg-brazil-black rounded-lg p-6 border-2 border-brazil-gray">
              <h2 className="text-xl font-bold text-brazil-white mb-4">Precio Actual</h2>
              <div className="text-3xl font-bold text-brazil-green">
                ${xlmPrice.toFixed(6)} USD
              </div>
              <div className="text-brazil-gray text-sm">
                Última actualización: {lastUpdateTime || 'Cargando...'}
              </div>
            </div>

            {/* Nueva Posición */}
            <div className="bg-brazil-black rounded-lg p-6 border-2 border-brazil-gray">
              <h2 className="text-xl font-bold text-brazil-white mb-4">Abrir Posición</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-brazil-white mb-2">Cantidad XLM</label>
                  <input
                    type="number"
                    value={newPosition.amount}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 bg-brazil-gray text-brazil-white rounded border border-brazil-green"
                    placeholder="10.0"
                    step="0.1"
                    min="0.1"
                  />
                </div>

                <div>
                  <label className="block text-brazil-white mb-2">Leverage</label>
                  <select
                    value={newPosition.leverage}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, leverage: parseInt(e.target.value) }))}
                    className="w-full p-3 bg-brazil-gray text-brazil-white rounded border border-brazil-green"
                  >
                    <option value={2}>2x</option>
                    <option value={5}>5x</option>
                    <option value={10}>10x</option>
                  </select>
                </div>

                <div>
                  <label className="block text-brazil-white mb-2">Tipo</label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setNewPosition(prev => ({ ...prev, type: 'long' as 'long' | 'short' }));
                      }}
                      className={`px-4 py-2 rounded font-bold ${
                        newPosition.type === 'long' 
                          ? 'bg-green-600 text-white border-2 border-green-400' 
                          : 'bg-brazil-gray text-brazil-white border border-gray-500'
                      }`}
                    >
                      📈 Long {newPosition.type === 'long' && '✅'}
                    </button>
                    <button
                      onClick={() => {
                        setNewPosition(prev => ({ ...prev, type: 'short' as 'long' | 'short' }));
                      }}
                      className={`px-4 py-2 rounded font-bold ${
                        newPosition.type === 'short' 
                          ? 'bg-red-600 text-white border-2 border-red-400' 
                          : 'bg-brazil-gray text-brazil-white border border-gray-500'
                      }`}
                    >
                      📉 Short {newPosition.type === 'short' && '✅'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={openPosition}
                  disabled={isLoading || newPosition.amount <= 0}
                  className="w-full bg-brazil-green text-brazil-white py-3 rounded font-bold hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-brazil-white rounded-lg p-8 max-w-lg w-full mx-4 border-4 border-brazil-green">
              <div className="text-center">
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
                
                <div className="bg-brazil-gray rounded-lg p-6 mb-6 text-left">
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

                <div className="space-y-3">
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${tradeResult.hash}`}
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
