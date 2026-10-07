import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAppUser } from '@/lib/server-auth';
import { verifyPrivatePayment } from '@/lib/helius-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const sender = await requireAppUser(request);
    const { payment_id, signature } = await request.json() as { payment_id?: string; signature?: string };
    if (!payment_id || !signature) return NextResponse.json({ error: 'Payment and transaction signature are required.' }, { status: 400 });
    const { data: payment, error } = await supabaseAdmin.from('payments')
      .select('id, receiver_user_id, privacy_status, transaction_signature, status').eq('id', payment_id).eq('sender_user_id', sender.id).maybeSingle();
    if (error || !payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    if (payment.privacy_status !== 'private') return NextResponse.json({ error: 'SwiftPay only verifies private payments.' }, { status: 400 });
    if (payment.transaction_signature && payment.transaction_signature !== signature) return NextResponse.json({ error: 'This payment already has a different transaction signature.' }, { status: 409 });
    if (payment.status === 'confirmed') return NextResponse.json({ status: 'confirmed' });
    if (!['created', 'submitted', 'processing'].includes(payment.status)) return NextResponse.json({ error: 'This payment cannot be verified in its current state.' }, { status: 409 });
    if (!(await verifyPrivatePayment(signature, sender.wallet_address)).confirmed) return NextResponse.json({ error: 'Helius has not indexed this private payment yet.' }, { status: 409 });
    let update = supabaseAdmin.from('payments').update({ status: 'processing', transaction_signature: signature }).eq('id', payment.id).eq('sender_user_id', sender.id);
    update = payment.transaction_signature ? update.eq('transaction_signature', signature) : update.is('transaction_signature', null);
    const { error: updateError } = await update.in('status', ['created', 'submitted', 'processing']);
    if (updateError) throw new Error('The private transfer was confirmed, but SwiftPay could not update history.');
    return NextResponse.json({ status: 'processing' });
  } catch (error) { return apiError(error); }
}
