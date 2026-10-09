import { DM_Mono, DM_Sans } from 'next/font/google';
import { AppShell } from '@/components/app-shell';
import Providers from './providers';
import './global.css';
const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
});

export const metadata = {
  title: 'SwiftPay',
  description: 'Send and receive USDC privately on Solana.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-shell-background text-foreground antialiased selection:bg-[#CFEBDD] selection:text-[#143C2F]">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
