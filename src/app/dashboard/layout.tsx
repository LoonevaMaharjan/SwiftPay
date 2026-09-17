'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useWalletAddress } from '@/hooks/use-wallet-address';

function truncate(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout } = usePrivy();
  const { address } = useWalletAddress();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) router.push('/');
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col justify-between border-r px-4 py-6">
        <div>
          <span className="px-2 text-sm font-semibold">SwiftPay</span>
          <nav className="mt-8 flex flex-col gap-1 text-sm">
            <a className="rounded-md px-2 py-2 hover:bg-muted" href="/dashboard">Dashboard</a>
            <a className="rounded-md px-2 py-2 hover:bg-muted" href="/dashboard/send">Send</a>
            <a className="rounded-md px-2 py-2 hover:bg-muted" href="/dashboard/receive">Receive</a>
            <a className="rounded-md px-2 py-2 hover:bg-muted" href="/dashboard/history">History</a>
          </nav>
        </div>
        <div className="flex items-center justify-between px-2">
          {address && (
            <span className="font-mono text-xs text-muted-foreground">{truncate(address)}</span>
          )}
          <Button variant="ghost" size="sm" onClick={logout}>Log out</Button>
        </div>
      </aside>
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}