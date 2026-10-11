import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAppUser } from '@/lib/server-auth';
import { verifyPrivatePayment } from '@/lib/helius-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const sender = await requireAppUser(request);
    const body = await request.json() as { receiver_user_id?: string; amount?: string; signature?: string; payment_id?: string; payment_request_id?: string | null };
    const { receiver_user_id, amount, signature, payment_id, payment_request_id } = body;
    if (!receiver_user_id || !amount || !signature || !/^\d+(?:\.\d{1,6})?$/.test(amount) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Recipient, valid USDC amount, and transaction signature are required.' }, { status: 400 });
    }

    const { data: receiver, error: receiverError } = await supabaseAdmin.from('users')
      .select('id, wallet_address').eq('id', receiver_user_id).maybeSingle();
    if (receiverError || !receiver || receiver.id === sender.id) {
      return NextResponse.json({ error: 'Payment recipient not found.' }, { status: 404 });
    }
    if (payment_request_id) {
      const { data: paymentRequest, error: requestError } = await supabaseAdmin.from('payment_requests')
        .select('id, requester_user_id, payer_user_id, amount, status, transaction_signature')
        .eq('id', payment_request_id).maybeSingle();
      if (requestError || !paymentRequest) return NextResponse.json({ error: 'Payment request not found.' }, { status: 404 });
      if (paymentRequest.payer_user_id !== sender.id || paymentRequest.requester_user_id !== receiver.id || Number(paymentRequest.amount) !== Number(amount)) {
        return NextResponse.json({ error: 'This transaction does not match the payment request.' }, { status: 409 });
      }
      if (paymentRequest.transaction_signature && paymentRequest.transaction_signature !== signature) {
        return NextResponse.json({ error: 'This payment request already has a transaction in progress.' }, { status: 409 });
      }
      if (!['pending', 'processing', 'paid'].includes(paymentRequest.status)) {
        return NextResponse.json({ error: 'This payment request is no longer available.' }, { status: 409 });
      }
      if (paymentRequest.status === 'paid' && paymentRequest.transaction_signature !== signature) {
        return NextResponse.json({ error: 'This payment request has already been paid.' }, { status: 409 });
      }
    }
    const { data: existing, error: existingError } = await supabaseAdmin.from('payments')
      .select('id, sender_user_id, receiver_user_id, amount, status')
      .eq('transaction_signature', signature).maybeSingle();
    if (existingError) throw new Error('Couldn’t check payment history. Apply the payments migration and try again.');
    if (existing) {
      if (existing.sender_user_id !== sender.id || existing.receiver_user_id !== receiver.id || Number(existing.amount) !== Number(amount)) {
        return NextResponse.json({ error: 'This transaction is already linked to another payment.' }, { status: 409 });
      }
      if (!payment_id) return NextResponse.json({ payment: existing, status: existing.status });
      if (existing.id !== payment_id) return NextResponse.json({ error: 'This transaction is already linked to another payment.' }, { status: 409 });
    }

    if (payment_id) {
      const { data: intent, error: intentError } = await supabaseAdmin.from('payments')
        .select('id, sender_user_id, receiver_user_id, amount, status, transaction_signature')
        .eq('id', payment_id).eq('sender_user_id', sender.id).maybeSingle();
      if (intentError || !intent) return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
      if (intent.receiver_user_id !== receiver.id || Number(intent.amount) !== Number(amount)) {
        return NextResponse.json({ error: 'Payment details do not match the saved review.' }, { status: 409 });
      }
      if (intent.transaction_signature && intent.transaction_signature !== signature) {
        return NextResponse.json({ error: 'This payment already has a transaction signature.' }, { status: 409 });
      }
      if (!intent.transaction_signature) {
        const { error: attachError } = await supabaseAdmin.from('payments').update({
          transaction_signature: signature,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        }).eq('id', intent.id).eq('status', 'created');
        if (attachError) throw new Error('The transfer was sent, but SwiftPay could not attach it to your payment record. Retry the history update.');
      }
    }

    const verification = await verifyPrivatePayment(signature, sender.wallet_address);
    if (payment_request_id) {
      const { error: requestUpdateError } = await supabaseAdmin.from('payment_requests').update({
        status: 'processing',
        transaction_signature: signature,
        updated_at: new Date().toISOString(),
      }).eq('id', payment_request_id).in('status', ['pending', 'processing']);
      if (requestUpdateError) throw new Error('The payment was submitted, but SwiftPay could not update the request status. Retry the history update.');
    }
    if (!verification.confirmed) {
      if (payment_id) return NextResponse.json({ status: 'submitted', pendingVerification: true }, { status: 202 });
      return NextResponse.json({ error: 'Helius has not confirmed this private payment yet. Retry shortly.' }, { status: 409 });
    }

    if (payment_id) {
      const { data: updated, error: updateError } = await supabaseAdmin.from('payments').update({ status: 'processing' })
        .eq('id', payment_id).eq('sender_user_id', sender.id).eq('transaction_signature', signature)
        .in('status', ['created', 'submitted']).select('id, status').maybeSingle();
      if (updateError) throw new Error('The transfer was verified, but SwiftPay could not update its status.');
      if (updated) return NextResponse.json({ payment: updated, status: updated.status });
      const { data: current } = await supabaseAdmin.from('payments').select('id, status, transaction_signature').eq('id', payment_id).maybeSingle();
      if (current?.transaction_signature === signature) return NextResponse.json({ payment: current, status: current.status });
      return NextResponse.json({ error: 'The payment changed before it could be verified.' }, { status: 409 });
    }

    const { data: payment, error: insertError } = await supabaseAdmin.from('payments').insert({
      sender_user_id: sender.id,
      receiver_user_id: receiver.id,
      amount,
      token: 'USDC',
      status: 'processing',
      privacy_status: 'private',
      transaction_signature: signature,
      network: 'devnet',
    }).select('id, status').single();
    if (insertError) throw new Error('The transfer succeeded, but SwiftPay could not save it to history. Retry the history update.');
    return NextResponse.json({ payment, status: 'processing' }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
