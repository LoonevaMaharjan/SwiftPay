'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Banknote, Download, HandCoins, History, House, LogOut, Send, UserRound, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PrivateWalletProvider } from '@/providers/private-wallet-provider';
import { PaymentReconciler } from '@/components/payment-reconciler';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout, getAccessToken } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const [showNavigation, setShowNavigation] = useState(true);
  const lastScrollTop = useRef(0);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
      return;
    }

    if (ready && authenticated) {
      async function checkProfile() {
        const token = await getAccessToken();
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setCheckingProfile(false);
        } else {
          router.push('/onboarding');
        }
      }

      checkProfile();
    }
  }, [ready, authenticated, router, getAccessToken]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    lastScrollTop.current = 0;
    setShowNavigation(true);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const difference = current - lastScrollTop.current;
      if (current < 24) {
        setShowNavigation(true);
        lastScrollTop.current = current;
      } else if (Math.abs(difference) > 4) {
        setShowNavigation(difference < 0);
        lastScrollTop.current = current;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!ready || !authenticated || checkingProfile) return null;

  const navigation = [
    { href: '/dashboard', label: 'Home', icon: House, exact: true },
    { href: '/dashboard/send', label: 'Send', icon: Send },
    { href: '/dashboard/receive', label: 'Receive', icon: Download },
    { href: '/dashboard/requests', label: 'Requests', icon: HandCoins },
    { href: '/dashboard/history', label: 'History', icon: History },
    { href: '/dashboard/balance', label: 'Wallet', icon: Wallet },
    { href: '/dashboard/cashout', label: 'Cash out', icon: Banknote },
  ];

  return (
    <PrivateWalletProvider>
    <PaymentReconciler />
    <div className="relative min-h-dvh bg-background pb-28">
      <header className="flex items-center justify-between border-b border-primary-foreground/20 bg-primary px-4 py-3 text-primary-foreground">
        <Link href="/dashboard" aria-label="SwiftPay home" className="inline-flex min-h-10 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2"><Image src="/swiftpay-logo.png" alt="" width={140} height={37} priority /></Link>
        <div className="flex items-center gap-1">
          <Link href="/dashboard/profile" className="grid size-10 place-items-center rounded-lg text-primary-foreground transition-colors hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground" aria-label="Profile"><UserRound className="size-5" /></Link>
          <Button variant="ghost" size="icon" className="size-10 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" onClick={() => void logout()} aria-label="Log out"><LogOut className="size-4" /></Button>
        </div>
      </header>
      <main className="min-w-0 p-4 sm:p-6">{children}</main>
      <nav
        aria-label="Main navigation"
        style={{ transform: `translate(-50%, ${showNavigation ? '0' : 'calc(100% + 1rem)'})` }}
        className={`fixed bottom-0 left-1/2 z-40 grid w-full max-w-xl grid-cols-7 border-t border-border/80 bg-card/95 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-200 ease-out motion-reduce:transition-none ${showNavigation ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        {navigation.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} aria-current={isActive ? 'page' : undefined} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[10px] ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Icon className="size-5" aria-hidden="true" /><span className="truncate">{label}</span></Link>;
        })}
      </nav>
    </div>
    </PrivateWalletProvider>
  );
}
