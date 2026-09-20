'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ChevronLeft, ExternalLink, LoaderCircle, Send, ShieldCheck } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUsdcBalance } from '@/hooks/use-usdc-balance';
import { useWalletAddress } from '@/hooks/use-wallet-address';
import { useSendUsdc } from '@/hooks/use-send-usdc';

type Step = 'details' | 'review' | 'complete';
const truncate = (value: string) => `${value.slice(0, 4)}...${value.slice(-4)}`;

function toRawAmount(value: string): bigint | null {
  if (!/^\d+(\.\d{1,6})?$/.test(value) || Number(value) <= 0) return null;
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * BigInt(1_000_000) + BigInt(fraction.padEnd(6, '0'));
}

export default function SendPage() {
  const { address, wallet, ready } = useWalletAddress();
  const { getAccessToken } = usePrivy();
  const { balance, loading: balanceLoading, error: balanceError, refresh } = useUsdcBalance(address);
  const { send, state, signature, error: sendError, reset } = useSendUsdc();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('details');
  const [recipientInput, setRecipientInput] = useState('');
  const [recipient, setRecipient] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const recipient = searchParams.get('recipient');
    if (recipient) setRecipientInput(recipient);
  }, [searchParams]);

  const rawAmount = useMemo(() => toRawAmount(amount), [amount]);
  const submitting = state === 'signing' || state === 'confirming';

  async function resolveRecipient() {
    const input = recipientInput.trim();
    const token = await getAccessToken();
    const response = await fetch(`/api/recipients/resolve?query=${encodeURIComponent(input)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const data = await response.json() as { recipient?: { walletAddress?: string }; error?: string };
    if (!response.ok || !data.recipient?.walletAddress) throw new Error(data.error ?? 'We couldn’t find a SwiftPay wallet for that recipient.');
    new PublicKey(data.recipient.walletAddress);
    return data.recipient.walletAddress;
  }

  async function review(event: React.FormEvent) {
    event.preventDefault(); setFormError(null);
    if (!rawAmount) return setFormError('Enter a USDC amount with up to 6 decimal places.');
    if (balance === null) return setFormError('Your balance is still loading. Try again in a moment.');
    if (Number(amount) > balance) return setFormError('That amount is greater than your available USDC balance.');
    try { setRecipient(await resolveRecipient()); setStep('review'); } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Couldn’t resolve that recipient.'); }
  }

  async function confirm() {
    if (!wallet || !recipient || !rawAmount) return;
    try { await send({ wallet, recipient, amount: rawAmount }); setStep('complete'); refresh(); } catch { /* Hook provides the recovery message. */ }
  }

  if (!ready || balanceLoading) return <div className="max-w-xl space-y-4"><div className="h-8 w-40 animate-pulse rounded bg-muted" /><div className="h-80 animate-pulse rounded-xl bg-muted" /></div>;
  if (!address || !wallet) return <Card className="max-w-xl"><CardHeader><CardTitle>Wallet still being created</CardTitle><CardDescription>We’re preparing your secure Solana wallet. Refresh in a moment if this takes longer than expected.</CardDescription></CardHeader><CardContent><Button onClick={() => window.location.reload()}>Refresh wallet</Button></CardContent></Card>;
  if (step === 'complete') return <Card className="max-w-xl text-center"><CardContent className="space-y-4 py-10"><CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" /><div><h1 className="text-2xl font-semibold">Payment sent</h1><p className="mt-2 text-sm text-muted-foreground">{amount} USDC was submitted for confirmation.</p></div>{signature && <a className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline" href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" rel="noreferrer">View on Solana Explorer <ExternalLink className="size-4" /></a>}<Button className="mx-auto" variant="secondary" onClick={() => { reset(); setAmount(''); setRecipientInput(''); setRecipient(null); setStep('details'); }}>Send another payment</Button></CardContent></Card>;

  return <div className="max-w-xl"><div className="mb-8"><h1 className="text-3xl font-semibold tracking-tight">Send USDC</h1><p className="mt-2 text-sm text-muted-foreground">Payments on devnet are public while private transfers are being integrated.</p></div>{balanceError && <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm"><p className="font-medium">Couldn’t load your balance</p><p className="mt-1 text-muted-foreground">{balanceError}</p><Button className="mt-3" variant="outline" onClick={refresh}>Try again</Button></div>}
  {step === 'details' ? <Card><CardHeader><CardTitle>Payment details</CardTitle><CardDescription>Enter a recipient and amount. You’ll review everything before signing.</CardDescription></CardHeader><CardContent><form onSubmit={review} className="space-y-5"><div><label htmlFor="recipient" className="text-sm font-medium">Recipient</label><input id="recipient" value={recipientInput} onChange={(e) => setRecipientInput(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Wallet address, username, or email" autoComplete="off" spellCheck={false} aria-invalid={formError ? 'true' : undefined} /><p className="mt-2 text-xs text-muted-foreground">Recipients must have a SwiftPay profile so payments can be verified and tracked securely.</p></div><div><div className="flex items-baseline justify-between"><label htmlFor="amount" className="text-sm font-medium">Amount</label><button type="button" onClick={() => setAmount(balance?.toString() ?? '')} className="text-xs font-medium text-primary underline-offset-4 hover:underline">Max {balance?.toFixed(2) ?? '0.00'} USDC</button></div><div className="mt-2 flex h-11 items-center rounded-lg border border-input bg-background pr-3 focus-within:ring-2 focus-within:ring-ring"><input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" inputMode="decimal" placeholder="0.00" autoComplete="off" /><span className="text-sm font-medium text-muted-foreground">USDC</span></div><p className="mt-2 text-xs text-muted-foreground">Available: <span className="font-mono tabular-nums">{balance?.toFixed(2) ?? '0.00'} USDC</span></p></div>{formError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{formError}</p>}<Button className="w-full" size="lg" type="submit" disabled={Boolean(balanceError)}>Review payment <Send className="size-4" /></Button></form></CardContent></Card> : <Card><CardHeader><Button variant="ghost" className="-ml-2 w-fit" onClick={() => setStep('details')} disabled={submitting}><ChevronLeft className="size-4" /> Edit details</Button><CardTitle className="mt-3">Review payment</CardTitle><CardDescription>Confirm these details before your wallet asks you to sign.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="rounded-xl bg-muted p-4"><p className="text-xs font-medium text-muted-foreground">YOU’RE SENDING</p><p className="mt-1 font-mono text-3xl font-semibold tabular-nums">{amount} <span className="text-base text-muted-foreground">USDC</span></p></div><div className="space-y-3 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">To</span><span className="font-mono" title={recipient ?? undefined}>{recipient && truncate(recipient)}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Network</span><span>Solana devnet</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Token account</span><span className="text-right">Created automatically if needed</span></div></div><div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground"><ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />This is a public SPL token transfer. Your wallet will ask you to approve it; no payment is sent until you do.</div>{sendError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{sendError}</p>}<Button className="w-full" size="lg" onClick={confirm} disabled={submitting} aria-busy={submitting}>{submitting ? <><LoaderCircle className="size-4 animate-spin" /> {state === 'signing' ? 'Waiting for signature…' : 'Confirming payment…'}</> : 'Sign and send USDC'}</Button></CardContent></Card>}</div>;
}
