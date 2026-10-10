'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ChevronLeft, ExternalLink, LoaderCircle, Send, ShieldCheck } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletAddress } from '@/hooks/use-wallet-address';
import { useSendUsdc } from '@/hooks/use-send-usdc';
import { usePrivateWallet } from '@/providers/private-wallet-provider';
import { formatZolanaError } from '@/lib/zolana-errors';

type Step = 'details' | 'review' | 'complete';
const truncate = (value: string) => `${value.slice(0, 4)}...${value.slice(-4)}`;

function toRawAmount(value: string): bigint | null {
  if (!/^\d+(\.\d{1,6})?$/.test(value) || Number(value) <= 0) return null;
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * BigInt(1_000_000) + BigInt(fraction.padEnd(6, '0'));
}
export default function SendPage() {
  const { address, ready } = useWalletAddress();
  const { getAccessToken } = usePrivy();
  const router = useRouter();
  const { send, state, signature, error: sendError, confirmationPending, reset } = useSendUsdc();
  const { privateUsdc, prepare, refresh: refreshPrivate } = usePrivateWallet();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('details');
  const [recipientInput, setRecipientInput] = useState('');
  const [recipient, setRecipient] = useState<string | null>(null);
  const [recipientUserId, setRecipientUserId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [completionWarning, setCompletionWarning] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'confirmed'>('processing');
  const [retryingRequestUpdate, setRetryingRequestUpdate] = useState(false);
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    const recipientParam = searchParams.get('recipient');
    const amountParam = searchParams.get('amount');
    if (recipientParam) setRecipientInput(recipientParam);
    if (amountParam && toRawAmount(amountParam)) setAmount(amountParam);
  }, [searchParams]);

  const rawAmount = useMemo(() => toRawAmount(amount), [amount]);
  const submitting = state === 'signing' || state === 'confirming';

  async function resolveRecipient() {
    let input = recipientInput.trim();
    try {
      const pastedLink = new URL(input);
      input = pastedLink.searchParams.get('recipient')?.trim()
        || (pastedLink.pathname.startsWith('/pay/') ? decodeURIComponent(pastedLink.pathname.split('/').at(-1) ?? '') : input);
    } catch {
      // The recipient may be a username or wallet address rather than a link.
    }
    input = input.replace(/^@/, '');
    const token = await getAccessToken();
    const response = await fetch(`/api/recipients/resolve?query=${encodeURIComponent(input)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const data = await response.json() as { recipient?: { id: string; walletAddress?: string }; error?: string };
    if (!response.ok || !data.recipient?.id || !data.recipient.walletAddress) throw new Error(data.error ?? 'We couldn’t find a SwiftPay wallet for that recipient.');
    new PublicKey(data.recipient.walletAddress);
    return { id: data.recipient.id, walletAddress: data.recipient.walletAddress };
  }

  async function review(event: React.FormEvent) {
    event.preventDefault(); setFormError(null);
    if (!rawAmount) return setFormError('Enter a USDC amount with up to 6 decimal places.');
    setPreparing(true);
    try {
      const resolved = await resolveRecipient();
      const availablePrivateUsdc = await prepare();
      if (Number(amount) > availablePrivateUsdc) throw new Error('Your private USDC balance is too low. Add USDC to your private balance first.');
      const token = await getAccessToken();
      if (!token) throw new Error('Your session expired. Sign in again to continue.');
      const intentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiver_user_id: resolved.id, amount, token: 'USDC', privacy_status: 'private', idempotency_key: crypto.randomUUID() }),
      });
      const intentData = await intentResponse.json() as { payment?: { id: string }; error?: string };
      if (!intentResponse.ok || !intentData.payment?.id) throw new Error(intentData.error ?? 'Could not save this payment review.');
      setRecipient(resolved.walletAddress);
      setRecipientUserId(resolved.id);
      setPaymentId(intentData.payment.id);
      setStep('review');
    } catch (cause) { setFormError(formatZolanaError(cause)); }
    finally { setPreparing(false); }
  }

  async function savePayment(signatureToSave: string): Promise<'processing' | 'confirmed'> {
    if (!recipientUserId || !paymentId) throw new Error('The payment review is missing. Go back and review the payment again.');
    const token = await getAccessToken();
    if (!token) throw new Error('Your session expired. Sign in again, then retry the history update.');
    const recordResponse = await fetch('/api/payments/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ payment_id: paymentId, receiver_user_id: recipientUserId, amount, signature: signatureToSave }),
    });
    const recordData = await recordResponse.json() as { error?: string; status?: 'submitted' | 'processing' | 'confirmed' };
    if (!recordResponse.ok) throw new Error(recordData.error ?? 'Could not save this payment to history.');

    return recordData.status === 'confirmed' ? 'confirmed' : 'processing';
  }

  async function confirm() {
    if (!recipient || !rawAmount || !recipientUserId) return;
    setCompletionWarning(null);
    setPaymentStatus('processing');
    const transactionSignature = await send({ recipient, amount: rawAmount }).catch(() => null);
    if (!transactionSignature) return;
    try {
      setPaymentStatus(await savePayment(transactionSignature));
    } catch (cause) {
      setCompletionWarning(cause instanceof Error ? cause.message : 'The payment was sent, but SwiftPay could not update payment history.');
    }
    setStep('complete');
    refreshPrivate().catch(() => undefined);
  }

  async function retryRequestUpdate() {
    if (!signature) return;
    setRetryingRequestUpdate(true);
    try {
      setPaymentStatus(await savePayment(signature));
      setCompletionWarning(null);
    } catch (cause) {
      setCompletionWarning(cause instanceof Error ? `Payment history is still pending: ${cause.message}` : 'Payment history is still pending.');
    } finally {
      setRetryingRequestUpdate(false);
    }
  }

  if (!ready) return <div className="max-w-xl space-y-4"><div className="h-8 w-40 animate-pulse rounded bg-muted" /><div className="h-80 animate-pulse rounded-xl bg-muted" /></div>;
  if (!address) return <Card className="max-w-xl"><CardHeader><CardTitle>Wallet still being created</CardTitle><CardDescription>We’re preparing your secure Solana wallet. Refresh in a moment if this takes longer than expected.</CardDescription></CardHeader><CardContent><Button onClick={() => window.location.reload()}>Refresh wallet</Button></CardContent></Card>;
  if (step === 'complete') return <Card className="max-w-xl text-center"><CardContent className="space-y-4 py-10"><CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" /><div><h1 className="text-2xl font-semibold">{confirmationPending ? 'Payment submitted' : paymentStatus === 'processing' ? 'Payment processing' : 'Payment confirmed'}</h1><p className="mt-2 text-sm text-muted-foreground">{confirmationPending ? `${amount} USDC was submitted. SwiftPay is waiting for Solana and Helius indexing; do not resend until you check the signature.` : paymentStatus === 'processing' ? `${amount} USDC was sent. SwiftPay is verifying the payment before marking it complete.` : `${amount} USDC was verified and added to the receiver’s SwiftPay account.`}</p></div>{completionWarning && <div className="space-y-2 rounded-md bg-destructive/10 p-3 text-left text-sm text-destructive" role="status"><p>{completionWarning}</p><Button type="button" variant="outline" size="sm" onClick={retryRequestUpdate} disabled={retryingRequestUpdate} aria-busy={retryingRequestUpdate}>{retryingRequestUpdate ? 'Updating history…' : 'Retry history update'}</Button></div>}{signature && <a className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline" href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" rel="noreferrer">View on Solana Explorer <ExternalLink className="size-4" /></a>}<Button className="mx-auto" variant="secondary" onClick={() => { reset(); setAmount(''); setRecipientInput(''); setRecipient(null); setRecipientUserId(null); setPaymentId(null); setPaymentStatus('processing'); setStep('details'); router.replace('/dashboard/send'); }}>Send another payment</Button></CardContent></Card>;

  return <div className="max-w-xl"><div className="mb-8"><h1 className="text-3xl font-semibold tracking-tight">Send USDC</h1><p className="mt-2 text-sm text-muted-foreground">SwiftPay sends USDC privately by default. <a className="font-medium text-primary underline underline-offset-4" href="/dashboard/balance">View balance and add funds</a></p></div>
  {step === 'details' ? <Card><CardHeader><CardTitle>Payment details</CardTitle><CardDescription>Enter a recipient and amount. You’ll review everything before signing.</CardDescription></CardHeader><CardContent><form onSubmit={review} className="space-y-5"><div><label htmlFor="recipient" className="text-sm font-medium">Recipient</label><input id="recipient" value={recipientInput} onChange={(e) => setRecipientInput(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring read-only:bg-muted" placeholder="Username, email, or wallet address" autoComplete="off" spellCheck={false} aria-invalid={formError ? 'true' : undefined} /></div><div><div className="flex items-baseline justify-between"><label htmlFor="amount" className="text-sm font-medium">Amount</label><button type="button" onClick={() => setAmount(privateUsdc?.toString() ?? '')} className="text-xs font-medium text-primary underline-offset-4 hover:underline">Max {privateUsdc?.toFixed(2) ?? '0.00'} USDC</button></div><div className="mt-2 flex h-11 items-center rounded-lg border border-input bg-background pr-3 focus-within:ring-2 focus-within:ring-ring"><input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none read-only:bg-muted" inputMode="decimal" placeholder="0.00" autoComplete="off" /><span className="text-sm font-medium text-muted-foreground">USDC</span></div><p className="mt-2 text-xs text-muted-foreground">Available privately: <span className="font-mono tabular-nums">{privateUsdc?.toFixed(2) ?? 'Review to load balance'} USDC</span></p></div>{formError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{formError}</p>}<Button className="w-full" size="lg" type="submit" disabled={preparing || submitting} aria-busy={preparing}>{preparing ? <><LoaderCircle className="size-4 animate-spin" /> Preparing private payment…</> : 'Review payment'} <Send className="size-4" /></Button></form></CardContent></Card> : <Card><CardHeader><Button variant="ghost" className="-ml-2 w-fit" onClick={() => setStep('details')} disabled={submitting}><ChevronLeft className="size-4" /> Edit details</Button><CardTitle className="mt-3">Review payment</CardTitle><CardDescription>Confirm these details before your wallet asks you to sign.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="rounded-xl bg-muted p-4"><p className="text-xs font-medium text-muted-foreground">YOU’RE SENDING</p><p className="mt-1 font-mono text-3xl font-semibold tabular-nums">{amount} <span className="text-base text-muted-foreground">USDC</span></p></div><div className="space-y-3 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Privacy</span><span>SwiftPay private transfer</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">To</span><span className="font-mono" title={recipient ?? undefined}>{recipient && truncate(recipient)}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Network</span><span>Solana devnet</span></div></div><div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground"><ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />This payment is private by default. Amount and asset are hidden; wallet addresses remain visible.</div>{sendError && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert"><p>{sendError}</p>{sendError.includes('SOL') && <a className="mt-2 inline-block font-medium underline underline-offset-4" href="https://faucet.solana.com/" target="_blank" rel="noreferrer">Request Devnet SOL</a>}</div>}<Button className="w-full" size="lg" onClick={confirm} disabled={submitting} aria-busy={submitting}>{submitting ? <><LoaderCircle className="size-4 animate-spin" /> {state === 'signing' ? 'Waiting for signature…' : 'Confirming…'}</> : 'Sign and send'}</Button></CardContent></Card>}</div>;
}
