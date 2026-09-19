import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAppUser } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const amountPattern = /^\d+(\.\d{1,6})?$/;

export async function GET(request: NextRequest) {
  try {
    const sender = await requireAppUser(request);
    const { data, error } = await supabaseAdmin.from('payments').select('id, amount, token, status, privacy_status, transaction_signature, created_at, updated_at, receiver_user_id').eq('sender_user_id', sender.id).order('created_at', { ascending: false }).limit(50);
    if (error) throw new Error('Couldn’t load sent payments.');
    const receiverIds = [...new Set((data ?? []).map((payment) => payment.receiver_user_id))];
    const { data: receivers, error: receiverError } = receiverIds.length ? await supabaseAdmin.from('users').select('id, username, wallet_address').in('id', receiverIds) : { data: [], error: null };
    if (receiverError) throw new Error('Couldn’t load payment recipients.');
    const recipientById = new Map((receivers ?? []).map((user) => [user.id, user]));
    return NextResponse.json({ payments: (data ?? []).map((payment) => ({ ...payment, recipient: recipientById.get(payment.receiver_user_id) ?? null })) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const sender = await requireAppUser(request);
    const { receiver_user_id, amount, token, privacy_status, idempotency_key } = await request.json() as Record<string, string>;
    if (!receiver_user_id || !amountPattern.test(amount ?? '') || !idempotency_key) return NextResponse.json({ error: 'Recipient, amount, and idempotency key are required.' }, { status: 400 });
    if (token !== 'USDC' || !['public', 'private'].includes(privacy_status)) return NextResponse.json({ error: 'Only USDC public or private payments are supported.' }, { status: 400 });
    if (Number(amount) <= 0) return NextResponse.json({ error: 'Amount must be greater than zero.' }, { status: 400 });
    const { data: receiver } = await supabaseAdmin.from('users').select('id').eq('id', receiver_user_id).maybeSingle();
    if (!receiver || receiver.id === sender.id) return NextResponse.json({ error: 'Choose another SwiftPay recipient.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('payments').insert({ sender_user_id: sender.id, receiver_user_id, amount, token: 'USDC', status: 'created', privacy_status, idempotency_key, network: 'devnet' }).select('id, status').single();
    if (error) throw new Error('Payments migration is required before creating payment intents.');
    return NextResponse.json({ payment: data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
