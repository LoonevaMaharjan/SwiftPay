'use client';

import { useWallets } from '@privy-io/react-auth';

export function useWalletAddress() {
  const { wallets, ready } = useWallets();

  const wallet = wallets.find(
    (wallet) => wallet.walletClientType === 'privy'
  );

  return {
    address: wallet?.address ?? null,
    ready,
  };
}