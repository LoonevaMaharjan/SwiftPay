'use client';

import { usePathname } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/' || pathname === '/coming-soon';

  if (isLanding) {
    return <div className="min-h-screen w-full bg-background text-foreground">{children}</div>;
  }

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-shell-background sm:flex sm:justify-center sm:px-8 sm:py-8">
      <div className="min-h-dvh w-full max-w-lg bg-card sm:min-h-[calc(100dvh-4rem)] sm:rounded-xl sm:border sm:border-border sm:shadow-md">
        {children}
      </div>
    </div>
  );
}
