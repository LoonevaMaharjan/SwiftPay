'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePrivateWallet } from '@/providers/private-wallet-provider';
import { USDC_MINT } from '@/lib/solana';

type PendingReceipt = {
  direction: 'sent' | 'received';
  status: string;
  transaction_signature: string | null;
  amount: string;
};

function rawAmount(value: string) {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * BigInt(1_000_000) + BigInt(fraction.padEnd(6, '0'));
}

export function PaymentReconciler() {
  const { getAccessToken } = usePrivy();
  const { privateTransactions, state } = usePrivateWallet();
  const attempts = useRef(new Set<string>());
  const transactionsRef = useRef(privateTransactions);

  useEffect(() => { transactionsRef.current = privateTransactions; }, [privateTransactions]);

  const reconcile = useCallback(async () => {
    if (state !== 'ready') return;
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch('/api/payments', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const data = await response.json() as { payments: PendingReceipt[] };
      const usdcMint = USDC_MINT.toBase58();
      for (const payment of data.payments) {
        const signature = payment.transaction_signature;
        if (payment.direction !== 'received' || !['submitted', 'processing'].includes(payment.status) || !signature || attempts.current.has(signature)) continue;
        const expectedAmount = rawAmount(payment.amount);
        const isIncoming = transactionsRef.current.some((tx) => tx.direction === 'inbound'
          && tx.id.signature === signature
          && tx.asset === usdcMint
          && tx.amount === expectedAmount);
        if (!isIncoming) continue;
        attempts.current.add(signature);
        try {
          const result = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ signature }),
          });
          if (!result.ok) attempts.current.delete(signature);
        } catch {
          attempts.current.delete(signature);
        }
      }
    } catch {
      // A later scheduled reconciliation retries transient session or network errors.
    }
  }, [getAccessToken, state]);

  useEffect(() => {
    if (state !== 'ready') return;
    void reconcile();
    const interval = window.setInterval(() => { void reconcile(); }, 15_000);
    return () => window.clearInterval(interval);
  }, [reconcile, state]);

  return null;
}
