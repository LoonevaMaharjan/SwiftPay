import Providers from './providers';
import './global.css';

export const metadata = {
  title: 'SwiftPay',
  description: 'Send and receive USDC privately on Solana.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}