'use client';

import { useCallback, useState } from 'react';
import { usePrivateWallet } from '@/providers/private-wallet-provider';

export type TransferState = 'idle' | 'signing' | 'confirming' | 'success' | 'error';

export function useSendUsdc() {
  const { transfer } = usePrivateWallet();
  const [state, setState] = useState<TransferState>('idle');
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);

  const send = useCallback(async ({ recipient, amount }: { wallet?: unknown; recipient: string; amount: bigint }) => {
    setState('signing'); setError(null); setSignature(null);
    try {
      const result = await transfer(recipient, amount);
      setSignature(result.signature); setConfirmationPending(!result.indexed); setState('success');
      return result.signature;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not complete the private payment.';
      setError(message); setState('error'); throw cause;
    }
  }, [transfer]);

  return { send, state, signature, error, confirmationPending, reset: () => { setState('idle'); setError(null); setSignature(null); setConfirmationPending(false); } };
}
