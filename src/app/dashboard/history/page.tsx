'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, RefreshCw, Send } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePrivateWallet } from '@/providers/private-wallet-provider';
import { USDC_MINT } from '@/lib/solana';

type Payment = { id: string; amount: string; token: string; status: string; privacy_status: string; transaction_signature: string | null; created_at: string | null; direction: 'sent' | 'received'; sender: { username: string; wallet_address: string } | null; recipient: { username: string; wallet_address: string } | null; privateWallet?: boolean };
const short = (value: string) => `${value.slice(0, 4)}...${value.slice(-4)}`;
const toRawAmount = (value: string) => { const [whole, fraction = ''] = value.split('.'); return BigInt(whole) * BigInt(1_000_000) + BigInt(fraction.padEnd(6, '0')); };

export default function HistoryPage() {
  const { getAccessToken, ready } = usePrivy();
  const { privateTransactions, state: privateWalletState } = usePrivateWallet();
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const confirmingRef = useRef(new Set<string>());
  const load = async () => { setLoading(true); setError(null); const token = await getAccessToken(); const response = await fetch('/api/payments', { headers: token ? { Authorization: `Bearer ${token}` } : {} }); const body = await response.json(); if (!response.ok) setError(body.error ?? 'Couldn’t load sent payments.'); else setPayments(body.payments); setLoading(false); };
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
        } finally { confirmingRef.current.delete(payment.transaction_signature!); }
      })();
    }
  }, [payments, privateTransactions, privateWalletState, getAccessToken]);
  if (loading) return <div className="max-w-3xl space-y-3"><div className="h-8 w-44 animate-pulse rounded bg-muted" />{[1, 2, 3].map((key) => <div key={key} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>;
  const recordedSignatures = new Set((payments ?? []).map((payment) => payment.transaction_signature).filter(Boolean));
  const protocolPayments: Payment[] = privateTransactions.filter((tx) => !recordedSignatures.has(tx.id.signature)).map((tx, index) => ({ id: `helius-${tx.id.signature}-${index}`, amount: (Number(tx.amount) / 1_000_000).toString(), token: 'USDC', status: 'confirmed', privacy_status: 'private', transaction_signature: tx.id.signature, created_at: null, direction: tx.direction === 'outbound' ? 'sent' : 'received', sender: null, recipient: null, privateWallet: true }));
  const allPayments = [...(payments ?? []), ...protocolPayments];
  return <div className="max-w-3xl"><div className="mb-8 flex items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">Payment history</h1><p className="mt-2 text-sm text-muted-foreground">Sent and received SwiftPay payments and synced private transfers.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="size-4" /> Refresh</Button></div>{error ? <Card><CardContent className="flex items-start gap-3 py-6"><AlertCircle className="size-5 text-destructive" /><div><p className="font-medium">Couldn’t load payments</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-3" variant="outline" onClick={() => void load()}>Try again</Button></div></CardContent></Card> : allPayments.length === 0 ? <Card><CardContent className="py-12 text-center"><Send className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-medium">No payments yet</h2><p className="mt-1 text-sm text-muted-foreground">Your completed and processing payments will appear here.</p>{privateWalletState !== 'ready' && <p className="mt-2 text-xs text-muted-foreground">Private transfer history will appear here after your next payment.</p>}</CardContent></Card> : <div className="space-y-3">{allPayments.map((payment) => { const other = payment.direction === 'sent' ? payment.recipient : payment.sender; return <Card key={payment.id} size="sm"><CardContent className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono font-medium tabular-nums">{payment.direction === 'sent' ? '−' : '+'}{payment.amount} {payment.token}</p><p className="mt-1 text-xs text-muted-foreground">{payment.privateWallet ? 'Private transfer' : `${payment.direction === 'sent' ? 'To' : 'From'} @${other?.username ?? short(other?.wallet_address ?? 'Unknown')}`}{payment.created_at ? ` · ${new Date(payment.created_at).toLocaleDateString()}` : ''}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">{payment.privacy_status} · {payment.status}</span>{payment.transaction_signature && <a aria-label="View transaction on Solana Explorer" href={`https://explorer.solana.com/tx/${payment.transaction_signature}?cluster=devnet`} target="_blank" rel="noreferrer" className="rounded-md p-2 text-primary hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><ExternalLink className="size-4" /></a>}</div></CardContent></Card>; })}</div>}<p className="mt-4 text-xs text-muted-foreground">Private amounts shown here are decrypted by your local wallet sync. Explorer links reveal public transaction metadata, but not the encrypted transfer amount.</p></div>;
}
