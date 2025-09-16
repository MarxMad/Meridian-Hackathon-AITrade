// Servicio del lado del cliente para interactuar con el contrato
// Todas las operaciones se envían a las API routes del servidor

export interface ContractCall {
  method: string;
  args: any[];
  sourceAccount: string;
}

export class ContractService {
  // Crear transacción para invocar contrato
  async createContractInvokeTransaction(
    sourceAccount: string,
    method: string,
    args: any[] = []
  ): Promise<string> {
    try {
      const response = await fetch('/api/contract/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: method,
          sourceAccount,
          ...this.formatArgs(args)
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error creando transacción');
      }

      return result.data.transactionXdr;
    } catch (error) {
      console.error('Error creando transacción:', error);
      throw error;
    }
  }

  // Enviar transacción firmada
  async submitTransaction(signedTransaction: string): Promise<any> {
    try {
      const response = await fetch('/api/contract/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransaction })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error enviando transacción');
      }

      return result.data;
    } catch (error) {
      console.error('Error enviando transacción:', error);
      throw error;
    }
  }

  // Ejecutar consulta de solo lectura
  async executeQuery(query: string, sourceAccount?: string): Promise<string> {
    try {
      const response = await fetch('/api/contract/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          sourceAccount
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error ejecutando consulta');
      }

      return result.data.transactionXdr;
    } catch (error) {
      console.error('Error ejecutando consulta:', error);
      throw error;
    }
  }

  // Formatear argumentos para la API
  private formatArgs(args: any[]): any {
    const formatted: any = {};
    
    args.forEach((arg, index) => {
      if (typeof arg === 'string') {
        formatted[`arg${index}`] = arg;
      } else if (typeof arg === 'number') {
        formatted[`arg${index}`] = arg;
      } else if (typeof arg === 'boolean') {
        formatted[`arg${index}`] = arg;
      } else if (arg && typeof arg === 'object' && arg.address) {
        formatted[`arg${index}`] = arg.address;
      } else {
        formatted[`arg${index}`] = arg;
      }
    });

    return formatted;
  }

  // Métodos específicos del contrato de trading

  // Depositar fondos
  async depositFunds(sourceAccount: string, amount: number): Promise<string> {
    return this.createContractInvokeTransaction(
      sourceAccount,
      'deposit_funds',
      [amount]
    );
  }

  // Abrir posición
  async openPosition(
    sourceAccount: string, 
    amount: number, 
    leverage: number, 
    positionType: 'long' | 'short'
  ): Promise<string> {
    return this.createContractInvokeTransaction(
      sourceAccount,
      'open_position',
      [amount, leverage, positionType]
    );
  }

  // Cerrar posición
  async closePosition(sourceAccount: string, positionId: string): Promise<string> {
    return this.createContractInvokeTransaction(
      sourceAccount,
      'close_position',
      [positionId]
    );
  }

  // Auto trading
  async autoTrade(sourceAccount: string, amount: number): Promise<string> {
    return this.createContractInvokeTransaction(
      sourceAccount,
      'auto_trade',
      [amount]
    );
  }

  // Obtener posiciones del trader
  async getTraderPositions(sourceAccount: string): Promise<string> {
    return this.executeQuery('get_my_positions', sourceAccount);
  }

  // Obtener precio actual
  async getCurrentPrice(): Promise<string> {
    return this.executeQuery('get_current_price');
  }

  // Obtener estadísticas globales
  async getGlobalStats(): Promise<string> {
    return this.executeQuery('get_global_stats');
  }

  // Crear transacción de pago (para TransferModal)
  async createPaymentTransaction(
    sourceAccount: string,
    destination: string,
    amount: string,
    asset: string = 'XLM'
  ): Promise<string> {
    try {
      const response = await fetch('/api/contract/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'payment',
          sourceAccount,
          destination,
          amount,
          asset
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error creando transacción de pago');
      }

      return result.data.transactionXdr;
    } catch (error) {
      console.error('Error creando transacción de pago:', error);
      throw error;
    }
  }
}

export const contractService = new ContractService();