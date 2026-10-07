'use client';

import { usePrivy } from '@privy-io/react-auth';
import { ArrowUpRight, LockKeyhole, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const { login, authenticated, ready, getAccessToken } = usePrivy();
  const router = useRouter();
  const [checkingAccount, setCheckingAccount] = useState(false);
  const checkedAccount = useRef(false);

  useEffect(() => {
    if (!authenticated) {
      checkedAccount.current = false;
      setCheckingAccount(false);
      return;
    }
    if (!ready || checkedAccount.current) return;
    checkedAccount.current = true;
    let cancelled = false;
    setCheckingAccount(true);
    void (async () => {
      try {
        const token = await getAccessToken();
        const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
        if (!cancelled) router.replace(response.ok ? '/dashboard' : '/onboarding');
      } catch {
        if (!cancelled) router.replace('/onboarding');
      }
    })();
    return () => { cancelled = true; };
  }, [ready, authenticated, getAccessToken, router]);

  return (
    <main className="relative flex min-h-full flex-col overflow-hidden bg-[#f7f8f5] text-[#17231f] lg:flex-row">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-48 size-[34rem] rounded-full bg-emerald-200/40 blur-3xl" />
      <section className="relative z-10 flex flex-1 flex-col justify-between px-6 py-8 sm:px-12 sm:py-10 lg:min-h-screen lg:px-20 lg:py-14">
        <a href="/" className="flex w-fit items-center gap-3" aria-label="SwiftPay home">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#153b31] text-white shadow-sm"><Sparkles className="size-5" aria-hidden="true" /></span>
          <span className="text-lg font-semibold tracking-tight">swiftpay</span>
        </a>
        <div className="my-16 max-w-xl lg:my-24">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#356153]"><LockKeyhole className="size-3.5" aria-hidden="true" /> Private by default on Solana</p>
          <h1 className="max-w-lg text-5xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl">Money moves.<br /><span className="text-[#43816b]">Your business stays yours.</span></h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#62716b]">Send and receive USDC with a simple username, email, or payment link. Your payment details stay protected by default.</p>
          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={() => login()} disabled={!ready || checkingAccount} className="h-12 rounded-xl bg-[#153b31] px-6 text-white hover:bg-[#204e41]">
              {checkingAccount ? 'Opening your account…' : 'Continue with Google'} <ArrowUpRight className="ml-1 size-4" aria-hidden="true" />
            </Button>
            <span className="text-xs text-[#7a8982]">Secure sign-in powered by Privy</span>
          </div>
        </div>
        <p className="text-xs text-[#84918b]">SwiftPay · Private payments, made simple</p>
      </section>
      <aside className="relative hidden min-h-screen w-[43%] items-center justify-center overflow-hidden bg-[#153b31] p-12 text-white lg:flex">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_75%_22%,rgba(163,218,182,0.22),transparent_35%),radial-gradient(circle_at_15%_85%,rgba(72,135,111,0.36),transparent_42%)]" />
        <div className="relative w-full max-w-sm">
          <div className="absolute -right-12 -top-24 size-48 rounded-full border border-white/10" />
          <div className="absolute -right-4 -top-16 size-32 rounded-full border border-white/10" />
          <div className="rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-7 shadow-2xl shadow-black/10 backdrop-blur-sm">
            <div className="flex items-center justify-between"><span className="text-sm text-white/65">SwiftPay balance</span><span className="rounded-full bg-emerald-300/15 px-2.5 py-1 text-[11px] font-medium text-emerald-200">USDC</span></div>
            <p className="mt-7 text-4xl font-medium tracking-tight">Private by default</p>
            <div className="my-7 h-px bg-white/15" />
            <div className="flex items-center justify-between text-sm"><span className="text-white/60">Payment details</span><span className="inline-flex items-center gap-1.5 text-emerald-200"><LockKeyhole className="size-3.5" aria-hidden="true" /> Protected</span></div>
            <p className="mt-2 text-xs leading-5 text-white/45">A quieter way to move money on Solana.</p>
          </div>
          <div className="ml-auto mt-4 w-3/4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-white/70">username → payment sent <span className="float-right text-emerald-200">✓</span></div>
        </div>
      </aside>
    </main>
  );
}
