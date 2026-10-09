'use client';

import {
  AtSign,
  History,
  Link2,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

export function Features() {
  const featureList = [
    {
      title: 'Embedded wallet',
      description: 'Privy generates a secure, non-custodial Solana wallet immediately upon login — no seed phrases required.',
      icon: Wallet,
    },
    {
      title: 'Username payments',
      description: 'Claim your unique SwiftPay username and receive USDC without sharing raw public keys.',
      icon: AtSign,
    },
    {
      title: 'Payment links',
      description: 'Generate shareable payment links for fast web checkouts and direct private transfers.',
      icon: Link2,
    },
    {
      title: 'Payment requests',
      description: 'Send detailed USDC payment requests with customizable amounts and private memos.',
      icon: Receipt,
    },
    {
      title: 'Private by default',
      description: 'Built on Helius Privacy to keep payment amounts and token balances confidential on Solana.',
      icon: ShieldCheck,
    },
    {
      title: 'Payment history with status',
      description: 'Track every incoming and outgoing transfer in real-time with verified on-chain confirmations.',
      icon: History,
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-20 border-t border-slate-200/80">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase font-semibold tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 mb-3">
            Features
          </div>
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
            Everything you need to move money.{' '}
            <span className="text-emerald-600">
              Nothing you don&apos;t.
            </span>
          </h2>
          <p className="mt-3 font-sans text-base text-slate-600 leading-relaxed">
            Essential payment primitives re-engineered for privacy and non-custodial ownership.
          </p>
        </div>

        {/* 6 Clean Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureList.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="size-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="font-sans font-bold text-base text-slate-900 tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
