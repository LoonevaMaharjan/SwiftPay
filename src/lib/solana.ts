import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';

export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

export function getConnection() {
  return new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
}

export async function estimateBaseSolFee(payerAddress: string, recipientAddress: string): Promise<number> {
  const connection = getConnection();
  const payer = new PublicKey(payerAddress);
  const recipient = new PublicKey(recipientAddress);
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  const message = new Transaction({ feePayer: payer, recentBlockhash: blockhash })
    .add(SystemProgram.transfer({ fromPubkey: payer, toPubkey: recipient, lamports: 1 }))
    .compileMessage();
  const fee = await connection.getFeeForMessage(message, 'confirmed');
  if (fee === null) throw new Error('Solana could not estimate the transaction fee.');
  return fee / LAMPORTS_PER_SOL;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 15_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('The Solana network took too long to respond.')), timeoutMs);
    promise.then(
      (value) => { clearTimeout(timeout); resolve(value); },
      (error) => { clearTimeout(timeout); reject(error); },
    );
  });
}

async function withRpcRetry<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await withTimeout(request());
  } catch (firstError) {
    // Public devnet RPCs occasionally drop browser requests. Retry once after
    // a short pause so transient fetch failures don't appear as a zero balance.
    await new Promise((resolve) => setTimeout(resolve, 700));
    try {
      return await withTimeout(request());
    } catch {
      throw firstError;
    }
  }
}

export async function getUsdcBalance(walletAddress: string): Promise<number> {
  const connection = getConnection();
  const owner = new PublicKey(walletAddress);
  const ata = await getAssociatedTokenAddress(USDC_MINT, owner);

  try {
    const account = await withRpcRetry(() => getAccount(connection, ata));
    return Number(account.amount) / 1_000_000;
  } catch (err) {
    if (err instanceof TokenAccountNotFoundError) {
      return 0;
    }
    throw err;
  }
}

export async function getSolBalance(walletAddress: string): Promise<number> {
  const lamports = await withRpcRetry(() => getConnection().getBalance(new PublicKey(walletAddress), 'confirmed'));
  return lamports / 1_000_000_000;
}
