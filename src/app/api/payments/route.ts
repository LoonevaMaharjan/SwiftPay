import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAppUser } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const amountPattern = /^\d+(\.\d{1,6})?$/;

export async function GET(request: NextRequest) {
  try {
    const sender = await requireAppUser(request);
    const { data, error } = await supabaseAdmin.from('payments').select('id, amount, token, status, privacy_status, transaction_signature, created_at, updated_at, sender_user_id, receiver_user_id').or(`sender_user_id.eq.${sender.id},receiver_user_id.eq.${sender.id}`).neq('status', 'created').order('created_at', { ascending: false }).limit(100);
    if (error) throw new Error('Couldn’t load sent payments.');
    const participantIds = [...new Set((data ?? []).flatMap((payment) => [payment.sender_user_id, payment.receiver_user_id]))];
    const { data: participants, error: receiverError } = participantIds.length ? await supabaseAdmin.from('users').select('id, username, wallet_address').in('id', participantIds) : { data: [], error: null };
    if (receiverError) throw new Error('Couldn’t load payment recipients.');
    const participantById = new Map((participants ?? []).map((user) => [user.id, user]));
    return NextResponse.json({ payments: (data ?? []).map((payment) => ({ ...payment, direction: payment.sender_user_id === sender.id ? 'sent' : 'received', sender: participantById.get(payment.sender_user_id) ?? null, recipient: participantById.get(payment.receiver_user_id) ?? null })) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const sender = await requireAppUser(request);
    const { receiver_user_id, amount, token, privacy_status, idempotency_key } = await request.json() as Record<string, string>;
    if (!receiver_user_id || !amountPattern.test(amount ?? '') || !idempotency_key) return NextResponse.json({ error: 'Recipient, amount, and idempotency key are required.' }, { status: 400 });
    if (token !== 'USDC' || privacy_status !== 'private') return NextResponse.json({ error: 'SwiftPay supports private USDC payments only.' }, { status: 400 });
    if (Number(amount) <= 0) return NextResponse.json({ error: 'Amount must be greater than zero.' }, { status: 400 });
    const { data: receiver } = await supabaseAdmin.from('users').select('id').eq('id', receiver_user_id).maybeSingle();
    if (!receiver || receiver.id === sender.id) return NextResponse.json({ error: 'Choose another SwiftPay recipient.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('payments').insert({ sender_user_id: sender.id, receiver_user_id, amount, token: 'USDC', status: 'created', privacy_status, idempotency_key, network: 'devnet' }).select('id, status').single();
    if (error) {
      console.error('Payment intent insert failed:', { code: error.code, message: error.message });
      const migrationRequired = ['42P01', '42703', 'PGRST204', 'PGRST205', '23514'].includes(error.code ?? '');
      return NextResponse.json({
        error: migrationRequired
          ? 'The Supabase payments schema is outdated. Apply supabase/migrations/20260919_secure_payments.sql in the Supabase SQL Editor, then retry.'
          : 'Could not create the payment intent. Check the server log for the Supabase error.',
      }, { status: migrationRequired ? 503 : 500 });
    }
    return NextResponse.json({ payment: data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
