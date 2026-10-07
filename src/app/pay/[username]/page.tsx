'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Recipient = { id: string; username: string; walletAddress: string };

export default function PayUsernamePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pay/${encodeURIComponent(params.username)}`).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Couldn’t load this payment page.');
      if (!cancelled) setRecipient(data.recipient);
    }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Couldn’t load this payment page.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.username]);

  async function pay() {
    if (!recipient) return;
    if (!authenticated) return login();
    try {
      const token = await getAccessToken();
      const profile = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (profile.ok) {
        router.push(`/dashboard/send?recipient=${encodeURIComponent(recipient.username)}`);
      } else {
        sessionStorage.setItem('swiftpay:post-onboarding-recipient', recipient.username);
        router.push('/onboarding');
      }
    } catch {
      setError('Couldn’t check your SwiftPay account. Please try again.');
    }
  }

  return <main className="grid min-h-screen place-items-center bg-background p-4"><Card className="w-full max-w-md"><CardHeader className="text-center"><ShieldCheck className="mx-auto mb-2 size-10 text-primary" aria-hidden="true" /><CardTitle className="text-2xl">Pay with SwiftPay</CardTitle><CardDescription>{loading ? 'Finding this SwiftPay user…' : recipient ? `Send USDC privately to @${recipient.username}.` : error}</CardDescription></CardHeader><CardContent>{error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : <Button className="w-full" size="lg" onClick={() => void pay()} disabled={!ready || loading || !recipient}>{authenticated ? 'Continue to payment' : 'Sign in to pay'}</Button>}<p className="mt-4 text-center text-xs text-muted-foreground">Private USDC payments on Solana.</p></CardContent></Card></main>;
}
