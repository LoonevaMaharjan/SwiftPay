'use client';

import { AlertCircle, Eye, EyeOff, ShieldCheck, Wallet } from 'lucide-react';

export function ProblemSection() {
  return (
    <section id="why" className="py-16 sm:py-20 border-t border-slate-200/80 bg-slate-50/50">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase font-semibold tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 mb-3">
            Why Privacy Matters
          </div>
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
            Public wallets reveal{' '}
            <span className="text-emerald-600">
              everything.
            </span>
          </h2>
          <p className="mt-3 font-sans text-base text-slate-600 leading-relaxed">
            On standard Solana, anyone who knows your address can see your balance, net worth, and payment amounts on Solscan. SwiftPay keeps payment amounts confidential.
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Standard Solana */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
                  <Eye className="size-4" />
                </span>
                <span className="font-sans font-semibold text-sm text-slate-900">Standard Solana Transfer</span>
              </div>
              <span className="font-mono text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Public Ledger
              </span>
            </div>

            <div className="mt-5 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Transfer Amount</span>
                <span className="font-bold text-slate-900">500.00 USDC (Exposed)</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Account Balance</span>
                <span className="font-bold text-slate-900">14,290.00 USDC (Visible)</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Block Explorer</span>
                <span className="text-slate-700">Fully readable by anyone</span>
              </div>
            </div>
          </div>

          {/* Card 2: With SwiftPay */}
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-7 shadow-sm ring-1 ring-emerald-500/10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <ShieldCheck className="size-4" />
                </span>
                <span className="font-sans font-semibold text-sm text-slate-900">With SwiftPay</span>
              </div>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Amount Shielded
              </span>
            </div>

            <div className="mt-5 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <span className="text-slate-500">Transfer Amount</span>
                <span className="font-bold text-emerald-800">●●●●●● (Encrypted)</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <span className="text-slate-500">Account Balance</span>
                <span className="font-bold text-emerald-800">Confidential</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <span className="text-slate-500">Zero-Knowledge</span>
                <span className="text-emerald-800 font-medium">Helius Privacy Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Honest Disclosure */}
        <p className="mt-6 text-xs text-slate-500 font-mono">
          Note: SwiftPay on Helius Privacy shields transfer amounts and token balances. Sender and recipient addresses settle on Solana and remain recorded on-chain.
        </p>
      </div>
    </section>
  );
}
