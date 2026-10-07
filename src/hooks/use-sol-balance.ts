'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSolBalance } from '@/lib/solana';

export function useSolBalance(address: string | null) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) {
      setBalance(null);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      setBalance(await getSolBalance(address));
    } catch (cause) {
      console.error('Failed to fetch SOL balance', cause);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { balance, loading, error, refresh };
}
