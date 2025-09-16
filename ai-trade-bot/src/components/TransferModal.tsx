'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { contractService } from '@/services/contractService';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferModal({ isOpen, onClose, onSuccess }: TransferModalProps) {
  const { isConnected, publicKey, signTransaction } = useWallet();
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleTransfer = async () => {
    if (!isConnected || !publicKey) {
      alert('Por favor conecta tu wallet primero');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Por favor ingresa una cantidad válida');
      return;
    }

    setIsLoading(true);
    setStatus('Preparando transferencia...');

    try {
      // 1. Crear transacción de pago al contrato
      setStatus('Creando transacción de pago...');
      const transactionXdr = await contractService.createPaymentTransaction(
        publicKey,
        CONTRACT_ID,
        amount,
        'XLM'
      );

      // 2. Firmar transacción
      setStatus('Firmando transacción...');
      const signedTransaction = await signTransaction(transactionXdr);

      // 3. Enviar transacción
      setStatus('Enviando transferencia...');
      const response = await fetch('/api/contract/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceAccount: publicKey,
          amount: amount,
          signedTransaction
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatus('✅ Transferencia exitosa');
        alert(`✅ ${amount} XLM transferidos al contrato exitosamente`);
        onSuccess();
        onClose();
      } else {
        throw new Error(result.message || 'Error en transferencia');
      }
    } catch (error) {
      console.error('Error en transferencia:', error);
      setStatus('❌ Error en transferencia');
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-brazil-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-brazil-black mb-4">
          💰 Transferir XLM al Contrato
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-brazil-gray mb-2">Cantidad XLM</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 border border-brazil-gray rounded focus:border-brazil-green focus:outline-none"
              placeholder="10.0"
              step="0.1"
              min="0.1"
            />
          </div>

          <div className="bg-brazil-gray text-brazil-white p-3 rounded text-sm">
            <div className="font-bold mb-1">Contrato de Destino:</div>
            <div className="font-mono text-xs break-all">
              {CONTRACT_ID}
            </div>
          </div>

          {status && (
            <div className="p-3 bg-brazil-gray rounded text-brazil-white text-sm">
              {status}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleTransfer}
              disabled={isLoading || !amount}
              className="flex-1 bg-brazil-green text-brazil-white py-2 px-4 rounded font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Procesando...' : '🚀 Transferir'}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-brazil-gray text-brazil-white py-2 px-4 rounded font-bold hover:bg-gray-600 disabled:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
