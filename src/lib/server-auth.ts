import { PrivyClient } from '@privy-io/node';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

type AppUser = { id: string; privy_user_id: string; username: string; email: string | null; wallet_address: string };

function client() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET; 
  const configuredJwtVerificationKey = process.env.PRIVY_JWT_VERIFICATION_KEY?.trim().replace(/\\n/g, '\n');
  // A complete SPKI key overrides Privy's JWKS endpoint. Empty values and
  // copied placeholders fall back to the SDK's built-in JWKS verification.
  const jwtVerificationKey = configuredJwtVerificationKey?.startsWith('-----BEGIN PUBLIC KEY-----') && configuredJwtVerificationKey.includes('-----END PUBLIC KEY-----')
    ? configuredJwtVerificationKey
    : undefined;
  if (!appId || !appSecret) throw new Error('Server authentication is not configured. Set PRIVY_APP_SECRET.');
  return new PrivyClient({ appId, appSecret, jwtVerificationKey });
}

export async function requirePrivyUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Sign in to continue.');
  try {
    return await client().utils().auth().verifyAccessToken(token);
  } catch (error) {
    console.error('REAL AUTH ERROR:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    if (error instanceof Error && /invalid app id or app secret/i.test(error.message)) {
      throw new Error('Server authentication is misconfigured. Check that PRIVY_APP_SECRET belongs to NEXT_PUBLIC_PRIVY_APP_ID.');
    }
    throw new Error('Your session has expired. Please sign in again.');
  }
}

export async function requireAppUser(request: NextRequest): Promise<AppUser> {
  const auth = await requirePrivyUser(request);
  const { data, error } = await supabaseAdmin.from('users').select('id, privy_user_id, username, email, wallet_address').eq('privy_user_id', auth.user_id).maybeSingle();
  if (error) throw new Error('Couldn’t load your SwiftPay profile.');
  if (!data) throw new Error('Complete your SwiftPay profile before sending payments.');
  return data;
}

export async function verifiedSolanaWallet(request: NextRequest, walletAddress: string) {
  const auth = await requirePrivyUser(request);
  const user = await client().users()._get(auth.user_id);
  const ownsWallet = user.linked_accounts.some((account) => account.type === 'wallet' && account.chain_type === 'solana' && account.address === walletAddress);
  if (!ownsWallet) throw new Error('That wallet is not linked to your Privy account.');
  return auth;
}

export function apiError(error: unknown, fallback = 'Request failed.') {
  const message = error instanceof Error ? error.message : fallback;
  const status = /sign in|session has expired/i.test(message) ? 401 : /not configured|misconfigured|invalid app id or app secret/i.test(message) ? 503 : 400;
  return Response.json({ error: message }, { status });
}
