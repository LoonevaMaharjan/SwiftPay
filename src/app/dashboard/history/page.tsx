'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ExternalLink, RefreshCw, Send } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Payment = { id: string; amount: string; token: string; status: string; privacy_status: string; transaction_signature: string | null; created_at: string; recipient: { username: string; wallet_address: string } | null };
const short = (value: string) => `${value.slice(0, 4)}...${value.slice(-4)}`;

export default function HistoryPage() {
  const { getAccessToken, ready } = usePrivy();
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); setError(null); const token = await getAccessToken(); const response = await fetch('/api/payments', { headers: token ? { Authorization: `Bearer ${token}` } : {} }); const body = await response.json(); if (!response.ok) setError(body.error ?? 'Couldn’t load sent payments.'); else setPayments(body.payments); setLoading(false); };
  useEffect(() => { if (ready) void load(); }, [ready]);
  if (loading) return <div className="max-w-3xl space-y-3"><div className="h-8 w-44 animate-pulse rounded bg-muted" />{[1, 2, 3].map((key) => <div key={key} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>;
  return <div className="max-w-3xl"><div className="mb-8 flex items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">Sent payments</h1><p className="mt-2 text-sm text-muted-foreground">Your outgoing SwiftPay payments.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="size-4" /> Refresh</Button></div>{error ? <Card><CardContent className="flex items-start gap-3 py-6"><AlertCircle className="size-5 text-destructive" /><div><p className="font-medium">Couldn’t load payments</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-3" variant="outline" onClick={() => void load()}>Try again</Button></div></CardContent></Card> : payments?.length === 0 ? <Card><CardContent className="py-12 text-center"><Send className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-medium">No sent payments yet</h2><p className="mt-1 text-sm text-muted-foreground">Your completed and pending payments will appear here.</p></CardContent></Card> : <div className="space-y-3">{payments?.map((payment) => <Card key={payment.id} size="sm"><CardContent className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono font-medium tabular-nums">{payment.amount} {payment.token}</p><p className="mt-1 text-xs text-muted-foreground">To @{payment.recipient?.username ?? short(payment.recipient?.wallet_address ?? 'Unknown')} · {new Date(payment.created_at).toLocaleDateString()}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">{payment.privacy_status} · {payment.status}</span>{payment.transaction_signature && <a aria-label="View transaction on Solana Explorer" href={`https://explorer.solana.com/tx/${payment.transaction_signature}?cluster=devnet`} target="_blank" rel="noreferrer" className="rounded-md p-2 text-primary hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><ExternalLink className="size-4" /></a>}</div></CardContent></Card>)}</div>}</div>;
}
