import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { apiError, requireAppUser } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { registeredPrivateWallet } from '@/lib/helius-server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await requireAppUser(request);
    const query = request.nextUrl.searchParams.get('query')?.trim();
    if (!query || query.length > 320) return NextResponse.json({ error: 'Enter a recipient.' }, { status: 400 });
    let filter: string;
    try { new PublicKey(query); filter = `wallet_address.eq.${query}`; }
    catch { filter = query.includes('@') ? `email.eq.${query.toLowerCase()}` : `username.ilike.${query.toLowerCase()}`; }
    const { data, error } = await supabaseAdmin.from('users').select('id, username, wallet_address').or(filter).maybeSingle();
    if (error) throw new Error('Couldn’t resolve that recipient.');
    if (!data) return NextResponse.json({ error: 'No SwiftPay user matched that recipient.' }, { status: 404 });
    new PublicKey(data.wallet_address);
    const privateWalletRegistered = await registeredPrivateWallet(data.wallet_address);
    if (!privateWalletRegistered) return NextResponse.json({ error: 'This recipient has a SwiftPay profile but has not activated private receiving yet. Ask them to sign in, open Receive, and finish the one-time wallet setup. They may need a small amount of Devnet SOL for the setup transaction.' }, { status: 409 });
    return NextResponse.json({ recipient: { id: data.id, username: data.username, walletAddress: data.wallet_address, privateWalletRegistered } });
  } catch (error) { return apiError(error); }
}
