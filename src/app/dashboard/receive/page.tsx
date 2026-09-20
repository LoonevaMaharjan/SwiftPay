'use client';

import { Check, Copy, LoaderCircle, QrCode, RefreshCw, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletAddress } from '@/hooks/use-wallet-address';

type CopyTarget = 'address' | 'link' | null;

async function copyText(value: string) {
  if (!navigator.clipboard?.writeText) throw new Error('Copying is not supported by this browser.');
  await navigator.clipboard.writeText(value);
}

export default function ReceivePage() {
  const { ready: privyReady, getAccessToken, user } = usePrivy();
  const { address, ready: walletReady } = useWalletAddress();
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<CopyTarget>(null);

  async function createPaymentLink() {
    if (!address) return;
    setError('');
    const fallbackLink = `${window.location.origin}/dashboard/send?recipient=${encodeURIComponent(address)}`;
    setPaymentLink(fallbackLink);
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/payment-links?walletAddress=${encodeURIComponent(address)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Couldn’t create your payment link.');
      setPaymentLink(data.paymentLink);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Couldn’t create your payment link.');
    }
  }

  useEffect(() => { createPaymentLink(); }, [address]);

  useEffect(() => {
    if (!paymentLink) return;
    const link = paymentLink;
    let cancelled = false;
    async function createQrCode() {
      const QRCode = await import('qrcode');
      const code = await QRCode.toDataURL(link, { errorCorrectionLevel: 'M', margin: 1, width: 512 });
      if (!cancelled) setQrCode(code);
    }
    createQrCode().catch(() => { if (!cancelled) setError('Couldn’t create the QR code.'); });
    return () => { cancelled = true; };
  }, [paymentLink]);

  async function handleCopy(target: Exclude<CopyTarget, null>, value: string) {
    try {
      await copyText(value);
      setCopied(target);
      window.setTimeout(() => setCopied(null), 1800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Couldn’t copy to your clipboard.');
    }
  }

  if (!privyReady || !walletReady) return <div className="max-w-4xl space-y-6"><Skeleton className="h-9 w-32" /><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"><Skeleton className="h-80" /><Skeleton className="h-80" /></div></div>;
  if (!address) return <Card className="max-w-xl"><CardHeader><CardTitle>Wallet still being created</CardTitle><CardDescription>We’re preparing your secure Solana wallet. Refresh in a moment if this takes longer than expected.</CardDescription></CardHeader><CardContent><Button onClick={() => window.location.reload()}><RefreshCw className="size-4" aria-hidden="true" /> Refresh wallet</Button></CardContent></Card>;

  return <div className="mx-auto max-w-4xl"><div className="mb-8"><h1 className="text-3xl font-semibold tracking-tight">Receive USDC</h1><p className="mt-2 text-sm text-muted-foreground">Share your payment link, QR code, email, or Solana wallet address.</p></div>{error && <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert"><p>{error}</p><Button className="mt-3" variant="outline" onClick={createPaymentLink}>Try again</Button></div>}<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"><div className="space-y-6"><Card><CardHeader><CardTitle>Share your details</CardTitle><CardDescription>Use your wallet address to receive USDC on Solana devnet.</CardDescription></CardHeader><CardContent className="space-y-4"><DetailRow label="Username" value="Not set" /><DetailRow label="Email" value={user?.email?.address ?? 'Not added'} /><DetailRow label="Solana wallet" value={address} mono copyLabel={copied === 'address' ? 'Address copied' : 'Copy wallet address'} copied={copied === 'address'} onCopy={() => handleCopy('address', address)} /></CardContent></Card><Card><CardHeader><CardTitle>Payment link</CardTitle><CardDescription>Anyone who opens this link will have your wallet prefilled.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex min-h-11 items-center gap-2 rounded-lg border border-input bg-muted/40 p-2"><p className="min-w-0 flex-1 truncate font-mono text-xs" title={paymentLink ?? undefined}>{paymentLink ?? 'Creating payment link…'}</p><Button type="button" variant="outline" size="icon" className="size-10 shrink-0" onClick={() => paymentLink && handleCopy('link', paymentLink)} disabled={!paymentLink} aria-label={copied === 'link' ? 'Payment link copied' : 'Copy payment link'}>{copied === 'link' ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}</Button></div><p className="text-xs text-muted-foreground">{copied === 'link' ? 'Payment link copied to your clipboard.' : 'The link opens SwiftPay’s send flow.'}</p></CardContent></Card></div><Card className="h-fit"><CardHeader><div className="flex items-center gap-2"><QrCode className="size-5 text-primary" aria-hidden="true" /><CardTitle>Scan to pay</CardTitle></div><CardDescription>Opens your SwiftPay payment link.</CardDescription></CardHeader><CardContent><div className="rounded-xl bg-background p-3 ring-1 ring-foreground/10">{qrCode ? <img src={qrCode} alt="QR code for your SwiftPay payment link" className="aspect-square w-full" /> : <div className="grid aspect-square place-items-center"><LoaderCircle className="size-6 animate-spin text-primary" aria-label="Creating QR code" /></div>}</div></CardContent></Card></div></div>;
}

function DetailRow({ label, value, mono = false, onCopy, copyLabel, copied }: { label: string; value: string; mono?: boolean; onCopy?: () => void; copyLabel?: string; copied?: boolean }) {
  return <div className="space-y-1.5"><p className="text-xs font-medium text-muted-foreground">{label}</p><div className="flex min-h-11 items-center gap-2 rounded-lg border border-input bg-background px-3"><p className={`min-w-0 flex-1 truncate text-sm ${mono ? 'font-mono' : ''}`} title={value}>{value}</p>{onCopy && <Button type="button" variant="ghost" size="icon" className="size-10 shrink-0" onClick={onCopy} aria-label={copyLabel}>{copied ? <Check className="size-4 text-primary" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}</Button>}</div>{copied && <p className="text-xs text-primary">Copied to your clipboard.</p>}</div>;
}
