'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Clock3, ExternalLink, RefreshCw, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePrivateWallet } from '@/providers/private-wallet-provider';
import { USDC_MINT } from '@/lib/solana';

type Payment = {
  id: string;
  amount: string;
  token: string;
  status: string;
  privacy_status: string;
  transaction_signature: string | null;
  created_at: string | null;
  direction: 'sent' | 'received';
  sender: { username: string; wallet_address: string } | null;
  recipient: { username: string; wallet_address: string } | null;
  privateWallet?: boolean;
};

const short = (value: string) => `${value.slice(0, 4)}...${value.slice(-4)}`;
const toRawAmount = (value: string) => {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * BigInt(1_000_000) + BigInt(fraction.padEnd(6, '0'));
};

export default function HistoryPage() {
  const { getAccessToken, ready } = usePrivy();
  const { privateTransactions, state: privateWalletState } = usePrivateWallet();
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const confirmingRef = useRef(new Set<string>());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/payments', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Couldn’t load your payment activity.');
      setPayments(body.payments);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Couldn’t load your payment activity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (ready) void load(); }, [ready]);

  useEffect(() => {
    if (!payments?.length) return;
    for (const payment of payments) {
      if (!['submitted', 'processing'].includes(payment.status) || !payment.transaction_signature || confirmingRef.current.has(payment.transaction_signature)) continue;
      const matches = payment.direction === 'received' && privateWalletState === 'ready' && privateTransactions.some((tx) => tx.direction === 'inbound'
        && tx.id.signature === payment.transaction_signature
        && tx.asset === USDC_MINT.toBase58()
        && tx.amount === toRawAmount(payment.amount));
      if (payment.direction === 'received' && !matches) continue;
      confirmingRef.current.add(payment.transaction_signature);
      void (async () => {
        try {
          const token = await getAccessToken();
          const endpoint = payment.direction === 'sent' ? '/api/payments/verify' : '/api/payments/confirm';
          const body = payment.direction === 'sent' ? { payment_id: payment.id, signature: payment.transaction_signature } : { signature: payment.transaction_signature };
          const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
          if (response.ok) await load();
        } finally {
          confirmingRef.current.delete(payment.transaction_signature!);
        }
      })();
    }
  }, [payments, privateTransactions, privateWalletState, getAccessToken]);

  if (loading) return <div className="mx-auto max-w-4xl space-y-4"><div className="h-8 w-44 animate-pulse rounded-lg bg-muted" /><div className="h-28 animate-pulse rounded-2xl bg-muted" />{[1, 2, 3].map((key) => <div key={key} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>;

  const recordedSignatures = new Set((payments ?? []).map((payment) => payment.transaction_signature).filter(Boolean));
  const protocolPayments: Payment[] = privateTransactions
    .filter((tx) => !recordedSignatures.has(tx.id.signature))
    .map((tx, index) => ({
      id: `helius-${tx.id.signature}-${index}`,
      amount: (Number(tx.amount) / 1_000_000).toString(),
      token: 'USDC',
      status: 'confirmed',
      privacy_status: 'private',
      transaction_signature: tx.id.signature,
      created_at: null,
      direction: tx.direction === 'outbound' ? 'sent' : 'received',
      sender: null,
      recipient: null,
      privateWallet: true,
    }));
  const allPayments = [...(payments ?? []), ...protocolPayments];
  const sentTotal = allPayments.filter((payment) => payment.direction === 'sent').reduce((sum, payment) => sum + Number(payment.amount), 0);
  const receivedTotal = allPayments.filter((payment) => payment.direction === 'received').reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-medium text-primary">Your activity</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Payment history</h1><p className="mt-2 text-sm text-muted-foreground">A clear record of money moving in and out.</p></div>
        <Button variant="outline" className="rounded-xl" onClick={() => void load()}><RefreshCw className="size-4" />Refresh</Button>
      </header>

      <section aria-label="Activity totals" className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-2xl border-primary/15 bg-primary/[0.035]"><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-sm text-muted-foreground">Received</p><p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{receivedTotal.toLocaleString(undefined, { maximumFractionDigits: 6 })} <span className="text-sm text-muted-foreground">USDC</span></p></div><span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><ArrowDownLeft className="size-5" aria-hidden="true" /></span></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-sm text-muted-foreground">Sent</p><p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{sentTotal.toLocaleString(undefined, { maximumFractionDigits: 6 })} <span className="text-sm text-muted-foreground">USDC</span></p></div><span className="grid size-11 place-items-center rounded-2xl bg-muted text-foreground"><ArrowUpRight className="size-5" aria-hidden="true" /></span></CardContent></Card>
      </section>

      <section aria-labelledby="recent-activity-title">
        <div className="mb-3 flex items-center justify-between"><div><h2 id="recent-activity-title" className="text-lg font-semibold">Recent activity</h2><p className="mt-1 text-sm text-muted-foreground">{allPayments.length} {allPayments.length === 1 ? 'payment' : 'payments'}</p></div></div>
        {error ? <Card className="rounded-2xl"><CardContent className="flex items-start gap-3 py-6"><AlertCircle className="size-5 text-destructive" aria-hidden="true" /><div><p className="font-medium">Couldn’t load payments</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-3 rounded-xl" variant="outline" onClick={() => void load()}>Try again</Button></div></CardContent></Card>
          : allPayments.length === 0 ? <Card className="rounded-2xl"><CardContent className="flex flex-col items-center py-12 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><WalletCards className="size-7" aria-hidden="true" /></span><h3 className="mt-4 font-semibold">No payments yet</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">Your sent and received payments will show up here when you start using SwiftPay.</p></CardContent></Card>
            : <div className="space-y-3">{allPayments.map((payment) => {
              const other = payment.direction === 'sent' ? payment.recipient : payment.sender;
              const isSent = payment.direction === 'sent';
              const otherLabel = other?.username ? `@${other.username}` : other?.wallet_address ? short(other.wallet_address) : isSent ? 'Private recipient' : 'Private sender';
              return <Card key={payment.id} className="rounded-2xl transition-colors hover:border-primary/25">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex min-w-0 items-center gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${isSent ? 'bg-muted text-foreground' : 'bg-primary/10 text-primary'}`}>{isSent ? <ArrowUpRight className="size-5" aria-hidden="true" /> : <ArrowDownLeft className="size-5" aria-hidden="true" />}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{isSent ? 'Sent payment' : 'Received payment'}</p><p className="mt-1 truncate text-xs text-muted-foreground">{isSent ? 'To' : 'From'} {otherLabel}{payment.privateWallet ? ' · Private' : ''}{payment.created_at ? ` · ${new Date(payment.created_at).toLocaleString()}` : ''}</p></div></div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end"><div className="text-left sm:text-right"><p className={`font-mono text-base font-semibold tabular-nums ${isSent ? '' : 'text-primary'}`}>{isSent ? '−' : '+'}{Number(payment.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} <span className="text-xs text-muted-foreground">{payment.token}</span></p><span className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-medium capitalize text-muted-foreground"><Clock3 className="size-3" aria-hidden="true" />{payment.status}</span></div>{payment.transaction_signature && <a aria-label="View transaction on Solana Explorer" href={`https://explorer.solana.com/tx/${payment.transaction_signature}?cluster=devnet`} target="_blank" rel="noreferrer" className="grid size-10 shrink-0 place-items-center rounded-xl text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ExternalLink className="size-4" aria-hidden="true" /></a>}</div>
                </CardContent>
              </Card>;
            })}</div>}
      </section>
      {allPayments.some((payment) => payment.privateWallet) && <p className="text-xs leading-5 text-muted-foreground">Private amounts shown here are decrypted by your local wallet sync. Explorer links show transaction metadata.</p>}
    </div>
  );
}
