'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface FinalCtaProps {
  onStartSending?: () => void;
}

export function FinalCta({ onStartSending }: FinalCtaProps) {
  const router = useRouter();

  const handleCta = () => {
    if (onStartSending) {
      onStartSending();
    } else {
      router.push('/coming-soon');
    }
  };

  return (
    <section className="py-16 sm:py-20 border-t border-slate-200/80">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 lg:p-16 text-center text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            {/* Top Chip */}
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 mb-5">
              <ShieldCheck className="size-3.5" />
              <span>Devnet Beta Live</span>
            </div>

            {/* Headline */}
            <h2 className="font-sans font-extrabold text-3xl sm:text-5xl tracking-tight leading-tight">
              Ready to send privately?
            </h2>

            {/* Subhead */}
            <p className="mt-4 font-sans text-base sm:text-lg text-slate-300 max-w-lg mx-auto leading-relaxed">
              Create your embedded Solana wallet in under ten seconds with Google or email. No seed phrases required.
            </p>

            {/* CTA */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleCta}
                className="group font-sans text-sm font-semibold px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <span>Start sending</span>
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform motion-reduce:transform-none" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-5 font-mono text-xs text-slate-400">
              Non-custodial · Devnet beta · Built on Helius Privacy & Privy
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
