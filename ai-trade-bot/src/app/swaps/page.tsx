'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWallet } from '@/contexts/WalletContext';

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
  const [usdcPrice, setUsdcPrice] = useState<number>(1.0);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [swapResult, setSwapResult] = useState<any>(null);

  // Obtener precio de XLM con manejo robusto de errores
  const fetchXlmPrice = async () => {
    try {
      console.log('📊 Obteniendo precio de XLM...');
      
      // Intentar primero nuestra API mejorada
      const response = await fetch('/api/soroswap/price?asset=XLM&amount=1');
      const data = await response.json();
      
      if (data.success) {
        // Usar CoinGecko como fuente primaria
        if (data.data.coingecko?.successful && data.data.coingecko.price > 0) {
          console.log('✅ Precio XLM desde CoinGecko:', data.data.coingecko.price);
          setXlmPrice(data.data.coingecko.price);
          return;
        }
        
        // Fallback a precio de fallback incluido en la respuesta
        if (data.data.fallback?.xlm) {
          console.log('📦 Usando precio de fallback para XLM:', data.data.fallback.xlm);
          setXlmPrice(data.data.fallback.xlm);
          return;
        }
      }
      
      // Si la API retorna error de rate limiting pero tiene datos cacheados
      if (response.status === 429 && data.data) {
        console.log('⚠️ Rate limit, pero usando datos cacheados');
        if (data.data.coingecko?.price > 0) {
          setXlmPrice(data.data.coingecko.price);
          return;
        }
      }
      
      // Último fallback
      console.log('❌ Todas las fuentes fallaron, usando precio fijo');
      setXlmPrice(0.38);
      
    } catch (error) {
      console.error('❌ Error obteniendo precio XLM:', error);
      setXlmPrice(0.38);
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  // Obtener precio de USDC con manejo robusto de errores
  const fetchUsdcPrice = async () => {
    try {
      console.log('📊 Obteniendo precio de USDC...');
      
      // No calcular si estamos ejecutando un swap
      if (isExecuting) {
        console.log('⏸️ Saltando cálculo de precio USDC - swap en progreso');
        return;
      }
      
      // Intentar primero nuestra API mejorada
      const response = await fetch('/api/soroswap/price?asset=USDC&amount=1');
      const data = await response.json();
      
      if (data.success) {
        // Usar CoinGecko como fuente primaria para USDC
        if (data.data.coingecko?.successful && data.data.coingecko.price > 0) {
          console.log('✅ Precio USDC desde CoinGecko:', data.data.coingecko.price);
          setUsdcPrice(data.data.coingecko.price);
          return;
        }
        
        // Usar precio de Soroswap si está disponible
        if (data.data.soroswap?.successful && data.data.soroswap.price > 0) {
          console.log('✅ Precio USDC desde Soroswap:', data.data.soroswap.price);
          setUsdcPrice(data.data.soroswap.price);
          return;
        }
        
        // Fallback incluido en la respuesta
        if (data.data.fallback?.usdc) {
          console.log('📦 Usando precio de fallback para USDC:', data.data.fallback.usdc);
          setUsdcPrice(data.data.fallback.usdc);
          return;
        }
      }
      
      // Si la API retorna error de rate limiting pero tiene datos cacheados
      if (response.status === 429 && data.data) {
        console.log('⚠️ Rate limit, pero usando datos cacheados para USDC');
        if (data.data.coingecko?.price > 0) {
          setUsdcPrice(data.data.coingecko.price);
          return;
        }
        if (data.data.soroswap?.price > 0) {
          setUsdcPrice(data.data.soroswap.price);
          return;
        }
      }
      
      // Último fallback
      console.log('❌ Todas las fuentes fallaron para USDC, usando precio fijo');
      setUsdcPrice(1.0);
      
    } catch (error) {
      console.error('❌ Error obteniendo precio USDC:', error);
      setUsdcPrice(1.0);
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  // Obtener cotización de swap con manejo robusto de errores
  const getSwapQuote = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    // No obtener cotización si estamos ejecutando un swap
    if (isExecuting) {
      console.log('⏸️ Saltando cotización - swap en progreso');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`📊 Obteniendo cotización para ${amount} XLM...`);
      
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
          console.log(`✅ Cotización: ${amount} XLM = ${outputAmount} USDC`);
        }
      } else if (response.status === 429) {
        console.log('⚠️ Rate limit alcanzado para cotizaciones. Intenta de nuevo en unos segundos.');
        setSwapStatus('⚠️ Demasiadas solicitudes. Intenta de nuevo en unos segundos.');
        setTimeout(() => setSwapStatus(''), 3000);
      } else {
        console.error('❌ Error obteniendo cotización:', data.message);
        setSwapStatus(`❌ Error: ${data.message || 'No se pudo obtener cotización'}`);
        setTimeout(() => setSwapStatus(''), 5000);
      }
    } catch (error) {
      console.error('❌ Error de red obteniendo cotización:', error);
      setSwapStatus('❌ Error de conexión. Verifica tu red e intenta de nuevo.');
      setTimeout(() => setSwapStatus(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Ejecutar swap - mantengo la funcionalidad completa
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
      
      console.log('📊 Datos de swap enviados:', swapData);
      console.log('📊 Quote completo:', quote);

      setSwapStatus('Creando transacción de swap...');
      const response = await fetch('/api/soroswap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swapData)
      });

      const data = await response.json();
      console.log('📊 Respuesta de execute API:', data);
      
      if (!data.success) {
        console.error('❌ Error en execute API:', data);
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
        setSwapStatus(''); // Limpiar el estado de swap
        setIsExecuting(false); // Resetear estado de carga
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
        setSwapStatus(''); // Limpiar el estado de swap
        setIsExecuting(false); // Resetear estado de carga
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

  // Obtener precios al cargar y cada 30 segundos
  useEffect(() => {
    const loadPrices = async () => {
      // No actualizar precios si estamos ejecutando un swap
      if (isExecuting) {
        console.log('⏸️ Saltando actualización de precios - swap en progreso');
        return;
      }
      
      setIsUpdatingPrices(true);
      await Promise.all([fetchXlmPrice(), fetchUsdcPrice()]);
    };
    
    // Cargar inmediatamente
    loadPrices();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadPrices, 30000);
    
    return () => clearInterval(interval);
  }, [isExecuting]);

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
                Smart Swaps
              </h1>
              <p className="text-gray-600 mb-4">
                Intercambia XLM ↔ USDC con las mejores tasas de Soroswap
              </p>
              
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium">Soroswap Integrado</span>
                </div>
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                  <span className="text-blue-700">🌐</span>
                  <span className="text-blue-700 font-medium">Stellar Testnet</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Update Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setIsUpdatingPrices(true);
              fetchXlmPrice();
              fetchUsdcPrice();
            }}
            disabled={isUpdatingPrices}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <span className={isUpdatingPrices ? 'animate-spin' : ''}>🔄</span>
            <span>{isUpdatingPrices ? 'Actualizando Precios...' : 'Actualizar Precios'}</span>
          </button>
        </div>

        {/* Swap Interface */}
        <div className="app-card p-6 mb-6">
          <div className="space-y-6">
            {/* From Token */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3">Desde</label>
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">✨</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">XLM</div>
                      <div className="text-sm text-gray-500">Stellar Lumens</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-600">
                      ${xlmPrice.toFixed(6)}
                    </div>
                    <div className="text-xs text-gray-500">CoinGecko</div>
                  </div>
                </div>
                
                <input
                  type="number"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="w-full bg-transparent text-2xl font-bold border-none outline-none text-gray-900 placeholder-gray-400"
                  placeholder="0.0"
                  step="0.1"
                  min="0.1"
                />
                
                <div className="flex justify-between items-center mt-3 text-sm">
                  <div className="text-gray-600">
                    ≈ ${(parseFloat(inputAmount || '0') * xlmPrice).toFixed(2)} USD
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setInputAmount('10')}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      10
                    </button>
                    <button 
                      onClick={() => setInputAmount('100')}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      100
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Swap Icon */}
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">🔄</span>
              </div>
            </div>

            {/* To Token */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3">Hacia</label>
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">💎</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">USDC</div>
                      <div className="text-sm text-gray-500">USD Coin</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {isLoading ? '...' : `$${usdcPrice.toFixed(6)}`}
                    </div>
                    <div className="text-xs text-gray-500">Soroswap</div>
                  </div>
                </div>
                
                <div className="text-2xl font-bold text-gray-900 mb-3">
                  {isLoading ? '⏳ Calculando...' : outputAmount}
                </div>
                
                <div className="text-sm text-gray-600">
                  ≈ ${(parseFloat(outputAmount || '0') * usdcPrice).toFixed(2)} USD
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Information */}
        {quote && (
          <div className="app-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Detalles de la Cotización
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm text-blue-600 font-medium">Entrada</div>
                <div className="font-semibold text-gray-900">{quote.input_amount_xlm} XLM</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm text-green-600 font-medium">Salida</div>
                <div className="font-semibold text-gray-900">{outputAmount} USDC</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-sm text-purple-600 font-medium">Red</div>
                <div className="font-semibold text-gray-900">{quote.network}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-sm text-yellow-600 font-medium">Tipo</div>
                <div className="font-semibold text-gray-900">EXACT_IN</div>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        {swapStatus && (
          <div className="app-card p-4 mb-6">
            <div className="flex items-center space-x-3 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="font-medium">{swapStatus}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4 mb-6">
          <button
            onClick={() => getSwapQuote(inputAmount)}
            disabled={isLoading || !inputAmount || parseFloat(inputAmount) <= 0}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Obteniendo Cotización...</span>
              </>
            ) : (
              <>
                <span>💫</span>
                <span>Obtener Cotización</span>
              </>
            )}
          </button>
          
          {!isConnected ? (
            <div className="app-card p-4 text-center bg-red-50 border-red-200">
              <div className="text-red-600 font-semibold mb-2">❌ Wallet Desconectada</div>
              <div className="text-red-500 text-sm">Conecta tu wallet para ejecutar swaps reales</div>
            </div>
          ) : (
            <button
              onClick={executeSwap}
              disabled={!quote || isExecuting || isLoading}
              className="w-full btn-success disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isExecuting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Ejecutando Swap...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Ejecutar Swap Real</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="app-card p-4 text-center">
            <div className="text-2xl mb-2">⚡</div>
            <h4 className="font-semibold text-gray-900 mb-2">Rápido</h4>
            <p className="text-sm text-gray-600">
              Swaps ejecutados en segundos usando Soroswap
            </p>
          </div>
          
          <div className="app-card p-4 text-center">
            <div className="text-2xl mb-2">🔒</div>
            <h4 className="font-semibold text-gray-900 mb-2">Seguro</h4>
            <p className="text-sm text-gray-600">
              Transacciones firmadas por tu wallet
            </p>
          </div>
          
          <div className="app-card p-4 text-center">
            <div className="text-2xl mb-2">💰</div>
            <h4 className="font-semibold text-gray-900 mb-2">Económico</h4>
            <p className="text-sm text-gray-600">
              Tarifas mínimas en la red Stellar
            </p>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && swapResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  ¡Swap Exitoso!
                </h2>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Cantidad:</span>
                      <div className="text-blue-600 font-semibold">{swapResult.amount} XLM</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Recibes:</span>
                      <div className="text-green-600 font-semibold">{swapResult.outputAmount} USDC</div>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Hash:</span>
                      <div className="text-gray-600 font-mono text-xs break-all">
                        {swapResult.hash}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${swapResult.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full btn-primary text-center"
                  >
                    🔍 Ver en Explorador
                  </a>
                  
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setSwapResult(null);
                      setTransactionHash('');
                      setSwapStatus('');
                      setInputAmount('10');
                      setOutputAmount('0');
                      setQuote(null);
                    }}
                    className="w-full bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    ✨ Hacer Otro Swap
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