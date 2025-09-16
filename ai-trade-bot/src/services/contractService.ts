// Servicio del lado del cliente para interactuar con el contrato REAL
// Usa Stellar SDK directamente en el cliente para crear transacciones reales

import { createRealTransaction, submitRealTransaction } from '@/utils/stellarUtils';

export interface ContractCall {
  method: string;
  args: unknown[];
  sourceAccount: string;
}

export class ContractService {
  // Crear transacción REAL para invocar contrato
  async createContractInvokeTransaction(
    sourceAccount: string,
    method: string,
    args: unknown[] = []
  ): Promise<string> {
    try {
      const params = this.formatArgs(args);
      return await createRealTransaction(sourceAccount, method, params);
    } catch (error) {
      console.error('Error creando transacción REAL:', error);
      throw error;
    }
  }

  // Enviar transacción REAL firmada
  async submitTransaction(signedTransaction: string): Promise<{ successful: boolean; hash: string; ledger: number; network: string }> {
    try {
      return await submitRealTransaction(signedTransaction);
    } catch (error) {
      console.error('Error enviando transacción REAL:', error);
      throw error;
    }
  }

  // Formatear argumentos para la API
  private formatArgs(args: unknown[]): Record<string, unknown> {
    const formatted: Record<string, unknown> = {};
    args.forEach((arg, index) => {
      formatted[`arg${index}`] = arg;
    });
    return formatted;
  }

  // Abrir posición REAL
  async openPosition(
    publicKey: string,
    amount: number,
    leverage: number,
    positionType: 'long' | 'short'
  ): Promise<string> {
    try {
      return await createRealTransaction(publicKey, 'open_position', {
        amount,
        leverage,
        positionType,
      });
    } catch (error) {
      console.error('Error en openPosition:', error);
      throw error;
    }
  }

  // Cerrar posición REAL
  async closePosition(
    publicKey: string,
    positionId: string
  ): Promise<string> {
    try {
      return await createRealTransaction(publicKey, 'close_position', {
        positionId,
      });
    } catch (error) {
      console.error('Error en closePosition:', error);
      throw error;
    }
  }

  // Depositar fondos REAL
  async depositFunds(
    publicKey: string,
    asset: string,
    amount: number
  ): Promise<string> {
    try {
      return await createRealTransaction(publicKey, 'deposit_funds', {
        asset,
        amount,
      });
    } catch (error) {
      console.error('Error en depositFunds:', error);
      throw error;
    }
  }

  // Obtener posiciones del trader REAL
  async getTraderPositions(publicKey: string): Promise<string> {
    try {
      return await createRealTransaction(publicKey, 'get_trader_positions', {});
    } catch (error) {
      console.error('Error en getTraderPositions:', error);
      throw error;
    }
  }

  // Ejecutar consulta REAL
  async executeQuery(query: string, sourceAccount?: string): Promise<string> {
    try {
      const response = await fetch('/api/contract/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          sourceAccount: sourceAccount || 'default'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error ejecutando consulta REAL');
      }

      return result.data.transactionXdr;
    } catch (error) {
      console.error('Error ejecutando consulta REAL:', error);
      throw error;
    }
  }

  // Obtener precio actual REAL
  async getCurrentPrice(): Promise<string> {
    return this.executeQuery('get_current_price');
  }

  // Obtener estadísticas globales REAL
  async getGlobalStats(): Promise<string> {
    return this.executeQuery('get_global_stats');
  }

  // Crear transacción de pago REAL (para TransferModal)
  async createPaymentTransaction(
    sourceAccount: string,
    destination: string,
    amount: string,
    asset: string = 'XLM'
  ): Promise<string> {
    try {
      return await createRealTransaction(sourceAccount, 'payment', {
        destination,
        amount,
        asset
      });
    } catch (error) {
      console.error('Error creando transacción REAL de pago:', error);
      throw error;
    }
  }
}

export const contractService = new ContractService();