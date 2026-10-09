'use client';

import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { PaymentFlowchart } from './payment-flowchart';

export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Log in once.',
      description: 'Privy creates your embedded Solana wallet instantly with Google or email. Zero seed phrases to write down or lose.',
      icon: KeyRound,
    },
    {
      step: '02',
      title: 'Review and sign.',
      description: 'Confirm the recipient and amount by username, email, or payment link, then sign securely with your embedded wallet in one tap.',
      icon: ShieldCheck,
    },
    {
      step: '03',
      title: 'Sent privately.',
      description: 'Helius Privacy keeps the amount private while it settles on Solana, and SwiftPay verifies it before marking it complete.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 border-t border-slate-200/80">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase font-semibold tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 mb-3">
            Payment Architecture
          </div>
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
            How a payment moves.{' '}
            <span className="text-emerald-600">
              Interactive node flow.
            </span>
          </h2>
          <p className="mt-3 font-sans text-base text-slate-600 leading-relaxed">
            From instant sign-in to zero-knowledge encryption, watch how confidential USDC transfers settle on Solana devnet.
          </p>
        </div>

        {/* Animated Flowchart with Live Data Flow */}
        <PaymentFlowchart />

        {/* 3 Step Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    Step {item.step}
                  </span>
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon className="size-4" />
                  </span>
                </div>
                <h3 className="font-sans font-bold text-lg text-slate-900 tracking-tight">
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
