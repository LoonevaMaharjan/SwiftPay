'use client';

import { useEffect, useState, useCallback } from 'react';
import { getUsdcBalance } from '@/lib/solana';

export function useUsdcBalance(address: string | null) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

// src/hooks/use-usdc-balance.ts
const refresh = useCallback(async () => {
  if (!address) {
    setLoading(false);   // ← was missing, caused infinite skeleton
    return;
  }
  setLoading(true);
  try {
    const bal = await getUsdcBalance(address);
    setBalance(bal);
  } catch (err) {
    console.error('Failed to fetch USDC balance', err);
  } finally {
    setLoading(false);
  }
}, [address]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { balance, loading, refresh };
}