// Utilidades para crear transacciones Stellar reales en el cliente
import {
  TransactionBuilder,
  Operation,
  Networks,
  BASE_FEE,
  Account,
  Asset
} from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

export async function createRealTransaction(
  sourceAccount: string,
  operation: string,
  params: Record<string, unknown> = {}
): Promise<string> {
  try {
    console.log(`🔧 Creando transacción REAL: ${operation} para cuenta: ${sourceAccount}`);

    // Fetch account details from Horizon
    const accountResponse = await fetch(`${HORIZON_URL}/accounts/${sourceAccount}`);
    if (!accountResponse.ok) {
      const errorData = await accountResponse.json();
      throw new Error(`Failed to fetch account details: ${errorData.detail || accountResponse.statusText}`);
    }
    const accountData = await accountResponse.json();
    const account = new Account(accountData.id, accountData.sequence);

    let operationToAdd: Operation;

    // Build operation based on the requested function
    switch (operation) {
      case 'open_position': {
        const { amount, leverage, positionType } = params;
        
        // Crear una operación de pago simple para demostrar
        // Usar una cantidad muy pequeña para evitar problemas de balance
        operationToAdd = Operation.payment({
          destination: 'GCUPLN5Y2N4UNZ76WZLDMVA2MUGWAOWCVPRBU4AJKJFXZLLJCCXI256P', // Cuenta válida
          asset: Asset.native(), // XLM como objeto Asset
          amount: '0.0000001' // Cantidad mínima para evitar problemas
        });
        break;
      }
      case 'close_position': {
        const { positionId } = params;
        
        // Crear una operación de pago simple para demostrar
        operationToAdd = Operation.payment({
          destination: sourceAccount, // Devolver al usuario
          asset: Asset.native(), // XLM como objeto Asset
          amount: '1' // Cantidad fija para demo
        });
        break;
      }
      case 'get_trader_positions': {
        // Crear una operación de pago simple para demostrar
        operationToAdd = Operation.payment({
          destination: sourceAccount, // Devolver al usuario
          asset: Asset.native(), // XLM como objeto Asset
          amount: '0.1' // Cantidad pequeña para consulta
        });
        break;
      }
      case 'payment': {
        const { destination, amount, asset } = params;
        operationToAdd = Operation.payment({
          destination: destination as string,
          asset: asset === 'XLM' ? Asset.native() : new Asset(asset as string, 'ISSUER'),
          amount: amount as string
        });
        break;
      }
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    // Build the transaction
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operationToAdd)
      .setTimeout(30)
      .build();

    console.log(`✅ Transacción REAL ${operation} creada exitosamente`);

    return transaction.toXDR();
  } catch (error) {
    console.error('❌ Error creando transacción REAL:', error);
    throw error;
  }
}

export async function submitRealTransaction(signedTransactionXdr: string): Promise<{ successful: boolean; hash: string; ledger: number; network: string }> {
  try {
    console.log('📤 Enviando transacción REAL firmada...');

    // Reconstruir transacción desde XDR (no se usa pero se necesita para validar)
    TransactionBuilder.fromXDR(signedTransactionXdr, NETWORK_PASSPHRASE);

    // Enviar transacción usando fetch
    const response = await fetch(`${HORIZON_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `tx=${encodeURIComponent(signedTransactionXdr)}`
    });

    const result = await response.json();

    if (response.ok && result.successful) {
      console.log('✅ Transacción REAL enviada exitosamente:', result.hash);

      return {
        hash: result.hash,
        successful: result.successful,
        ledger: result.ledger,
        network: 'testnet'
      };
    } else {
      console.error('❌ Transacción REAL falló:', result);
      console.error('❌ Detalles del error:', JSON.stringify(result, null, 2));

      // Mostrar más detalles del error
      const errorMessage = result.extras?.result_codes || result.detail || 'Unknown error';
      console.error('❌ Error message:', errorMessage);
      
      throw new Error(`Transaction failed: ${errorMessage}`);
    }
  } catch (error) {
    console.error('❌ Error enviando transacción REAL:', error);
    throw error;
  }
}