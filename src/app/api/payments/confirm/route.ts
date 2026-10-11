import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAppUser } from '@/lib/server-auth';
import { verifyPrivatePayment } from '@/lib/helius-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const receiver = await requireAppUser(request);
    const { signature } = await request.json() as { signature?: string };
    if (!signature) return NextResponse.json({ error: 'Private transfer signature is required.' }, { status: 400 });
    const { data: payment, error } = await supabaseAdmin.from('payments').select('id, sender_user_id, receiver_user_id, status, transaction_signature')
      .eq('receiver_user_id', receiver.id).eq('transaction_signature', signature).maybeSingle();
    if (error) throw new Error('Couldn’t load this payment.');
    if (!payment) return NextResponse.json({ error: 'No SwiftPay payment matches this private transfer.' }, { status: 404 });
    if (payment.status === 'confirmed') {
      const { error: requestUpdateError } = await supabaseAdmin.from('payment_requests').update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('transaction_signature', signature).eq('requester_user_id', receiver.id).eq('status', 'processing');
      if (requestUpdateError && !['42P01', 'PGRST205'].includes(requestUpdateError.code ?? '')) throw new Error('Payment is confirmed, but SwiftPay could not mark the payment request paid.');
      return NextResponse.json({ status: 'confirmed' });
    }
    if (!['submitted', 'processing'].includes(payment.status)) return NextResponse.json({ error: 'This payment is not ready for receipt verification.' }, { status: 409 });
    const { data: sender, error: senderError } = await supabaseAdmin.from('users').select('wallet_address').eq('id', payment.sender_user_id).maybeSingle();
    if (senderError || !sender) throw new Error('Couldn’t verify the sender wallet.');
    if (!(await verifyPrivatePayment(signature, sender.wallet_address)).confirmed) return NextResponse.json({ error: 'Helius has not indexed this private transfer yet.' }, { status: 409 });
    const { data: updated, error: updateError } = await supabaseAdmin.from('payments').update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', payment.id).eq('receiver_user_id', receiver.id).eq('status', payment.status).select('id').maybeSingle();
    if (updateError) throw new Error('Receipt was verified, but SwiftPay could not update payment history.');
    if (!updated) return NextResponse.json({ error: 'This payment changed before confirmation.' }, { status: 409 });
    const { error: requestUpdateError } = await supabaseAdmin.from('payment_requests').update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('transaction_signature', signature).eq('requester_user_id', receiver.id).eq('status', 'processing');
    if (requestUpdateError && !['42P01', 'PGRST205'].includes(requestUpdateError.code ?? '')) throw new Error('Payment is confirmed, but SwiftPay could not mark the payment request paid.');
    return NextResponse.json({ status: 'confirmed' });
  } catch (error) { return apiError(error); }
}
