'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Download, History, LayoutDashboard, LogOut, Menu, Send, UserRound, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout, getAccessToken } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMenuOpen]);

  if (!ready || !authenticated || checkingProfile) return null;

  const navigation = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/send', label: 'Send', icon: Send },
    { href: '/dashboard/receive', label: 'Receive', icon: Download },
    { href: '/dashboard/history', label: 'History', icon: History },
    { href: '/dashboard/profile', label: 'Profile', icon: UserRound, exact: true },
  ];

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="relative z-20 flex shrink-0 items-center justify-between border-b bg-card px-4 py-3">
        <span className="text-lg font-bold tracking-tight">SwiftPay</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          aria-controls="app-navigation-menu"
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
      </header>

      {isMenuOpen && (
        <>
          <button
            type="button"
            className="absolute inset-0 z-10 cursor-default"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close navigation menu"
            tabIndex={-1}
          />
          <nav
            id="app-navigation-menu"
            className="absolute right-4 top-16 z-30 w-56 rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg"
            aria-label="Main navigation"
          >
            <div className="flex flex-col gap-1">
              {navigation.map(({ href, label, icon: Icon, exact }) => {
                const isActive = exact ? pathname === href : pathname.startsWith(href);

                return (
                  <a
                    key={href}
                    className={`flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isActive ? 'bg-accent text-accent-foreground italic' : 'hover:bg-muted'}`}
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {label}
                  </a>
                );
              })}
            </div>
            <div className="mt-2 border-t pt-2">
              <Button
                variant="ghost"
                className="min-h-10 w-full justify-start gap-3 px-3 text-sm font-semibold"
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Log out
              </Button>
            </div>
          </nav>
        </>
      )}
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}