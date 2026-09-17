'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) router.push('/dashboard');
  }, [ready, authenticated, router]);

  return (
    <main className="flex min-h-screen">
      <div className="flex w-full max-w-xl flex-col justify-center gap-6 px-16">
        <span className="text-sm font-medium text-muted-foreground">SwiftPay</span>
        <h1 className="text-5xl font-semibold tracking-tight">
          Send USDC privately.
        </h1>
        <p className="text-lg text-muted-foreground">
          A Solana wallet built for private payments — by username, email, or QR code.
        </p>
        <div>
          <Button size="lg" onClick={login} disabled={!ready} className="rounded-md px-6">
            Sign in
          </Button>
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center border-l bg-muted/30 lg:flex">
        <div className="rounded-xl border bg-background p-8 shadow-sm">
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className="mt-2 text-3xl font-semibold">1,240.00 USDC</p>
          <div className="mt-6 flex gap-3">
            <div className="h-9 w-24 rounded-md bg-muted" />
            <div className="h-9 w-24 rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </main>
  );
}