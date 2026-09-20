'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Download, History, LayoutDashboard, LogOut, Menu, PanelLeftClose, Send, UserRound } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWalletAddress } from '@/hooks/use-wallet-address';

function truncate(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout } = usePrivy();
  const { address } = useWalletAddress();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;

  const navigation = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/send', label: 'Send', icon: Send },
    { href: '/dashboard/receive', label: 'Receive', icon: Download },
    { href: '/dashboard/history', label: 'History', icon: History },
    { href: '/dashboard/profile', label: 'Profile', icon: UserRound, exact: true },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`relative flex shrink-0 flex-col justify-between overflow-hidden border-r border-sidebar-border bg-sidebar px-3 py-4 transition-[width] duration-200 motion-reduce:transition-none ${isSidebarOpen ? 'w-64' : 'w-16'}`}
      >
        <div>
          <div className="flex h-10 items-center justify-between gap-2 px-1">
            {isSidebarOpen && <span className="whitespace-nowrap text-lg font-bold tracking-tight">SwiftPay</span>}
            <Button
              variant="ghost"
              size="icon"
              className="size-10 shrink-0"
              onClick={() => setIsSidebarOpen((open) => !open)}
              aria-label={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
              title={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
            >
              {isSidebarOpen ? <PanelLeftClose aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </Button>
          </div>
          <nav className="mt-8 flex flex-col gap-2" aria-label="Main navigation">
            {navigation.map(({ href, label, icon: Icon, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href);

              return (
                <a
                  key={href}
                  className={`flex min-h-10 items-center gap-3 rounded-md border px-3 py-2 text-base font-bold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isActive ? 'border-primary bg-accent text-accent-foreground italic' : 'border-transparent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  title={!isSidebarOpen ? label : undefined}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  {isSidebarOpen && <span className="whitespace-nowrap">{label}</span>}
                </a>
              );
            })}
          </nav>
        </div>
        <div className={`flex items-center gap-2 px-1 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {address && isSidebarOpen && (
            <span className="font-mono text-xs text-muted-foreground">{truncate(address)}</span>
          )}
          <Button variant="ghost" size={isSidebarOpen ? 'sm' : 'icon'} onClick={logout} aria-label={!isSidebarOpen ? 'Log out' : undefined} title={!isSidebarOpen ? 'Log out' : undefined}>
            {isSidebarOpen ? 'Log out' : <LogOut className="size-5" aria-hidden="true" />}
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}
