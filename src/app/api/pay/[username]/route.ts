import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/server-auth';
import { registeredPrivateWallet } from '@/lib/helius-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username: rawUsername } = await params;
    const username = decodeURIComponent(rawUsername).replace(/^@/, '').toLowerCase();
    const { data, error } = await supabaseAdmin.from('users').select('id, username, wallet_address').eq('username', username).maybeSingle();
    if (error) throw new Error('Couldn’t find this SwiftPay profile.');
    if (!data) return NextResponse.json({ error: 'This SwiftPay username does not exist.' }, { status: 404 });
    const registered = await registeredPrivateWallet(data.wallet_address);
    if (!registered) return NextResponse.json({ error: 'This user has not activated private receiving yet. Ask them to sign in to SwiftPay, open Receive, and finish the one-time wallet setup.' }, { status: 409 });
    return NextResponse.json({ recipient: { id: data.id, username: data.username, walletAddress: data.wallet_address } });
  } catch (error) { return apiError(error); }
}
