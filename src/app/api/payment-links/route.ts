import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { apiError, verifiedSolanaWallet } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get('walletAddress')?.trim();
    if (!walletAddress) return NextResponse.json({ error: 'A wallet address is required.' }, { status: 400 });
    new PublicKey(walletAddress);
    await verifiedSolanaWallet(request, walletAddress);
    const paymentUrl = new URL('/dashboard/send', request.nextUrl.origin);
    paymentUrl.searchParams.set('recipient', walletAddress);

    return NextResponse.json({
      paymentLink: paymentUrl.toString(),
      recipient: { walletAddress },
    });
  } catch (error) {
    return apiError(error);
  }
}
