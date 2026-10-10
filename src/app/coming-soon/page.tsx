'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Rocket } from 'lucide-react';

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
            aria-label="SwiftPay home"
          >
            <span className="size-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-sans font-bold text-sm shadow-sm group-hover:bg-emerald-700 transition-colors">
              <ShieldCheck className="size-4.5 text-white" aria-hidden="true" />
            </span>
            <span className="font-sans font-bold text-xl tracking-tight text-slate-900">
              SwiftPay
            </span>
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center py-20">
          {/* Icon */}
          <div className="mx-auto mb-6 size-20 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center">
            <Rocket className="size-10 text-emerald-600" />
          </div>

          {/* Heading */}
          <h1 className="font-sans font-extrabold text-4xl sm:text-5xl tracking-tight text-slate-900">
            Coming Soon
          </h1>

          {/* Description */}
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-md mx-auto">
            We&apos;re building something incredible. SwiftPay&apos;s private payment platform on Solana is launching soon.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Private payments
            </span>
            <span className="font-mono text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Solana powered
            </span>
            <span className="font-mono text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              No seed phrases
            </span>
          </div>

          {/* Divider */}
          <div className="mt-10 pt-8 border-t border-slate-200/80">
            <p className="text-sm text-slate-500">
              Stay tuned for updates. Follow us for the latest news.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 font-sans text-sm font-semibold px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="size-4" />
              Back to homepage
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-6">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-xs text-slate-400">
            © {new Date().getFullYear()} SwiftPay. Built on Solana.
          </p>
        </div>
      </footer>
    </div>
  );
}
