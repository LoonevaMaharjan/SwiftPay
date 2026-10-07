'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletAddress } from '@/hooks/use-wallet-address';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';
import { useSolBalance } from '@/hooks/use-sol-balance';
import { usePrivateWallet } from '@/providers/private-wallet-provider';

function formatSol(balance: number) {
  return balance.toFixed(9).replace(/0+$/, '').replace(/\.$/, '');
}

export function BalanceCard() {
  const { address, ready } = useWalletAddress();
  const { balance, loading, error, refresh } = useUsdcBalance(address);
  const { privateUsdc, state: privateWalletState, error: privateWalletError, initialize } = usePrivateWallet();
  const { balance: solBalance, loading: solLoading, error: solError } = useSolBalance(address);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (address && privateWalletState === 'disconnected') void initialize().catch(() => undefined);
  }, [address, privateWalletState, initialize]);

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
          <div><p className="font-mono text-3xl font-semibold tabular-nums">{privateUsdc?.toFixed(6) ?? (privateWalletState === 'loading' ? 'Loading…' : '—')} USDC</p><p className="mt-1 text-xs text-muted-foreground">USDC available for SwiftPay payments.</p><p className="mt-3 text-xs text-muted-foreground">Public USDC available to add: {balance?.toFixed(2) ?? '0.00'} USDC</p>{privateWalletError && <div className="mt-2 flex items-center gap-2"><p className="text-xs text-destructive">Private balance is temporarily unavailable.</p><Button variant="link" size="sm" className="h-auto px-0 py-0 text-xs" onClick={() => void initialize().catch(() => undefined)}>Retry</Button></div>}</div>
        )}
        {address && (
          <div className="mt-3 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">SOL for fees</span>
              <span className="font-mono font-medium tabular-nums">
                {solLoading ? 'Loading…' : solError ? 'Unavailable' : `${formatSol(solBalance ?? 0)} SOL`}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              SOL is needed to pay transaction fees and may be needed to create a USDC account.
            </p>
            {!solLoading && !solError && solBalance !== null && solBalance < 0.01 && (
              <a className="mt-2 inline-block text-xs font-medium text-primary underline underline-offset-4" href="https://faucet.solana.com/" target="_blank" rel="noreferrer">
                Get Devnet SOL
              </a>
            )}
          </div>
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
