import { 
  Server, 
  Keypair, 
  TransactionBuilder, 
  Operation, 
  Networks,
  Asset,
  BASE_FEE,
  Memo,
  MemoType
} from '@stellar/stellar-sdk';

// Configuración del contrato
const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

// Crear servidor Stellar
const server = new Server(HORIZON_URL);

export interface ContractCall {
  method: string;
  args: any[];
  sourceAccount: string;
}

export class ContractService {
  private server: Server;
  private contractId: string;

  constructor() {
    this.server = server;
    this.contractId = CONTRACT_ID;
  }

  // Crear transacción para invocar contrato
  async createContractInvokeTransaction(
    sourceAccount: string,
    method: string,
    args: any[] = []
  ): Promise<string> {
    try {
      // Obtener cuenta fuente
      const account = await this.server.getAccount(sourceAccount);
      
      // Crear transacción
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.invokeContractFunction({
            contract: this.contractId,
            function: method,
            args: args.map(arg => this.convertToXdr(arg))
          })
        )
        .setTimeout(30)
        .build();

      return transaction.toXDR();
    } catch (error) {
      console.error('Error creando transacción:', error);
      throw error;
    }
  }

  // Crear transacción de pago
  async createPaymentTransaction(
    sourceAccount: string,
    destination: string,
    amount: string,
    asset: string = 'XLM'
  ): Promise<string> {
    try {
      const account = await this.server.getAccount(sourceAccount);
      
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.payment({
            destination,
            asset: asset === 'XLM' ? Asset.native() : Asset.fromString(asset),
            amount: amount
          })
        )
        .setTimeout(30)
        .build();

      return transaction.toXDR();
    } catch (error) {
      console.error('Error creando transacción de pago:', error);
      throw error;
    }
  }

  // Enviar transacción firmada
  async submitTransaction(signedTransaction: string): Promise<any> {
    try {
      const transaction = TransactionBuilder.fromXDR(signedTransaction, NETWORK_PASSPHRASE);
      const result = await this.server.submitTransaction(transaction);
      return result;
    } catch (error) {
      console.error('Error enviando transacción:', error);
      throw error;
    }
  }

  // Convertir argumentos a formato XDR
  private convertToXdr(arg: any): any {
    if (typeof arg === 'string') {
      return { string: arg };
    } else if (typeof arg === 'number') {
      return { int: arg };
    } else if (typeof arg === 'boolean') {
      return { bool: arg };
    } else if (arg && typeof arg === 'object' && arg.address) {
      return { address: arg.address };
    }
    return arg;
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
    return this.createContractInvokeTransaction(
      sourceAccount,
      'get_my_positions',
      []
    );
  }

  // Obtener precio actual
  async getCurrentPrice(): Promise<string> {
    // Usar una cuenta dummy para consultas de solo lectura
    const dummyAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    return this.createContractInvokeTransaction(
      dummyAccount,
      'get_current_price',
      []
    );
  }

  // Obtener estadísticas globales
  async getGlobalStats(): Promise<string> {
    const dummyAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    return this.createContractInvokeTransaction(
      dummyAccount,
      'get_global_stats',
      []
    );
  }
}

export const contractService = new ContractService();
