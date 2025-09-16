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
      console.log('📤 ===== INICIO TRANSFERENCIA FIRMADA =====');
      console.log('📤 Enviando transacción firmada...');
      console.log('📤 SignedTransaction type:', typeof signedTransaction);
      console.log('📤 SignedTransaction length:', signedTransaction?.length);
      console.log('📤 SignedTransaction preview:', signedTransaction?.substring(0, 100));
      
      // Validar que el XDR sea válido
      if (!signedTransaction || typeof signedTransaction !== 'string') {
        throw new Error('signedTransaction debe ser un string válido');
      }
      
      // Decodificar URL si es necesario
      let decodedXdr = signedTransaction;
      try {
        decodedXdr = decodeURIComponent(signedTransaction);
        console.log('📤 XDR decodificado:', decodedXdr.substring(0, 100));
      } catch (decodeError) {
        console.log('📤 XDR no necesita decodificación');
      }
      
      console.log('📤 XDR original length:', signedTransaction.length);
      console.log('📤 XDR decodificado length:', decodedXdr.length);
      console.log('📤 XDR starts with AAAA:', decodedXdr.startsWith('AAAA'));
      console.log('📤 XDR preview:', decodedXdr.substring(0, 20));
      
      if (!decodedXdr.startsWith('AAAA')) {
        throw new Error(`signedTransaction no parece ser un XDR válido de Stellar. Inicio: ${decodedXdr.substring(0, 10)}`);
      }
      
      const server = new Horizon.Server(HORIZON_URL);
      
      try {
        // Convertir XDR a Transaction object antes de enviar
        console.log('📤 Convirtiendo XDR a Transaction object...');
        const transaction = TransactionBuilder.fromXDR(decodedXdr, NETWORK_PASSPHRASE);
        console.log('📤 Transaction object creado:', !!transaction);
        console.log('📤 Transaction details:', {
          source: transaction.source,
          operations: transaction.operations.length,
          fee: transaction.fee,
          sequence: transaction.sequence
        });
        
        console.log('📤 Enviando transacción a Horizon...');
        const result = await server.submitTransaction(transaction);
        console.log('📤 Transaction submitted successfully:', result.hash);
        console.log('📤 ===== TRANSFERENCIA EXITOSA =====');
        
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
      } catch (xdrError) {
        console.error('❌ Error procesando XDR:', xdrError);
        console.error('❌ Error details:', {
          message: xdrError.message,
          status: xdrError.response?.status,
          data: xdrError.response?.data
        });
        console.error('❌ Result codes:', xdrError.response?.data?.extras?.result_codes);
        console.error('❌ Result XDR:', xdrError.response?.data?.extras?.result_xdr);
        throw new Error(`Error procesando transacción XDR: ${xdrError.message}`);
      }
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
    console.log(`🔍 Amount type:`, typeof amount);
    console.log(`🔍 Amount value:`, amount);
    console.log(`🔍 Amount toString:`, amount.toString());

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
