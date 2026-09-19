import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { apiError, verifiedSolanaWallet } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { username, wallet_address } = await request.json() as { username?: string; wallet_address?: string };
    const normalizedUsername = username?.trim().toLowerCase();
    if (!normalizedUsername || !/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) return NextResponse.json({ error: 'Username must be 3–24 letters, numbers, or underscores.' }, { status: 400 });
    if (!wallet_address) return NextResponse.json({ error: 'A Solana wallet is required.' }, { status: 400 });
    new PublicKey(wallet_address);
    const auth = await verifiedSolanaWallet(request, wallet_address);
    const { data: existing } = await supabaseAdmin.from('users').select('id').eq('privy_user_id', auth.user_id).maybeSingle();
    if (existing) return NextResponse.json({ error: 'Your profile already exists.' }, { status: 409 });
    const { data, error } = await supabaseAdmin.from('users').insert({ privy_user_id: auth.user_id, username: normalizedUsername, wallet_address }).select('id, username, wallet_address').single();
    if (error) return NextResponse.json({ error: error.code === '23505' ? 'That username or wallet is already in use.' : 'Couldn’t create your profile.' }, { status: 400 });
    return NextResponse.json({ user: data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
