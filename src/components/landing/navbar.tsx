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
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="SwiftPay home"
        >
          <span className="flex items-center gap-2">
            <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-black/40">
              <Image src="/swiftpay-circle.png" alt="" width={34} height={34} priority className="size-[34px] rounded-full object-contain" />
            </span>
            <span className="rounded-md bg-black/40 px-1.5 py-0.5">
              <Image src="/swiftpay-logo.png" alt="SwiftPay" width={112} height={36} priority className="h-9 w-28 object-contain" />
            </span>
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 hidden sm:inline-block">
            Devnet Beta
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md py-1 px-2"
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
            className="text-xs uppercase tracking-wider font-mono font-semibold px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm hover:shadow flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 shadow-lg animate-in fade-in slide-in-from-top-2">
          <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
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
              className="mt-2 text-xs uppercase tracking-wider font-mono font-semibold px-4 py-2.5 rounded-lg bg-slate-900 text-white flex items-center justify-center gap-1.5"
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
