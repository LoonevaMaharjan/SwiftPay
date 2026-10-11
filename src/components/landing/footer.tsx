'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp } from 'lucide-react';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Why SwiftPay', href: '#why' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Roadmap', href: '#roadmap' },
  ];

  return (
    <footer className="w-full bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-slate-800">
          {/* Logo & Info */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label="SwiftPay home"
            >
              <span className="flex items-center gap-0">
                <Image src="/swiftpay-circle-bg.png" alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-contain" />
                <Image src="/swiftpay-logo.png" alt="SwiftPay" width={105} height={34} className="-ml-[31px] h-[34px] w-[105px] object-contain" />
              </span>
              <span className="-ml-5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Devnet Beta
              </span>
            </Link>
            <p className="mt-2.5 font-sans text-xs text-slate-400 max-w-sm leading-relaxed">
              Non-custodial, confidential USDC transfers on Solana powered by Helius Privacy and Privy.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-6" aria-label="Footer navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Back to top */}
          <button
            type="button"
            onClick={scrollToTop}
            className="text-xs font-mono font-medium px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span>Back to top</span>
            <ArrowUp className="size-3.5" />
          </button>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Built on Solana devnet using Helius Privacy and Privy</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Amounts shielded · Addresses settle on-chain
          </div>
        </div>
      </div>
    </footer>
  );
}
