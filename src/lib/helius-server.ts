import 'server-only';
import { address, signature as toKitSignature } from '@solana/kit';
import { createZolanaClient } from '@heliuslabs/zolana';
import { isWalletRegistered } from '@heliuslabs/zolana/wallet';
import { Connection, PublicKey } from '@solana/web3.js';

function getRpcUrl() {
  const key = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY;
  return process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL || (key ? `https://devnet.helius-rpc.com/?api-key=${key}` : '');
}

export async function verifyPrivatePayment(signature: string, ownerAddress: string) {
  const rpcUrl = getRpcUrl();
  if (!rpcUrl) throw new Error('Helius Privacy is not configured. Set HELIUS_API_KEY or NEXT_PUBLIC_HELIUS_API_KEY.');
  const connection = new Connection(rpcUrl, 'confirmed');
  const matchingSignature = await connection.getSignaturesForAddress(new PublicKey(ownerAddress), { limit: 1000 });
  const chainRecord = matchingSignature.find((item) => item.signature === signature);
  if (!chainRecord) return { confirmed: false as const };
  if (chainRecord.err) throw new Error('Solana rejected this transaction.');
  // The Privacy SDK transaction format may not be understood by web3.js parsers.
  // The address history proves this owner signed/paid; Helius indexer confirmation
  // below proves a private protocol event was indexed for the same signature.
  const client = await createZolanaClient({
    solanaRpcUrl: rpcUrl,
    indexerUrl: process.env.HELIUS_INDEXER_URL || 'https://d2xah7tnhdhcom.cloudfront.net',
    proverUrl: process.env.HELIUS_PROVER_URL || 'https://d21ni15goiip6l.cloudfront.net',
  });
  await client.confirmPrivateTransaction(toKitSignature(signature));
  return { confirmed: true as const };
}

export async function registeredPrivateWallet(ownerAddress: string) {
  const rpcUrl = getRpcUrl();
  if (!rpcUrl) throw new Error('Helius Privacy is not configured on the server. Set HELIUS_API_KEY or NEXT_PUBLIC_HELIUS_API_KEY.');
  const client = await createZolanaClient({
    solanaRpcUrl: rpcUrl,
    indexerUrl: process.env.HELIUS_INDEXER_URL || 'https://d2xah7tnhdhcom.cloudfront.net',
    proverUrl: process.env.HELIUS_PROVER_URL || 'https://d21ni15goiip6l.cloudfront.net',
  });
  return isWalletRegistered({ rpc: client, owner: address(ownerAddress) });
}
