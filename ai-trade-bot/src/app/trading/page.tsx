'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { contractService } from '@/services/contractService';
import TransferModal from '@/components/TransferModal';

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
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Obtener precio de XLM
  const fetchXlmPrice = async () => {
    try {
      const response = await fetch('/api/soroswap/price');
      const data = await response.json();
      if (data.success) {
        setXlmPrice(data.data.price_usd);
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
    if (newPosition.amount <= 0) return;
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
        setNewPosition({ amount: 0, leverage: 2, type: 'long' });
        setTransactionStatus('✅ Posición abierta exitosamente');
        
        alert(`✅ Posición ${newPosition.type} abierta con leverage ${newPosition.leverage}x - Hash: ${result.hash}`);
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

    setIsLoading(true);
    setTransactionStatus('Cerrando posición...');
    
    try {
      // 1. Crear transacción para cerrar posición en el contrato
      const transactionXdr = await contractService.closePosition(publicKey, id);

      // 2. Firmar transacción
      setTransactionStatus('Firmando transacción...');
      const signedTransaction = await signTransaction(transactionXdr);

      // 3. Enviar transacción
      setTransactionStatus('Enviando transacción...');
      const result = await contractService.submitTransaction(signedTransaction);

      if (result.successful) {
        setPositions(prev => prev.filter(p => p.id !== id));
        setTransactionStatus('✅ Posición cerrada exitosamente');
        alert(`✅ Posición cerrada - Hash: ${result.hash}`);
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
                ⚠️ TRANSACCIONES REALES - Self-payment para demostración del hackathon
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
              
              {isConnected && (
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="bg-brazil-yellow text-brazil-black px-4 py-2 rounded font-bold hover:bg-yellow-400 transition-colors"
                >
                  💰 Transferir XLM
                </button>
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
                Última actualización: {new Date().toLocaleTimeString()}
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
                      onClick={() => setNewPosition(prev => ({ ...prev, type: 'long' }))}
                      className={`px-4 py-2 rounded ${
                        newPosition.type === 'long' 
                          ? 'bg-brazil-green text-brazil-white' 
                          : 'bg-brazil-gray text-brazil-white'
                      }`}
                    >
                      📈 Long
                    </button>
                    <button
                      onClick={() => setNewPosition(prev => ({ ...prev, type: 'short' }))}
                      className={`px-4 py-2 rounded ${
                        newPosition.type === 'short' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-brazil-gray text-brazil-white'
                      }`}
                    >
                      📉 Short
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
      </div>
      
      {/* Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={() => {
          setShowTransferModal(false);
          // Opcional: refrescar datos
        }}
      />
    </div>
  );
}
