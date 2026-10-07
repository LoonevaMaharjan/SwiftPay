'use client';

import { address, getTransactionEncoder, signature as toKitSignature, type Transaction } from '@solana/kit';
import {
  buildDepositTransaction,
  buildRegistrationTransaction,
  buildTransferTransaction,
  createZolanaClient,
  getPrivateTokenBalances,
  getPrivateTransactions,
  LocalKeys,
  syncWallet,
  Wallet,
} from '@heliuslabs/zolana';
import { isWalletRegistered } from '@heliuslabs/zolana/wallet';
import { ed25519DerivationMessage, type Bytes32 } from '@heliuslabs/zolana/keypair';
import type { ZolanaClient } from '@heliuslabs/zolana/client';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { useSignAndSendTransaction, useSignMessage } from '@privy-io/react-auth/solana';
import type { ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import bs58 from 'bs58';
import { useWalletAddress } from '@/hooks/use-wallet-address';
import { getConnection, USDC_MINT } from '@/lib/solana';

type State = 'disconnected' | 'loading' | 'ready' | 'error';
type PrivateContextValue = {
  state: State;
  error: string | null;
  registered: boolean;
  privateUsdc: number | null;
  privateTransactions: ReturnType<typeof getPrivateTransactions>;
  client: ZolanaClient | null;
  wallet: Wallet | null;
  keys: LocalKeys | null;
  initialize: () => Promise<void>;
  prepare: () => Promise<number>;
  register: () => Promise<number>;
  refresh: () => Promise<void>;
  deposit: (amount: bigint) => Promise<string>;
  transfer: (recipient: string, amount: bigint) => Promise<{ signature: string; indexed: boolean }>;
};

const PrivateWalletContext = createContext<PrivateContextValue | null>(null);
const USDC_ADDRESS = address(USDC_MINT.toBase58());
const RPC = process.env.NEXT_PUBLIC_HELIUS_RPC_URL
  ?? (process.env.NEXT_PUBLIC_HELIUS_API_KEY
    ? `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
    : '');

function getPrivateUsdcAmount(wallet: Wallet) {
  return getPrivateTokenBalances(wallet).find((balance) => balance.mint === USDC_ADDRESS)?.amount ?? BigInt(0);
}

export function PrivateWalletProvider({ children }: { children: React.ReactNode }) {
  const { wallet: ownerWallet } = useWalletAddress();
  const { signMessage } = useSignMessage();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const [state, setState] = useState<State>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [privateUsdc, setPrivateUsdc] = useState<number | null>(null);
  const [privateTransactions, setPrivateTransactions] = useState<ReturnType<typeof getPrivateTransactions>>([]);
  const clientRef = useRef<ZolanaClient | null>(null);
  const walletRef = useRef<Wallet | null>(null);
  const keysRef = useRef<LocalKeys | null>(null);

  const initialize = useCallback(async () => {
    if (keysRef.current && walletRef.current && clientRef.current) return;
    setState('loading'); setError(null);
    try {
      if (!ownerWallet) throw new Error('Your Privy Solana wallet is not ready yet.');
      if (!RPC) throw new Error('Add NEXT_PUBLIC_HELIUS_API_KEY to enable Helius Privacy on Devnet.');
      const client = await createZolanaClient({
        solanaRpcUrl: RPC,
        indexerUrl: process.env.NEXT_PUBLIC_HELIUS_INDEXER_URL || 'https://d2xah7tnhdhcom.cloudfront.net',
        proverUrl: process.env.NEXT_PUBLIC_HELIUS_PROVER_URL || 'https://d21ni15goiip6l.cloudfront.net',
      });
      const ownerAddress = address(ownerWallet.address);
      const publicKeyBytes = new PublicKey(ownerWallet.address).toBytes() as Bytes32;
      const { signature: derivationSeed } = await signMessage({ message: ed25519DerivationMessage(publicKeyBytes), wallet: ownerWallet });
      const keys = LocalKeys.fromDerivationSeed({ solanaPublicKey: ownerAddress, derivationSeed }, client.proofService);
      const privateWallet = new Wallet({ identity: keys.address() });
      clientRef.current = client; walletRef.current = privateWallet; keysRef.current = keys;
      await syncWallet({ client, wallet: privateWallet, keys });
      const isRegistered = await isWalletRegistered({ rpc: client, owner: address(ownerWallet.address) });
      setRegistered(isRegistered);
      setPrivateUsdc(Number(getPrivateUsdcAmount(privateWallet)) / 1_000_000);
      setPrivateTransactions(getPrivateTransactions(privateWallet));
      setState('ready');
    } catch (cause) {
      keysRef.current?.destroy(); keysRef.current = null; walletRef.current = null; clientRef.current = null;
      setState('error');
      setError(cause instanceof Error ? cause.message : 'Could not open your private wallet.');
      throw cause;
    }
  }, [ownerWallet, signMessage]);

  const submit = useCallback(async (transaction: Transaction) => {
    if (!ownerWallet) throw new Error('Your Privy wallet is not connected.');
    const wireTransaction = Uint8Array.from(getTransactionEncoder().encode(transaction));

    const result = await signAndSendTransaction({
      transaction: wireTransaction,
      wallet: ownerWallet,
      chain: 'solana:devnet',
      options: { optimisticBroadcast: true },
    });

    return bs58.encode(result.signature);
  }, [ownerWallet, signAndSendTransaction]);

  const refresh = useCallback(async () => {
    const client = clientRef.current; const privateWallet = walletRef.current; const keys = keysRef.current;
    if (!client || !privateWallet || !keys) return;
    await syncWallet({ client, wallet: privateWallet, keys });
    setPrivateUsdc(Number(getPrivateUsdcAmount(privateWallet)) / 1_000_000);
    setPrivateTransactions(getPrivateTransactions(privateWallet));
  }, []);

  const prepare = useCallback(async () => {
    await initialize();
    await refresh();
    if (!walletRef.current) throw new Error('Could not load your SwiftPay balance. Please try again.');
    return Number(getPrivateUsdcAmount(walletRef.current)) / 1_000_000;
  }, [initialize, refresh]);

  const register = useCallback(async () => {
    await prepare();
    if (!ownerWallet || !clientRef.current || !keysRef.current) throw new Error('Could not prepare this payment. Please try again.');
    const owner = address(ownerWallet.address);
    const wasRegistered = await isWalletRegistered({ rpc: clientRef.current, owner });
    const transaction = wasRegistered ? undefined : await buildRegistrationTransaction({ client: clientRef.current, owner, address: keysRef.current.address() });
    if (transaction) {
      const txSignature = await submit(transaction);
      await clientRef.current.confirmTransaction(toKitSignature(txSignature));
    }
    setRegistered(true);
    await refresh();
    return Number(getPrivateUsdcAmount(walletRef.current!)) / 1_000_000;
  }, [ownerWallet, prepare, refresh, submit]);

  const deposit = useCallback(async (amount: bigint) => {
    await register();
    if (!ownerWallet || !clientRef.current || !keysRef.current) throw new Error('Could not prepare this payment. Please try again.');
    const ata = await getAssociatedTokenAddress(USDC_MINT, new PublicKey(ownerWallet.address));
    const transaction = await buildDepositTransaction({
      client: clientRef.current,
      feePayer: address(ownerWallet.address),
      recipient: keysRef.current.address(),
      asset: USDC_ADDRESS,
      splTokenAccount: address(ata.toBase58()),
      amount,
    });
    const txSignature = await submit(transaction);
    let slot: number | undefined;
    try {
      slot = await clientRef.current.confirmTransaction(toKitSignature(txSignature));
    } catch {
      const status = await getConnection().getSignatureStatuses([txSignature], { searchTransactionHistory: true }).then((result) => result.value[0]).catch(() => null);
      if (status?.err) throw new Error('Solana rejected this deposit.');
      if (!status || !['confirmed', 'finalized'].includes(status.confirmationStatus ?? '')) {
        throw new Error('Your deposit was sent but confirmation is taking longer than usual. Refresh in a moment.');
      }
    }
    await syncWallet({ client: clientRef.current, wallet: walletRef.current!, keys: keysRef.current, config: slot ? { requireSlot: slot } : undefined });
    setPrivateUsdc(Number(getPrivateUsdcAmount(walletRef.current!)) / 1_000_000);
    setPrivateTransactions(getPrivateTransactions(walletRef.current!));
    return txSignature;
  }, [ownerWallet, register, submit]);

  const transfer = useCallback(async (recipient: string, amount: bigint) => {
    await register();
    if (!ownerWallet || !clientRef.current || !walletRef.current || !keysRef.current) throw new Error('Could not prepare this payment. Please try again.');
    if (getPrivateUsdcAmount(walletRef.current) < amount) throw new Error('Your private USDC balance is too low. Deposit USDC into your private wallet first.');
    const transaction = await buildTransferTransaction({
      client: clientRef.current,
      wallet: walletRef.current,
      keys: keysRef.current,
      feePayer: address(ownerWallet.address),
      recipient: address(recipient),
      asset: USDC_ADDRESS,
      amount,
    });
    const txSignature = await submit(transaction);
    let chainConfirmed = false;
    try {
      await clientRef.current.confirmTransaction(toKitSignature(txSignature));
      chainConfirmed = true;
    } catch {
      const status = await getConnection().getSignatureStatuses([txSignature], { searchTransactionHistory: true }).then((result) => result.value[0]).catch(() => null);
      if (status?.err) throw new Error('Solana rejected this private payment.');
      chainConfirmed = Boolean(status && ['confirmed', 'finalized'].includes(status.confirmationStatus ?? ''));
    }
    if (!chainConfirmed) return { signature: txSignature, indexed: false };
    let indexed = true;
    try {
      await clientRef.current.confirmPrivateTransaction(toKitSignature(txSignature));
      await refresh();
    } catch (cause) {
      // The chain may accept a private payment before the Helius indexer catches up.
      // Preserve the signature so SwiftPay can display a pending record and avoid a duplicate send.
      indexed = false;
      console.warn('Private transfer is confirmed on Solana but is still waiting for Helius indexing.', cause);
    }
    return { signature: txSignature, indexed };
  }, [ownerWallet, refresh, register, submit]);

  useEffect(() => () => { keysRef.current?.destroy(); keysRef.current = null; walletRef.current = null; clientRef.current = null; }, []);

  useEffect(() => {
    if (state !== 'ready') return;
    const interval = window.setInterval(() => { void refresh().catch((cause) => console.warn('Could not refresh private payment activity.', cause)); }, 15_000);
    return () => window.clearInterval(interval);
  }, [state, refresh]);

  const value = useMemo(() => ({ state, error, registered, privateUsdc, privateTransactions, client: clientRef.current, wallet: walletRef.current, keys: keysRef.current, initialize, prepare, register, refresh, deposit, transfer }), [state, error, registered, privateUsdc, privateTransactions, initialize, prepare, register, refresh, deposit, transfer]);
  return <PrivateWalletContext.Provider value={value}>{children}</PrivateWalletContext.Provider>;
}

export function usePrivateWallet() {
  const value = useContext(PrivateWalletContext);
  if (!value) throw new Error('usePrivateWallet must be used inside PrivateWalletProvider.');
  return value;
}