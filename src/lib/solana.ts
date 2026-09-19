import { clusterApiUrl, Connection, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountIdempotentInstruction, createTransferCheckedInstruction, getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';

export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

export function getConnection() {
  return new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet'), 'confirmed');
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 10_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('The Solana network took too long to respond.')), timeoutMs)),
  ]);
}

export async function getUsdcBalance(walletAddress: string): Promise<number> {
  const connection = getConnection();
  const owner = new PublicKey(walletAddress);
  const ata = await getAssociatedTokenAddress(USDC_MINT, owner);

  try {
    const account = await withTimeout(getAccount(connection, ata));
    return Number(account.amount) / 1_000_000;
  } catch (err) {
    if (err instanceof TokenAccountNotFoundError) {
      return 0;
    }
    throw err;
  }
}

export async function buildUsdcTransfer({ sender, recipient, amount }: { sender: string; recipient: string; amount: bigint }) {
  const connection = getConnection();
  const owner = new PublicKey(sender);
  const destination = new PublicKey(recipient);
  const sourceAta = await getAssociatedTokenAddress(USDC_MINT, owner);
  const destinationAta = await getAssociatedTokenAddress(USDC_MINT, destination);
  const { blockhash, lastValidBlockHeight } = await withTimeout(connection.getLatestBlockhash('confirmed'));

  const message = new TransactionMessage({
    payerKey: owner,
    recentBlockhash: blockhash,
    instructions: [
      createAssociatedTokenAccountIdempotentInstruction(owner, destinationAta, destination, USDC_MINT),
      createTransferCheckedInstruction(sourceAta, USDC_MINT, destinationAta, owner, amount, 6),
    ],
  }).compileToV0Message();

  return { transaction: new VersionedTransaction(message), blockhash, lastValidBlockHeight };
}
