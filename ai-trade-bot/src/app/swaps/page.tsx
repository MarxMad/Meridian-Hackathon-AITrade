'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { WalletNetwork } from '@creit.tech/stellar-wallets-kit';

interface SwapQuote {
  input_amount_xlm: string;
  input_amount_stroops: number;
  quote: any;
  network: string;
  timestamp: string;
}

export default function SwapsPage() {
  const { isConnected, publicKey, walletName, network, signTransaction } = useWallet();
  const [inputAmount, setInputAmount] = useState<string>('10');
  const [outputAmount, setOutputAmount] = useState<string>('0');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [swapStatus, setSwapStatus] = useState<string>('');
  const [xlmPrice, setXlmPrice] = useState<number>(0);

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
  const getSwapQuote = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/soroswap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });

      const data = await response.json();
      if (data.success) {
        setQuote(data.data);
        // Calcular cantidad de salida aproximada
        if (data.data.quote && data.data.quote.amountOut) {
          const outputAmount = (parseInt(data.data.quote.amountOut) / 1_000_000).toFixed(6);
          setOutputAmount(outputAmount);
        }
      } else {
        console.error('Error obteniendo cotización:', data.message);
      }
    } catch (error) {
      console.error('Error obteniendo cotización:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ejecutar swap
  const executeSwap = async () => {
    if (!isConnected || !publicKey || !quote) {
      alert('Por favor conecta tu wallet y obtén una cotización primero');
      return;
    }

    setIsExecuting(true);
    setSwapStatus('Preparando transacción de swap...');

    try {
      // Crear transacción de swap usando Soroswap
      const swapData = {
        sourceAccount: publicKey,
        quote: quote.quote,
        network: 'testnet'
      };

      setSwapStatus('Creando transacción de swap...');
      const response = await fetch('/api/soroswap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swapData)
      });

      const data = await response.json();
      console.log('📊 Respuesta de execute API:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Error creando transacción');
      }

      // Verificar si requiere crear trustline primero
      if (data.requiresTrustline) {
        setSwapStatus('🔗 Creando trustline para USDC...');
        console.log('🔗 Creando trustline:', data.trustlineData);
        
        // Firmar transacción de trustline
        const trustlineXdr = data.transactionXdr;
        const signedTrustlineXdr = await signTransaction(trustlineXdr);
        
        setSwapStatus('Enviando trustline...');
        // Enviar trustline
        const trustlineSubmitResponse = await fetch('/api/soroswap/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signedTransaction: signedTrustlineXdr })
        });

        const trustlineSubmitData = await trustlineSubmitResponse.json();
        if (!trustlineSubmitData.success || !trustlineSubmitData.data?.successful) {
          throw new Error('Error creando trustline: ' + (trustlineSubmitData.message || trustlineSubmitData.error));
        }

        setSwapStatus('✅ Trustline creada! Ahora ejecutando swap...');
        
        // Esperar un momento y luego intentar el swap nuevamente
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Reintentar el swap
        const retryExecuteResponse = await fetch('/api/soroswap/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceAccount: publicKey,
            quote: quote.quote,
            network: 'testnet'
          })
        });

        const retryExecuteData = await retryExecuteResponse.json();
        if (!retryExecuteData.success) {
          throw new Error('Error en segundo intento de swap: ' + (retryExecuteData.message || retryExecuteData.error));
        }

        // Continuar con el swap normal
        const transactionXdr = retryExecuteData.data?.soroswapResponse?.xdr || retryExecuteData.transactionXdr;
        if (!transactionXdr) {
          throw new Error('No se pudo obtener el XDR de la transacción de swap');
        }

        setSwapStatus('Firmando transacción de swap...');
        const signedTransactionXdr = await signTransaction(transactionXdr);

        setSwapStatus('Enviando transacción de swap...');
        const submitResponse = await fetch('/api/soroswap/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signedTransaction: signedTransactionXdr })
        });

        const submitData = await submitResponse.json();
        if (!submitData.success || !submitData.data?.successful) {
          throw new Error(submitData.message || submitData.error || 'Error ejecutando swap');
        }

        setSwapStatus(`✅ Swap exitoso! Hash: ${submitData.data.hash}`);
        alert(`✅ Swap ejecutado exitosamente! Hash: ${submitData.data.hash}`);

        // Resetear estado
        setInputAmount('10');
        setOutputAmount('0');
        setQuote(null);
        return;
      }

      // El XDR está en data.soroswapResponse.xdr según la respuesta de la API
      const transactionXdr = data.data?.soroswapResponse?.xdr || data.transactionXdr;
      console.log('📊 TransactionXdr extraído:', transactionXdr ? transactionXdr.substring(0, 50) + '...' : 'undefined');
      
      if (!transactionXdr) {
        throw new Error('No se pudo obtener el XDR de la transacción');
      }

      setSwapStatus('Firmando transacción...');
      const signedTransaction = await signTransaction(transactionXdr);

      setSwapStatus('Enviando transacción...');
      const submitResponse = await fetch('/api/soroswap/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransaction })
      });

      const submitData = await submitResponse.json();
      if (submitData.success) {
        setSwapStatus('✅ Swap ejecutado exitosamente');
        alert(`✅ Swap completado! Hash: ${submitData.hash}`);
        // Limpiar formulario
        setInputAmount('10');
        setOutputAmount('0');
        setQuote(null);
      } else {
        throw new Error(submitData.message || 'Error enviando transacción');
      }
    } catch (error) {
      console.error('Error ejecutando swap:', error);
      setSwapStatus('❌ Error ejecutando swap');
      alert(`Error ejecutando swap: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Obtener cotización cuando cambia la cantidad
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputAmount && parseFloat(inputAmount) > 0) {
        getSwapQuote(inputAmount);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [inputAmount]);

  // Obtener precio al cargar
  useEffect(() => {
    fetchXlmPrice();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brazil-black via-brazil-gray to-brazil-green p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-brazil-white rounded-lg p-6 mb-8 border-4 border-brazil-green">
          <h1 className="text-3xl font-bold text-center mb-4">
            <span className="text-brazil-green">🔄</span> Swaps Automáticos
          </h1>
          <p className="text-center text-brazil-gray mb-4">
            Intercambia XLM ↔ USDC automáticamente usando Soroswap
          </p>
                  <div className="bg-brazil-green text-brazil-white p-3 rounded-lg text-center font-bold">
                    ✅ ASSETS REALES - Swap XLM ↔ USDC en Stellar Testnet
                  </div>
                  <div className="bg-brazil-yellow text-brazil-black p-2 rounded-lg text-center text-sm mt-2">
                    <strong>XLM:</strong> CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC<br/>
                    <strong>USDC:</strong> CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
                  </div>
        </div>

        {/* Swap Interface */}
        <div className="bg-brazil-black rounded-lg p-6 border-2 border-brazil-gray">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input */}
            <div>
              <label className="block text-brazil-white mb-2 font-bold">Desde</label>
              <div className="bg-brazil-gray rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-brazil-white font-semibold">XLM</span>
                  <span className="text-brazil-yellow text-sm">
                    ${xlmPrice.toFixed(6)} USD
                  </span>
                </div>
                <input
                  type="number"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="w-full bg-transparent text-brazil-white text-2xl font-bold border-none outline-none"
                  placeholder="0.0"
                  step="0.1"
                  min="0.1"
                />
                <div className="text-brazil-gray text-sm">
                  ≈ ${(parseFloat(inputAmount || '0') * xlmPrice).toFixed(2)} USD
                </div>
              </div>
            </div>

            {/* Output */}
            <div>
              <label className="block text-brazil-white mb-2 font-bold">Hacia</label>
              <div className="bg-brazil-gray rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-brazil-white font-semibold">USDC</span>
                  <span className="text-brazil-yellow text-sm">
                    {isLoading ? '⏳ Calculando...' : 'Est. $1.00 USD'}
                  </span>
                </div>
                <div className="text-brazil-white text-2xl font-bold">
                  {isLoading ? '⏳' : outputAmount}
                </div>
                <div className="text-brazil-gray text-sm">
                  ≈ ${(parseFloat(outputAmount || '0') * 1).toFixed(2)} USD
                </div>
              </div>
            </div>
          </div>

          {/* Quote Info */}
          {quote && (
            <div className="mt-6 p-4 bg-brazil-green rounded-lg">
              <h3 className="text-brazil-white font-bold mb-2">📊 Información de la Cotización</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-brazil-yellow">Entrada:</span>
                  <div className="text-brazil-white">{quote.input_amount_xlm} XLM</div>
                </div>
                <div>
                  <span className="text-brazil-yellow">Salida:</span>
                  <div className="text-brazil-white">{outputAmount} USDC</div>
                </div>
                <div>
                  <span className="text-brazil-yellow">Red:</span>
                  <div className="text-brazil-white">{quote.network}</div>
                </div>
                <div>
                  <span className="text-brazil-yellow">Tipo:</span>
                  <div className="text-brazil-white">EXACT_IN</div>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          {swapStatus && (
            <div className="mt-4 p-3 bg-brazil-gray rounded-lg">
              <div className="text-brazil-white text-center">{swapStatus}</div>
            </div>
          )}

          {/* Execute Button */}
          <div className="mt-6">
            {!isConnected ? (
              <div className="text-center p-4 bg-red-600 rounded-lg">
                <div className="text-white font-bold">❌ Wallet Desconectada</div>
                <div className="text-sm">Conecta tu wallet para ejecutar swaps</div>
              </div>
            ) : (
              <button
                onClick={executeSwap}
                disabled={!quote || isExecuting || isLoading}
                className="w-full bg-brazil-green text-brazil-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                {isExecuting ? '⏳ Ejecutando Swap...' : '🚀 Ejecutar Swap'}
              </button>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-brazil-white rounded-lg p-4 border-2 border-brazil-green">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-bold text-brazil-black mb-2">Rápido</h3>
            <p className="text-brazil-gray text-sm">
              Swaps ejecutados en segundos usando Soroswap
            </p>
          </div>
          
          <div className="bg-brazil-white rounded-lg p-4 border-2 border-brazil-green">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-bold text-brazil-black mb-2">Seguro</h3>
            <p className="text-brazil-gray text-sm">
              Transacciones firmadas por tu wallet
            </p>
          </div>
          
          <div className="bg-brazil-white rounded-lg p-4 border-2 border-brazil-green">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-bold text-brazil-black mb-2">Económico</h3>
            <p className="text-brazil-gray text-sm">
              Tarifas mínimas en la red Stellar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

