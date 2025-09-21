'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import BottomNavigation from '@/components/MobileMenu';
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
  const [usdcPrice, setUsdcPrice] = useState<number>(1.0);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [swapResult, setSwapResult] = useState<any>(null);

  // Obtener precio de XLM
  const fetchXlmPrice = async () => {
    try {
      console.log('📊 Obteniendo precio de XLM...');
      
      const response = await fetch('/api/soroswap/price?asset=XLM&amount=1');
      const data = await response.json();
      
      if (data.success) {
        if (data.data.coingecko?.successful && data.data.coingecko.price > 0) {
          console.log('✅ Precio XLM desde CoinGecko:', data.data.coingecko.price);
          setXlmPrice(data.data.coingecko.price);
          return;
        }
        
        if (data.data.fallback?.xlm) {
          console.log('📦 Usando precio de fallback para XLM:', data.data.fallback.xlm);
          setXlmPrice(data.data.fallback.xlm);
          return;
        }
      }
      
      // Fallback final a precio hardcodeado
      console.log('⚠️ Usando precio hardcodeado para XLM: $0.12');
      setXlmPrice(0.12);
      
    } catch (error) {
      console.error('❌ Error obteniendo precio XLM:', error);
      setXlmPrice(0.12); // Fallback
    }
  };

  // Obtener precio de USDC
  const fetchUsdcPrice = async () => {
    try {
      console.log('📊 Obteniendo precio de USDC...');
      
      const response = await fetch('/api/soroswap/usdc-price');
      const data = await response.json();
      
      if (data.success && data.price > 0) {
        console.log('✅ Precio USDC:', data.price);
        setUsdcPrice(data.price);
      } else {
        console.log('📦 Usando precio por defecto para USDC: $1.00');
        setUsdcPrice(1.0);
      }
    } catch (error) {
      console.error('❌ Error obteniendo precio USDC:', error);
      setUsdcPrice(1.0);
    }
  };

  // Cargar precios al montar el componente
  useEffect(() => {
    fetchXlmPrice();
    fetchUsdcPrice();
  }, []);

  // Obtener cotización de swap
  const getQuote = async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setOutputAmount('0');
      setQuote(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/soroswap/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: inputAmount,
          assetIn: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC', // XLM
          assetOut: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA'  // USDC
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setQuote(data.data);
        // Calcular output amount basado en la cotización
        const outputAmount = parseFloat(inputAmount) * xlmPrice / usdcPrice;
        setOutputAmount(outputAmount.toFixed(6));
      } else {
        console.error('Error obteniendo cotización:', data.message);
        setOutputAmount('0');
        setQuote(null);
      }
    } catch (error) {
      console.error('Error obteniendo cotización:', error);
      setOutputAmount('0');
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener cotización cuando cambia el input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getQuote();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputAmount, xlmPrice, usdcPrice]);

  // Ejecutar swap
  const executeSwap = async () => {
    if (!isConnected || !publicKey || !quote) return;

    setIsExecuting(true);
    setSwapStatus('Preparando transacción...');

    try {
      // 1. Crear transacción de swap
      setSwapStatus('Creando transacción...');
      const executeResponse = await fetch('/api/soroswap/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
            sourceAccount: publicKey,
            quote: quote.quote,
            network: 'testnet'
        }),
      });

      const executeData = await executeResponse.json();
      
      if (!executeData.success) {
        throw new Error(executeData.message || 'Error creando transacción');
      }

      setSwapStatus('Firmando transacción...');
      
      // 2. Firmar transacción
      const signedTransaction = await signTransaction(executeData.transactionXdr);
      
      if (!signedTransaction) {
        throw new Error('Error firmando transacción');
      }

      setSwapStatus('Enviando transacción...');
      
      // 3. Enviar transacción
      const submitResponse = await fetch('/api/soroswap/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: signedTransaction,
          network: 'testnet'
        }),
      });

      const submitData = await submitResponse.json();
      
      if (submitData.success) {
        setTransactionHash(submitData.transactionHash);
        setSwapStatus('¡Swap completado exitosamente!');
        setSwapResult(submitData);
        setShowConfirmation(true);
      } else {
        throw new Error(submitData.message || 'Error enviando transacción');
      }

    } catch (error) {
      console.error('Error ejecutando swap:', error);
      setSwapStatus(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSwapTokens = () => {
    // Intercambiar los valores
    const tempAmount = inputAmount;
    setInputAmount(outputAmount);
    setOutputAmount(tempAmount);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Zap className="w-3 h-3 sm:w-5 sm:h-5 text-black" />
      </div>
              <h1 className="text-xl sm:text-2xl font-bold">Swap</h1>
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

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-4 sm:py-8">
        <motion.div
          className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* From Section */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-400">From</span>
              <span className="text-xs sm:text-sm text-gray-400">
                Balance: {isConnected ? '0.00' : '--'} XLM
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-800 rounded-xl p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">X</span>
                </div>
                <span className="font-medium text-sm sm:text-base">XLM</span>
              </div>
              <div className="flex-1 text-right">
                  <input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    placeholder="0.0"
                  className="w-full bg-transparent text-right text-lg sm:text-2xl font-semibold outline-none"
                />
                <div className="text-xs sm:text-sm text-gray-400">
                  ≈ ${(parseFloat(inputAmount || '0') * xlmPrice).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              
          {/* Swap Button */}
          <div className="flex justify-center my-3 sm:my-4">
            <motion.button
              onClick={handleSwapTokens}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>

          {/* To Section */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-400">To</span>
              <span className="text-xs sm:text-sm text-gray-400">
                Balance: {isConnected ? '0.00' : '--'} USDC
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-800 rounded-xl p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">U</span>
                </div>
                <span className="font-medium text-sm sm:text-base">USDC</span>
              </div>
              <div className="flex-1 text-right">
                <div className="text-lg sm:text-2xl font-semibold">
                  {isLoading ? (
                    <div className="flex items-center justify-end space-x-2">
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      <span className="text-sm sm:text-base">Loading...</span>
                    </div>
                  ) : (
                    outputAmount
                  )}
                      </div>
                <div className="text-xs sm:text-sm text-gray-400">
                  ≈ ${(parseFloat(outputAmount || '0') * usdcPrice).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

          {/* Price Info */}
            {quote && (
            <motion.div
              className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Rate</span>
                <span className="text-white">
                  1 XLM = {(xlmPrice / usdcPrice).toFixed(6)} USDC
                </span>
                  </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-400">Price Impact</span>
                <span className="text-green-400">0.01%</span>
              </div>
            </motion.div>
          )}

          {/* Swap Button */}
          <motion.button
            onClick={executeSwap}
            disabled={!isConnected || !quote || isExecuting || parseFloat(inputAmount) <= 0}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              isConnected && quote && parseFloat(inputAmount) > 0 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                : 'bg-gray-600 text-gray-400'
            }`}
            whileHover={{ scale: isConnected && quote && parseFloat(inputAmount) > 0 ? 1.02 : 1 }}
            whileTap={{ scale: isConnected && quote && parseFloat(inputAmount) > 0 ? 0.98 : 1 }}
          >
            {!isConnected ? (
              'Connect Wallet'
            ) : isExecuting ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{swapStatus}</span>
              </div>
            ) : !quote ? (
              'Enter Amount'
            ) : (
              'Swap'
            )}
          </motion.button>

          {/* Status Messages */}
          {swapStatus && (
            <motion.div
              className="mt-4 p-3 rounded-lg flex items-center space-x-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                backgroundColor: swapStatus.includes('Error') ? '#1F2937' : '#065F46',
                borderColor: swapStatus.includes('Error') ? '#EF4444' : '#10B981'
              }}
            >
              {swapStatus.includes('Error') ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
              <span className="text-sm">{swapStatus}</span>
            </motion.div>
          )}

          {/* Transaction Link */}
          {transactionHash && (
            <motion.div
              className="mt-4 p-3 bg-gray-800 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Transaction</span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 text-sm"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          className="mt-6 p-4 bg-gray-900/50 rounded-xl border border-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-purple-400 mt-0.5" />
            <div className="text-sm text-gray-400">
              <p className="mb-2">
                This swap uses Soroswap protocol for real XLM ↔ USDC exchanges on Stellar testnet.
              </p>
              <p>
                All transactions are verified on the blockchain and can be viewed in the Stellar Explorer.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}