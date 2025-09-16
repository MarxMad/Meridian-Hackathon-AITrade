'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  setAllowed, 
  isConnected, 
  getPublicKey, 
  signTransaction,
  requestAccess,
  getNetworkDetails,
  NetworkDetails
} from '@stellar/freighter-api';

interface WalletContextType {
  isConnected: boolean;
  publicKey: string | null;
  network: NetworkDetails | null;
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
  const [network, setNetwork] = useState<NetworkDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar conexión al cargar
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const connected = await isConnected();
      if (connected) {
        const key = await getPublicKey();
        const networkDetails = await getNetworkDetails();
        setPublicKey(key);
        setNetwork(networkDetails);
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
    }
  };

  const connect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Verificar si Freighter está instalado
      if (typeof window === 'undefined' || !window.freighterApi) {
        throw new Error('Freighter wallet no está instalado. Por favor instala la extensión de Freighter.');
      }

      // Solicitar acceso
      await requestAccess();
      
      // Obtener información de la wallet
      const key = await getPublicKey();
      const networkDetails = await getNetworkDetails();
      
      setPublicKey(key);
      setNetwork(networkDetails);
      setIsConnected(true);
      
      console.log('✅ Wallet conectada:', key);
      console.log('🌐 Red:', networkDetails);
      
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
    setNetwork(null);
    setIsConnected(false);
    setError(null);
    console.log('🔌 Wallet desconectada');
  };

  const signTransaction = async (transaction: string): Promise<string> => {
    try {
      if (!isConnected) {
        throw new Error('Wallet no conectada');
      }
      
      const signedTransaction = await signTransaction(transaction);
      return signedTransaction;
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
      network,
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
