"use client";

// Conexión con la wallet del navegador (Phantom, Solflare, Backpack…) mediante Wallet Standard,
// el estándar común de las wallets de Solana. Solo se usa para saber la dirección del titular:
// la web nunca le pide firmar nada.

import { getWallets } from "@wallet-standard/app";
import type { Wallet } from "@wallet-standard/base";
import {
  StandardConnect,
  StandardDisconnect,
  type StandardConnectFeature,
  type StandardDisconnectFeature,
} from "@wallet-standard/features";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Status = "idle" | "connecting" | "connected";
export type WalletError = "rejected" | null;

type WalletState = {
  status: Status;
  address: string | null;
  error: WalletError;
  /** Wallets de Solana instaladas en este navegador. */
  wallets: readonly Wallet[];
  connect: (wallet: Wallet) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
};

const WalletContext = createContext<WalletState | null>(null);

const STORAGE_KEY = "pp.wallet";

const isSolanaWallet = (wallet: Wallet) =>
  wallet.chains.some((chain) => chain.startsWith("solana:")) && StandardConnect in wallet.features;

function remember(name: string | null) {
  try {
    if (name) localStorage.setItem(STORAGE_KEY, name);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Almacenamiento bloqueado (navegación privada…): simplemente no se recuerda.
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<readonly Wallet[]>([]);
  const [active, setActive] = useState<Wallet | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<WalletError>(null);

  const connectWith = useCallback(async (wallet: Wallet, silent: boolean) => {
    setStatus("connecting");
    setError(null);
    try {
      const feature = wallet.features[StandardConnect] as StandardConnectFeature[typeof StandardConnect];
      const { accounts } = await feature.connect(silent ? { silent: true } : undefined);
      const account = accounts.find((a) => a.chains.some((c) => c.startsWith("solana:"))) ?? accounts[0];
      if (!account) throw new Error("sin cuentas");
      setActive(wallet);
      setAddress(account.address);
      setStatus("connected");
      remember(wallet.name);
    } catch {
      setStatus("idle");
      if (!silent) setError("rejected");
    }
  }, []);

  // Las wallets se anuncian al cargar la página y pueden llegar después que React.
  useEffect(() => {
    const api = getWallets();
    const refresh = () => setWallets(api.get().filter(isSolanaWallet));
    refresh();
    const offRegister = api.on("register", refresh);
    const offUnregister = api.on("unregister", refresh);

    // Reconexión silenciosa si ya se conectó antes en este navegador (sin ventanas emergentes).
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {}
    const previous = saved ? api.get().filter(isSolanaWallet).find((w) => w.name === saved) : undefined;
    const reconnect = previous ? setTimeout(() => void connectWith(previous, true), 0) : undefined;

    return () => {
      clearTimeout(reconnect);
      offRegister();
      offUnregister();
    };
  }, [connectWith]);

  const connect = useCallback((wallet: Wallet) => connectWith(wallet, false), [connectWith]);

  const disconnect = useCallback(async () => {
    const feature = active?.features[StandardDisconnect] as StandardDisconnectFeature[typeof StandardDisconnect] | undefined;
    try {
      await feature?.disconnect();
    } catch {}
    setActive(null);
    setAddress(null);
    setStatus("idle");
    remember(null);
  }, [active]);

  const value = useMemo<WalletState>(
    () => ({
      status,
      address,
      error,
      wallets,
      connect,
      disconnect,
      clearError: () => setError(null),
    }),
    [status, address, error, wallets, connect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet debe usarse dentro de <WalletProvider>");
  return context;
}
