import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { apiError, requireAppUser } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getConnection, USDC_MINT } from '@/lib/solana';

export async function POST(request: NextRequest) {
  try {
    const sender = await requireAppUser(request);
    const { payment_id, signature } = await request.json() as { payment_id?: string; signature?: string };
    if (!payment_id || !signature) return NextResponse.json({ error: 'Payment and transaction signature are required.' }, { status: 400 });
    const { data: payment, error } = await supabaseAdmin.from('payments').select('*').eq('id', payment_id).eq('sender_user_id', sender.id).maybeSingle();
    if (error || !payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    const { data: receiver } = await supabaseAdmin.from('users').select('wallet_address').eq('id', payment.receiver_user_id).single();
    if (!receiver) throw new Error('Payment recipient is unavailable.');
    const transaction = await getConnection().getParsedTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    if (!transaction || transaction.meta?.err) throw new Error('This transaction is not confirmed.');
    const destinationAta = (await getAssociatedTokenAddress(USDC_MINT, new PublicKey(receiver.wallet_address))).toBase58();
    const expectedAmount = BigInt(String(payment.amount).replace('.', '').padEnd(String(payment.amount).split('.')[0].length + 6, '0')).toString();
    const validTransfer = transaction.transaction.message.instructions.some((instruction) => {
      if (!('parsed' in instruction) || !instruction.parsed || typeof instruction.parsed !== 'object') return false;
      const parsed = instruction.parsed as { type?: string; info?: Record<string, string> };
      return ['transfer', 'transferChecked'].includes(parsed.type ?? '') && parsed.info?.mint === USDC_MINT.toBase58() && parsed.info?.authority === sender.wallet_address && parsed.info?.destination === destinationAta && parsed.info?.amount === expectedAmount;
    });
    if (!validTransfer) throw new Error('Transaction does not match this USDC payment.');
    const { error: updateError } = await supabaseAdmin.from('payments').update({ status: 'confirmed', transaction_signature: signature, confirmed_at: new Date().toISOString() }).eq('id', payment.id);
    if (updateError) throw new Error('Couldn’t record the confirmed payment.');
    return NextResponse.json({ status: 'confirmed' });
  } catch (error) { return apiError(error); }
}
