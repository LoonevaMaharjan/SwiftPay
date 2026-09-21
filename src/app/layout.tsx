import { DM_Mono, DM_Sans } from 'next/font/google';
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
      <body className="h-dvh overflow-hidden bg-shell-background text-foreground antialiased">
        <Providers>
          <div className="flex h-full items-center justify-center bg-shell-background p-4 sm:p-8">
            <div className="h-[calc(100dvh-2rem)] w-full max-w-lg max-h-[48rem] overflow-y-auto rounded-xl border border-border bg-card shadow-md sm:h-[calc(100dvh-4rem)]">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
