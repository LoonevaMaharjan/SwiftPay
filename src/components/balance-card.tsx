'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletAddress } from '@/hooks/use-wallet-address';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';

export function BalanceCard() {
  const { address, ready } = useWalletAddress();
  const { balance, loading, error, refresh } = useUsdcBalance(address);
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !ready ? (
          <Skeleton className="h-9 w-40" />
        ) : error ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">Couldn’t load your balance.</p>
            <Button variant="outline" size="sm" onClick={refresh}>Try again</Button>
          </div>
        ) : !address ? (
          <div className="space-y-1"><p className="text-sm font-medium">Wallet unavailable</p><p className="text-xs text-muted-foreground">Refresh to retry wallet creation.</p></div>
        ) : (
          <p className="font-mono text-3xl font-semibold tabular-nums">{balance?.toFixed(2) ?? '0.00'} USDC</p>
        )}
        <div className="mt-4 flex items-center gap-2">
          <span className="truncate font-mono text-xs text-muted-foreground">
            {address ?? '...'}
          </span>
          <Button variant="ghost" size="sm" onClick={copyAddress} disabled={!address}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
