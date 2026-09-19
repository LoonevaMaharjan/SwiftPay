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
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
