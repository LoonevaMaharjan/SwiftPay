'use client';

import { Banknote, Compass, Layers, ShieldCheck } from 'lucide-react';

export function Roadmap() {
  return (
    <section id="roadmap" className="py-16 sm:py-20 border-t border-slate-200/80 bg-slate-50/50">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase font-semibold tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 mb-3">
            Roadmap
          </div>
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
            Building the private standard.{' '}
            <span className="text-emerald-600">
              Step by step.
            </span>
          </h2>
          <p className="mt-3 font-sans text-base text-slate-600 leading-relaxed">
            Our progressive development milestones from Solana devnet testing to global fiat off-ramping.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="size-4" />
                </span>
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  live on devnet
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-slate-900 tracking-tight">
                Private USDC payments
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-sans">
                Zero-knowledge transfer amounts via Helius Privacy with non-custodial balance protection.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 font-mono text-[11px] text-emerald-700 font-medium">
              Operational
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Layers className="size-4" />
                </span>
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  live on devnet
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-slate-900 tracking-tight">
                Payment links & requests
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-sans">
                Username handles, shareable payment links, and custom amount invoicing flows.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 font-mono text-[11px] text-emerald-700 font-medium">
              Operational
            </div>
          </div>

          {/* Card 3: Visually Emphasized Off-Ramp Card */}
          <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 shadow-md flex flex-col justify-between relative ring-1 ring-amber-400/20">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Banknote className="size-4" />
                </span>
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  coming soon
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-slate-900 tracking-tight">
                Cash out to your local currency
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-sans">
                Direct fiat off-ramping to withdraw USDC balances straight to local bank accounts worldwide.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-100 font-mono text-[11px] text-amber-800 font-semibold flex justify-between">
              <span>Next Release</span>
              <span className="text-slate-400 font-normal">Coming Soon</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <Compass className="size-4" />
                </span>
                <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  planned
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-slate-900 tracking-tight">
                Solana mainnet launch
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-sans">
                Production rollout once Helius Privacy completes formal cryptographic audits.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 font-mono text-[11px] text-slate-400">
              Post-audit
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
