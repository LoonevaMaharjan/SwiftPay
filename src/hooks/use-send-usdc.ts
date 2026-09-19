'use client';

import bs58 from 'bs58';
import { useCallback, useState } from 'react';
import { useSignAndSendTransaction } from '@privy-io/react-auth/solana';
import { getConnection, buildUsdcTransfer } from '@/lib/solana';
import type { ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana';

export type TransferState = 'idle' | 'signing' | 'confirming' | 'success' | 'error';

export function useSendUsdc() {
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const [state, setState] = useState<TransferState>('idle');
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async ({ wallet, recipient, amount }: { wallet: ConnectedStandardSolanaWallet; recipient: string; amount: bigint }) => {
    setState('signing'); setError(null); setSignature(null);
    try {
      const { transaction, blockhash, lastValidBlockHeight } = await buildUsdcTransfer({ sender: wallet.address, recipient, amount });
      const result = await signAndSendTransaction({ transaction: transaction.serialize(), wallet, chain: 'solana:devnet' });
      const transactionSignature = bs58.encode(result.signature);
      setSignature(transactionSignature);
      setState('confirming');
      const confirmation = await getConnection().confirmTransaction({ signature: transactionSignature, blockhash, lastValidBlockHeight }, 'confirmed');
      if (confirmation.value.err) throw new Error('The network rejected this transfer. Your funds have not been sent.');
      setState('success');
      return transactionSignature;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Couldn’t send the payment. Please try again.';
      setError(/reject|cancel/i.test(message) ? 'Signature cancelled. No payment was sent.' : message);
      setState('error');
      throw cause;
    }
  }, [signAndSendTransaction]);

  return { send, state, signature, error, reset: () => { setState('idle'); setError(null); setSignature(null); } };
}
