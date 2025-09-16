'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  ISupportedWallet
} from '@creit.tech/stellar-wallets-kit';

interface WalletContextType {
  isConnected: boolean;
  publicKey: string | null;
  walletName: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (transaction: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kit, setKit] = useState<StellarWalletsKit | null>(null);

  // Inicializar el kit al cargar
  useEffect(() => {
    const initializeKit = () => {
      try {
        const stellarKit = new StellarWalletsKit({
          network: WalletNetwork.TESTNET,
          modules: allowAllModules(),
        });
        setKit(stellarKit);
        console.log('✅ Stellar Wallets Kit inicializado');
      } catch (err) {
        console.error('❌ Error inicializando Stellar Wallets Kit:', err);
        setError('Error inicializando el kit de wallets');
      }
    };

    initializeKit();
  }, []);

  // Verificar conexión al cargar
  useEffect(() => {
    if (kit) {
      checkConnection();
    }
  }, [kit]);

  const checkConnection = async () => {
    if (!kit) return;
    
    try {
      const { address } = await kit.getAddress();
      if (address) {
        setPublicKey(address);
        setIsConnected(true);
        setWalletName(kit.getWalletName() || 'Unknown');
      }
    } catch (err) {
      // No hay wallet conectada, esto es normal
      console.log('No hay wallet conectada');
    }
  };

  const connect = async () => {
    if (!kit) {
      setError('Kit de wallets no inicializado');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await kit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          console.log('🔗 Wallet seleccionada:', option.name);
          
          // Configurar la wallet seleccionada
          kit.setWallet(option.id);
          
          // Obtener la dirección pública
          const { address } = await kit.getAddress();
          
          if (address) {
            setPublicKey(address);
            setWalletName(option.name);
            setIsConnected(true);
            setError(null);
            
            console.log('✅ Wallet conectada:', option.name, address);
          } else {
            throw new Error('No se pudo obtener la dirección de la wallet');
          }
        },
        onClosed: (err: Error) => {
          if (err) {
            console.error('❌ Error cerrando modal:', err);
            setError(err.message);
          }
        },
        modalTitle: 'Conectar Wallet - AI Trade Bot',
        notAvailableText: 'Esta wallet no está disponible'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error conectando wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setPublicKey(null);
    setWalletName(null);
    setIsConnected(false);
    setError(null);
    console.log('🔌 Wallet desconectada');
  };

  const signTransaction = async (transaction: string): Promise<string> => {
    if (!kit || !isConnected) {
      throw new Error('Wallet no conectada');
    }
    
    try {
      const { signedTxXdr } = await kit.signTransaction(transaction, {
        address: publicKey!,
        networkPassphrase: WalletNetwork.TESTNET
      });
      return signedTxXdr;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error firmando transacción';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      publicKey,
      walletName,
      connect,
      disconnect,
      signTransaction,
      isLoading,
      error
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet debe ser usado dentro de WalletProvider');
  }
  return context;
}