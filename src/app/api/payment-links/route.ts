import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { apiError, verifiedSolanaWallet } from '@/lib/server-auth';
import { registeredPrivateWallet } from '@/lib/helius-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get('walletAddress')?.trim();
    if (!walletAddress) return NextResponse.json({ error: 'A wallet address is required.' }, { status: 400 });
    new PublicKey(walletAddress);
    await verifiedSolanaWallet(request, walletAddress);
    const { data: profile, error } = await supabaseAdmin.from('users').select('username').eq('wallet_address', walletAddress).maybeSingle();
    if (error || !profile) throw new Error('Couldn’t load your SwiftPay profile.');
    if (!(await registeredPrivateWallet(walletAddress))) return NextResponse.json({ error: 'Your payment link is still being prepared. Please try again.' }, { status: 409 });
    const paymentUrl = new URL(`/pay/${encodeURIComponent(profile.username)}`, request.nextUrl.origin);

    return NextResponse.json({
      paymentLink: paymentUrl.toString(),
      recipient: { username: profile.username, walletAddress },
    });
  } catch (error) {
    return apiError(error);
  }
}
