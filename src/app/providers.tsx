'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
  const devnetRpcUrl = `https://solana-devnet.rpc.privy.systems?privyAppId=${encodeURIComponent(appId)}`;
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['google'],
        appearance: {
          theme: 'light',
          accentColor: '#171717',
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
        solana: {
          rpcs: {
            'solana:devnet': {
              rpc: createSolanaRpc(devnetRpcUrl),
              rpcSubscriptions: createSolanaRpcSubscriptions(devnetRpcUrl.replace(/^https:/, 'wss:')),
            },
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
