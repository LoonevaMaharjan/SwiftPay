import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { apiError, requireAppUser } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAppUser(request);
    const [incomingResult, outgoingResult] = await Promise.all([
      supabaseAdmin.from('payment_requests').select('id, requester_user_id, payer_user_id, amount, token, status, created_at, updated_at, transaction_signature').eq('payer_user_id', user.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('payment_requests').select('id, requester_user_id, payer_user_id, amount, token, status, created_at, updated_at, transaction_signature').eq('requester_user_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (incomingResult.error || outgoingResult.error) {
      throw new Error('Payment requests are unavailable. Apply the payment requests migrations and try again.');
    }

    const rows = [
      ...(incomingResult.data ?? []).map((row) => ({ ...row, direction: 'incoming' as const, other_user_id: row.requester_user_id })),
      ...(outgoingResult.data ?? []).map((row) => ({ ...row, direction: 'outgoing' as const, other_user_id: row.payer_user_id })),
    ];
    const userIds = [...new Set(rows.map((row) => row.other_user_id))];
    const profiles = userIds.length
      ? await supabaseAdmin.from('users').select('id, username').in('id', userIds)
      : { data: [], error: null };
    if (profiles.error) throw new Error('Could not load payment request profiles.');
    const profileById = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));

    return NextResponse.json({
      requests: rows.map(({ other_user_id, ...row }) => ({ ...row, other_user: profileById.get(other_user_id) ?? null })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const requester = await requireAppUser(request);
    const body = await request.json() as { recipient?: string; amount?: string };
    const recipientInput = body.recipient?.trim().replace(/^@/, '');
    const amount = body.amount?.trim();
    if (!recipientInput || recipientInput.length > 320 || !amount || !/^\d+(?:\.\d{1,6})?$/.test(amount) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Enter a SwiftPay username or email and a valid USDC amount.' }, { status: 400 });
    }

    let column: 'wallet_address' | 'email' | 'username';
    let value = recipientInput.toLowerCase();
    try {
      new PublicKey(recipientInput);
      column = 'wallet_address';
      value = recipientInput;
    } catch {
      column = recipientInput.includes('@') ? 'email' : 'username';
    }

    const { data: payer, error: payerError } = await supabaseAdmin.from('users')
      .select('id, username').eq(column, value).maybeSingle();
    if (payerError) throw new Error('Could not find that SwiftPay user.');
    if (!payer) return NextResponse.json({ error: 'No SwiftPay user matched that recipient.' }, { status: 404 });
    if (payer.id === requester.id) return NextResponse.json({ error: 'You can’t request a payment from yourself.' }, { status: 400 });

    const { data: paymentRequest, error } = await supabaseAdmin.from('payment_requests').insert({
      requester_user_id: requester.id,
      payer_user_id: payer.id,
      amount,
      token: 'USDC',
      status: 'pending',
    }).select('id, requester_user_id, payer_user_id, amount, token, status, created_at, updated_at').single();
    if (error || !paymentRequest) throw new Error('Could not create the payment request. Apply the payment requests migrations and try again.');
    return NextResponse.json({ request: { ...paymentRequest, direction: 'outgoing', other_user: { id: payer.id, username: payer.username } } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAppUser(request);
    const body = await request.json() as { id?: string; status?: string };
    if (!body.id || body.status !== 'declined') {
      return NextResponse.json({ error: 'Only pending incoming requests can be declined.' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from('payment_requests').update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', body.id).eq('payer_user_id', user.id).eq('status', 'pending')
      .select('id, status').maybeSingle();
    if (error) throw new Error('Could not update the payment request.');
    if (!data) return NextResponse.json({ error: 'This payment request is no longer pending.' }, { status: 409 });
    return NextResponse.json({ request: data });
  } catch (error) {
    return apiError(error);
  }
}
