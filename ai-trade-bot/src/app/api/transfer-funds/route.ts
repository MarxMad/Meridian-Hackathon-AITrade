import { NextRequest, NextResponse } from 'next/server';
import { Horizon, Keypair, TransactionBuilder, Networks, Operation, Asset, Memo, Transaction } from '@stellar/stellar-sdk';

// Configuración
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

// Wallet intermedia (Meridian) - la que desplegó el contrato
const MERIDIAN_SECRET = 'SCNEEBZPEDFDLJJNWHLZPLY3XVRNNJ3SXIYL64FLLPLKKM3KUROIE7TG';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toAccount, amount, memo = 'PnL Return', createTransaction = false, signedTransaction } = body;

    // Si se envía una transacción firmada, solo enviarla
    if (signedTransaction) {
      console.log('📤 Enviando transacción firmada...');
      console.log('📤 SignedTransaction type:', typeof signedTransaction);
      console.log('📤 SignedTransaction length:', signedTransaction?.length);
      
      const server = new Horizon.Server(HORIZON_URL);
      
      // Convertir XDR string a Transaction object
      const transaction = TransactionBuilder.fromXDR(signedTransaction, NETWORK_PASSPHRASE);
      console.log('📤 Transaction object created:', !!transaction);
      
      const result = await server.submitTransaction(transaction);
      
      return NextResponse.json({
        success: true,
        message: 'Transacción enviada exitosamente',
        data: {
          hash: result.hash,
          ledger: result.ledger,
          successful: result.successful,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!toAccount || !amount) {
      return NextResponse.json({
        success: false,
        message: 'toAccount y amount son requeridos'
      }, { status: 400 });
    }

    // Truncar memo para no superar 28 bytes (límite de Stellar)
    const truncatedMemo = memo.length > 28 ? memo.substring(0, 25) + '...' : memo;
    
    console.log(`💸 Transfiriendo ${amount} XLM desde Meridian a ${toAccount}`);
    console.log(`📝 Memo: "${truncatedMemo}"`);

    // 1. Crear servidor de Horizon
    const server = new Horizon.Server(HORIZON_URL);
    
    // 2. Crear keypair de Meridian (wallet intermedia)
    const meridianKeypair = Keypair.fromSecret(MERIDIAN_SECRET);
    const meridianAccount = await server.loadAccount(meridianKeypair.publicKey());

    // 3. Crear transacción de transferencia
    const transaction = new TransactionBuilder(meridianAccount, {
      fee: '100000', // 0.01 XLM
      networkPassphrase: NETWORK_PASSPHRASE,
    })
    .addOperation(Operation.payment({
      destination: toAccount,
      asset: Asset.native(), // XLM
      amount: amount.toString()
    }))
    .addMemo(Memo.text(truncatedMemo))
    .setTimeout(180)
    .build();

    // 4. Si solo se solicita crear la transacción, devolver el XDR sin firmar
    if (createTransaction) {
      return NextResponse.json({
        success: true,
        message: 'Transacción creada exitosamente',
        transactionXdr: transaction.toXDR(),
        data: {
          from: meridianKeypair.publicKey(),
          to: toAccount,
          amount: amount.toString(),
          memo: truncatedMemo,
          timestamp: new Date().toISOString()
        }
      });
    }

    // 5. Firmar transacción con la wallet Meridian
    transaction.sign(meridianKeypair);

    // 6. Enviar transacción
    const result = await server.submitTransaction(transaction);

    console.log(`✅ Transferencia exitosa: ${result.hash}`);

    return NextResponse.json({
      success: true,
      message: 'Fondos transferidos exitosamente',
      data: {
        hash: result.hash,
        ledger: result.ledger,
        from: meridianKeypair.publicKey(),
        to: toAccount,
        amount: amount,
        memo: memo,
        successful: result.successful,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error transfiriendo fondos:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error transfiriendo fondos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
