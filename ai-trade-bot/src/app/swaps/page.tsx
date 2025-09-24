'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import BottomNavigation from '@/components/MobileMenu';
import Navigation from '@/components/Navigation';
import { 
  ArrowUpDown, 
  Wallet, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Zap,
  TrendingUp,
  Info
} from 'lucide-react';

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
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [swapResult, setSwapResult] = useState<any>(null);

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
          // USDC en Stellar tiene 7 decimales como XLM (1 USDC = 10 millones de stroops)
          const outputAmount = (parseInt(data.data.quote.amountOut) / 10_000_000).toFixed(7);
          setOutputAmount(outputAmount);
          console.log(`📊 Conversión output: ${data.data.quote.amountOut} stroops = ${outputAmount} USDC`);
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

        // Mostrar hash de trustline
        const trustlineHash = trustlineSubmitData.data?.hash;
        if (trustlineHash) {
          setTransactionHash(trustlineHash);
          setSwapStatus(`✅ Trustline creada! Hash: ${trustlineHash.substring(0, 8)}...`);
        } else {
          setSwapStatus('✅ Trustline creada! Ahora ejecutando swap...');
        }
        
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

        // Mostrar pantalla de confirmación
        setSwapResult({
          hash: submitData.data.hash,
          ledger: submitData.data.ledger,
          amount: inputAmount,
          outputAmount: outputAmount,
          network: 'testnet'
        });
        setTransactionHash(submitData.data.hash);
        setShowConfirmation(true);
        setSwapStatus(`✅ Swap exitoso! Hash: ${submitData.data.hash.substring(0, 8)}...`);
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
        // Mostrar pantalla de confirmación
        setSwapResult({
          hash: submitData.data?.hash || submitData.hash,
          ledger: submitData.data?.ledger || 'N/A',
          amount: inputAmount,
          outputAmount: outputAmount,
          network: 'testnet'
        });
        setTransactionHash(submitData.data?.hash || submitData.hash);
        setShowConfirmation(true);
        setSwapStatus(`✅ Swap exitoso! Hash: ${(submitData.data?.hash || submitData.hash).substring(0, 8)}...`);
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

  const handleSwapTokens = () => {
    // Intercambiar los valores
    const tempAmount = inputAmount;
    setInputAmount(outputAmount);
    setOutputAmount(tempAmount);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Top Navigation Bar */}
      <Navigation />

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-4 sm:py-8">
        <motion.div
          className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ArrowUpDown className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Swap Tokens</h1>
            <p className="text-gray-400">Intercambia XLM por USDC en Stellar</p>
          </div>

          {/* Swap Interface */}
          <div className="space-y-4">
            {/* Input Token */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Desde</span>
                <span className="text-sm text-gray-400">Balance: --</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">XLM</div>
                    <div className="text-xs text-gray-400">Stellar Lumens</div>
                  </div>
                </div>
                <div className="text-right">
                  <input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    className="bg-transparent text-white text-xl font-bold text-right border-none outline-none w-32"
                    placeholder="0.0"
                    step="0.1"
                    min="0.1"
                  />
                  <div className="text-xs text-gray-400">
                    ≈ ${(parseFloat(inputAmount || '0') * xlmPrice).toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSwapTokens}
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center border border-gray-600 transition-colors"
              >
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Output Token */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Hacia</span>
                <span className="text-sm text-gray-400">Balance: --</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">USDC</div>
                    <div className="text-xs text-gray-400">USD Coin</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-xl font-bold">
                    {isLoading ? '⏳' : outputAmount}
                  </div>
                  <div className="text-xs text-gray-400">
                    ≈ ${(parseFloat(outputAmount || '0') * 1).toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Info */}
          {quote && (
            <div className="mt-6 bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Detalles de la Cotización
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Entrada:</div>
                  <div className="text-white font-semibold">{quote.input_amount_xlm} XLM</div>
                </div>
                <div>
                  <div className="text-gray-400">Salida:</div>
                  <div className="text-white font-semibold">{outputAmount} USDC</div>
                </div>
                <div>
                  <div className="text-gray-400">Red:</div>
                  <div className="text-white font-semibold">{quote.network}</div>
                </div>
                <div>
                  <div className="text-gray-400">Tipo:</div>
                  <div className="text-white font-semibold">EXACT_IN</div>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          {swapStatus && (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center text-blue-300">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-3"></div>
                <span className="text-sm font-medium">{swapStatus}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={() => getSwapQuote(inputAmount)}
              disabled={isLoading || !inputAmount || parseFloat(inputAmount) <= 0}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Obteniendo Cotización...
                </div>
              ) : (
                'Obtener Cotización'
              )}
            </button>
            
            {!isConnected ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <div className="text-red-400 font-semibold mb-1">❌ Wallet Desconectada</div>
                <div className="text-red-300 text-sm">Conecta tu wallet para ejecutar swaps</div>
              </div>
            ) : (
              <button
                onClick={executeSwap}
                disabled={!quote || isExecuting || isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExecuting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Ejecutando Swap...
                  </div>
                ) : (
                  'Ejecutar Swap'
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Confirmation Modal */}
      {showConfirmation && swapResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">¡Swap Exitoso!</h2>
              
              <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Cantidad:</span>
                    <div className="text-white font-semibold">{swapResult.amount} XLM</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Recibes:</span>
                    <div className="text-white font-semibold">{swapResult.outputAmount} USDC</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Hash:</span>
                    <div className="text-white font-mono text-xs break-all">
                      {swapResult.hash}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Ledger:</span>
                    <div className="text-white font-semibold">{swapResult.ledger}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Red:</span>
                    <div className="text-white font-semibold">{swapResult.network}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${swapResult.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  <ExternalLink className="w-4 h-4 inline mr-2" />
                  Ver en Explorador
                </a>
                
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setSwapResult(null);
                    setTransactionHash('');
                    setInputAmount('10');
                    setOutputAmount('0');
                    setQuote(null);
                  }}
                  className="block w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  Hacer Otro Swap
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}