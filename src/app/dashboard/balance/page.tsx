'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSolBalance } from '@/hooks/use-sol-balance';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';
import { useWalletAddress } from '@/hooks/use-wallet-address';
import { usePrivateWallet } from '@/providers/private-wallet-provider';

function toRawAmount(value: string): bigint | null {
  if (!/^\d+(\.\d{1,6})?$/.test(value) || Number(value) <= 0) return null;
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * BigInt(1_000_000) + BigInt(fraction.padEnd(6, '0'));
}

export default function BalancePage() {
  const { address, ready } = useWalletAddress();
  const { privateUsdc, state, error: walletError, prepare, deposit, refresh: refreshPrivate, initialize } = usePrivateWallet();
  const { balance: publicUsdc, loading: publicLoading, error: publicError, refresh: refreshPublic } = useUsdcBalance(address);
  const { balance: sol, loading: solLoading, error: solError, refresh: refreshSol } = useSolBalance(address);
  const [amount, setAmount] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [depositing, setDepositing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (address && state === 'disconnected') void initialize().catch(() => undefined);
  }, [address, state, initialize]);

  async function addToPrivateBalance() {
    const raw = toRawAmount(amount);
    if (!raw) { setActionError('Enter a valid USDC amount with up to 6 decimal places.'); return; }
    if (publicUsdc !== null && Number(amount) > publicUsdc) { setActionError('Your public USDC balance is lower than this amount.'); return; }
    setActionError(null);
    setDepositing(true);
    try {
      await prepare();
      await deposit(raw);
      setAmount('');
      await Promise.all([refreshPublic(), refreshPrivate()]);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not add USDC to your private balance.');
    } finally { setDepositing(false); }
  }

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function refreshAll() {
    await Promise.all([refreshPrivate().catch(() => initialize().catch(() => undefined)), refreshPublic(), refreshSol()]);
  }

  if (!ready || !address) return <div className="max-w-3xl space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-muted" /><div className="h-64 animate-pulse rounded-xl bg-muted" /></div>;

  return <div className="mx-auto max-w-3xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-3xl font-semibold tracking-tight">Balance</h1><p className="mt-2 text-sm text-muted-foreground">Manage private USDC, public USDC, and SOL for network fees.</p></div>
      <Button variant="outline" onClick={refreshAll}><RefreshCw className="size-4" />Refresh balances</Button>
    </header>

    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="border-primary/20 bg-primary/[0.035] sm:col-span-2">
        <CardHeader><CardTitle>Private USDC</CardTitle><CardDescription>Funds here are available for SwiftPay private payments.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap items-end justify-between gap-4">
          <p className="font-mono text-4xl font-semibold tabular-nums">{privateUsdc === null ? (state === 'loading' ? 'Loading…' : '—') : `${privateUsdc.toFixed(6)} USDC`}</p>
          {privateUsdc === null && <Button variant="outline" onClick={() => void initialize().catch(() => undefined)}><RefreshCw className="size-4"/>Load private balance</Button>}
          {walletError && <p className="w-full text-sm text-destructive" role="alert">{walletError}</p>}
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Public USDC</CardTitle><CardDescription>USDC in your wallet that can be deposited privately.</CardDescription></CardHeader><CardContent><p className="font-mono text-2xl font-semibold tabular-nums">{publicLoading ? 'Loading…' : publicError ? 'Unavailable' : `${(publicUsdc ?? 0).toFixed(6)} USDC`}</p>{publicError && <p className="mt-2 text-xs text-destructive">Could not load public USDC. Refresh and try again.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>SOL for fees</CardTitle><CardDescription>SOL pays Solana network fees for deposits and private transfers.</CardDescription></CardHeader><CardContent><p className="font-mono text-2xl font-semibold tabular-nums">{solLoading ? 'Loading…' : solError ? 'Unavailable' : `${(sol ?? 0).toFixed(6)} SOL`}</p>{!solLoading && !solError && (sol ?? 0) < 0.01 && <a className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-4" href="https://faucet.solana.com/" target="_blank" rel="noreferrer">Get Devnet SOL <ExternalLink className="size-3.5"/></a>}</CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle>Add to private balance</CardTitle><CardDescription>Deposit public USDC into Helius Privacy before sending privately.</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="flex flex-wrap items-end gap-3"><div className="min-w-48 flex-1"><label htmlFor="private-deposit-amount" className="text-sm font-medium">Amount</label><div className="mt-1 flex h-11 items-center rounded-lg border bg-background pr-3"><input id="private-deposit-amount" value={amount} onChange={(event) => setAmount(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" placeholder="0.00" inputMode="decimal"/><span className="text-sm text-muted-foreground">USDC</span></div></div><Button onClick={addToPrivateBalance} disabled={depositing || publicLoading || (publicUsdc ?? 0) <= 0} aria-busy={depositing}>{depositing ? <><LoaderCircle className="size-4 animate-spin"/>Depositing…</> : 'Deposit privately'}</Button></div>
      {actionError && <p className="text-sm text-destructive" role="alert">{actionError}</p>}
      <div className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-amber-600" aria-hidden="true"/>The deposit from your public wallet is visible on-chain. SwiftPay private transfers hide the payment amount and asset; wallet addresses remain visible.</div>
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Your Solana wallet</CardTitle><CardDescription>Send USDC to this address from another wallet to fund it.</CardDescription></CardHeader><CardContent><div className="flex flex-wrap items-center gap-2"><code className="min-w-0 flex-1 break-all rounded-md bg-muted p-3 text-xs">{address}</code><Button variant="outline" size="icon" aria-label="Copy wallet address" onClick={() => void copyAddress()}>{copied ? <Check className="size-4"/> : <Copy className="size-4"/>}</Button></div></CardContent></Card>
  </div>;
}
