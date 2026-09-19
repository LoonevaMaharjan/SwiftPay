'use client';

import { useWallets } from '@privy-io/react-auth/solana';

export function useWalletAddress() {
  const { wallets, ready } = useWallets();

  // The Solana hook exposes Privy's Solana Standard Wallets. The root SDK hook
  // only returns EVM wallets, which was why the address was always null.
  const wallet = wallets[0];

  return {
    address: wallet?.address ?? null,
    ready,
    wallet,
    hasWallet: Boolean(wallet),
  };
}
