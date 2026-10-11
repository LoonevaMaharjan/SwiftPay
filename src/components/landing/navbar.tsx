'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowUpRight, Menu, X } from 'lucide-react';

interface NavbarProps {
  onSignIn?: () => void;
}

export function Navbar({ onSignIn }: NavbarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAuthAction = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      router.push('/coming-soon');
    }
  };

  const navLinks = [
    { label: 'Why SwiftPay', href: '#why' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Roadmap', href: '#roadmap' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/95 text-white backdrop-blur-md">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex items-center gap-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="SwiftPay home"
        >
          <span className="flex items-center gap-0">
            <Image src="/swiftpay-circle-bg.png" alt="" width={40} height={40} priority className="size-10 shrink-0 rounded-full object-contain" />
            <Image src="/swiftpay-logo.png" alt="SwiftPay" width={112} height={36} priority className="-ml-8 h-9 w-28 object-contain" />
          </span>
          <span className="-ml-5 hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400 sm:inline-block">
            Devnet Beta
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-1 text-sm font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={handleAuthAction}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span>Sign in</span>
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 border-t border-slate-800 bg-slate-900 px-4 py-4 shadow-lg md:hidden">
          <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleAuthAction();
              }}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500 px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-emerald-500/10"
            >
              <span>Sign in</span>
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
