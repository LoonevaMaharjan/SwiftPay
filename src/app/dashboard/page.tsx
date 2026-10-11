'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Banknote, Clock3, ExternalLink, HandCoins, History, Sparkles, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { BalanceCard } from '@/components/balance-card';
import { readJsonResponse } from '@/lib/read-json-response';
import { usePrivateWallet } from '@/providers/private-wallet-provider';
import { USDC_MINT } from '@/lib/solana';

type ProfileResponse = { user?: { username?: string | null }; error?: string };
type DashboardPayment = {
  id: string;
  amount: string;
  token: string;
  status: string;
  created_at: string | null;
  direction: 'sent' | 'received';
  sender: { username: string; wallet_address: string } | null;
  recipient: { username: string; wallet_address: string } | null;
  transaction_signature: string | null;
};

const actions = [
  { href: '/dashboard/send', label: 'Send money', detail: 'Pay someone', icon: ArrowUpRight },
  { href: '/dashboard/receive', label: 'Receive', detail: 'Share your link', icon: ArrowDownLeft },
  { href: '/dashboard/requests', label: 'Requests', detail: 'Ask or pay', icon: HandCoins },
  { href: '/dashboard/history', label: 'Activity', detail: 'All payments', icon: History },
];

export default function DashboardPage() {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const { privateTransactions } = usePrivateWallet();
  const [username, setUsername] = useState<string | null>(null);
  const [recentPayments, setRecentPayments] = useState<DashboardPayment[]>([]);
  const [recentStatus, setRecentStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [recentRetry, setRecentRetry] = useState(0);

  const recordedSignatures = new Set(recentPayments.map((payment) => payment.transaction_signature).filter(Boolean));
  const walletPayments: DashboardPayment[] = privateTransactions
    .filter((transaction) => transaction.asset === USDC_MINT.toBase58() && !recordedSignatures.has(transaction.id.signature))
    .map((transaction, index) => ({
      id: `wallet-${transaction.id.signature}-${index}`,
      amount: (Number(transaction.amount) / 1_000_000).toString(),
      token: 'USDC',
      status: 'confirmed',
      created_at: null,
      direction: transaction.direction === 'outbound' ? 'sent' : 'received',
      sender: null,
      recipient: null,
      transaction_signature: transaction.id.signature,
    }));
  const displayedPayments = [...recentPayments, ...walletPayments].slice(0, 3);

  useEffect(() => {
    if (!ready || !authenticated) return;
    let active = true;
    void (async () => {
      try {
        const token = await getAccessToken();
        const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const data = await response.json() as ProfileResponse;
        if (active && data.user?.username) setUsername(data.user.username);
      } catch {
        // The dashboard remains usable if the greeting profile lookup is temporarily unavailable.
      }
    })();
    return () => { active = false; };
  }, [ready, authenticated, getAccessToken]);

  useEffect(() => {
    if (!ready || !authenticated) return;
    let active = true;
    void (async () => {
      try {
        setRecentStatus('loading');
        const token = await getAccessToken();
        const response = await fetch('/api/payments', { headers: { Authorization: `Bearer ${token}` } });
        const data = await readJsonResponse<{ payments: DashboardPayment[]; error?: string }>(response, '/api/payments');
        if (!response.ok) throw new Error(data.error ?? 'Could not load recent payments.');
        if (active) {
          setRecentPayments(data.payments.slice(0, 3));
          setRecentStatus('ready');
        }
      } catch {
        if (active) setRecentStatus('error');
      }
    })();
    return () => { active = false; };
  }, [ready, authenticated, getAccessToken, recentRetry]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-7 text-primary-foreground shadow-sm sm:px-9 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 size-72 rounded-full border border-primary-foreground/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-14 size-48 rounded-full border border-primary-foreground/10" />
        <div className="relative max-w-xl">
          <p className="flex items-center gap-2 text-sm font-medium text-primary-foreground/80"><Sparkles className="size-4" aria-hidden="true" /> Your SwiftPay home</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Good to see you{username ? `, @${username}` : ''}</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-primary-foreground/80">Your money, your people, all in one place. What would you like to do today?</p>
          <Link href="/dashboard/send" className={`${buttonVariants({ variant: 'secondary', size: 'lg' })} mt-6 min-h-11 rounded-xl px-5 font-semibold`}>
            Send USDC <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-label="Wallet balance" className="space-y-2">
        <BalanceCard />
        <Link href="/dashboard/balance" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Wallet className="size-4" aria-hidden="true" /> Wallet details and SOL <ArrowRight className="size-4" aria-hidden="true" /></Link>
      </section>

      <section aria-labelledby="dashboard-history-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div><h2 id="dashboard-history-title" className="text-lg font-semibold tracking-tight">Payment history</h2><p className="mt-1 text-sm text-muted-foreground">Your latest payments at a glance.</p></div>
          <Link href="/dashboard/history" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">See all <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
        {recentStatus === 'loading' ? <Card className="rounded-2xl"><CardContent className="space-y-3 p-4">{[1, 2].map((item) => <div key={item} className="h-10 animate-pulse rounded-lg bg-muted" />)}</CardContent></Card>
          : recentStatus === 'error' ? <Card className="rounded-2xl"><CardContent className="flex items-center gap-3 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><History className="size-4" aria-hidden="true" /></span><p className="text-sm text-muted-foreground">Recent payments are temporarily unavailable. <button type="button" onClick={() => setRecentRetry((retry) => retry + 1)} className="font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Retry</button></p></CardContent></Card>
          : displayedPayments.length ? <Card className="rounded-2xl"><CardContent className="divide-y divide-border p-0">{displayedPayments.map((payment) => {
          const sent = payment.direction === 'sent';
          const person = sent ? payment.recipient : payment.sender;
          const counterparty = person?.username ? `@${person.username}` : person?.wallet_address ? `${person.wallet_address.slice(0, 4)}…${person.wallet_address.slice(-4)}` : sent ? 'Private recipient' : 'Private sender';
          return <div key={payment.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${sent ? 'bg-muted text-foreground' : 'bg-primary/10 text-primary'}`}><IconForDirection sent={sent} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{sent ? 'To' : 'From'} {counterparty}</p><p className="mt-0.5 flex items-center gap-1 text-xs capitalize text-muted-foreground"><Clock3 className="size-3" aria-hidden="true" />{payment.created_at ? new Date(payment.created_at).toLocaleDateString() : payment.status}</p></div><p className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${sent ? '' : 'text-primary'}`}>{sent ? '−' : '+'}{Number(payment.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} <span className="text-xs text-muted-foreground">{payment.token}</span></p>{payment.transaction_signature && <a href={`https://explorer.solana.com/tx/${payment.transaction_signature}?cluster=devnet`} target="_blank" rel="noreferrer" aria-label="View transaction on Solana Explorer" className="grid size-9 shrink-0 place-items-center rounded-lg text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ExternalLink className="size-4" aria-hidden="true" /></a>}</div>;
        })}</CardContent></Card> : <Card className="rounded-2xl"><CardContent className="flex items-center gap-3 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><History className="size-4" aria-hidden="true" /></span><p className="text-sm text-muted-foreground">Your recent payments will appear here.</p></CardContent></Card>}
      </section>

      <section aria-labelledby="quick-actions-title">
        <div className="mb-3"><h2 id="quick-actions-title" className="text-lg font-semibold tracking-tight">Quick actions</h2></div>
        <Card className="rounded-2xl">
          <CardContent className="divide-y divide-border p-0">
          {actions.map(({ href, label, detail, icon: Icon }) => (
            <Link key={href} href={href} className="group flex min-h-16 items-center gap-3 px-4 py-2.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-primary/[0.035] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-4" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span></span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
            </Link>
          ))}
          </CardContent>
        </Card>
      </section>

      <Link href="/dashboard/cashout" className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Card className="rounded-2xl border-dashed border-primary/25 transition-colors group-hover:bg-primary/[0.025]">
          <CardContent className="flex items-center gap-3 p-4 sm:px-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Banknote className="size-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-sm font-semibold">Cash out <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Coming soon</span></span><span className="mt-1 block text-xs text-muted-foreground">Withdraw to a supported bank or payment method.</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" /></CardContent>
        </Card>
      </Link>
    </div>
  );
}

function IconForDirection({ sent }: { sent: boolean }) {
  const Icon = sent ? ArrowUpRight : ArrowDownLeft;
  return <Icon className="size-4" aria-hidden="true" />;
}
