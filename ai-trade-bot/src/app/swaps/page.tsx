'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  const [xlmPrice, setXlmPrice] = useState<number>(0); // Se cargará desde CoinGecko
  const [usdcPrice, setUsdcPrice] = useState<number>(1.0); // Se cargará desde CoinGecko
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
      console.log('📊 Status de respuesta:', response.status);
      console.log('📊 Headers de respuesta:', response.headers);
      
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-l from-emerald-500/20 to-transparent rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-r from-cyan-500/15 to-transparent rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Enhanced Header */}
          <header className="mb-12">
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-emerald-500/20 shadow-2xl">
              <div className="text-center">
                <div className="inline-block mb-6">
                  <div className="w-20 h-20 relative animate-pulse">
                    <Image
                      src="/LOGOZZ.png"
                      alt="ZENTRADE Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                
                <h1 className="text-4xl lg:text-6xl font-extrabold text-white mb-6">
                  <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">ZENTRADE</span> <span className="text-white drop-shadow-lg">Swaps</span>
                </h1>
                
                <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                  Intercambia XLM ↔ USDC automáticamente con la mejor liquidez de Soroswap
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  <div className="bg-gradient-to-r from-emerald-500/30 to-green-600/30 border border-emerald-400/50 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center justify-center text-emerald-300 font-bold text-lg">
                      <span className="mr-2">✅</span>
                      Assets Reales en Stellar Testnet
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-cyan-500/30 to-blue-600/30 border border-cyan-400/50 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center justify-center text-cyan-300 font-bold text-lg">
                      <span className="mr-2">🚀</span>
                      Soroswap Integration
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-400/40 rounded-2xl p-4 max-w-2xl mx-auto shadow-lg">
                  <div className="text-amber-300 font-semibold text-sm">
                    <div className="mb-2">📍 Direcciones de Assets:</div>
                    <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                      <div><span className="text-amber-200">XLM:</span> <span className="text-white">CDLZ...CYSC</span></div>
                      <div><span className="text-amber-200">USDC:</span> <span className="text-white">CBIE...DAMA</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Enhanced Swap Interface */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-emerald-500/20 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Interfaz de Swap</h2>
              <p className="text-gray-300 mb-4">Intercambia tus tokens con las mejores tasas</p>
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={() => {
                    setIsUpdatingPrices(true);
                    fetchXlmPrice();
                    fetchUsdcPrice();
                  }}
                  disabled={isUpdatingPrices}
                  className="bg-brazil-green hover:bg-green-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                >
                  {isUpdatingPrices ? '⏳ Actualizando...' : '🔄 Actualizar Precios'}
                </button>
                <p className="text-xs text-gray-300">
                  XLM: CoinGecko | USDC: Soroswap (Stellar DEX)
                </p>
                <p className="text-xs text-cyan-300">
                  💡 Precios reales para mejor experiencia
                </p>
              </div>
            </div>
            
            <div className="relative">
              {/* Input Token */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3 flex items-center">
                  <span className="mr-2">📤</span>
                  Desde
                </label>
                <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-2xl p-6 border border-gray-600/50 hover:border-brazil-green/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-brazil-green to-emerald-600 rounded-xl flex items-center justify-center text-lg font-bold text-white mr-3">
                        ✨
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">XLM</div>
                        <div className="text-gray-400 text-sm">Stellar Lumens</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-brazil-green font-bold">
                        ${xlmPrice.toFixed(6)}
                      </div>
                      <div className="text-gray-400 text-sm">USD (CoinGecko)</div>
                    </div>
                  </div>
                  
                  <input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    className="w-full bg-transparent text-white text-3xl font-bold border-none outline-none placeholder-gray-500"
                    placeholder="0.0"
                    step="0.1"
                    min="0.1"
                  />
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-600/30">
                    <div className="text-gray-400 text-sm">
                      ≈ ${(parseFloat(inputAmount || '0') * xlmPrice).toFixed(2)} USD
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setInputAmount('10')}
                        className="px-3 py-1 bg-gray-600/50 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                      >
                        10
                      </button>
                      <button 
                        onClick={() => setInputAmount('100')}
                        className="px-3 py-1 bg-gray-600/50 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                      >
                        100
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Swap Icon */}
              <div className="flex justify-center my-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <span className="text-white text-xl">🔄</span>
                </div>
              </div>

              {/* Output Token */}
              <div className="mb-8">
                <label className="block text-white font-semibold mb-3 flex items-center">
                  <span className="mr-2">📥</span>
                  Hacia
                </label>
                <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-2xl p-6 border border-gray-600/50 hover:border-blue-500/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-lg font-bold text-white mr-3">
                        💎
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">USDC</div>
                        <div className="text-gray-400 text-sm">USD Coin</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-400 font-bold">
                        {isLoading ? '⏳ Calculando...' : `$${usdcPrice.toFixed(6)}`}
                      </div>
                      <div className="text-gray-400 text-sm">USD (Soroswap)</div>
                    </div>
                  </div>
                  
                  <div className="text-white text-3xl font-bold mb-4">
                    {isLoading ? '⏳' : outputAmount}
                  </div>
                  
                  <div className="text-gray-400 text-sm">
                    ≈ ${(parseFloat(outputAmount || '0') * usdcPrice).toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Quote Info */}
            {quote && (
              <div className="mt-8 bg-gradient-to-r from-brazil-green/10 to-emerald-600/10 border border-brazil-green/30 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-6 flex items-center text-lg">
                  <span className="mr-3">📊</span>
                  Detalles de la Cotización
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black/20 rounded-xl p-4">
                    <div className="text-brazil-green font-semibold text-sm mb-1">Entrada:</div>
                    <div className="text-white font-bold">{quote.input_amount_xlm} XLM</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4">
                    <div className="text-blue-400 font-semibold text-sm mb-1">Salida:</div>
                    <div className="text-white font-bold">{outputAmount} USDC</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4">
                    <div className="text-purple-400 font-semibold text-sm mb-1">Red:</div>
                    <div className="text-white font-bold">{quote.network}</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4">
                    <div className="text-yellow-400 font-semibold text-sm mb-1">Tipo:</div>
                    <div className="text-white font-bold">EXACT_IN</div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Status */}
            {swapStatus && (
              <div className="mt-6 bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-4">
                <div className="flex items-center justify-center text-blue-300">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mr-3"></div>
                  <span className="font-semibold">{swapStatus}</span>
                </div>
              </div>
            )}

            {/* Enhanced Action Buttons */}
            <div className="mt-8 space-y-4">
              <button
                onClick={() => getSwapQuote(inputAmount)}
                disabled={isLoading || !inputAmount || parseFloat(inputAmount) <= 0}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 border border-blue-400/30"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Obteniendo Cotización...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-3">💫</span>
                    Obtener Cotización
                  </div>
                )}
              </button>
              
              {!isConnected ? (
                <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-6 text-center">
                  <div className="text-red-400 font-bold text-lg mb-2">❌ Wallet Desconectada</div>
                  <div className="text-red-300">Conecta tu wallet para ejecutar swaps reales</div>
                </div>
              ) : (
                <button
                  onClick={executeSwap}
                  disabled={!quote || isExecuting || isLoading}
                  className="w-full bg-gradient-to-r from-brazil-green to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 border border-emerald-400/30"
                >
                  {isExecuting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Ejecutando Swap...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-3">🚀</span>
                      Ejecutar Swap Real
                    </div>
                  )}
                </button>
              )}
            </div>
            </div>
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

        {/* Pantalla de Confirmación */}
        {showConfirmation && swapResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-brazil-white rounded-lg p-8 max-w-md w-full mx-4 border-4 border-brazil-green">
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-brazil-black mb-4">
                  ¡Swap Exitoso!
                </h2>
                
                <div className="bg-brazil-gray rounded-lg p-4 mb-6 text-left">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-bold text-brazil-white">Cantidad:</span>
                      <div className="text-brazil-yellow">{swapResult.amount} XLM</div>
                    </div>
                    <div>
                      <span className="font-bold text-brazil-white">Recibes:</span>
                      <div className="text-brazil-yellow">{swapResult.outputAmount} USDC</div>
                    </div>
                    <div>
                      <span className="font-bold text-brazil-white">Hash:</span>
                      <div className="text-brazil-yellow font-mono text-xs break-all">
                        {swapResult.hash}
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-brazil-white">Ledger:</span>
                      <div className="text-brazil-yellow">{swapResult.ledger}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${swapResult.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-brazil-green text-brazil-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                  >
                    🔍 Ver en Explorador
                  </a>
                  
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setSwapResult(null);
                      setTransactionHash('');
                      setSwapStatus(''); // Limpiar estado de swap
                      setInputAmount('10');
                      setOutputAmount('0');
                      setQuote(null);
                    }}
                    className="block w-full bg-brazil-gray text-brazil-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                  >
                    ✨ Hacer Otro Swap
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      
    </div>
  );
}

