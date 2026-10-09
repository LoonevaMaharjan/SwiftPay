'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import {
  ArrowDownLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  History,
  Link2,
  Lock,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface HeroProps {
  onStartSending?: () => void;
}

export function Hero({ onStartSending }: HeroProps) {
  const { login, ready, authenticated } = usePrivy();
  const router = useRouter();
  const [isShielded, setIsShielded] = useState(true);

  const handleCta = () => {
    if (onStartSending) {
      onStartSending();
      return;
    }
    if (ready && authenticated) {
      router.push('/dashboard');
    } else if (ready) {
      login();
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden="true" />
                private payments on Solana
              </span>
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                devnet beta
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-900 leading-[1.12]">
              Pay anyone on Solana.{' '}
              <span className="text-emerald-600 block sm:inline">
                Keep it private.
              </span>
            </h1>

            {/* Subhead */}
            <div className="mt-5 space-y-1.5 max-w-xl text-slate-600 font-sans text-base sm:text-lg leading-relaxed">
              <p>
                Send and receive USDC on Solana, privately, without revealing what&apos;s in your wallet.
              </p>
              <p className="text-slate-500 text-sm sm:text-base font-normal">
                Use a username, email, or payment link. No seed phrases.
              </p>
            </div>

            {/* CTA Group */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCta}
                disabled={!ready}
                className="group font-sans text-sm font-semibold px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span>{authenticated ? 'Go to dashboard' : 'Start sending'}</span>
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform motion-reduce:transform-none" aria-hidden="true" />
              </button>

              <a
                href="#how-it-works"
                className="font-sans text-sm font-medium text-slate-700 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                See how it works
              </a>
            </div>

            {/* Trust highlights */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600" /> Embedded Privy wallet
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600" /> Helius ZK encryption
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600" /> Non-custodial
              </span>
            </div>
          </div>

          {/* Right Column: Sleek Modern Card Visual */}
          <div className="lg:col-span-5 flex items-center justify-center select-none pt-4 lg:pt-0">
            <div className="w-full max-w-[360px] bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 relative">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold flex items-center justify-center">
                    SP
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-900">@abi</span>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[11px] text-slate-400">Solana Devnet</span>
                  </div>
                </div>

                {/* Privacy Badge Toggle */}
                <button
                  type="button"
                  onClick={() => setIsShielded(!isShielded)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
                  title="Toggle to preview privacy"
                >
                  {isShielded ? <Lock className="size-3" /> : <Eye className="size-3" />}
                  <span>{isShielded ? 'Private' : 'Public'}</span>
                </button>
              </div>

              {/* Balance Display */}
              <div className="py-6 text-center">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                  Wallet Balance
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                    {isShielded ? '124.50' : '124.50'}
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-600">USDC</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>{isShielded ? 'Amount shielded via Helius ZK' : 'Amount visible on-chain'}</span>
                </div>
              </div>

              {/* Feature Action Buttons (send, receive, link, history) */}
              <div className="grid grid-cols-4 gap-2 pt-2 pb-4 border-b border-slate-100">
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 transition-colors cursor-pointer group">
                  <div className="size-8 rounded-lg bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-900 group-hover:text-emerald-700">
                    <Send className="size-4" />
                  </div>
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider">send</span>
                </div>

                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 transition-colors cursor-pointer group">
                  <div className="size-8 rounded-lg bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-900 group-hover:text-emerald-700">
                    <ArrowDownLeft className="size-4" />
                  </div>
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider">receive</span>
                </div>

                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 transition-colors cursor-pointer group">
                  <div className="size-8 rounded-lg bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-900 group-hover:text-emerald-700">
                    <Link2 className="size-4" />
                  </div>
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider">link</span>
                </div>

                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 transition-colors cursor-pointer group">
                  <div className="size-8 rounded-lg bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-900 group-hover:text-emerald-700">
                    <History className="size-4" />
                  </div>
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider">history</span>
                </div>
              </div>

              {/* Status Note */}
              <div className="pt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Helius Privacy Protocol</span>
                <span className="text-emerald-600 font-medium">Devnet Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
