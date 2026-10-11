'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, LoaderCircle, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSolBalance } from '@/hooks/use-sol-balance';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';
import { useWalletAddress } from '@/hooks/use-wallet-address';
import { usePrivateWallet } from '@/providers/private-wallet-provider';
import { formatZolanaError } from '@/lib/zolana-errors';

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
    if (sol !== null && sol < 0.002) {
      setActionError('You need Devnet SOL to pay Solana network fees before depositing. Please claim free Devnet SOL from the faucet.');
      return;
    }
    setActionError(null);
    setDepositing(true);
    try {
      await prepare();
      await deposit(raw);
      setAmount('');
      await Promise.all([refreshPublic(), refreshPrivate(), refreshSol()]);
    } catch (cause) {
      setActionError(formatZolanaError(cause));
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

  return <div className="mx-auto max-w-4xl space-y-6 pb-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-primary">Wallet</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Your balances</h1><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">See what’s available and keep a little SOL ready for network fees.</p></div>
      <Button variant="outline" className="rounded-xl" onClick={refreshAll}><RefreshCw className="size-4" />Refresh balances</Button>
    </header>

    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="relative overflow-hidden rounded-3xl border-primary/15 bg-brand-bg shadow-none sm:col-span-2">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-24 size-64 rounded-full border border-primary/15" />
        <CardHeader className="relative pb-2"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-sm font-medium text-primary"><WalletCards className="size-4" aria-hidden="true" /> Private balance</div><CardTitle className="mt-4 font-mono text-4xl tracking-tight tabular-nums sm:text-5xl">{privateUsdc === null ? (state === 'loading' ? 'Loading…' : '—') : privateUsdc.toFixed(6)} <span className="text-xl font-medium text-muted-foreground">USDC</span></CardTitle></div><span className="rounded-full border border-primary/15 bg-card/80 px-3 py-1.5 text-xs font-medium text-primary">SwiftPay wallet</span></div></CardHeader>
        <CardContent className="relative flex flex-wrap items-center justify-between gap-3 pt-3">
          <p className="text-sm text-muted-foreground">Funds available for SwiftPay private payments.</p>
          {privateUsdc === null && <Button variant="outline" className="rounded-xl bg-card" onClick={() => void initialize().catch(() => undefined)}><RefreshCw className="size-4"/>Load balance</Button>}
          {walletError && <p className="w-full text-sm text-destructive" role="alert">{walletError}</p>}
        </CardContent>
      </Card>
      <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Public USDC</CardTitle><CardDescription>USDC in your connected wallet.</CardDescription></CardHeader><CardContent><p className="font-mono text-2xl font-semibold tabular-nums">{publicLoading ? 'Loading…' : publicError ? 'Unavailable' : `${(publicUsdc ?? 0).toFixed(6)} USDC`}</p>{publicError && <p className="mt-2 text-xs text-destructive">Could not load public USDC. Refresh and try again.</p>}</CardContent></Card>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">SOL for fees</CardTitle>
          <CardDescription>SOL pays Solana network fees for deposits and private transfers.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-2xl font-semibold tabular-nums">{solLoading ? 'Loading…' : solError ? 'Unavailable' : `${(sol ?? 0).toFixed(6)} SOL`}</p>
          {!solLoading && !solError && (sol ?? 0) < 0.01 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <a className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4" href="https://faucet.solana.com/" target="_blank" rel="noreferrer">
                Solana Faucet <ExternalLink className="size-3"/>
              </a>
              <span className="text-muted-foreground">•</span>
              <a className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4" href="https://faucet.quicknode.com/solana/devnet" target="_blank" rel="noreferrer">
                QuickNode Faucet <ExternalLink className="size-3"/>
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Add to private balance</CardTitle>
        <CardDescription>Deposit public USDC into Helius Privacy before sending privately.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sol !== null && !solLoading && sol < 0.002 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
            <span>
              <strong>Devnet SOL required:</strong> Solana transactions require Devnet SOL to pay network gas fees for registration and deposits.
            </span>
            <a href="https://faucet.solana.com/" target="_blank" rel="noreferrer" className="shrink-0 font-semibold underline inline-flex items-center gap-1">
              Get Devnet SOL <ExternalLink className="size-3" />
            </a>
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label htmlFor="private-deposit-amount" className="text-sm font-medium">Amount</label>
            <div className="mt-1 flex h-11 items-center rounded-lg border bg-background pr-3">
              <input id="private-deposit-amount" value={amount} onChange={(event) => setAmount(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" placeholder="0.00" inputMode="decimal"/>
              <span className="text-sm text-muted-foreground">USDC</span>
            </div>
          </div>
          <Button
            onClick={addToPrivateBalance}
            disabled={depositing || publicLoading || (publicUsdc ?? 0) <= 0 || (sol !== null && sol < 0.002)}
            aria-busy={depositing}
          >
            {depositing ? <><LoaderCircle className="size-4 animate-spin"/>Depositing…</> : 'Deposit privately'}
          </Button>
        </div>
      {actionError && <p className="text-sm text-destructive" role="alert">{actionError}</p>}
      <div className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-amber-600" aria-hidden="true"/>The deposit from your public wallet is visible on-chain. SwiftPay private transfers hide the payment amount and asset; wallet addresses remain visible.</div>
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Your Solana wallet</CardTitle><CardDescription>Send USDC to this address from another wallet to fund it.</CardDescription></CardHeader><CardContent><div className="flex flex-wrap items-center gap-2"><code className="min-w-0 flex-1 break-all rounded-md bg-muted p-3 text-xs">{address}</code><Button variant="outline" size="icon" aria-label="Copy wallet address" onClick={() => void copyAddress()}>{copied ? <Check className="size-4"/> : <Copy className="size-4"/>}</Button></div></CardContent></Card>
  </div>;
}
