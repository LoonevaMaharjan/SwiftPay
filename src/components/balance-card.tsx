'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletAddress } from '@/hooks/use-wallet-address';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';

export function BalanceCard() {
  const { address } = useWalletAddress();
  const { balance, loading } = useUsdcBalance(address);
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <p className="text-3xl font-semibold">{balance?.toFixed(2)} USDC</p>
        )}
        <div className="mt-4 flex items-center gap-2">
          <span className="truncate font-mono text-xs text-muted-foreground">
            {address ?? '...'}
          </span>
          <Button variant="ghost" size="sm" onClick={copyAddress}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}