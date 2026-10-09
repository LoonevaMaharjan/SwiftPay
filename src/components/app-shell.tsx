'use client';

import { usePathname } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return <div className="min-h-screen w-full bg-[#FAFAFA] text-slate-900">{children}</div>;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-shell-background p-4 sm:p-8 overflow-hidden">
      <div className="h-[calc(100dvh-2rem)] w-full max-w-lg max-h-[48rem] overflow-y-auto rounded-xl border border-border bg-card shadow-md sm:h-[calc(100dvh-4rem)]">
        {children}
      </div>
    </div>
  );
}
