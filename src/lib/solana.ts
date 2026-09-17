import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';

export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

export function getConnection() {
  return new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, 'confirmed');
}

export async function getUsdcBalance(walletAddress: string): Promise<number> {
  const connection = getConnection();
  const owner = new PublicKey(walletAddress);
  const ata = await getAssociatedTokenAddress(USDC_MINT, owner);

  try {
    const account = await getAccount(connection, ata);
    return Number(account.amount) / 1_000_000;
  } catch (err) {
    if (err instanceof TokenAccountNotFoundError) {
      return 0;
    }
    throw err;
  }
}