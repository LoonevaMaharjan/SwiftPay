import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { apiError, requireAppUser } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
    return NextResponse.json({ recipient: { id: data.id, username: data.username, walletAddress: data.wallet_address } });
  } catch (error) { return apiError(error); }
}
