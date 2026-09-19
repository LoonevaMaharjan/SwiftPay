'use client';

import { useEffect, useState, useCallback } from 'react';
import { getUsdcBalance } from '@/lib/solana';

export function useUsdcBalance(address: string | null) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) {
      setBalance(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const bal = await getUsdcBalance(address);
      setBalance(bal);
    } catch (err) {
      console.error('Failed to fetch USDC balance', err);
      setError('Couldn’t load your USDC balance. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { balance, loading, error, refresh };
}
