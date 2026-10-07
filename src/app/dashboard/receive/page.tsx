'use client';

import { Check, Copy, ExternalLink, LoaderCircle, QrCode, RefreshCw, Share2, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletAddress } from '@/hooks/use-wallet-address';
import { usePrivateWallet } from '@/providers/private-wallet-provider';

async function copyText(value: string) {
  if (!navigator.clipboard?.writeText) throw new Error('Copying is not supported by this browser.');
  await navigator.clipboard.writeText(value);
}

export default function ReceivePage() {
  const { ready: privyReady, getAccessToken } = usePrivy();
  const { address, ready: walletReady } = useWalletAddress();
  const { register } = usePrivateWallet();
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const requestActive = useRef(false);

  useEffect(() => { setCanShare(typeof navigator !== 'undefined' && 'share' in navigator); }, []);

  async function createPaymentLink() {
    if (!address || requestActive.current) return;
    requestActive.current = true;
    setLoading(true);
    setError('');
    try {
      await register();
      const token = await getAccessToken();
      const response = await fetch(`/api/payment-links?walletAddress=${encodeURIComponent(address)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Couldn’t create your payment link.');
      setPaymentLink(data.paymentLink);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Couldn’t create your payment link.');
    } finally {
      requestActive.current = false;
      setLoading(false);
    }
  }

  useEffect(() => { if (address) void createPaymentLink(); }, [address]);

  useEffect(() => {
    if (!paymentLink) return;
    let cancelled = false;
    async function createQrCode() {
      const QRCode = await import('qrcode');
      const code = await QRCode.toDataURL(paymentLink!, { errorCorrectionLevel: 'M', margin: 1, width: 512 });
      if (!cancelled) setQrCode(code);
    }
    void createQrCode().catch(() => { if (!cancelled) setError('Couldn’t create the QR code.'); });
    return () => { cancelled = true; };
  }, [paymentLink]);

  async function copyLink() {
    if (!paymentLink) return;
    try {
      await copyText(paymentLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Couldn’t copy your link.');
    }
  }

  async function shareLink() {
    if (!paymentLink) return;
    if (navigator.share) {
      try { await navigator.share({ title: 'Pay me on SwiftPay', url: paymentLink }); } catch { /* The user may dismiss the share sheet. */ }
    } else await copyLink();
  }

  if (!privyReady || !walletReady) return <div className="mx-auto max-w-2xl space-y-5"><Skeleton className="h-9 w-40" /><Skeleton className="h-72" /></div>;
  if (!address) return <Card className="max-w-xl"><CardHeader><CardTitle>Wallet still being created</CardTitle><CardDescription>We’re preparing your Solana wallet. Refresh in a moment if this takes longer than expected.</CardDescription></CardHeader><CardContent><Button onClick={() => window.location.reload()}><RefreshCw className="size-4" aria-hidden="true" /> Refresh wallet</Button></CardContent></Card>;

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <div className="mb-7"><p className="text-sm font-medium text-[#43816b]">Receive</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Get paid privately</h1><p className="mt-2 text-sm text-muted-foreground">Share your link or QR code. The other person can enter an amount and pay you.</p></div>
      {error && <div className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive" role="alert"><p>{error}</p><Button className="mt-3" variant="outline" disabled={loading} onClick={() => void createPaymentLink()}>{loading ? 'Preparing…' : 'Try again'}</Button></div>}
      <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
          <CardHeader className="pb-3"><div className="mb-1 grid size-10 place-items-center rounded-xl bg-emerald-50 text-[#43816b]"><Share2 className="size-5" aria-hidden="true" /></div><CardTitle>Payment link</CardTitle><CardDescription>Your username link opens a ready-to-pay SwiftPay screen.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-3"><p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Your SwiftPay link</p><p className="break-all font-mono text-sm" aria-live="polite">{paymentLink ?? (loading ? 'Preparing your link…' : 'Your link will appear here.')}</p></div>
            <div className="flex flex-col gap-2 sm:flex-row"><Button className="min-h-11 flex-1 rounded-xl bg-[#153b31] text-white hover:bg-[#204e41]" onClick={() => void shareLink()} disabled={!paymentLink}>{copied ? <Check className="size-4" /> : <Share2 className="size-4" />} {canShare ? 'Share link' : copied ? 'Link copied' : 'Copy link'}</Button><Button className="min-h-11 rounded-xl" variant="outline" onClick={() => void copyLink()} disabled={!paymentLink}><Copy className="size-4" /> Copy</Button></div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-[#43816b]" aria-hidden="true" /> Payments through this link use SwiftPay’s private transfer flow.</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border/70 shadow-sm">
          <CardHeader className="items-center text-center"><div className="mb-1 grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><QrCode className="size-5" aria-hidden="true" /></div><CardTitle>QR code</CardTitle><CardDescription>Scan to open your payment link.</CardDescription></CardHeader>
          <CardContent><div className="mx-auto grid aspect-square w-full max-w-56 place-items-center rounded-2xl border border-border/70 bg-white p-3">{qrCode ? <img src={qrCode} alt="QR code for your SwiftPay payment link" className="aspect-square w-full" /> : loading ? <LoaderCircle className="size-7 animate-spin text-[#43816b]" aria-label="Preparing QR code" /> : <QrCode className="size-10 text-muted-foreground/40" aria-hidden="true" />}</div>{paymentLink && <a href={paymentLink} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'ghost', className: 'mt-3 w-full' })}>Preview payment page <ExternalLink className="size-4" /></a>}</CardContent>
        </Card>
      </div>
    </div>
  );
}
