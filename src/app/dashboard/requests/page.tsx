'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowDownLeft, ArrowUpRight, Check, Clock3, HandCoins, LoaderCircle, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { readJsonResponse } from '@/lib/read-json-response';

type PaymentRequest = {
  id: string;
  amount: string;
  token: 'USDC';
  status: 'pending' | 'processing' | 'paid' | 'declined';
  created_at: string;
  direction: 'incoming' | 'outgoing';
  other_user: { id: string; username: string } | null;
};

type Filter = 'incoming' | 'outgoing';

export default function PaymentRequestsPage() {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filter, setFilter] = useState<Filter>('incoming');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadRequests = useCallback(async () => {
    if (!ready || !authenticated) return;
    setLoading(true);
    setError('');
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/payment-requests', { headers: { Authorization: `Bearer ${token}` } });
      const data = await readJsonResponse<{ requests: PaymentRequest[]; error?: string }>(response, '/api/payment-requests');
      if (!response.ok) throw new Error(data.error ?? 'Could not load your payment requests.');
      setRequests(data.requests);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load your payment requests.');
    } finally {
      setLoading(false);
    }
  }, [ready, authenticated, getAccessToken]);

  useEffect(() => { void loadRequests(); }, [loadRequests]);

  const visibleRequests = useMemo(() => requests.filter((item) => item.direction === filter), [requests, filter]);

  async function createRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipient, amount }),
      });
      const data = await readJsonResponse<{ request: PaymentRequest; error?: string }>(response, '/api/payment-requests');
      if (!response.ok) throw new Error(data.error ?? 'Could not create the payment request.');
      setRequests((current) => [data.request, ...current]);
      setRecipient('');
      setAmount('');
      setFilter('outgoing');
      setNotice('Payment request sent.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the payment request.');
    } finally {
      setSubmitting(false);
    }
  }

  async function declineRequest(id: string) {
    setError('');
    setNotice('');
    setWorkingId(id);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/payment-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status: 'declined' }),
      });
      const data = await readJsonResponse<{ error?: string }>(response, '/api/payment-requests');
      if (!response.ok) throw new Error(data.error ?? 'Could not decline this request.');
      setRequests((current) => current.map((item) => item.id === id ? { ...item, status: 'declined' } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not decline this request.');
    } finally {
      setWorkingId(null);
    }
  }

  return <div className="mx-auto max-w-2xl space-y-6">
    <header>
      <p className="text-sm font-medium text-primary">Requests</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Payment requests</h1>
      <p className="mt-2 text-sm text-muted-foreground">Ask a SwiftPay user to pay you, or review requests they’ve sent.</p>
    </header>

    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><HandCoins className="size-5" aria-hidden="true" /></span>
          <div><h2 className="font-semibold">Request USDC</h2><p className="text-xs text-muted-foreground">Send a request to a username or email.</p></div>
        </div>
        <form className="space-y-3" onSubmit={createRequest}>
          <div><label htmlFor="request-recipient" className="text-sm font-medium">From</label><input id="request-recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="@username, email, or wallet address" autoComplete="off" className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" required /></div>
          <div><label htmlFor="request-amount" className="text-sm font-medium">Amount</label><div className="mt-1 flex h-11 items-center rounded-lg border border-input bg-background pr-3 focus-within:ring-2 focus-within:ring-ring"><input id="request-amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" required /><span className="text-sm text-muted-foreground">USDC</span></div></div>
          <Button type="submit" className="min-h-11 w-full" disabled={submitting} aria-busy={submitting}>{submitting ? <><LoaderCircle className="size-4 animate-spin" /> Sending request…</> : 'Send request'}</Button>
        </form>
      </CardContent>
    </Card>

    {notice && <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary" role="status">{notice}</p>}
    {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}

    <section aria-label="Your payment requests">
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-muted p-1">
        {(['incoming', 'outgoing'] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-10 rounded-lg text-sm font-semibold transition-colors ${filter === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{value === 'incoming' ? 'Received' : 'Sent'}{value === 'incoming' && requests.some((item) => item.direction === 'incoming' && item.status === 'pending') ? ` · ${requests.filter((item) => item.direction === 'incoming' && item.status === 'pending').length}` : ''}</button>)}
      </div>
      {loading ? <Card><CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Loading requests…</CardContent></Card>
        : visibleRequests.length === 0 ? <Card><CardContent className="flex flex-col items-center py-10 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">{filter === 'incoming' ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}</span><p className="mt-3 font-semibold">No {filter} requests</p><p className="mt-1 text-sm text-muted-foreground">{filter === 'incoming' ? 'Requests sent to you will appear here.' : 'Requests you send will appear here.'}</p></CardContent></Card>
        : <div className="space-y-3">{visibleRequests.map((item) => <Card key={item.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">{item.direction === 'incoming' ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.direction === 'incoming' ? 'From' : 'To'} @{item.other_user?.username ?? 'SwiftPay user'}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p></div></div><p className="shrink-0 font-mono text-sm font-semibold tabular-nums">{Number(item.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} <span className="text-xs text-muted-foreground">USDC</span></p></div><div className="mt-4 flex items-center justify-between gap-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'paid' ? 'bg-primary/10 text-primary' : item.status === 'declined' ? 'bg-muted text-muted-foreground' : 'bg-amber-500/10 text-amber-800'}`}>{item.status === 'paid' ? <Check className="size-3" /> : item.status === 'declined' ? <X className="size-3" /> : <Clock3 className="size-3" />}{item.status === 'paid' ? 'Paid' : item.status === 'processing' ? 'Processing' : item.status === 'declined' ? 'Declined' : 'Pending'}</span>{item.direction === 'incoming' && item.status === 'pending' && <div className="flex gap-2"><Button type="button" variant="outline" className="min-h-9 rounded-lg px-3 text-xs" onClick={() => void declineRequest(item.id)} disabled={workingId === item.id}>{workingId === item.id ? 'Working…' : 'Decline'}</Button><Link href={`/dashboard/send?request_id=${encodeURIComponent(item.id)}&recipient=${encodeURIComponent(`@${item.other_user?.username ?? ''}`)}&amount=${encodeURIComponent(item.amount)}`} className={buttonVariants({ size: 'sm', className: 'min-h-9 rounded-lg px-3' })}>Pay</Link></div>}</div></CardContent></Card>)}</div>}
    </section>
  </div>;
}
