"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { fill, shortAddress } from "@/lib/format";
import { useWallet } from "./WalletProvider";
import styles from "./WalletButton.module.css";

type Props = { t: Dictionary["wallet"]; className?: string };

// Botón "Conectar wallet" de la barra superior (DESIGN.md §4): como el primario, 16 px y 44 px de alto.
export function WalletButton({ t, className }: Props) {
  const { status, address, error, wallets, connect, disconnect, clearError } = useWallet();
  const [chooserOpen, setChooserOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);

  if (status === "connected" && address) {
    return (
      <div className={`${styles.wrap} ${className ?? ""}`}>
        <span className={styles.connected} title={address}>
          {fill(t.connectedAs, { address: shortAddress(address) })}
        </span>
        <button type="button" className={styles.disconnect} onClick={() => void disconnect()}>
          {t.disconnect}
        </button>
      </div>
    );
  }

  function onClick() {
    clearError();
    if (wallets.length === 0) {
      setNotFound(true);
      return;
    }
    setNotFound(false);
    if (wallets.length === 1) void connect(wallets[0]);
    else setChooserOpen((open) => !open);
  }

  const message = notFound ? t.notFound : error === "rejected" ? t.rejected : null;

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <button
        type="button"
        className="btn btn-primary btn-bar"
        onClick={onClick}
        disabled={status === "connecting"}
        aria-expanded={wallets.length > 1 ? chooserOpen : undefined}
      >
        {status === "connecting" ? t.connecting : t.connect}
      </button>

      {chooserOpen && wallets.length > 1 && (
        <div className={styles.popover}>
          <p className={styles.popoverTitle}>{t.choose}</p>
          <ul>
            {wallets.map((wallet) => (
              <li key={wallet.name}>
                <button
                  type="button"
                  className={styles.walletOption}
                  onClick={() => {
                    setChooserOpen(false);
                    void connect(wallet);
                  }}
                >
                  {/* El icono lo aporta la propia wallet como data URI. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={wallet.icon} alt="" width={24} height={24} />
                  {wallet.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && (
        <p className={styles.popover} role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
