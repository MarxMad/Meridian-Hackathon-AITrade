import { NextRequest, NextResponse } from 'next/server';
import { 
  Server, 
  Keypair, 
  TransactionBuilder, 
  Operation, 
  Networks,
  Asset,
  BASE_FEE
} from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

const server = new Server(HORIZON_URL);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceAccount, amount, signedTransaction } = body;

    if (!sourceAccount || !amount || !signedTransaction) {
      return NextResponse.json({
        success: false,
        message: 'Missing required parameters'
      }, { status: 400 });
    }

    console.log(`💰 Procesando transferencia de ${amount} XLM al contrato...`);

    // Enviar transacción firmada
    const transaction = TransactionBuilder.fromXDR(signedTransaction, NETWORK_PASSPHRASE);
    const result = await server.submitTransaction(transaction);

    if (result.successful) {
      console.log('✅ Transferencia exitosa:', result.hash);
      
      return NextResponse.json({
        success: true,
        message: 'Transferencia exitosa',
        data: {
          hash: result.hash,
          amount: amount,
          contract_id: CONTRACT_ID,
          source_account: sourceAccount,
          network: 'testnet'
        }
      });
    } else {
      throw new Error('Transaction failed');
    }

  } catch (error) {
    console.error('❌ Error procesando transferencia:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error procesando transferencia',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
